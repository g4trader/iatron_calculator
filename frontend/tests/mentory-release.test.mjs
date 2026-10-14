import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspectHistory, redactError } from '../scripts/deploy-pending-resources.mjs';
const current = '20261015000100_mentory';
const checksum = '0ff45e12af2c4eda6af050a577e318409cf06436535e63169750c517bb2b35ee';
const files = { prior: 'prior-hash', [current]: checksum };
const done = { migration_name: 'prior', checksum: 'prior-hash', finished_at: new Date(), rolled_back_at: null };
test('release permits only the audited additive migration', () => assert.deepEqual(inspectHistory(files, [done]), [current]));
test('release is idempotent after successful migration', () => assert.deepEqual(inspectHistory(files, [done, { ...done, migration_name: current, checksum }]), []));
test('release refuses unrelated pending migrations', () => assert.throws(() => inspectHistory(files, []), /Unrelated/));
test('release refuses checksum drift and unfinished migrations', () => { assert.throws(() => inspectHistory(files, [{ ...done, checksum: 'different' }]), /mismatch/); assert.throws(() => inspectHistory(files, [{ ...done, finished_at: null }]), /Unresolved/); assert.throws(() => inspectHistory({ ...files, [current]: 'other' }, [done]), /audited/); });

test('release diagnostics redact environment secrets and database passwords', () => { const url = 'postgresql://user:sensitive%40password@private.example/db'; const message = redactError(new Error(url + ' sensitive@password token-secret-value'), { DIRECT_URL: url, AUTH_SECRET: 'token-secret-value' }); assert.ok(!message.includes('sensitive')); assert.ok(!message.includes('token-secret-value')); assert.ok(!message.includes('private.example')); });
