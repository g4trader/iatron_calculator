import { createSign } from "crypto";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

const globalForGoogleAuth = globalThis as unknown as {
  __iatronGoogleToken?: Record<string, TokenCache>;
};

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function googlePrivateKey() {
  return process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

export function googleCloudConfigured() {
  return Boolean(process.env.GCP_PROJECT_ID?.trim() && process.env.GCP_SERVICE_ACCOUNT_EMAIL?.trim() && googlePrivateKey());
}

export async function getGoogleCloudAccessToken(scope = "https://www.googleapis.com/auth/cloud-platform") {
  if (!globalForGoogleAuth.__iatronGoogleToken) globalForGoogleAuth.__iatronGoogleToken = {};
  const cached = globalForGoogleAuth.__iatronGoogleToken[scope];
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.accessToken;

  const clientEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKey = googlePrivateKey();
  if (!process.env.GCP_PROJECT_ID?.trim() || !clientEmail || !privateKey) {
    throw new Error("Credenciais GCP ausentes para operação administrativa.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope,
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };
  const unsignedJwt = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claims))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedJwt);
  signer.end();
  const assertion = `${unsignedJwt}.${signer.sign(privateKey, "base64url")}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    }),
    cache: "no-store"
  });

  if (!response.ok) throw new Error(`Falha ao autenticar no GCP: ${response.status} ${response.statusText}`);
  const payload = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!payload.access_token) throw new Error("GCP não retornou access_token.");

  globalForGoogleAuth.__iatronGoogleToken[scope] = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + Number(payload.expires_in ?? 3600) * 1000
  };

  return payload.access_token;
}
