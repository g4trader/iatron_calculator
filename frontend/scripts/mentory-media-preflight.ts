// Explicit remote integration probe: creates one random private media object and deletes it.
import { beginMediaUpload, finishMediaUpload, gcsPlayback, mediaObject } from '../lib/mentory/gcs-video';
import { getGoogleCloudAccessToken } from '../lib/google-cloud-auth';
import assert from 'node:assert/strict';
async function main() {
if (process.env.MENTORY_MEDIA_PREFLIGHT !== 'true') throw new Error('Explicit media preflight required');
let id: string | undefined;
try {
  const bytes=Buffer.from('0000ftypisom000000000000');
  const session=await beginMediaUpload('operational-storage-probe','video',bytes.length,'https://ped.iatron.com.br');id=session.id;
  const upload=await fetch(session.uploadUrl,{method:'PUT',headers:{'content-type':session.contentType,'content-range':`bytes 0-${bytes.length-1}/${bytes.length}`,origin:'https://ped.iatron.com.br'},body:bytes});
  assert.ok(upload.ok);assert.equal(upload.headers.get('access-control-allow-origin'),'https://ped.iatron.com.br');
  await finishMediaUpload('operational-storage-probe',id);
  const url=await gcsPlayback(id,new Date(Date.now()+60000));
  const read=await fetch(url,{headers:{Range:'bytes=0-11'}}); assert.equal(read.status,206);assert.equal((await read.arrayBuffer()).byteLength,12);
  const publicUrl=new URL(url);publicUrl.search='';const denied=await fetch(publicUrl);assert.ok([401,403,404].includes(denied.status));
  console.log(JSON.stringify({mentoryMediaPreflight:'PASS',privateObject:true,resumableUpload:true,browserCors:true,verifiedHeader:true,signedRangeRead:true,anonymousDenied:true}));
} catch { console.error('Mentory media preflight failed; no promotion allowed. No credentials or signed URLs logged.');process.exitCode=1; }
finally {
 if(id){const r=await fetch(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(process.env.MENTORY_VIDEO_BUCKET!)}/o/${encodeURIComponent(mediaObject(id))}`,{method:'DELETE',headers:{authorization:`Bearer ${await getGoogleCloudAccessToken()}`}});if(!r.ok&&r.status!==404){console.error('Private probe cleanup failed');process.exitCode=1;}else console.log('Private media probe removed.');}
}

}
main().catch(() => { console.error("Media probe failed safely."); process.exitCode = 1; });
