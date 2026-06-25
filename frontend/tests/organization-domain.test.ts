import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrganizationRole } from "@prisma/client";
import {
  OrganizationAccessError,
  canInviteOrganizationRole,
  canManageOrganization,
  hasAvailableSeat
} from "../lib/organization-authz";

describe("organization authorization rules", () => {
  it("allows only OWNER and ADMIN to manage organization operations", () => {
    assert.equal(canManageOrganization(OrganizationRole.OWNER), true);
    assert.equal(canManageOrganization(OrganizationRole.ADMIN), true);
    assert.equal(canManageOrganization(OrganizationRole.MEMBER), false);
    assert.equal(canManageOrganization(null), false);
  });

  it("prevents role elevation through invites", () => {
    assert.equal(canInviteOrganizationRole(OrganizationRole.OWNER, OrganizationRole.ADMIN), true);
    assert.equal(canInviteOrganizationRole(OrganizationRole.ADMIN, OrganizationRole.MEMBER), true);
    assert.equal(canInviteOrganizationRole(OrganizationRole.ADMIN, OrganizationRole.OWNER), false);
    assert.equal(canInviteOrganizationRole(OrganizationRole.MEMBER, OrganizationRole.MEMBER), false);
  });

  it("blocks license assignment when no seats are available", () => {
    assert.equal(hasAvailableSeat(3, 0), true);
    assert.equal(hasAvailableSeat(3, 2), true);
    assert.equal(hasAvailableSeat(3, 3), false);
    assert.equal(hasAvailableSeat(3, 4), false);
  });

  it("uses explicit access errors for tenant isolation failures", () => {
    const error = new OrganizationAccessError("Organização não encontrada ou sem permissão.", 404, "ORGANIZATION_NOT_FOUND");
    assert.equal(error.status, 404);
    assert.equal(error.code, "ORGANIZATION_NOT_FOUND");
    assert.match(error.message, /Organização/);
  });
});
