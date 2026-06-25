import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Plan, SubscriptionStatus } from "@prisma/client";
import {
  hasBillingIssue,
  hasLackOfUse,
  parseSupportFilters,
  supportPriorityScore,
  validateSupportNoteInput
} from "../lib/admin-support";

const root = resolve(process.cwd());

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("admin support operations", () => {
  it("parses support filters safely", () => {
    const filters = parseSupportFilters({
      risk: "critical",
      plan: Plan.PROFESSIONAL,
      accountType: "institutional",
      billingIssue: "true",
      lackOfUse: "true"
    });
    assert.equal(filters.risk, "critical");
    assert.equal(filters.plan, Plan.PROFESSIONAL);
    assert.equal(filters.accountType, "institutional");
    assert.equal(filters.billingIssue, true);
    assert.equal(filters.lackOfUse, true);

    const fallback = parseSupportFilters({ risk: "NOPE", plan: "NOPE", accountType: "NOPE" });
    assert.equal(fallback.risk, undefined);
    assert.equal(fallback.plan, undefined);
    assert.equal(fallback.accountType, undefined);
  });

  it("detects billing issue and lack of use", () => {
    assert.equal(hasBillingIssue(SubscriptionStatus.PAST_DUE), true);
    assert.equal(hasBillingIssue(SubscriptionStatus.UNPAID), true);
    assert.equal(hasBillingIssue(SubscriptionStatus.ACTIVE), false);

    const now = new Date("2026-06-23T12:00:00.000Z");
    assert.equal(hasLackOfUse(null, now), true);
    assert.equal(hasLackOfUse(new Date("2026-05-01T12:00:00.000Z"), now), true);
    assert.equal(hasLackOfUse(new Date("2026-06-20T12:00:00.000Z"), now), false);
  });

  it("prioritizes critical low-health accounts with billing and adoption risk", () => {
    const critical = supportPriorityScore({ healthScore: 20, risk: "critical", billingIssue: true, lackOfUse: true });
    const healthy = supportPriorityScore({ healthScore: 90, risk: "healthy", billingIssue: false, lackOfUse: false });
    assert.ok(critical > healthy);
  });

  it("requires note, risk reason and action taken for interventions", () => {
    const valid = validateSupportNoteInput({
      admin: {} as never,
      customerId: "user_1",
      customerType: "individual",
      supportNote: "Contato realizado por WhatsApp",
      riskReason: "Falha recorrente de login",
      actionTaken: "Orientado reset de senha",
      followUpDate: "2026-06-30"
    });
    assert.equal(valid.followUpDate, "2026-06-30");
    assert.throws(() => validateSupportNoteInput({
      admin: {} as never,
      customerId: "user_1",
      customerType: "individual",
      supportNote: "curto",
      riskReason: "Falha recorrente",
      actionTaken: "Contato feito"
    }));
  });

  it("support actions are server-side protected and audited", () => {
    const actionSource = read("app/admin/support/actions.ts");
    const serviceSource = read("lib/admin-support.ts");
    const operationalSource = read("lib/admin-operational-data.ts");
    assert.match(actionSource, /requireAdminPermission\("admin\.support\.write"\)/);
    assert.match(serviceSource, /recordAdminAuditEvent/);
    assert.match(serviceSource, /admin\.support\.note_added/);
    assert.match(actionSource, /createSupportTicketAction/);
    assert.match(actionSource, /updateSupportTicketAction/);
    assert.match(operationalSource, /admin\.support\.ticket_created/);
    assert.match(operationalSource, /admin\.support\.ticket_updated/);
  });
});
