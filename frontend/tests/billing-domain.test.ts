import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BillingCycle, SubscriptionStatus } from "@prisma/client";
import {
  fallbackStripePriceEnvName,
  isPrismaUniqueConstraintError,
  isStripeStatusAccessActive,
  minimumInstitutionalSeats,
  normalizeStripeSubscriptionStatus
} from "../lib/billing";

describe("billing domain rules", () => {
  it("maps PlanPrice to deterministic Stripe env fallback names", () => {
    assert.equal(fallbackStripePriceEnvName("PROFESSIONAL", BillingCycle.MONTHLY), "STRIPE_PRICE_PROFESSIONAL_MONTHLY");
    assert.equal(fallbackStripePriceEnvName("STARTER", BillingCycle.BIENNIAL), "STRIPE_PRICE_STARTER_BIENNIAL");
    assert.equal(fallbackStripePriceEnvName("HOSPITAL", BillingCycle.CUSTOM), "STRIPE_PRICE_HOSPITAL_CUSTOM");
  });

  it("enforces institutional minimum seats", () => {
    assert.equal(minimumInstitutionalSeats(1, 1), 3);
    assert.equal(minimumInstitutionalSeats(5, 3), 5);
    assert.equal(minimumInstitutionalSeats(3, 8), 8);
  });

  it("normalizes Stripe subscription statuses", () => {
    assert.equal(normalizeStripeSubscriptionStatus("active"), SubscriptionStatus.ACTIVE);
    assert.equal(normalizeStripeSubscriptionStatus("trialing"), SubscriptionStatus.TRIALING);
    assert.equal(normalizeStripeSubscriptionStatus("past_due"), SubscriptionStatus.PAST_DUE);
    assert.equal(normalizeStripeSubscriptionStatus("canceled"), SubscriptionStatus.CANCELED);
  });

  it("identifies access-active subscription statuses", () => {
    assert.equal(isStripeStatusAccessActive(SubscriptionStatus.ACTIVE), true);
    assert.equal(isStripeStatusAccessActive(SubscriptionStatus.TRIALING), true);
    assert.equal(isStripeStatusAccessActive(SubscriptionStatus.PAST_DUE), false);
    assert.equal(isStripeStatusAccessActive(SubscriptionStatus.CANCELED), false);
  });

  it("detects Prisma unique constraint errors for webhook idempotency", () => {
    assert.equal(isPrismaUniqueConstraintError({ code: "P2002" }), true);
    assert.equal(isPrismaUniqueConstraintError({ code: "P2003" }), false);
    assert.equal(isPrismaUniqueConstraintError(new Error("boom")), false);
  });
});
