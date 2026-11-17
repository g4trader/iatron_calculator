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

export async function listDriveVideos() {
  const folder = process.env.MENTORY_DRIVE_FOLDER_ID;
  if (!folder || !/^[A-Za-z0-9_-]+$/.test(folder)) throw new MentoryError(503, 'Pasta de vídeos não configurada.');
  const token = await getGoogleCloudAccessToken('https://www.googleapis.com/auth/drive.readonly');
  const folderCheck = await fetch('https://www.googleapis.com/drive/v3/files/'+folder+'?fields=id,mimeType', {headers:{authorization:'Bearer '+token},cache:'no-store',signal:AbortSignal.timeout(15000)});
  if (!folderCheck.ok) throw new MentoryError(503, 'A conta de serviço ainda não tem acesso à pasta do Drive.');
  const files: {id:string;name:string;size?:string}[] = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({q:"'"+folder+"' in parents and trashed = false and mimeType contains 'video/'",fields:'nextPageToken,files(id,name,size)',pageSize:'100',orderBy:'name'});
    if(pageToken) params.set('pageToken',pageToken);
    const r=await fetch('https://www.googleapis.com/drive/v3/files?'+params,{headers:{authorization:'Bearer '+token},cache:'no-store',signal:AbortSignal.timeout(15000)});
    if(!r.ok) throw new MentoryError(503,'Não foi possível consultar os vídeos do Drive.');
    const payload=await r.json();files.push(...(payload.files||[]));pageToken=payload.nextPageToken||'';
  } while(pageToken && files.length<1000);
  return {files};
}
