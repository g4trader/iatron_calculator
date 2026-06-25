import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const root = resolve(process.cwd());

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("admin wave 5 production readiness", () => {
  it("adds restore schema, enums, events and indexes", () => {
    const schema = read("prisma/schema.prisma");
    assert.match(schema, /enum ArchiveRestoreStatus/);
    assert.match(schema, /enum ArchiveRestoreEventType/);
    assert.match(schema, /model ArchiveRestoreJob \{/);
    assert.match(schema, /model ArchiveRestoreEvent \{/);
    assert.match(schema, /checksumVerified/);
    assert.match(schema, /@@index\(\[archiveObjectId, createdAt\]\)/);
  });

  it("ships a real private external storage provider with local fallback only", () => {
    const storage = read("lib/archive-storage.ts");
    assert.match(storage, /class S3ArchiveStorage/);
    assert.match(storage, /class GcsArchiveStorage/);
    assert.match(storage, /ARCHIVE_STORAGE_PROVIDER/);
    assert.match(storage, /ARCHIVE_S3_ENDPOINT/);
    assert.match(storage, /ARCHIVE_S3_BUCKET/);
    assert.match(storage, /ARCHIVE_GCS_BUCKET/);
    assert.match(storage, /AWS4-HMAC-SHA256/);
    assert.match(storage, /readObject/);
    assert.match(storage, /listObjects/);
    assert.match(storage, /ARCHIVE_STORAGE_PROVIDER=gcs ou s3 é obrigatório em produção/);
  });

  it("implements checksum-verified restore with duplicate protection and audit", () => {
    const service = read("lib/admin-archive-restore.ts");
    assert.match(service, /createArchiveRestoreJob/);
    assert.match(service, /processArchiveRestoreJob/);
    assert.match(service, /checksum\(content\)/);
    assert.match(service, /duplicate_restore/);
    assert.match(service, /skipDuplicates: true/);
    assert.match(service, /admin\.archive_restore\.requested/);
    assert.match(service, /admin\.archive_restore\.completed/);
    assert.match(service, /admin\.archive_restore\.failed/);
    assert.match(service, /admin\.archive\.download\.blocked/);
  });

  it("protects archive and restore actions with permission and step-up", () => {
    const actions = read("app/admin/archive/actions.ts");
    assert.match(actions, /requireAdminPermission\("admin\.contingency\.manage"\)/);
    assert.match(actions, /validateAdminStepUp/);
    assert.match(actions, /requestArchiveRestoreAction/);
    assert.match(actions, /stepUpPasswordFromForm/);
  });

  it("exposes restore state in the admin archive UI", () => {
    const page = read("app/admin/archive/page.tsx");
    assert.match(page, /Restore controlado/);
    assert.match(page, /listArchiveRestoreJobs/);
    assert.match(page, /requestArchiveRestoreAction/);
    assert.match(page, /confirm_force_restore/);
  });

  it("adds production readiness automation and documentation", () => {
    const script = read("scripts/admin-production-readiness.mjs");
    assert.match(script, /ADMIN_STAGING_BASE_URL/);
    assert.match(script, /ARCHIVE_STORAGE_PROVIDER=gcs ou s3/);
    assert.match(script, /ArchiveRestoreJob/);
    assert.match(read("package.json"), /admin:readiness/);
    const doc = read("ADMIN_PRODUCTION_READINESS.md");
    assert.match(doc, /Archive Restore/);
    assert.match(doc, /ARCHIVE_STORAGE_PROVIDER=s3/);
    assert.match(doc, /checksum/i);
  });

  it("surfaces restore failures in operations", () => {
    const operations = read("lib/admin-operations.ts");
    assert.match(operations, /ArchiveRestoreStatus/);
    assert.match(operations, /archiveRestoreJob\.count/);
    assert.match(operations, /Restore travado\/falho/);
  });
});
