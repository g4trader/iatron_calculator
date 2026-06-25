import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Role } from "@prisma/client";
import {
  ADMIN_PERMISSIONS,
  ADMIN_ROLE_DEFINITIONS,
  getRoleAdminPermissions,
  hasAdminPermission,
  isAdminPermission
} from "../lib/admin-permissions";

describe("admin permission domain rules", () => {
  it("defines stable string permissions", () => {
    assert.ok(ADMIN_PERMISSIONS.includes("admin.dashboard.view"));
    assert.ok(ADMIN_PERMISSIONS.includes("admin.customers.view"));
    assert.ok(ADMIN_PERMISSIONS.includes("admin.customers.write"));
    assert.ok(ADMIN_PERMISSIONS.includes("admin.licenses.manage"));
    assert.ok(ADMIN_PERMISSIONS.includes("admin.contingency.manage"));
    assert.ok(ADMIN_PERMISSIONS.includes("admin.audit.view"));
    assert.ok(ADMIN_PERMISSIONS.includes("admin.audit.export"));
  });

  it("defines mature predefined admin roles with explicit permissions", () => {
    assert.deepEqual(Object.keys(ADMIN_ROLE_DEFINITIONS).sort(), ["auditor", "billing", "ops", "superadmin", "support"]);
    assert.ok(ADMIN_ROLE_DEFINITIONS.support.permissions.includes("admin.support.write"));
    assert.ok(ADMIN_ROLE_DEFINITIONS.billing.permissions.includes("admin.billing.reconcile"));
    assert.ok(!ADMIN_ROLE_DEFINITIONS.auditor.permissions.includes("admin.users.manage"));
  });

  it("treats ADMIN role as the initial superadmin permission source", () => {
    const permissions = getRoleAdminPermissions(Role.ADMIN);
    assert.equal(permissions.length, ADMIN_PERMISSIONS.length);
    assert.equal(permissions.includes("admin.users.manage"), true);
  });

  it("does not grant admin permissions to normal users", () => {
    assert.deepEqual(getRoleAdminPermissions(Role.USER), []);
    assert.equal(hasAdminPermission({ role: Role.USER }, "admin.dashboard.view"), false);
  });

  it("checks specific permissions explicitly", () => {
    assert.equal(hasAdminPermission({ role: Role.ADMIN }, "admin.billing.manage"), true);
    assert.equal(isAdminPermission("admin.audit.view"), true);
    assert.equal(isAdminPermission("admin.unknown"), false);
  });
});
