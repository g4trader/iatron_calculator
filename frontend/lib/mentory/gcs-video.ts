import { createHash, createSign, randomUUID } from 'node:crypto';
import { getGoogleCloudAccessToken } from '../google-cloud-auth';
import { MentoryError } from './domain';
const prefix = 'iatron-mentory-media/';
export const VIDEO_MAX_BYTES = 2_000_000_000;
export function mediaObject(id: string) {
  if (!/^gcs_[0-9a-f-]{36}$/.test(id)) throw new MentoryError(400, 'Identificador de mídia inválido.');
  return prefix + id;
}
function bucket() {
  const value = process.env.MENTORY_VIDEO_BUCKET;
  if (process.env.MENTORY_STREAM_APPROVED !== 'true' || !value || !/^[a-z0-9][a-z0-9._-]+$/.test(value)) throw new MentoryError(503, 'Armazenamento de vídeo não configurado.');
  return value;
}
function objectUrl(id: string) { mediaObject(id); return `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket())}/o/${encodeURIComponent(mediaObject(id))}`; }
async function authorizedFetch(url: string, init: RequestInit = {}) {
  const token = await getGoogleCloudAccessToken();
  return fetch(url, { ...init, headers: { ...init.headers, authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(20000) });
}
export function validateUpload(kind: unknown, size: unknown) {
  if (!['video', 'captions'].includes(String(kind)) || !Number.isSafeInteger(size) || Number(size) < 8 || Number(size) > (kind === 'video' ? VIDEO_MAX_BYTES : 1_000_000)) throw new MentoryError(400, 'Envie vídeo MP4 de até 2 GB ou legendas WebVTT de até 1 MB.');
}
export async function beginMediaUpload(actorId: string, kind: string, size: number, origin: string) {
  validateUpload(kind, size);
  const id = `gcs_${randomUUID()}`;
  const contentType = kind === 'video' ? 'video/mp4' : 'text/vtt';
  const url = `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket())}/o?uploadType=resumable&ifGenerationMatch=0`;
  const response = await authorizedFetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-upload-content-type': contentType, 'x-upload-content-length': String(size), origin }, body: JSON.stringify({ name: mediaObject(id), contentType, cacheControl: 'private, no-store', metadata: { creator: actorId, kind, expectedBytes: String(size), verified: 'false' } }) });
  const uploadUrl = response.headers.get('location');
  if (!response.ok || !uploadUrl || new URL(uploadUrl).origin !== 'https://storage.googleapis.com') throw new MentoryError(503, 'Não foi possível iniciar o envio privado.');
  return { id, uploadUrl, contentType };
}
type Metadata = { size: string; generation: string; contentType: string; metadata?: Record<string, string> };
async function metadata(id: string): Promise<Metadata> {
  const r = await authorizedFetch(objectUrl(id));
  if (!r.ok) throw new MentoryError(404, 'Mídia não encontrada ou upload incompleto.');
  return r.json();
}
export function validMediaHeader(bytes: Uint8Array, kind: string) {
  const b = Buffer.from(bytes);
  return kind === 'video' ? b.length >= 12 && b.subarray(4, 8).toString('ascii') === 'ftyp' : /^\uFEFF?WEBVTT(?:[ \t]|\r?\n)/.test(b.toString('utf8'));
}
export async function finishMediaUpload(actorId: string, id: string) {
  const info = await metadata(id); const m = info.metadata || {};
  if (m.creator !== actorId) throw new MentoryError(403, 'Upload pertence a outro editor.');
  validateUpload(m.kind, Number(info.size));
  if (info.size !== m.expectedBytes || info.contentType !== (m.kind === 'video' ? 'video/mp4' : 'text/vtt')) throw new MentoryError(400, 'Tamanho ou formato diferente do informado.');
  const r = await authorizedFetch(objectUrl(id) + `?alt=media&generation=${info.generation}`, { headers: { Range: 'bytes=0-65535' } });
  if (!r.ok || !validMediaHeader(new Uint8Array(await r.arrayBuffer()), m.kind)) throw new MentoryError(400, 'O arquivo não corresponde ao formato MP4/WebVTT.');
  const update = await authorizedFetch(objectUrl(id) + `?ifGenerationMatch=${info.generation}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ metadata: { ...m, verified: 'true' } }) });
  if (!update.ok) throw new MentoryError(503, 'Não foi possível concluir a verificação do arquivo.');
  return { id, kind: m.kind, byteSize: Number(info.size) };
}
export async function verifiedMedia(id: string, kind: string) {
  const info = await metadata(id);
  if (info.metadata?.verified !== 'true' || info.metadata.kind !== kind) throw new MentoryError(400, 'Conclua o envio e a verificação da mídia antes de salvar a aula.');
  return info;
}
const encode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
export function signedMediaUrl(input: { bucket: string; id: string; email: string; privateKey: string; expiresAt: Date; generation: string; now?: Date }) {
  const now = input.now || new Date();
  const seconds = Math.min(300, Math.floor((input.expiresAt.getTime() - now.getTime()) / 1000));
  if (seconds < 1) throw new MentoryError(403, 'Acesso expirado.');
  const timestamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const scope = timestamp.slice(0, 8) + '/auto/storage/goog4_request';
  const path = '/' + [input.bucket, ...mediaObject(input.id).split('/')].map(encode).join('/');
  const query = Object.entries({ 'X-Goog-Algorithm': 'GOOG4-RSA-SHA256', 'X-Goog-Credential': input.email + '/' + scope, 'X-Goog-Date': timestamp, 'X-Goog-Expires': String(seconds), 'X-Goog-SignedHeaders': 'host', generation: input.generation }).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k,v]) => encode(k) + '=' + encode(v)).join('&');
  const canonical = ['GET', path, query, 'host:storage.googleapis.com\n', 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const toSign = ['GOOG4-RSA-SHA256', timestamp, scope, createHash('sha256').update(canonical).digest('hex')].join('\n');
  const signature = createSign('RSA-SHA256').update(toSign).sign(input.privateKey.replace(/\\n/g, '\n'), 'hex');
  return `https://storage.googleapis.com${path}?${query}&X-Goog-Signature=${signature}`;
}
export async function gcsPlayback(id: string, expiresAt: Date) {
  const info = await verifiedMedia(id, 'video');
  const email = process.env.GCP_SERVICE_ACCOUNT_EMAIL; const privateKey = process.env.GCP_PRIVATE_KEY;
  if (!email || !privateKey) throw new MentoryError(503, 'Credenciais de vídeo indisponíveis.');
  return signedMediaUrl({ bucket: bucket(), id, email, privateKey, expiresAt, generation: info.generation });
}
export async function readCaptions(id: string) {
  const info = await verifiedMedia(id, 'captions');
  if (Number(info.size) > 1_000_000) throw new MentoryError(400, 'Legendas excedem o limite.');
  const r = await authorizedFetch(objectUrl(id) + `?alt=media&generation=${info.generation}`);
  if (!r.ok) throw new MentoryError(503, 'Legendas indisponíveis.');
  return r.text();
}
