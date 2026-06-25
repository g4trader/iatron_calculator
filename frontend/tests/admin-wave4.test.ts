import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { archiveCutoffFor, ARCHIVE_POLICIES, parseArchiveType } from "../lib/admin-archive";
import { parseAdminListPagination } from "../lib/admin-exports";

const root = resolve(process.cwd());

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("admin wave 4 production readiness", () => {
  it("defines archive schema and storage references", () => {
    const schema = read("prisma/schema.prisma");
    assert.match(schema, /enum ArchiveJobType/);
    assert.match(schema, /enum ArchiveJobStatus/);
    assert.match(schema, /model ArchiveJob \{/);
    assert.match(schema, /model ArchiveObject \{/);
    assert.match(schema, /storageProvider/);
    assert.match(schema, /checksum/);
  });

  it("keeps archive policy explicit and parseable", () => {
    assert.ok(ARCHIVE_POLICIES.some((policy) => policy.type === "ADMIN_AUDIT"));
    assert.equal(parseArchiveType("JOB_RUNS"), "JOB_RUNS");
    assert.equal(parseArchiveType("invalid"), "FUNNEL_EVENTS");
    assert.ok(archiveCutoffFor("FUNNEL_EVENTS").getTime() < Date.now());
  });

  it("uses local private storage as replaceable fallback", () => {
    const storage = read("lib/archive-storage.ts");
    assert.match(storage, /interface ArchiveStorage/);
    assert.match(storage, /class LocalArchiveStorage/);
    assert.match(storage, /ARCHIVE_STORAGE_DIR/);
    assert.match(storage, /mode: 0o600/);
  });

  it("audits archive jobs and records ArchiveObject", () => {
    const service = read("lib/admin-archive.ts");
    assert.match(service, /admin\.archive\.requested/);
    assert.match(service, /admin\.archive\.completed/);
    assert.match(service, /admin\.archive\.failed/);
    assert.match(service, /prisma\.archiveObject\.create/);
  });

  it("requires archive before destructive retention", () => {
    const service = read("lib/admin-retention.ts");
    assert.match(service, /requireArchiveForDestructiveRetention/);
    assert.match(service, /Archive obrigatório ausente/);
    assert.match(service, /ArchiveJobStatus\.COMPLETED/);
    assert.match(service, /objects: \{ some: \{\} \}/);
  });

  it("uses server-side pagination for growing admin lists", () => {
    assert.deepEqual(parseAdminListPagination({ page: "2", pageSize: "50" }), { page: 2, pageSize: 50, skip: 50, take: 50 });
    assert.equal(parseAdminListPagination({ pageSize: "500" }).pageSize, 100);
    assert.match(read("lib/admin-archive.ts"), /skip: \(page - 1\) \* pageSize/);
    assert.match(read("lib/admin-retention.ts"), /skip: \(page - 1\) \* pageSize/);
  });

  it("documents staging readiness and rollback", () => {
    const doc = read("ADMIN_PRODUCTION_READINESS.md");
    assert.match(doc, /ARCHIVE_STORAGE_DIR/);
    assert.match(doc, /Stripe test mode/);
    assert.match(doc, /Rollback Se Archive Falhar/);
    assert.match(doc, /E2E completo depende/);
  });
});
