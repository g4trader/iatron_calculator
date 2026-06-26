import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BillingCycle, Plan, PlanAudience } from "@prisma/client";
import {
  buildPricingView,
  getDefaultPriceForPlan,
  getMinimumInstitutionalCheckoutSeats,
  shouldUseBillingPortal
} from "../lib/pricing";

const date = new Date("2026-01-01T00:00:00.000Z");

function catalog(input: {
  id: string;
  code: Plan;
  name: string;
  audience: PlanAudience;
  minSeats?: number;
  prices: Array<{ id: string; billingCycle: BillingCycle; amountCents?: number | null; intervalCount: number; stripePriceId?: string | null }>;
}) {
  return {
    id: input.id,
    code: input.code,
    name: input.name,
    audience: input.audience,
    description: null,
    minSeats: input.minSeats ?? 1,
    isActive: true,
    createdAt: date,
    updatedAt: date,
    prices: input.prices.map((price) => ({
      id: price.id,
      planCatalogId: input.id,
      billingCycle: price.billingCycle,
      currency: "BRL",
      amountCents: price.amountCents ?? null,
      intervalCount: price.intervalCount,
      stripePriceId: price.stripePriceId ?? null,
      isActive: true,
      createdAt: date,
      updatedAt: date
    }))
  };
}

describe("pricing domain rules", () => {
  it("exposes only validated Professional annual and assisted Hospital in the commercial MVP", () => {
    const view = buildPricingView([
      catalog({
        id: "plan_professional",
        code: Plan.PROFESSIONAL,
        name: "Professional",
        audience: PlanAudience.INDIVIDUAL,
        prices: [
          { id: "annual", billingCycle: BillingCycle.ANNUAL, amountCents: 24900, intervalCount: 12, stripePriceId: "price_annual" },
          { id: "monthly", billingCycle: BillingCycle.MONTHLY, amountCents: 7900, intervalCount: 1, stripePriceId: "price_monthly" }
        ]
      }),
      catalog({
        id: "plan_hospital",
        code: Plan.HOSPITAL,
        name: "Hospital",
        audience: PlanAudience.INSTITUTIONAL,
        minSeats: 3,
        prices: [{ id: "custom", billingCycle: BillingCycle.CUSTOM, amountCents: null, intervalCount: 1 }]
      })
    ]);

    assert.equal(view.individualPlans.length, 1);
    assert.equal(view.institutionalPlans.length, 1);
    assert.deepEqual(view.individualPlans[0].prices.map((price) => price.billingCycle), [BillingCycle.ANNUAL]);
    assert.equal(view.institutionalPlans[0].prices[0].isCustom, true);
  });

  it("does not expose plans or cycles that are only modeled but not commercially validated", () => {
    const view = buildPricingView([
      catalog({
        id: "plan_starter",
        code: Plan.STARTER,
        name: "Starter",
        audience: PlanAudience.INDIVIDUAL,
        prices: [{ id: "semiannual", billingCycle: BillingCycle.SEMIANNUAL, amountCents: 39000, intervalCount: 6 }]
      })
    ]);

    assert.equal(view.individualPlans.length, 0);
  });

  it("uses the visible validated price as default", () => {
    const view = buildPricingView([
      catalog({
        id: "plan_professional",
        code: Plan.PROFESSIONAL,
        name: "Professional",
        audience: PlanAudience.INDIVIDUAL,
        prices: [{ id: "annual", billingCycle: BillingCycle.ANNUAL, amountCents: 24900, intervalCount: 12, stripePriceId: "price_annual" }]
      })
    ]);

    assert.equal(getDefaultPriceForPlan(view.individualPlans[0])?.id, "annual");
  });

  it("enforces institutional minimum seats for UI defaults", () => {
    assert.equal(getMinimumInstitutionalCheckoutSeats(1, 1), 3);
    assert.equal(getMinimumInstitutionalCheckoutSeats(5, 3), 5);
    assert.equal(getMinimumInstitutionalCheckoutSeats(3, 8), 8);
  });

  it("uses billing portal when the current active access matches plan audience", () => {
    assert.equal(shouldUseBillingPortal(true, PlanAudience.INDIVIDUAL, "INDIVIDUAL"), true);
    assert.equal(shouldUseBillingPortal(true, PlanAudience.INSTITUTIONAL, "ORGANIZATION"), true);
    assert.equal(shouldUseBillingPortal(true, PlanAudience.INSTITUTIONAL, "INDIVIDUAL"), false);
    assert.equal(shouldUseBillingPortal(false, PlanAudience.INDIVIDUAL, "INDIVIDUAL"), false);
  });
});
