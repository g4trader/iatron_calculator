import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  describeAuditAction,
  parseAuditFilters,
  sanitizeAuditMetadata,
  serializeAuditEvents
} from "../lib/admin-audit";

const root = resolve(process.cwd());

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("admin audit domain", () => {
  it("sanitizes sensitive metadata recursively", () => {
    const sanitized = sanitizeAuditMetadata({
      reason: "ok",
      token: "secret-token",
      nested: {
        passwordHash: "hash",
        visible: "value",
        list: [{ cookie: "session" }]
      }
    });

    assert.deepEqual(sanitized, {
      reason: "ok",
      token: "[redacted]",
      nested: {
        passwordHash: "[redacted]",
        visible: "value",
        list: [{ cookie: "[redacted]" }]
      }
    });
  });

  it("parses filters with bounded pagination", () => {
    const filters = parseAuditFilters({ page: "-1", pageSize: "1000", actor: " admin@iatron.com " });
    assert.equal(filters.page, 1);
    assert.equal(filters.pageSize, 100);
    assert.equal(filters.actor, "admin@iatron.com");
  });

  it("renders readable descriptions and CSV/JSON exports", () => {
    assert.equal(describeAuditAction("admin.license.revoke"), "Licença revogada");
    assert.equal(describeAuditAction("admin.unknown_action"), "unknown action");

    const event = {
      id: "evt_1",
      actorUserId: "user_1",
      action: "admin.license.revoke",
      resourceType: "license",
      resourceId: "lic_1",
      organizationId: null,
      targetUserId: null,
      metadata: { token: "secret", reason: "fraude" },
      ipAddress: "127.0.0.1",
      userAgent: "test",
      outcome: "success",
      createdAt: new Date("2026-06-23T12:00:00.000Z"),
      actor: { email: "admin@iatron.com", name: null },
      targetUser: null
    };

    const json = serializeAuditEvents([event], "json");
    const parsed = JSON.parse(json) as Array<{ metadata: string }>;
    assert.deepEqual(JSON.parse(parsed[0].metadata), { token: "[redacted]", reason: "fraude" });
    const csv = serializeAuditEvents([event], "csv");
    assert.match(csv, /description/);
    assert.match(csv, /Licença revogada/);
  });

  it("audit routes are protected server-side", () => {
    assert.match(read("app/admin/audit/page.tsx"), /requireAdminPermission\("admin\.audit\.view"\)/);
    assert.match(read("app/admin/audit/[id]/page.tsx"), /requireAdminPermission\("admin\.audit\.view"\)/);
    const exportRoute = read("app/admin/audit/export/route.ts");
    assert.match(exportRoute, /requireAdminPermission\("admin\.audit\.export"\)/);
    assert.match(exportRoute, /validateAdminStepUp/);
  });
});
