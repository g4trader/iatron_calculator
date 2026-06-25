import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const root = resolve(process.cwd());

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("admin wave 6 operational hardening", () => {
  it("persists private storage metadata for sensitive exports", () => {
    const schema = read("prisma/schema.prisma");
    assert.match(schema, /model ExportJob \{/);
    assert.match(schema, /storageProvider\s+String\?/);
    assert.match(schema, /checksum\s+String\?/);
    assert.match(schema, /byteSize\s+Int\?/);
    assert.match(schema, /@@index\(\[storageProvider, storageKey\]\)/);
  });

  it("stores exports in private storage and validates checksum on download", () => {
    const service = read("lib/admin-exports.ts");
    assert.match(service, /getArchiveStorage/);
    assert.match(service, /storage\.writeObject/);
    assert.match(service, /storageProvider: stored\.provider/);
    assert.match(service, /checksum: stored\.checksum/);
    assert.match(service, /admin\.export\.download\.blocked/);
    assert.match(service, /checksum_mismatch/);
    assert.match(service, /ADMIN_EXPORT_ALLOW_INLINE_FALLBACK/);
  });

  it("requires step-up for manual export reprocessing", () => {
    const actions = read("app/admin/exports/actions.ts");
    assert.match(actions, /processExportJobAction/);
    assert.match(actions, /validateAdminStepUp/);
    assert.match(actions, /export_reprocess/);
  });

  it("records richer restore analysis and conflict reports", () => {
    const schema = read("prisma/schema.prisma");
    assert.match(schema, /result\s+Json\?/);
    const service = read("lib/admin-archive-restore.ts");
    assert.match(service, /analyzeRestoreRows/);
    assert.match(service, /missingIdRows/);
    assert.match(service, /duplicateIds/);
    assert.match(service, /existingIds/);
    assert.match(service, /preconditionFailures/);
    assert.match(service, /Restore bloqueado:/);
  });

  it("surfaces export storage risk and restore risk in operations", () => {
    const operations = read("lib/admin-operations.ts");
    assert.match(operations, /completedExportsWithoutStorage/);
    assert.match(operations, /Export sem storage privado/);
    assert.match(operations, /ArchiveRestoreStatus/);
    assert.match(operations, /Restore travado\/falho/);
  });

  it("has strict staging readiness mode and operational runbooks", () => {
    const script = read("scripts/admin-production-readiness.mjs");
    assert.match(script, /ADMIN_READINESS_STRICT/);
    assert.match(script, /staging readiness estrito exige ARCHIVE_STORAGE_PROVIDER=s3/);
    assert.match(script, /ADMIN_EXPORT_ALLOW_INLINE_FALLBACK/);
    assert.match(script, /ADMIN_RELEASE_REVIEW\.md/);
    const doc = read("ADMIN_PRODUCTION_READINESS.md");
    assert.match(doc, /Modo estrito/);
    assert.match(doc, /Exportações Sensíveis/);
    assert.match(doc, /Quando Não Executar Restore Real/);
  });

  it("adds a visible controlled-release surface in admin", () => {
    assert.match(read("lib/admin-release-readiness.ts"), /summarizeAdminReleaseReadiness/);
    assert.match(read("app/admin/page.tsx"), /Liberação controlada/);
    assert.match(read("app/admin/system/page.tsx"), /Readiness de liberação/);
    assert.match(read("ADMIN_RELEASE_REVIEW.md"), /Bloqueadores Para Produção Ampla/);
  });
});
