import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { OperationalIncidentStatus, SupportTicketPriority } from "@prisma/client";
import { enumValue, pageResult, parsePagination } from "../lib/admin-operational-data";

const root = resolve(process.cwd());

function read(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("admin operational data foundation", () => {
  it("normalizes pagination defensively", () => {
    assert.deepEqual(parsePagination({ page: "2", pageSize: "25" }), { page: 2, pageSize: 25, skip: 25, take: 25 });
    assert.deepEqual(parsePagination({ page: "-1", pageSize: "500" }), { page: 1, pageSize: 100, skip: 0, take: 100 });
    assert.equal(pageResult([1, 2], 12, 2, 5).hasNext, true);
    assert.equal(pageResult([1, 2], 10, 2, 5).hasNext, false);
  });

  it("accepts only known enum values for filters", () => {
    assert.equal(enumValue(Object.values(OperationalIncidentStatus), "OPEN"), OperationalIncidentStatus.OPEN);
    assert.equal(enumValue(Object.values(SupportTicketPriority), "URGENT"), SupportTicketPriority.URGENT);
    assert.equal(enumValue(Object.values(SupportTicketPriority), "INVALID"), undefined);
  });

  it("defines real operational models in Prisma", () => {
    const schema = read("prisma/schema.prisma");
    for (const model of [
      "OperationalIncident",
      "OperationalIncidentComment",
      "SupportTicket",
      "SupportTicketComment",
      "JobRun",
      "CheckoutEvent",
      "WebhookFailure",
      "BillingIssue",
      "FunnelEvent"
    ]) {
      assert.match(schema, new RegExp(`model ${model} \\{`));
    }
  });

  it("audits mutable incident and support operations", () => {
    const source = read("lib/admin-operational-data.ts");
    assert.match(source, /admin\.incident\.created/);
    assert.match(source, /admin\.incident\.updated/);
    assert.match(source, /admin\.support\.ticket_created/);
    assert.match(source, /admin\.support\.ticket_updated/);
    assert.match(source, /recordAdminAuditEvent/);
  });

  it("does not store raw webhook payloads", () => {
    const source = read("lib/admin-operational-data.ts");
    assert.match(source, /createHash\("sha256"\)/);
    assert.match(source, /payloadHash/);
    assert.doesNotMatch(source, /payloadRaw/);
  });

  it("documents cleanup as dry-run by default", () => {
    const cleanup = read("scripts/cleanup-operational-data.ts");
    assert.match(cleanup, /OPERATIONAL_CLEANUP_EXECUTE === "true"/);
    assert.match(cleanup, /dry_run/);
    assert.match(cleanup, /resolved_operational_incidents/);
  });
});
