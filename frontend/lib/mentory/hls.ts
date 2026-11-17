import 'server-only';
import { getGoogleCloudAccessToken } from '../google-cloud-auth';
import { MentoryError } from './domain';

export async function readHlsObject(assetId: string, filename: string) {
  if (process.env.MENTORY_HLS_ENABLED !== 'true') throw new MentoryError(503, 'Streaming protegido indisponível.');
  const bucket = process.env.MENTORY_HLS_BUCKET;
  if (!bucket || !/^[a-z0-9][a-z0-9._-]+$/.test(bucket)) throw new MentoryError(503, 'Armazenamento indisponível.');
  if (!/^hls_[0-9a-f-]{36}$/.test(assetId) || !/^(index\.m3u8|video\.key|segment_[0-9]{6}\.ts)$/.test(filename)) throw new MentoryError(404, 'Mídia indisponível.');
  const object = encodeURIComponent('mentory-hls/' + assetId.slice(4) + '/' + filename);
  const token = await getGoogleCloudAccessToken();
  const response = await fetch('https://storage.googleapis.com/storage/v1/b/' + encodeURIComponent(bucket) + '/o/' + object + '?alt=media', {
    headers: { authorization: 'Bearer ' + token }, cache: 'no-store', signal: AbortSignal.timeout(20000)
  });
  if (response.status === 404) throw new MentoryError(404, 'Mídia indisponível.');
  if (!response.ok || !response.body) throw new MentoryError(503, 'Armazenamento temporariamente indisponível.');
  return response;
}
