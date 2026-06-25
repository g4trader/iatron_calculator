import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  CONTINGENCY_CONFIRMATION_TEXT,
  CONTINGENCY_PLAYBOOKS,
  requireContingencyConfirmation,
  requireContingencyReason
} from "../lib/admin-contingency";

const root = resolve(process.cwd());

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("admin contingency operations", () => {
  it("defines playbooks instead of isolated unsafe buttons", () => {
    const actions = CONTINGENCY_PLAYBOOKS.flatMap((playbook) => playbook.actions);
    assert.equal(CONTINGENCY_PLAYBOOKS.length, 3);
    assert.ok(actions.some((action) => action.id === "emergency_license" && action.risk === "high"));
    assert.ok(actions.some((action) => action.id === "reprocess_reconcile" && action.risk === "high"));
    assert.ok(actions.some((action) => action.id === "invalidate_sessions" && action.risk === "high"));
    assert.ok(actions.every((action) => action.impact.length > 20));
  });

  it("requires reason and explicit reinforced confirmation", () => {
    assert.equal(requireContingencyReason("motivo operacional"), "motivo operacional");
    assert.throws(() => requireContingencyReason("curto"), /motivo de contingência/);
    assert.doesNotThrow(() => requireContingencyConfirmation(CONTINGENCY_CONFIRMATION_TEXT));
    assert.doesNotThrow(() => requireContingencyConfirmation("contingencia"));
    assert.throws(() => requireContingencyConfirmation("confirmar"), /Confirmação obrigatória/);
  });

  it("server actions require contingency permission for every mutation", () => {
    const actionSource = read("app/admin/contingency/actions.ts");
    const permissionCalls = actionSource.match(/requireAdminPermission\("admin\.contingency\.manage"\)/g) ?? [];
    assert.equal(permissionCalls.length, 6);
  });

  it("service records AdminAuditEvent for every contingency action", () => {
    const serviceSource = read("lib/admin-contingency.ts");
    assert.match(serviceSource, /recordAdminAuditEvent/);
    assert.match(serviceSource, /admin\.contingency\.emergency_license_generated/);
    assert.match(serviceSource, /admin\.contingency\.reconcile_reprocessed/);
    assert.match(serviceSource, /admin\.contingency\.activation_resent/);
    assert.match(serviceSource, /admin\.contingency\.sessions_invalidated/);
    assert.match(serviceSource, /admin\.contingency\.entitlement_refreshed/);
    assert.match(serviceSource, /admin\.contingency\.incident_registered/);
  });

  it("uses existing safe domain services instead of direct financial edits", () => {
    const serviceSource = read("lib/admin-contingency.ts");
    assert.match(serviceSource, /createManualLicense/);
    assert.match(serviceSource, /reconcileAdminBillingSubscription/);
    assert.match(serviceSource, /resendVerificationEmail/);
    assert.match(serviceSource, /revokeAllUserSessions/);
    assert.match(serviceSource, /syncLicenseForSubscription/);
    assert.doesNotMatch(serviceSource, /stripe\.subscriptions\.update/);
    assert.doesNotMatch(serviceSource, /subscription\.update\(/);
  });
});
