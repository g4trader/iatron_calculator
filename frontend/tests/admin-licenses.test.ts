import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LicenseOrigin } from "@prisma/client";
import {
  AdminLicenseError,
  getLicenseAuditAction,
  getPresetExpiration,
  parseLicenseOrigin,
  requireDestructiveConfirmation,
  requireLicenseReason
} from "../lib/admin-licenses";

const root = resolve(process.cwd());

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("admin license contingency rules", () => {
  it("requires an explicit internal reason for every administrative action", () => {
    assert.throws(() => requireLicenseReason("curto"), AdminLicenseError);
    assert.throws(() => requireLicenseReason("   "), AdminLicenseError);
    assert.equal(requireLicenseReason("  Plantão sem billing ativo  "), "Plantão sem billing ativo");
  });

  it("requires explicit confirmation for destructive actions", () => {
    assert.doesNotThrow(() => requireDestructiveConfirmation("revoke", "REVOGAR"));
    assert.doesNotThrow(() => requireDestructiveConfirmation("suspend", "SUSPENDER"));
    assert.throws(() => requireDestructiveConfirmation("revoke", "revogar agora"), AdminLicenseError);
    assert.throws(() => requireDestructiveConfirmation("suspend", ""), AdminLicenseError);
  });

  it("uses safe expiration presets and defaults manual licenses to 72h", () => {
    const now = new Date("2026-06-23T12:00:00.000Z");
    assert.equal(getPresetExpiration("24h", now).toISOString(), "2026-06-24T12:00:00.000Z");
    assert.equal(getPresetExpiration("7d", now).toISOString(), "2026-06-30T12:00:00.000Z");
    assert.equal(getPresetExpiration("invalid", now).toISOString(), "2026-06-26T12:00:00.000Z");
  });

  it("normalizes license origins and action audit names", () => {
    assert.equal(parseLicenseOrigin("CONTINGENCY"), LicenseOrigin.CONTINGENCY);
    assert.equal(parseLicenseOrigin("invalid"), LicenseOrigin.MANUAL_SUPPORT);
    assert.equal(getLicenseAuditAction("create_manual"), "admin.license.create_manual");
    assert.equal(getLicenseAuditAction("revoke"), "admin.license.revoke");
  });

  it("manual creation and status changes record administrative audit events", () => {
    const source = read("lib/admin-licenses.ts");
    const createStart = source.indexOf("export async function createManualLicense");
    const extendStart = source.indexOf("export async function extendLicense");
    const updateStart = source.indexOf("export async function updateLicenseStatus");
    const createSource = source.slice(createStart, extendStart);
    const updateSource = source.slice(updateStart);

    assert.match(createSource, /recordAdminAuditEvent/);
    assert.match(createSource, /getLicenseAuditAction\("create_manual"\)/);
    assert.match(updateSource, /recordAdminAuditEvent/);
    assert.match(updateSource, /getLicenseAuditAction\(input\.action\)/);
    assert.match(updateSource, /requireDestructiveConfirmation/);
  });

  it("server actions are blocked by admin.licenses.manage permission", () => {
    const source = read("app/admin/licenses/actions.ts");
    const permissionCalls = source.match(/requireAdminPermission\("admin\.licenses\.manage"\)/g) ?? [];
    assert.equal(permissionCalls.length, 3);
    assert.match(source, /validateAdminStepUp/);
    assert.match(source, /stepUpPasswordFromForm/);
  });
});
