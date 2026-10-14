import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { MentoryError } from './domain';
function secret() { const value = process.env.AUTH_SECRET; if (!value) throw new MentoryError(503, 'Assinatura de ativos indisponível.'); return value; }
export function assetSignature(userId: string, materialId: string, expiry: number, preview: boolean) {
  return createHmac('sha256', secret()).update(JSON.stringify(['mentory-material-v1', userId, materialId, expiry, preview])).digest('hex');
}
export function verifyAssetSignature(userId: string, materialId: string, expiry: number, preview: boolean, signature: string) {
  if (!Number.isSafeInteger(expiry) || expiry <= Date.now() || expiry > Date.now() + 120000 || !/^[a-f0-9]{64}$/.test(signature)) return false;
  return timingSafeEqual(Buffer.from(assetSignature(userId, materialId, expiry, preview)), Buffer.from(signature));
}
// Optional adapter; no provider account is created or enabled by this implementation.
export async function videoPlayback(assetId: string | null, expiresAt: Date) {
  const account = process.env.MENTORY_STREAM_ACCOUNT_ID;
  const token = process.env.MENTORY_STREAM_API_TOKEN;
  const customer = process.env.MENTORY_STREAM_CUSTOMER_CODE;
  if (process.env.MENTORY_STREAM_APPROVED !== 'true' || !account || !token || !customer || !assetId) throw new MentoryError(423, 'Vídeo aguardando provedor seguro e publicação autorizada.');
  if (![account, customer, assetId].every(x => /^[a-zA-Z0-9_-]+$/.test(x))) throw new MentoryError(503, 'Configuração de vídeo inválida.');
  const base = `https://api.cloudflare.com/client/v4/accounts/${account}/stream/${assetId}`;
  const options = { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' as const, signal: AbortSignal.timeout(10000) };
  const metadata = await fetch(base, options);
  const info = await metadata.json();
  if (!metadata.ok || info.result?.requireSignedURLs !== true) throw new MentoryError(423, 'O vídeo deve exigir URLs assinadas no provedor.');
  const response = await fetch(`${base}/token`, { ...options, method: 'POST', body: JSON.stringify({ exp: Math.floor(Math.min(Date.now() + 300000, expiresAt.getTime()) / 1000), downloadable: false }), headers: { ...options.headers, 'content-type': 'application/json' } });
  const result = await response.json();
  if (!response.ok || !result.success || !result.result?.token) throw new MentoryError(503, 'Vídeo temporariamente indisponível.');
  return `https://customer-${customer}.cloudflarestream.com/${encodeURIComponent(result.result.token)}/iframe`;
}
