import { createHash } from "crypto";
import { createHmac } from "crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "fs/promises";
import { dirname, join } from "path";

export type ArchiveWriteResult = {
  provider: string;
  storageKey: string;
  checksum: string;
  byteSize: number;
};

export interface ArchiveStorage {
  provider: string;
  writeObject(key: string, content: string): Promise<ArchiveWriteResult>;
  readObject(key: string): Promise<string>;
  listObjects(prefix: string): Promise<Array<{ key: string; byteSize?: number; updatedAt?: Date }>>;
}

function archiveRoot() {
  return process.env.ARCHIVE_STORAGE_DIR || "/tmp/iatron-archives";
}

export class LocalArchiveStorage implements ArchiveStorage {
  provider = "local_private";

  async writeObject(key: string, content: string): Promise<ArchiveWriteResult> {
    const root = archiveRoot();
    const safeKey = key.replace(/[^a-zA-Z0-9._/-]/g, "_");
    const fullPath = join(root, safeKey);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, { encoding: "utf8", mode: 0o600 });
    return {
      provider: this.provider,
      storageKey: fullPath,
      checksum: createHash("sha256").update(content).digest("hex"),
      byteSize: Buffer.byteLength(content, "utf8")
    };
  }

  async readObject(key: string): Promise<string> {
    return readFile(key, "utf8");
  }

  async listObjects(prefix: string) {
    const root = archiveRoot();
    const safePrefix = prefix.replace(/[^a-zA-Z0-9._/-]/g, "_");
    const base = join(root, safePrefix);
    const entries = await walkArchiveFiles(base).catch(() => []);
    return entries.map((entry) => ({
      key: entry.path,
      byteSize: entry.byteSize,
      updatedAt: entry.updatedAt
    }));
  }
}

async function walkArchiveFiles(path: string): Promise<Array<{ path: string; byteSize: number; updatedAt: Date }>> {
  const info = await stat(path);
  if (info.isFile()) return [{ path, byteSize: info.size, updatedAt: info.mtime }];
  const entries = await readdir(path, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => walkArchiveFiles(join(path, entry.name))));
  return nested.flat();
}

type S3Config = {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix: string;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Archive storage externo sem ${name}.`);
  return value;
}

function s3Config(): S3Config {
  return {
    endpoint: requiredEnv("ARCHIVE_S3_ENDPOINT").replace(/\/$/, ""),
    bucket: requiredEnv("ARCHIVE_S3_BUCKET"),
    region: process.env.ARCHIVE_S3_REGION?.trim() || "auto",
    accessKeyId: requiredEnv("ARCHIVE_S3_ACCESS_KEY_ID"),
    secretAccessKey: requiredEnv("ARCHIVE_S3_SECRET_ACCESS_KEY"),
    prefix: (process.env.ARCHIVE_S3_PREFIX?.trim() || "iatron-admin-archives").replace(/^\/|\/$/g, "")
  };
}

function sha256Hex(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function hmacHex(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function amzTimestamp(now = new Date()) {
  return now.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function encodePathSegment(value: string) {
  return value.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

function signingKey(secretAccessKey: string, date: string, region: string) {
  const kDate = hmac(`AWS4${secretAccessKey}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

function buildSignedS3Request(input: {
  method: "GET" | "PUT";
  config: S3Config;
  key: string;
  body?: string;
  query?: string;
  bucketOnly?: boolean;
}) {
  const now = new Date();
  const timestamp = amzTimestamp(now);
  const date = timestamp.slice(0, 8);
  const payloadHash = sha256Hex(input.body ?? "");
  const host = new URL(input.config.endpoint).host;
  const objectPath = input.bucketOnly
    ? input.config.bucket
    : `${input.config.bucket}/${input.config.prefix}/${input.key.replace(/^\/+/, "")}`.replace(/\/+/g, "/");
  const canonicalUri = `/${encodePathSegment(objectPath)}`;
  const canonicalQueryString = input.query ?? "";
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${timestamp}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    input.method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join("\n");
  const credentialScope = `${date}/${input.config.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    timestamp,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join("\n");
  const signature = hmacHex(signingKey(input.config.secretAccessKey, date, input.config.region), stringToSign);
  const authorization = `AWS4-HMAC-SHA256 Credential=${input.config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const url = `${input.config.endpoint}${canonicalUri}${canonicalQueryString ? `?${canonicalQueryString}` : ""}`;

  return {
    url,
    headers: {
      Authorization: authorization,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": timestamp
    }
  };
}

export class S3ArchiveStorage implements ArchiveStorage {
  provider = "s3_private";
  private config: S3Config;

  constructor(config = s3Config()) {
    this.config = config;
  }

  async writeObject(key: string, content: string): Promise<ArchiveWriteResult> {
    const signed = buildSignedS3Request({ method: "PUT", config: this.config, key, body: content });
    const response = await fetch(signed.url, {
      method: "PUT",
      headers: {
        ...signed.headers,
        "content-type": "application/x-ndjson"
      },
      body: content
    });
    if (!response.ok) throw new Error(`Falha no upload do archive externo: ${response.status} ${response.statusText}`);
    return {
      provider: this.provider,
      storageKey: `${this.config.prefix}/${key.replace(/^\/+/, "")}`,
      checksum: sha256Hex(content),
      byteSize: Buffer.byteLength(content, "utf8")
    };
  }

  async readObject(key: string): Promise<string> {
    const objectKey = key.startsWith(`${this.config.prefix}/`) ? key.slice(this.config.prefix.length + 1) : key;
    const signed = buildSignedS3Request({ method: "GET", config: this.config, key: objectKey });
    const response = await fetch(signed.url, { method: "GET", headers: signed.headers });
    if (!response.ok) throw new Error(`Falha no download controlado do archive: ${response.status} ${response.statusText}`);
    return response.text();
  }

  async listObjects(prefix: string) {
    const query = new URLSearchParams({
      "list-type": "2",
      prefix: `${this.config.prefix}/${prefix.replace(/^\/+/, "")}`
    }).toString();
    const signed = buildSignedS3Request({ method: "GET", config: this.config, key: "", query, bucketOnly: true });
    const response = await fetch(signed.url, { method: "GET", headers: signed.headers });
    if (!response.ok) throw new Error(`Falha ao listar archive externo: ${response.status} ${response.statusText}`);
    const xml = await response.text();
    return Array.from(xml.matchAll(/<Key>(.*?)<\/Key>[\s\S]*?<Size>(\d+)<\/Size>/g)).map((match) => ({
      key: decodeXml(match[1]),
      byteSize: Number(match[2])
    }));
  }
}

export function getArchiveStorage(): ArchiveStorage {
  const provider = process.env.ARCHIVE_STORAGE_PROVIDER?.trim().toLowerCase();
  if (provider === "s3") return new S3ArchiveStorage();
  if (provider === "local") return new LocalArchiveStorage();
  if (process.env.NODE_ENV === "production") {
    throw new Error("ARCHIVE_STORAGE_PROVIDER=s3 é obrigatório em produção.");
  }
  return new LocalArchiveStorage();
}

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}
