import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BillingCycle, LicenseStatus, OrganizationRole, Plan, SubscriptionStatus } from "@prisma/client";
import {
  normalizeCheckoutReturnStatus,
  resolveCheckoutOnboarding,
  type CheckoutReturnStatus
} from "../lib/checkout-onboarding";
import type { CommercialEntitlement } from "../lib/commercial-access";

function entitlement(overrides: Partial<CommercialEntitlement> = {}): CommercialEntitlement {
  return {
    hasAccess: false,
    accountType: "NONE",
    blockReason: "NO_SUBSCRIPTION",
    plan: "FREE",
    status: "INACTIVE",
    billingCycle: null,
    currentPeriodEnd: null,
    trialEndsAt: null,
    licenseStatus: "INACTIVE",
    organization: null,
    organizationRole: null,
    seatsPurchased: 0,
    seatsUsed: 0,
    ...overrides
  };
}

function resolve(returnStatus: CheckoutReturnStatus, access: CommercialEntitlement, hasOrganization = false) {
  return resolveCheckoutOnboarding({ returnStatus, entitlement: access, hasOrganization });
}

describe("checkout onboarding state resolution", () => {
  it("normalizes checkout return status values", () => {
    assert.equal(normalizeCheckoutReturnStatus("success"), "success");
    assert.equal(normalizeCheckoutReturnStatus("cancelled"), "cancelled");
    assert.equal(normalizeCheckoutReturnStatus("canceled"), "cancelled");
    assert.equal(normalizeCheckoutReturnStatus("other"), "unknown");
  });

  it("resolves active individual onboarding", () => {
    const view = resolve("success", entitlement({
      hasAccess: true,
      accountType: "INDIVIDUAL",
      blockReason: null,
      plan: Plan.PROFESSIONAL,
      status: SubscriptionStatus.ACTIVE,
      billingCycle: BillingCycle.MONTHLY,
      licenseStatus: LicenseStatus.ACTIVE,
      seatsPurchased: 1,
      seatsUsed: 1
    }));

    assert.equal(view.state, "ACTIVE_INDIVIDUAL");
    assert.equal(view.primaryCta.href, "/dashboard");
  });

  it("resolves institutional onboarding without assigned license", () => {
    const view = resolve("success", entitlement({
      accountType: "ORGANIZATION",
      blockReason: "NO_ORGANIZATION_LICENSE",
      plan: Plan.HOSPITAL,
      status: SubscriptionStatus.ACTIVE,
      billingCycle: BillingCycle.CUSTOM,
      organization: { id: "org_1", name: "Hospital" },
      organizationRole: OrganizationRole.OWNER,
      seatsPurchased: 10
    }), true);

    assert.equal(view.state, "ORGANIZATION_LICENSE_REQUIRED");
    assert.equal(view.primaryCta.href, "/organization");
  });

  it("resolves transient state while webhook has not reflected checkout success", () => {
    const view = resolve("success", entitlement({
      accountType: "INDIVIDUAL",
      blockReason: "NO_SUBSCRIPTION"
    }));

    assert.equal(view.state, "AWAITING_WEBHOOK");
    assert.equal(view.primaryCta.href, "/checkout/return?status=success");
  });

  it("resolves payment recovery toward billing", () => {
    const view = resolve("unknown", entitlement({
      accountType: "INDIVIDUAL",
      blockReason: "PAYMENT_REQUIRED",
      plan: Plan.PROFESSIONAL,
      status: SubscriptionStatus.PAST_DUE
    }));

    assert.equal(view.state, "PAYMENT_RECOVERY");
    assert.equal(view.primaryCta.href, "/billing");
  });

  it("resolves cancelled checkout toward pricing", () => {
    const view = resolve("cancelled", entitlement());

    assert.equal(view.state, "CANCELLED");
    assert.equal(view.primaryCta.href, "/checkout");
  });
});
