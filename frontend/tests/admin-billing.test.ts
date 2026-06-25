import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LicenseStatus, SubscriptionStatus } from "@prisma/client";
import {
  detectLocalBillingDivergences,
  isRevenueRiskStatus,
  parseAdminBillingFilters,
  sourceLabel,
  stripeCustomerDashboardUrl,
  stripeSubscriptionDashboardUrl
} from "../lib/admin-billing";

const root = resolve(process.cwd());

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("admin billing operations", () => {
  it("parses filters and labels sources explicitly", () => {
    const filters = parseAdminBillingFilters({ q: " cus_123 ", status: SubscriptionStatus.PAST_DUE });
    assert.equal(filters.q, "cus_123");
    assert.equal(filters.status, SubscriptionStatus.PAST_DUE);
    assert.equal(parseAdminBillingFilters({ status: "NOPE" }).status, undefined);
    assert.equal(sourceLabel("stripe"), "stripe");
    assert.equal(sourceLabel("local cache"), "local cache");
    assert.equal(sourceLabel("derived"), "derived");
  });

  it("detects revenue risk statuses and local divergence without mutating finance state", () => {
    assert.equal(isRevenueRiskStatus(SubscriptionStatus.PAST_DUE), true);
    assert.equal(isRevenueRiskStatus(SubscriptionStatus.UNPAID), true);
    assert.equal(isRevenueRiskStatus(SubscriptionStatus.ACTIVE), false);

    const divergences = detectLocalBillingDivergences({
      id: "sub_local",
      status: SubscriptionStatus.ACTIVE,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      userId: "user_1",
      organizationId: null,
      licenses: [{ status: LicenseStatus.INACTIVE }]
    });

    assert.equal(divergences.length, 2);
    assert.ok(divergences.some((item) => item.kind === "orphan_subscription"));
    assert.ok(divergences.some((item) => item.kind === "billing_desync"));
  });

  it("builds Stripe dashboard URLs without exposing secrets", () => {
    assert.equal(stripeCustomerDashboardUrl("cus_123"), "https://dashboard.stripe.com/customers/cus_123");
    assert.equal(stripeSubscriptionDashboardUrl("sub_123"), "https://dashboard.stripe.com/subscriptions/sub_123");
    assert.equal(stripeCustomerDashboardUrl(null), null);
  });

  it("admin billing actions require permission and audit controlled operations", () => {
    const actionSource = read("app/admin/billing/actions.ts");
    const serviceSource = read("lib/admin-billing.ts");
    const managePermissionCalls = actionSource.match(/requireAdminPermission\("admin\.billing\.manage"\)/g) ?? [];
    assert.equal(managePermissionCalls.length, 2);
    assert.match(actionSource, /requireAdminPermission\("admin\.billing\.reconcile"\)/);
    assert.match(actionSource, /validateAdminStepUp/);
    assert.match(serviceSource, /recordAdminAuditEvent/);
    assert.match(serviceSource, /admin\.billing\.reconcile_executed/);
    assert.match(serviceSource, /admin\.billing\.manual_review_marked/);
    assert.match(serviceSource, /admin\.billing\.webhook_reprocess_requested/);
    assert.match(serviceSource, /prisma\.webhookFailure\.findMany/);
    assert.match(serviceSource, /prisma\.billingIssue\.findMany/);
    assert.match(serviceSource, /prisma\.billingIssue\.create/);
    assert.doesNotMatch(serviceSource, /subscription\.update\(/);
  });
});
