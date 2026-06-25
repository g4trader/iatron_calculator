import { BillingIssueStatus, JobRunStatus, OperationalIncidentStatus, SupportTicketStatus, WebhookFailureStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

const retentionDays = Number(process.env.OPERATIONAL_RETENTION_DAYS ?? "180");
const execute = process.env.OPERATIONAL_CLEANUP_EXECUTE === "true";
const cutoff = new Date(Date.now() - Math.max(retentionDays, 30) * 24 * 60 * 60 * 1000);

async function countAndMaybeDelete(label: string, count: Promise<number>, deleteMany: Promise<{ count: number }>) {
  const total = await count;
  if (!execute) {
    console.log(JSON.stringify({ label, mode: "dry_run", cutoff, count: total }));
    return;
  }
  const result = await deleteMany;
  console.log(JSON.stringify({ label, mode: "execute", cutoff, deleted: result.count }));
}

async function main() {
  await countAndMaybeDelete(
    "resolved_operational_incidents",
    prisma.operationalIncident.count({ where: { status: OperationalIncidentStatus.RESOLVED, resolvedAt: { lt: cutoff } } }),
    prisma.operationalIncident.deleteMany({ where: { status: OperationalIncidentStatus.RESOLVED, resolvedAt: { lt: cutoff } } })
  );

  await countAndMaybeDelete(
    "closed_support_tickets",
    prisma.supportTicket.count({ where: { status: { in: [SupportTicketStatus.RESOLVED, SupportTicketStatus.CLOSED] }, closedAt: { lt: cutoff } } }),
    prisma.supportTicket.deleteMany({ where: { status: { in: [SupportTicketStatus.RESOLVED, SupportTicketStatus.CLOSED] }, closedAt: { lt: cutoff } } })
  );

  await countAndMaybeDelete(
    "old_successful_job_runs",
    prisma.jobRun.count({ where: { status: { in: [JobRunStatus.SUCCESS, JobRunStatus.CANCELED] }, startedAt: { lt: cutoff } } }),
    prisma.jobRun.deleteMany({ where: { status: { in: [JobRunStatus.SUCCESS, JobRunStatus.CANCELED] }, startedAt: { lt: cutoff } } })
  );

  await countAndMaybeDelete(
    "resolved_webhook_failures",
    prisma.webhookFailure.count({ where: { status: { in: [WebhookFailureStatus.RESOLVED, WebhookFailureStatus.IGNORED] }, updatedAt: { lt: cutoff } } }),
    prisma.webhookFailure.deleteMany({ where: { status: { in: [WebhookFailureStatus.RESOLVED, WebhookFailureStatus.IGNORED] }, updatedAt: { lt: cutoff } } })
  );

  await countAndMaybeDelete(
    "resolved_billing_issues",
    prisma.billingIssue.count({ where: { status: { in: [BillingIssueStatus.RESOLVED, BillingIssueStatus.IGNORED] }, updatedAt: { lt: cutoff } } }),
    prisma.billingIssue.deleteMany({ where: { status: { in: [BillingIssueStatus.RESOLVED, BillingIssueStatus.IGNORED] }, updatedAt: { lt: cutoff } } })
  );
}

main()
  .catch((error) => {
    console.error(JSON.stringify({ level: "error", message: error instanceof Error ? error.message : "cleanup_failed" }));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
