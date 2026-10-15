import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createVerify, createHash } from 'node:crypto';
import { mediaObject, validateUpload, validMediaHeader, signedMediaUrl } from '../lib/mentory/gcs-video';
const id = 'gcs_12345678-1234-1234-1234-123456789abc';
test('private media rejects arbitrary paths, external URLs and invalid size/type', () => {
  for (const path of ['../archive', 'https://example.com/video', 'gcs_../../archive', 'other']) assert.throws(() => mediaObject(path));
  for (const size of [0, -1, 1.2, NaN, Infinity, 2000000001, '100']) assert.throws(() => validateUpload('video', size));
  assert.throws(() => validateUpload('html', 100)); assert.throws(() => validateUpload('captions', 1000001));
  validateUpload('video', 2000000000); validateUpload('captions', 1000000);
  assert.equal(mediaObject(id), 'iatron-mentory-media/' + id);
});
test('media requires MP4 and WebVTT headers rather than accepting MIME alone', () => {
  assert.equal(validMediaHeader(Buffer.from('0000ftypisom'), 'video'), true);
  assert.equal(validMediaHeader(Buffer.from('<script>x</script>'), 'video'), false);
  assert.equal(validMediaHeader(Buffer.from('WEBVTT\n\n'), 'captions'), true);
  assert.equal(validMediaHeader(Buffer.from('\uFEFFWEBVTT\n'), 'captions'), true);
  assert.equal(validMediaHeader(Buffer.from('WEBVTTBAD'), 'captions'), false);
});
test('signed media URLs bind method, bucket, generation and expiry with verifiable RSA signature', () => {
  const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
  const now=new Date('2026-10-15T15:00:00Z');
  const input={bucket:'private-bucket',id,email:'service@example.com',privateKey:privateKey.export({type:'pkcs8',format:'pem'}).toString(),now,expiresAt:new Date(now.getTime()+90000),generation:'123'};
  const url=new URL(signedMediaUrl(input));
  assert.equal(url.searchParams.get('X-Goog-Expires'),'90'); assert.equal(url.searchParams.get('generation'),'123');
  const signature=url.searchParams.get('X-Goog-Signature')!;url.searchParams.delete('X-Goog-Signature');
  const canonical=['GET',url.pathname,url.searchParams.toString(),'host:storage.googleapis.com\n','host','UNSIGNED-PAYLOAD'].join('\n');
  const toSign=['GOOG4-RSA-SHA256','20261015T150000Z','20261015/auto/storage/goog4_request',createHash('sha256').update(canonical).digest('hex')].join('\n');
  assert.ok(createVerify('RSA-SHA256').update(toSign).verify(publicKey,signature,'hex'));
  assert.equal(new URL(signedMediaUrl({...input,expiresAt:new Date(now.getTime()+999999)})).searchParams.get('X-Goog-Expires'),'300');
  assert.throws(()=>signedMediaUrl({...input,expiresAt:now}),/expirado/);
  assert.equal(createVerify('RSA-SHA256').update(toSign+'tampered').verify(publicKey,signature,'hex'),false);
});
