import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Plan, SubscriptionStatus } from "@prisma/client";
import {
  calculateHealthScore,
  getHealthRisk,
  healthScoreWeights,
  matchesActivityFilter,
  parseCustomerFilters
} from "../lib/admin-customers";

const root = resolve(process.cwd());

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("admin customer health score", () => {
  it("maps health score ranges to risk labels", () => {
    assert.equal(getHealthRisk(100), "healthy");
    assert.equal(getHealthRisk(80), "healthy");
    assert.equal(getHealthRisk(79), "monitor");
    assert.equal(getHealthRisk(60), "monitor");
    assert.equal(getHealthRisk(59), "at-risk");
    assert.equal(getHealthRisk(40), "at-risk");
    assert.equal(getHealthRisk(39), "critical");
  });

  it("uses configurable weights and penalizes billing/support problems", () => {
    const now = new Date("2026-06-23T12:00:00.000Z");
    const fullScore = Object.values(healthScoreWeights).reduce((total, value) => total + value, 0);
    assert.equal(fullScore, 100);

    const healthy = calculateHealthScore({
      now,
      createdAt: new Date("2026-06-01T12:00:00.000Z"),
      lastActivityAt: new Date("2026-06-22T12:00:00.000Z"),
      featureUseCount: 5,
      billingProblemCount: 0,
      supportSignalCount: 0
    });
    const critical = calculateHealthScore({
      now,
      createdAt: new Date("2026-01-01T12:00:00.000Z"),
      lastActivityAt: new Date("2026-01-10T12:00:00.000Z"),
      featureUseCount: 0,
      billingProblemCount: 2,
      supportSignalCount: 4
    });

    assert.equal(healthy, 100);
    assert.equal(critical, 0);
  });

  it("parses filters safely and matches activity buckets", () => {
    const filters = parseCustomerFilters({
      status: SubscriptionStatus.ACTIVE,
      plan: Plan.PROFESSIONAL,
      risk: "at-risk",
      activity: "active_7d",
      q: " medico@hospital.com "
    });
    assert.equal(filters.status, SubscriptionStatus.ACTIVE);
    assert.equal(filters.plan, Plan.PROFESSIONAL);
    assert.equal(filters.risk, "at-risk");
    assert.equal(filters.q, "medico@hospital.com");

    const fallback = parseCustomerFilters({ status: "NOPE", plan: "NOPE", risk: "NOPE", activity: "NOPE" });
    assert.equal(fallback.status, undefined);
    assert.equal(fallback.plan, undefined);
    assert.equal(fallback.risk, undefined);
    assert.equal(fallback.activity, undefined);

    const now = new Date("2026-06-23T12:00:00.000Z");
    assert.equal(matchesActivityFilter(new Date("2026-06-21T12:00:00.000Z"), "active_7d", now), true);
    assert.equal(matchesActivityFilter(new Date("2026-05-01T12:00:00.000Z"), "inactive_30d", now), true);
  });

  it("customer notes are server-side protected and recorded as AdminAuditEvent", () => {
    const actionSource = read("app/admin/customers/actions.ts");
    const serviceSource = read("lib/admin-customers.ts");
    assert.match(actionSource, /requireAdminPermission\("admin\.customers\.write"\)/);
    assert.match(actionSource, /addCustomerInternalNote/);
    assert.match(serviceSource, /recordAdminAuditEvent/);
    assert.match(serviceSource, /admin\.customer\.note_added/);
  });
});
