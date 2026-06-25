import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { ExportJobFormat } from "@prisma/client";
import { buildFunnelDedupeKey, FUNNEL_STEPS } from "../lib/funnel";
import { exportContentType, exportFilename, parseExportFormat } from "../lib/admin-exports";
import { getRetentionPolicy, RETENTION_POLICIES } from "../lib/admin-retention";

const root = resolve(process.cwd());

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("admin wave 3 operational maturity", () => {
  it("defines stable funnel steps and dedupe keys", () => {
    for (const step of ["landing_view", "pricing_view", "checkout_started", "checkout_completed", "checkout_failed", "account_created", "license_activated", "first_login", "first_use"]) {
      assert.ok(FUNNEL_STEPS.includes(step as never));
    }
    assert.equal(buildFunnelDedupeKey({ step: "first_login", userId: "user_1", scope: "credentials" }), "first_login:user:user_1:credentials");
    assert.equal(buildFunnelDedupeKey({ step: "landing_view", sessionId: "sid", scope: "home" }), "landing_view:session:sid:home");
    assert.equal(buildFunnelDedupeKey({ step: "landing_view" }), null);
  });

  it("instruments critical public and commercial paths", () => {
    assert.match(read("app/page.tsx"), /FunnelBeacon step="landing_view"/);
    assert.match(read("app/page.tsx"), /FunnelBeacon step="pricing_view"/);
    assert.match(read("app/checkout/page.tsx"), /pricing_view/);
    assert.match(read("lib/account-auth.ts"), /account_created/);
    assert.match(read("auth.ts"), /first_login/);
    assert.match(read("lib/billing.ts"), /checkout_started/);
    assert.match(read("app/api/stripe/webhook/route.ts"), /checkout_completed/);
    assert.match(read("app/api/stripe/create-checkout-session/route.ts"), /checkout_failed/);
    assert.match(read("app/api/calculation-history/route.ts"), /first_use/);
  });

  it("defines ExportJob and RetentionRun models", () => {
    const schema = read("prisma/schema.prisma");
    assert.match(schema, /model ExportJob \{/);
    assert.match(schema, /model RetentionRun \{/);
    assert.match(schema, /enum ExportJobStatus/);
    assert.match(schema, /enum RetentionRunStatus/);
    assert.match(schema, /dedupeKey String\?\s+@unique/);
  });

  it("governs export format and download metadata", () => {
    assert.equal(parseExportFormat("json"), ExportJobFormat.JSON);
    assert.equal(parseExportFormat("csv"), ExportJobFormat.CSV);
    assert.equal(exportContentType(ExportJobFormat.JSON), "application/json; charset=utf-8");
    assert.match(exportFilename({ id: "job_1", type: "AUDIT_EXPORT", format: ExportJobFormat.CSV }), /iatron-audit_export-job_1\.csv/);
  });

  it("requires step-up and audit trail for sensitive exports", () => {
    const actions = read("app/admin/exports/actions.ts");
    const service = read("lib/admin-exports.ts");
    assert.match(actions, /requireAdminPermission\("admin\.audit\.export"\)/);
    assert.match(actions, /validateAdminStepUp/);
    assert.match(service, /admin\.export\.requested/);
    assert.match(service, /admin\.export\.completed/);
    assert.match(service, /admin\.export\.failed/);
  });

  it("defines retention policies with dry-run and explicit execution", () => {
    assert.equal(RETENTION_POLICIES.length, 3);
    assert.equal(getRetentionPolicy("long_audit").id, "long_audit");
    assert.equal(getRetentionPolicy("missing").id, "short_operational");
    const actions = read("app/admin/retention/actions.ts");
    const service = read("lib/admin-retention.ts");
    assert.match(actions, /admin\.contingency\.manage/);
    assert.match(actions, /validateAdminStepUp/);
    assert.match(service, /admin\.retention\.dry_run/);
    assert.match(service, /admin\.retention\.executed/);
    assert.match(service, /AdminAuditEvent não é apagado automaticamente/);
  });
});
