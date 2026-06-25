import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Role } from "@prisma/client";
import {
  CRITICAL_ADMIN_PERMISSIONS,
  AdminAccessError,
  effectivePermissionsForUser,
  requireAdminAccessReason,
  requireCriticalConfirmation
} from "../lib/admin-admin-users";

const root = resolve(process.cwd());

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("admin access management", () => {
  it("calculates effective permissions from roles and direct grants", () => {
    const superadmin = effectivePermissionsForUser({ role: Role.ADMIN, grants: [] });
    assert.ok(superadmin.includes("admin.users.manage"));

    const direct = effectivePermissionsForUser({
      role: Role.USER,
      grants: [
        { permission: "admin.support.view", status: "ACTIVE" },
        { permission: "admin.billing.manage", status: "REVOKED", revokedAt: new Date() },
        { permission: "invalid.permission", status: "ACTIVE" }
      ]
    });
    assert.deepEqual(direct, ["admin.support.view"]);
  });

  it("requires reason and confirmation for critical permissions", () => {
    assert.throws(() => requireAdminAccessReason("curto"), AdminAccessError);
    assert.equal(requireAdminAccessReason("  revisão trimestral  "), "revisão trimestral");
    assert.ok(CRITICAL_ADMIN_PERMISSIONS.includes("admin.users.manage"));
    assert.throws(() => requireCriticalConfirmation("admin.users.manage", ""), AdminAccessError);
    assert.doesNotThrow(() => requireCriticalConfirmation("admin.users.manage", "CONFIRMAR"));
    assert.doesNotThrow(() => requireCriticalConfirmation("admin.support.view", ""));
  });

  it("actions and service enforce audit and dangerous-removal guardrails", () => {
    const actionSource = read("app/admin/admin-users/actions.ts");
    const serviceSource = read("lib/admin-admin-users.ts");
    assert.match(actionSource, /requireAdminPermission\("admin\.users\.manage"\)/);
    assert.match(actionSource, /validateAdminStepUp/);
    assert.match(serviceSource, /recordAdminAuditEvent/);
    assert.match(serviceSource, /SELF_REMOVAL_BLOCKED/);
    assert.match(serviceSource, /LAST_ADMIN_BLOCKED/);
    assert.match(serviceSource, /SUPERADMIN_REQUIRED/);
    assert.match(serviceSource, /AdminUserRole/);
    assert.match(serviceSource, /admin\.access\.permission_granted/);
    assert.match(serviceSource, /admin\.access\.deactivated/);
  });
});
