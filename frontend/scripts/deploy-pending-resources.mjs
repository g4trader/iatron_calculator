// One-off, explicitly authorized release migration. Never seeds data or enables billing/publication.
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { PrismaClient } from '@prisma/client';
let stage = 'configuration';
const migration = '20261015000100_mentory';
const expectedChecksum = '0ff45e12af2c4eda6af050a577e318409cf06436535e63169750c517bb2b35ee';
export function redactError(error, env) {
  let message = String(error.message || error);
  const secrets = Object.values(env).filter(value => typeof value === 'string' && value.length >= 8);
  for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
    try { const url = new URL(env[key]); if (url.password) secrets.push(url.password, decodeURIComponent(url.password)); } catch {}
  }
  for (const value of secrets.sort((a, b) => b.length - a.length)) message = message.split(value).join('[redacted]');
  return message.replace(/(?:postgres(?:ql)?|https?):\/\/[^\s"'`]+/g, '[redacted-url]').slice(0, 2500);
}
export function inspectHistory(files, history) {
  if (files[migration] !== expectedChecksum) throw new Error('Migration Mentory differs from audited SQL.');
  const applied = new Set();
  for (const row of history) {
    if (row.rolled_back_at) continue;
    if (!row.finished_at) throw new Error(`Unresolved migration: ${row.migration_name}`);
    if (!files[row.migration_name] || files[row.migration_name] !== row.checksum) throw new Error(`Migration history mismatch: ${row.migration_name}`);
    applied.add(row.migration_name);
  }
  const pending = Object.keys(files).filter(name => !applied.has(name));
  if (pending.some(name => name !== migration)) throw new Error(`Unrelated pending migrations: ${pending.join(', ')}`);
  return pending;
}
async function main() {
  if (process.env.IATRON_ENV !== 'production' || process.env.ALLOW_PRODUCTION_MIGRATIONS !== 'true') throw new Error('Explicit production migration authorization required.');
  if (!process.env.DIRECT_URL || !process.env.DATABASE_URL) throw new Error('Production database configuration unavailable.');
  if (process.env.MENTORY_PUBLICATION_APPROVAL || process.env.MENTORY_STREAM_APPROVED === 'true') throw new Error('This release must preserve closed publication/provider gates.');
  stage = 'client-initialization';
  const db = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL });
  try {
    stage = 'migration-files';
    const files = {};
    for (const entry of await readdir('prisma/migrations', { withFileTypes: true })) {
      if (entry.isDirectory()) files[entry.name] = createHash('sha256').update(await readFile(`prisma/migrations/${entry.name}/migration.sql`)).digest('hex');
    }
    stage = 'database-history';
    const history = await db.$queryRawUnsafe('SELECT migration_name, checksum, finished_at, rolled_back_at FROM "_prisma_migrations"');
    stage = 'history-validation';
    const pending = inspectHistory(files, history);
    async function fingerprint() {
      const schema = await db.$queryRawUnsafe("SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name NOT LIKE 'mentory_%' ORDER BY table_name, ordinal_position");
      return createHash('sha256').update(JSON.stringify(schema)).digest('hex');
    }
    stage = 'schema-fingerprint';
    const before = await fingerprint();
    console.log(JSON.stringify({ releasePreflight: 'PASS', pending, existingSchemaSha256: before, existingArtifactRollback: 'dpl_9WrRqyTpse91ZSRSvNyfgf9sdrDx', mutationScope: 'additive Mentory tables only; existing rows untouched' }));
    stage = 'apply-migration';
    if (pending.length) execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], { env: process.env, stdio: 'inherit' });
    stage = 'post-migration-check';
    const after = await fingerprint();
    if (before !== after) throw new Error('Unexpected modification of existing database columns; do not promote deployment.');
    const tables = await db.$queryRawUnsafe("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'mentory_%' ORDER BY tablename");
    if (tables.length !== 10) throw new Error('Incomplete Mentory schema.');
    console.log(JSON.stringify({ releaseMigration: 'PASS', existingSchemaPreserved: true, mentoryTables: tables.length, clinicalPublication: 'blocked', realCharges: 'blocked' }));
  } finally { await db.$disconnect(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch(error => { console.error(JSON.stringify({ migrationFailureStage: stage, errorType: error.constructor?.name, code: error.code || error.errorCode, databaseCode: error.meta?.code })); console.error(redactError(error, process.env)); console.error('Release migration failed. Inspect sanitized preflight and Prisma migration status before promotion.'); process.exitCode = 1; });
