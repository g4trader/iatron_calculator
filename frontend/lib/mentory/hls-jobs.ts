import 'server-only';
import { randomUUID } from 'node:crypto';
import { getGoogleCloudAccessToken } from '../google-cloud-auth';
import { MentoryError } from './domain';
export async function startHlsImport(fileId: unknown) {
  if (typeof fileId !== 'string' || !/^[a-zA-Z0-9_-]{10,200}$/.test(fileId)) throw new MentoryError(400, 'Informe o ID do arquivo privado no Drive.');
  const job = process.env.MENTORY_HLS_JOB;
  if (process.env.MENTORY_HLS_ENABLED !== 'true' || !job || !/^projects\/[a-zA-Z0-9_-]+\/locations\/[a-z0-9-]+\/jobs\/[a-z0-9-]+$/.test(job)) throw new MentoryError(503, 'Processamento HLS não configurado.');
  const asset = randomUUID();
  const token = await getGoogleCloudAccessToken();
  const r = await fetch('https://run.googleapis.com/v2/' + job + ':run', { method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' }, body: JSON.stringify({ overrides: { containerOverrides: [{ args: [fileId, asset] }], taskCount: 1 } }), signal: AbortSignal.timeout(15000), cache: 'no-store' });
  if (!r.ok) throw new MentoryError(503, 'Não foi possível iniciar o processamento.');
  return { id: 'hls_' + asset };
}
