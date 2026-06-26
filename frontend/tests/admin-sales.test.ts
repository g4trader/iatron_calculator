import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BillingCycle, Plan, SubscriptionOwnerType, SubscriptionStatus } from "@prisma/client";
import {
  buildSalesDashboardForTests,
  calculateCustomerChurn,
  calculateRevenueChurn,
  getMonthlyRevenueCents,
  parseSalesFilters
} from "../lib/admin-sales";

const now = new Date("2026-06-23T12:00:00.000Z");
const periodStart = new Date("2026-05-24T12:00:00.000Z");

function subscription(input: {
  id: string;
  status: SubscriptionStatus;
  plan?: Plan;
  billingCycle?: BillingCycle;
  ownerType?: SubscriptionOwnerType;
  amountCents?: number | null;
  intervalCount?: number;
  seatsPurchased?: number;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: input.id,
    status: input.status,
    plan: input.plan ?? Plan.PROFESSIONAL,
    billingCycle: input.billingCycle ?? BillingCycle.ANNUAL,
    ownerType: input.ownerType ?? SubscriptionOwnerType.USER,
    seatsPurchased: input.seatsPurchased ?? 1,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    planPrice: input.amountCents === undefined
      ? { amountCents: 24900, intervalCount: input.intervalCount ?? 12, billingCycle: input.billingCycle ?? BillingCycle.ANNUAL }
      : input.amountCents === null
        ? { amountCents: null, intervalCount: input.intervalCount ?? 12, billingCycle: input.billingCycle ?? BillingCycle.ANNUAL }
        : { amountCents: input.amountCents, intervalCount: input.intervalCount ?? 12, billingCycle: input.billingCycle ?? BillingCycle.ANNUAL }
  };
}

describe("admin sales metrics", () => {
  it("calculates monthly equivalent revenue by interval and institutional seats", () => {
    assert.equal(getMonthlyRevenueCents(subscription({ id: "monthly", status: SubscriptionStatus.ACTIVE, amountCents: 7900, intervalCount: 1, billingCycle: BillingCycle.MONTHLY })), 7900);
    assert.equal(getMonthlyRevenueCents(subscription({ id: "annual", status: SubscriptionStatus.ACTIVE, amountCents: 24900, intervalCount: 12, billingCycle: BillingCycle.ANNUAL })), 2075);
    assert.equal(getMonthlyRevenueCents(subscription({
      id: "org",
      status: SubscriptionStatus.ACTIVE,
      ownerType: SubscriptionOwnerType.ORGANIZATION,
      amountCents: 10000,
      intervalCount: 1,
      billingCycle: BillingCycle.MONTHLY,
      seatsPurchased: 3
    })), 30000);
    assert.equal(getMonthlyRevenueCents(subscription({ id: "custom", status: SubscriptionStatus.ACTIVE, amountCents: null })), null);
  });

  it("calculates churn defensively", () => {
    assert.equal(calculateCustomerChurn(9, 1), 0.1);
    assert.equal(calculateCustomerChurn(0, 0), 0);
    assert.equal(calculateRevenueChurn(90000, 10000), 0.1);
    assert.equal(calculateRevenueChurn(0, 0), 0);
  });

  it("builds executive metrics and explicit placeholders without inventing missing data", () => {
    const dashboard = buildSalesDashboardForTests({
      now,
      periodStart,
      firstUseCount: 2,
      subscriptions: [
        subscription({ id: "active", status: SubscriptionStatus.ACTIVE, amountCents: 24900 }),
        subscription({ id: "trial", status: SubscriptionStatus.TRIALING, amountCents: 24900 }),
        subscription({ id: "canceled", status: SubscriptionStatus.CANCELED, amountCents: 24900, updatedAt: now }),
        subscription({ id: "custom", status: SubscriptionStatus.ACTIVE, amountCents: null, plan: Plan.HOSPITAL, ownerType: SubscriptionOwnerType.ORGANIZATION, billingCycle: BillingCycle.CUSTOM, seatsPurchased: 3 })
      ]
    });

    assert.equal(dashboard.metrics.find((metric) => metric.label === "MRR atual")?.value, "R$ 21");
    assert.equal(dashboard.metrics.find((metric) => metric.label === "ARR estimado")?.precision, "estimated");
    assert.equal(dashboard.metrics.find((metric) => metric.label === "Upgrades/downgrades")?.precision, "placeholder");
    assert.equal(dashboard.funnel.find((row) => row.id === "landing")?.count, null);
    assert.match(dashboard.funnel.find((row) => row.id === "landing")?.note ?? "", /TODO/);
    assert.equal(dashboard.revenueByOwnerType.find((row) => row.id === SubscriptionOwnerType.ORGANIZATION)?.valueCents, null);
  });

  it("uses FunnelEvent counts when available", () => {
    const dashboard = buildSalesDashboardForTests({
      now,
      periodStart,
      firstUseCount: 2,
      funnelCounts: {
        landing_view: 20,
        checkout_started: 8,
        license_activated: 4,
        first_use: 3
      },
      subscriptions: [
        subscription({ id: "active", status: SubscriptionStatus.ACTIVE, amountCents: 24900 })
      ]
    });

    assert.equal(dashboard.funnel.find((row) => row.id === "landing")?.count, 20);
    assert.equal(dashboard.funnel.find((row) => row.id === "checkout")?.count, 8);
    assert.equal(dashboard.funnel.find((row) => row.id === "activation")?.count, 4);
    assert.equal(dashboard.funnel.find((row) => row.id === "first_use")?.count, 3);
    assert.match(dashboard.funnel.find((row) => row.id === "checkout")?.note ?? "", /FunnelEvent/);
  });

  it("parses filters using safe defaults", () => {
    const fallback = parseSalesFilters({ period: "invalid", plan: "BAD", ownerType: "NOPE", status: "NOPE" });
    assert.equal(fallback.period, "30d");
    assert.equal(fallback.plan, undefined);
    assert.equal(fallback.ownerType, undefined);
    assert.equal(fallback.status, undefined);
    assert.equal(parseSalesFilters({ period: "90d", plan: Plan.PROFESSIONAL }).period, "90d");
    assert.equal(parseSalesFilters({ period: "90d", plan: Plan.PROFESSIONAL }).plan, Plan.PROFESSIONAL);
  });
});
