import { createHash, createHmac, createSign } from "crypto";
import { ManualPaymentAttachmentStatus } from "@prisma/client";
import { recordAdminAuditEvent, type AdminUser } from "@/lib/admin-permissions";
import { googleCloudConfigured } from "@/lib/google-cloud-auth";
import { prisma } from "@/lib/prisma";

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const UPLOAD_EXPIRES_SECONDS = 10 * 60;
const DOWNLOAD_EXPIRES_SECONDS = 5 * 60;
const ALLOWED_CONTENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export class ManualPaymentAttachmentError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

type SignedStorageRequest = {
  attachmentId?: string;
  method: "GET" | "PUT";
  url: string;
  headers: Record<string, string>;
  expiresAt: string;
};

type ProviderConfig =
  | {
      provider: "gcs_private";
      bucket: string;
      prefix: string;
      clientEmail: string;
      privateKey: string;
    }
  | {
      provider: "s3_private";
      endpoint: string;
      bucket: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      prefix: string;
    };

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new ManualPaymentAttachmentError(`Storage externo sem ${name}.`, "STORAGE_NOT_CONFIGURED");
  return value;
}

function storageConfig(): ProviderConfig {
  const provider = process.env.ARCHIVE_STORAGE_PROVIDER?.trim().toLowerCase();
  if (provider === "gcs") {
    const privateKey = process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const clientEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL?.trim();
    if (!googleCloudConfigured() || !privateKey || !clientEmail) {
      throw new ManualPaymentAttachmentError("Storage GCS sem credenciais completas para URL assinada.", "STORAGE_NOT_CONFIGURED");
    }
    return {
      provider: "gcs_private",
      bucket: process.env.ARCHIVE_GCS_BUCKET?.trim() || process.env.ARCHIVE_S3_BUCKET?.trim() || requiredEnv("ARCHIVE_GCS_BUCKET"),
      prefix: (process.env.ARCHIVE_GCS_PREFIX?.trim() || process.env.ARCHIVE_S3_PREFIX?.trim() || "iatron-admin-archives").replace(/^\/|\/$/g, ""),
      clientEmail,
      privateKey
    };
  }
  if (provider === "s3") {
    return {
      provider: "s3_private",
      endpoint: requiredEnv("ARCHIVE_S3_ENDPOINT").replace(/\/$/, ""),
      bucket: requiredEnv("ARCHIVE_S3_BUCKET"),
      region: process.env.ARCHIVE_S3_REGION?.trim() || "auto",
      accessKeyId: requiredEnv("ARCHIVE_S3_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("ARCHIVE_S3_SECRET_ACCESS_KEY"),
      prefix: (process.env.ARCHIVE_S3_PREFIX?.trim() || "iatron-admin-archives").replace(/^\/|\/$/g, "")
    };
  }
  throw new ManualPaymentAttachmentError("Upload de comprovante exige ARCHIVE_STORAGE_PROVIDER=gcs ou s3.", "STORAGE_NOT_CONFIGURED");
}

function sanitizeFileName(value: string) {
  const fallback = "comprovante";
  const cleaned = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return cleaned || fallback;
}

function assertAttachmentInput(fileName: string, contentType: string, byteSize: number) {
  if (!fileName.trim()) throw new ManualPaymentAttachmentError("Nome do arquivo obrigatório.", "FILE_NAME_REQUIRED");
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new ManualPaymentAttachmentError("Formato inválido. Use PDF, PNG, JPG ou WEBP.", "INVALID_CONTENT_TYPE");
  }
  if (!Number.isFinite(byteSize) || byteSize <= 0 || byteSize > MAX_ATTACHMENT_BYTES) {
    throw new ManualPaymentAttachmentError("Arquivo inválido ou maior que 8 MB.", "INVALID_FILE_SIZE");
  }
}

function attachmentObjectKey(paymentId: string, attachmentId: string, fileName: string) {
  return `manual-payments/${paymentId}/${attachmentId}-${sanitizeFileName(fileName)}`;
}

function encodePath(value: string) {
  return value.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

function hmac(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest();
}

function hmacHex(key: Buffer | string, value: string) {
  return createHmac("sha256", key).update(value).digest("hex");
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function timestamp(now = new Date()) {
  return now.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function s3SigningKey(secretAccessKey: string, date: string, region: string) {
  const kDate = hmac(`AWS4${secretAccessKey}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

function signS3Url(config: Extract<ProviderConfig, { provider: "s3_private" }>, method: "GET" | "PUT", objectKey: string, expiresSeconds: number): SignedStorageRequest {
  const now = new Date();
  const amzDate = timestamp(now);
  const date = amzDate.slice(0, 8);
  const host = new URL(config.endpoint).host;
  const canonicalUri = `/${encodePath(`${config.bucket}/${config.prefix}/${objectKey}`.replace(/\/+/g, "/"))}`;
  const credentialScope = `${date}/${config.region}/s3/aws4_request`;
  const query = new URLSearchParams({
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${config.accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresSeconds),
    "X-Amz-SignedHeaders": "host"
  });
  const canonicalQuery = Array.from(query.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  const canonicalRequest = [method, canonicalUri, canonicalQuery, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const signature = hmacHex(s3SigningKey(config.secretAccessKey, date, config.region), stringToSign);
  const url = `${config.endpoint}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  return { method, url, headers: {}, expiresAt: new Date(now.getTime() + expiresSeconds * 1000).toISOString() };
}

function signGcsUrl(config: Extract<ProviderConfig, { provider: "gcs_private" }>, method: "GET" | "PUT", objectKey: string, expiresSeconds: number): SignedStorageRequest {
  const now = new Date();
  const googDate = timestamp(now);
  const date = googDate.slice(0, 8);
  const objectName = `${config.prefix}/${objectKey}`.replace(/\/+/g, "/");
  const canonicalUri = `/${encodePath(`${config.bucket}/${objectName}`)}`;
  const credentialScope = `${date}/auto/storage/goog4_request`;
  const query = new URLSearchParams({
    "X-Goog-Algorithm": "GOOG4-RSA-SHA256",
    "X-Goog-Credential": `${config.clientEmail}/${credentialScope}`,
    "X-Goog-Date": googDate,
    "X-Goog-Expires": String(expiresSeconds),
    "X-Goog-SignedHeaders": "host"
  });
  const canonicalQuery = Array.from(query.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  const canonicalRequest = [method, canonicalUri, canonicalQuery, "host:storage.googleapis.com\n", "host", "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["GOOG4-RSA-SHA256", googDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const signer = createSign("RSA-SHA256");
  signer.update(stringToSign);
  signer.end();
  const signature = signer.sign(config.privateKey).toString("hex");
  const url = `https://storage.googleapis.com${canonicalUri}?${canonicalQuery}&X-Goog-Signature=${signature}`;
  return { method, url, headers: {}, expiresAt: new Date(now.getTime() + expiresSeconds * 1000).toISOString() };
}

function signStorageUrl(config: ProviderConfig, method: "GET" | "PUT", objectKey: string, expiresSeconds: number) {
  if (config.provider === "gcs_private") return signGcsUrl(config, method, objectKey, expiresSeconds);
  return signS3Url(config, method, objectKey, expiresSeconds);
}

export async function createManualPaymentAttachmentUpload(input: {
  admin: AdminUser;
  paymentId: string;
  fileName: string;
  contentType: string;
  byteSize: number;
}) {
  assertAttachmentInput(input.fileName, input.contentType, input.byteSize);
  const config = storageConfig();
  const payment = await prisma.manualPayment.findUnique({ where: { id: input.paymentId }, select: { id: true, userId: true, organizationId: true } });
  if (!payment) throw new ManualPaymentAttachmentError("Pagamento manual não encontrado.", "PAYMENT_NOT_FOUND");

  const attachment = await prisma.manualPaymentAttachment.create({
    data: {
      paymentId: payment.id,
      storageProvider: config.provider,
      storageKey: "pending",
      fileName: sanitizeFileName(input.fileName),
      contentType: input.contentType,
      byteSize: input.byteSize,
      createdByUserId: input.admin.id
    }
  });
  const objectKey = attachmentObjectKey(payment.id, attachment.id, attachment.fileName);
  await prisma.manualPaymentAttachment.update({ where: { id: attachment.id }, data: { storageKey: `${config.prefix}/${objectKey}` } });

  const signed = signStorageUrl(config, "PUT", objectKey, UPLOAD_EXPIRES_SECONDS);
  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.manual_payment.attachment_upload_requested",
    resourceType: "manual_payment",
    resourceId: payment.id,
    organizationId: payment.organizationId,
    targetUserId: payment.userId,
    outcome: "success",
    metadata: { attachmentId: attachment.id, storageProvider: config.provider, fileName: attachment.fileName, contentType: input.contentType, byteSize: input.byteSize }
  });

  return { ...signed, attachmentId: attachment.id };
}

export async function completeManualPaymentAttachmentUpload(input: {
  admin: AdminUser;
  paymentId: string;
  attachmentId: string;
  checksum?: string | null;
}) {
  const attachment = await prisma.manualPaymentAttachment.findFirst({
    where: { id: input.attachmentId, paymentId: input.paymentId },
    include: { payment: { select: { id: true, userId: true, organizationId: true } } }
  });
  if (!attachment) throw new ManualPaymentAttachmentError("Anexo não encontrado.", "ATTACHMENT_NOT_FOUND");
  if (attachment.status !== ManualPaymentAttachmentStatus.PENDING_UPLOAD) {
    throw new ManualPaymentAttachmentError("Upload do comprovante já foi finalizado.", "ATTACHMENT_ALREADY_FINALIZED");
  }

  const updated = await prisma.manualPaymentAttachment.update({
    where: { id: attachment.id },
    data: {
      status: ManualPaymentAttachmentStatus.UPLOADED,
      checksum: input.checksum?.trim() || null,
      uploadedAt: new Date()
    }
  });

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.manual_payment.attachment_uploaded",
    resourceType: "manual_payment",
    resourceId: attachment.paymentId,
    organizationId: attachment.payment.organizationId,
    targetUserId: attachment.payment.userId,
    outcome: "success",
    metadata: { attachmentId: attachment.id, storageProvider: attachment.storageProvider, storageKey: attachment.storageKey }
  });

  return updated;
}

export async function getManualPaymentAttachmentDownloadUrl(input: {
  admin: AdminUser;
  paymentId: string;
  attachmentId: string;
}) {
  const attachment = await prisma.manualPaymentAttachment.findFirst({
    where: { id: input.attachmentId, paymentId: input.paymentId, status: ManualPaymentAttachmentStatus.UPLOADED },
    include: { payment: { select: { id: true, userId: true, organizationId: true } } }
  });
  if (!attachment) throw new ManualPaymentAttachmentError("Comprovante anexado não encontrado.", "ATTACHMENT_NOT_FOUND");
  const config = storageConfig();
  const objectKey = attachment.storageKey.startsWith(`${config.prefix}/`) ? attachment.storageKey.slice(config.prefix.length + 1) : attachment.storageKey;
  const signed = signStorageUrl(config, "GET", objectKey, DOWNLOAD_EXPIRES_SECONDS);

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.manual_payment.attachment_download_requested",
    resourceType: "manual_payment",
    resourceId: attachment.paymentId,
    organizationId: attachment.payment.organizationId,
    targetUserId: attachment.payment.userId,
    outcome: "success",
    metadata: { attachmentId: attachment.id, storageProvider: attachment.storageProvider }
  });

  return { ...signed, fileName: attachment.fileName };
}
