import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("protected route security contracts", () => {
  const protectedServerEntries = [
    "app/dashboard/page.tsx",
    "app/dashboard/pcr/page.tsx",
    "app/dashboard/completa/page.tsx",
    "app/billing/page.tsx",
    "app/profile/page.tsx",
    "app/admin/page.tsx",
    "app/admin/admin-users/actions.ts",
    "app/admin/admin-users/page.tsx",
    "app/admin/audit/[id]/page.tsx",
    "app/admin/audit/export/route.ts",
    "app/admin/audit/page.tsx",
    "app/admin/billing/actions.ts",
    "app/admin/billing/page.tsx",
    "app/admin/contingency/actions.ts",
    "app/admin/contingency/page.tsx",
    "app/admin/customers/actions.ts",
    "app/admin/customers/page.tsx",
    "app/admin/customers/[id]/page.tsx",
    "app/admin/licenses/actions.ts",
    "app/admin/licenses/page.tsx",
    "app/admin/operations/page.tsx",
    "app/admin/sales/page.tsx",
    "app/admin/support/actions.ts",
    "app/admin/support/page.tsx",
    "app/admin/system/page.tsx",
    "app/admin/users/page.tsx",
    "app/checkout/page.tsx",
    "app/checkout/return/page.tsx",
    "app/organization/page.tsx",
    "app/organization/invites/accept/page.tsx",
    "app/api/profile/route.ts",
    "app/api/calculation-history/route.ts",
    "app/api/stripe/create-checkout-session/route.ts",
    "app/api/stripe/create-portal-session/route.ts",
    "app/api/organizations/route.ts",
    "app/api/organizations/[organizationId]/route.ts",
    "app/api/organizations/[organizationId]/invites/route.ts",
    "app/api/organizations/[organizationId]/licenses/assign/route.ts",
    "app/api/organizations/[organizationId]/memberships/route.ts",
    "app/api/organization-invites/accept/route.ts"
  ];

  for (const file of protectedServerEntries) {
    it(`${file} uses server-side session validation`, () => {
      const source = read(file);
      assert.match(source, /requireAuth|getCurrentUser|getAuthenticatedUserId|requireOrganizationRole|requireAdminPermission|acceptOrganizationInvite/);
      assert.doesNotMatch(source, /from\s+["']@\/auth["']/);
      assert.doesNotMatch(source, /\bauth\(\)/);
    });
  }

  it("the global SaaS navigation does not trust cookie-only auth state", () => {
    const source = read("components/saas/SaaSChrome.tsx");
    assert.match(source, /getCurrentUser/);
    assert.doesNotMatch(source, /from\s+["']@\/auth["']/);
    assert.doesNotMatch(source, /\bauth\(\)/);
  });

  it("organization invitation page requires a validated session before accepting", () => {
    const source = read("app/organization/invites/accept/page.tsx");
    assert.match(source, /requireAuth/);
    assert.match(source, /acceptOrganizationInvite/);
  });
});

describe("single-session security contracts", () => {
  it("exclusive session creation uses a PostgreSQL transaction-level advisory lock", () => {
    const source = read("lib/session-control.ts");
    assert.match(source, /prisma\.\$transaction/);
    assert.match(source, /pg_advisory_xact_lock/);
    assert.match(source, /replaced_by_new_login/);
  });

  it("session validation checks revoked, timeout and newest active session state", () => {
    const source = read("lib/session-control.ts");
    assert.match(source, /SESSION_REVOKED/);
    assert.match(source, /SESSION_EXPIRED/);
    assert.match(source, /SESSION_NOT_CURRENT/);
    assert.match(source, /newestActive/);
  });
});

describe("Stripe webhook security contracts", () => {
  it("uses raw request body and Stripe signature verification before processing", () => {
    const source = read("app/api/stripe/webhook/route.ts");
    const bodyReadIndex = source.indexOf("request.text()");
    const constructEventIndex = source.indexOf("constructEvent");
    const handleEventIndex = source.indexOf("handleStripeEvent(event)");
    assert.ok(bodyReadIndex > -1, "webhook must read the raw body");
    assert.ok(constructEventIndex > bodyReadIndex, "signature verification must use raw body");
    assert.ok(handleEventIndex > constructEventIndex, "events must be handled only after verification");
  });

  it("records webhook event id before side effects and treats duplicates as no-op", () => {
    const source = read("app/api/stripe/webhook/route.ts");
    const recordIndex = source.indexOf("recordStripeWebhookEvent(event)");
    const duplicateIndex = source.indexOf("recorded.duplicate");
    const handleEventIndex = source.indexOf("handleStripeEvent(event)");
    assert.ok(recordIndex > -1, "webhook must record event id");
    assert.ok(duplicateIndex > recordIndex, "webhook must check duplicates");
    assert.ok(handleEventIndex > duplicateIndex, "side effects must happen after duplicate check");
  });

  it("idempotency handles both pre-existing event ids and database unique races", () => {
    const source = read("lib/billing.ts");
    assert.match(source, /stripeWebhookEvent\.findUnique/);
    assert.match(source, /stripeWebhookEvent\.create/);
    assert.match(source, /isPrismaUniqueConstraintError/);
    assert.match(source, /duplicate: true/);
  });

  it("subscription sync always reconciles license state after subscription state", () => {
    const source = read("lib/billing.ts");
    const syncSubscriptionIndex = source.indexOf("export async function syncStripeSubscription");
    const syncLicenseCallIndex = source.indexOf("await syncLicenseForSubscription(synced.id)");
    assert.ok(syncSubscriptionIndex > -1);
    assert.ok(syncLicenseCallIndex > syncSubscriptionIndex);
  });
});
