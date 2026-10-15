import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mediaRange } from '../lib/mentory/media-range';
test('media range: full, bounded, open and suffix requests', () => {
  assert.equal(mediaRange(null, 100), null);
  assert.deepEqual(mediaRange('bytes=0-11', 100), { start: 0, end: 11 });
  assert.deepEqual(mediaRange('bytes=20-', 100), { start: 20, end: 99 });
  assert.deepEqual(mediaRange('bytes=-12', 100), { start: 88, end: 99 });
  assert.deepEqual(mediaRange('bytes=0-999', 100), { start: 0, end: 99 });
  assert.deepEqual(mediaRange('bytes=-999', 100), { start: 0, end: 99 });
});
test('media range: malformed, multiple, reversed and unsafe ranges fail closed', () => {
  for (const value of ['bytes=-', 'bytes=-0', 'bytes=100-', 'bytes=10-2', 'bytes=0-1,3-4', 'bytes=9007199254740992-', 'items=0-1', 'bytes=1.5-2']) assert.equal(mediaRange(value, 100), false, value);
});
