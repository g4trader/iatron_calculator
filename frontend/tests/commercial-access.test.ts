import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BillingCycle, LicenseStatus, OrganizationRole, Plan, SubscriptionStatus } from "@prisma/client";
import {
  assessIndividualAccess,
  assessInstitutionalAccess,
  getCommercialBlockReasonForStatus,
  isCommercialLicenseAllowed,
  isCommercialSubscriptionAllowed
} from "../lib/commercial-access";

const activeSubscription = {
  status: SubscriptionStatus.ACTIVE,
  plan: Plan.PROFESSIONAL,
  billingCycle: BillingCycle.MONTHLY,
  currentPeriodEnd: null,
  trialEndsAt: null,
  seatsPurchased: 1
};

describe("commercial access rules", () => {
  it("allows individual users with active or trialing subscriptions", () => {
    assert.equal(isCommercialSubscriptionAllowed(SubscriptionStatus.ACTIVE), true);
    assert.equal(isCommercialSubscriptionAllowed(SubscriptionStatus.TRIALING), true);
    assert.equal(isCommercialSubscriptionAllowed(SubscriptionStatus.PAST_DUE), false);

    const entitlement = assessIndividualAccess(activeSubscription);
    assert.equal(entitlement.hasAccess, true);
    assert.equal(entitlement.accountType, "INDIVIDUAL");
    assert.equal(entitlement.blockReason, null);
  });

  it("blocks individual users without commercial access", () => {
    const entitlement = assessIndividualAccess({ ...activeSubscription, status: SubscriptionStatus.CANCELED });
    assert.equal(entitlement.hasAccess, false);
    assert.equal(entitlement.blockReason, "SUBSCRIPTION_CANCELED");
  });

  it("allows institutional members only with valid membership context, active subscription and active license", () => {
    assert.equal(isCommercialLicenseAllowed(LicenseStatus.ACTIVE), true);
    assert.equal(isCommercialLicenseAllowed(LicenseStatus.REVOKED), false);

    const entitlement = assessInstitutionalAccess({
      subscription: { ...activeSubscription, seatsPurchased: 10 },
      licenseStatus: LicenseStatus.ACTIVE,
      organization: { id: "org_1", name: "Hospital" },
      organizationRole: OrganizationRole.MEMBER,
      seatsUsed: 4
    });

    assert.equal(entitlement.hasAccess, true);
    assert.equal(entitlement.accountType, "ORGANIZATION");
    assert.equal(entitlement.organization?.id, "org_1");
    assert.equal(entitlement.seatsUsed, 4);
  });

  it("blocks institutional members with membership but without assigned license", () => {
    const entitlement = assessInstitutionalAccess({
      subscription: { ...activeSubscription, seatsPurchased: 10 },
      licenseStatus: null,
      organization: { id: "org_1", name: "Hospital" },
      organizationRole: OrganizationRole.MEMBER
    });

    assert.equal(entitlement.hasAccess, false);
    assert.equal(entitlement.blockReason, "NO_ORGANIZATION_LICENSE");
  });

  it("blocks users without a valid institutional membership context", () => {
    const entitlement = assessInstitutionalAccess({
      subscription: { ...activeSubscription, seatsPurchased: 10 },
      licenseStatus: LicenseStatus.ACTIVE,
      organization: null
    });

    assert.equal(entitlement.hasAccess, false);
    assert.equal(entitlement.blockReason, "NO_ORGANIZATION");
  });

  it("maps invalid subscription statuses to explicit block reasons", () => {
    assert.equal(getCommercialBlockReasonForStatus(SubscriptionStatus.PAST_DUE), "PAYMENT_REQUIRED");
    assert.equal(getCommercialBlockReasonForStatus(SubscriptionStatus.UNPAID), "PAYMENT_REQUIRED");
    assert.equal(getCommercialBlockReasonForStatus(SubscriptionStatus.CANCELED), "SUBSCRIPTION_CANCELED");
    assert.equal(getCommercialBlockReasonForStatus(SubscriptionStatus.INACTIVE), "SUBSCRIPTION_INACTIVE");

    const entitlement = assessInstitutionalAccess({
      subscription: { ...activeSubscription, status: SubscriptionStatus.PAST_DUE, seatsPurchased: 10 },
      licenseStatus: LicenseStatus.ACTIVE,
      organization: { id: "org_1", name: "Hospital" },
      organizationRole: OrganizationRole.MEMBER
    });

    assert.equal(entitlement.hasAccess, false);
    assert.equal(entitlement.blockReason, "PAYMENT_REQUIRED");
  });
});
