import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  buildOperationalMetrics,
  summarizeOperationalStatus
} from "../lib/admin-operations";

const root = resolve(process.cwd());

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("admin operations domain rules", () => {
  it("summarizes healthy, degraded and incident states", () => {
    assert.equal(summarizeOperationalStatus({
      databaseConnected: true,
      criticalIncidents: 0,
      warningIncidents: 0,
      stripeConfigured: true,
      redisConfigured: true
    }).status, "healthy");

    assert.equal(summarizeOperationalStatus({
      databaseConnected: true,
      criticalIncidents: 0,
      warningIncidents: 1,
      stripeConfigured: true,
      redisConfigured: true
    }).status, "degraded");

    assert.equal(summarizeOperationalStatus({
      databaseConnected: false,
      criticalIncidents: 0,
      warningIncidents: 0,
      stripeConfigured: true,
      redisConfigured: true
    }).status, "incident");
  });

  it("uses explicit placeholders for metrics without persistent source", () => {
    const metrics = buildOperationalMetrics({
      loginRateLimited: 2,
      sessionInvalid: 1,
      checkoutErrorsKnown: null,
      webhookFailuresKnown: null,
      activeSessions: 5,
      revokedSessions: 3,
      expiredSessions: 1,
      totalSecurityEvents: 10
    });

    assert.equal(metrics.find((metric) => metric.id === "login_error_rate")?.precision, "estimated");
    assert.equal(metrics.find((metric) => metric.id === "checkout_error_rate")?.precision, "placeholder");
    assert.equal(metrics.find((metric) => metric.id === "stripe_webhook_error_rate")?.value, "N/D");
    assert.equal(metrics.find((metric) => metric.id === "active_sessions")?.precision, "precise");
  });

  it("uses persisted operational counts when available", () => {
    const metrics = buildOperationalMetrics({
      loginRateLimited: 0,
      sessionInvalid: 0,
      checkoutErrorsKnown: 2,
      webhookFailuresKnown: 1,
      activeSessions: 5,
      revokedSessions: 0,
      expiredSessions: 1,
      totalSecurityEvents: 0
    });

    assert.equal(metrics.find((metric) => metric.id === "checkout_error_rate")?.value, "2");
    assert.equal(metrics.find((metric) => metric.id === "stripe_webhook_error_rate")?.precision, "precise");
    assert.equal(metrics.find((metric) => metric.id === "stripe_webhook_error_rate")?.status, "degraded");
  });

  it("protects incident mutations with contingency permission and audit trail", () => {
    const actionSource = read("app/admin/operations/actions.ts");
    const operationalSource = read("lib/admin-operational-data.ts");
    assert.match(actionSource, /requireAdminPermission\("admin\.contingency\.manage"\)/);
    assert.match(actionSource, /createOperationalIncidentAction/);
    assert.match(actionSource, /updateOperationalIncidentAction/);
    assert.match(operationalSource, /admin\.incident\.created/);
    assert.match(operationalSource, /admin\.incident\.updated/);
  });
});
