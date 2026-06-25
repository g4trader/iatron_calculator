import { ArchiveJobStatus, ArchiveJobType, ExportJobStatus, JobRunStatus, RetentionRunStatus, WebhookFailureStatus, type Prisma } from "@prisma/client";
import { recordAdminAuditEvent, type AdminUser } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

export const RETENTION_POLICIES = [
  { id: "short_operational", label: "Curta: eventos operacionais resolvidos", days: 90 },
  { id: "medium_exports", label: "Média: exportações expiradas", days: 30 },
  { id: "long_audit", label: "Longa: auditoria administrativa", days: 730 }
] as const;

export type RetentionPolicyId = (typeof RETENTION_POLICIES)[number]["id"];

export function getRetentionPolicy(id?: string | null) {
  return RETENTION_POLICIES.find((policy) => policy.id === id) ?? RETENTION_POLICIES[0];
}

function cutoffFor(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function collectRetentionCounts(policy: RetentionPolicyId, cutoff: Date) {
  if (policy === "medium_exports") {
    return {
      exportJobs: await prisma.exportJob.count({ where: { status: { in: [ExportJobStatus.COMPLETED, ExportJobStatus.FAILED, ExportJobStatus.EXPIRED] }, createdAt: { lt: cutoff } } })
    };
  }
  if (policy === "long_audit") {
    return {
      adminAuditEvents: await prisma.adminAuditEvent.count({ where: { createdAt: { lt: cutoff } } }),
      funnelEvents: await prisma.funnelEvent.count({ where: { createdAt: { lt: cutoff } } })
    };
  }
  return {
    jobRuns: await prisma.jobRun.count({ where: { status: { in: [JobRunStatus.SUCCESS, JobRunStatus.CANCELED] }, startedAt: { lt: cutoff } } }),
    webhookFailures: await prisma.webhookFailure.count({ where: { status: { in: [WebhookFailureStatus.RESOLVED, WebhookFailureStatus.IGNORED] }, updatedAt: { lt: cutoff } } })
  };
}

async function executeRetention(policy: RetentionPolicyId, cutoff: Date) {
  if (policy === "medium_exports") {
    return {
      exportJobs: (await prisma.exportJob.deleteMany({ where: { status: { in: [ExportJobStatus.COMPLETED, ExportJobStatus.FAILED, ExportJobStatus.EXPIRED] }, createdAt: { lt: cutoff } } })).count
    };
  }
  if (policy === "long_audit") {
    return {
      adminAuditEvents: 0,
      funnelEvents: (await prisma.funnelEvent.deleteMany({ where: { createdAt: { lt: cutoff } } })).count,
      note: "AdminAuditEvent não é apagado automaticamente; exige estratégia de arquivo/snapshot antes."
    };
  }
  return {
    jobRuns: (await prisma.jobRun.deleteMany({ where: { status: { in: [JobRunStatus.SUCCESS, JobRunStatus.CANCELED] }, startedAt: { lt: cutoff } } })).count,
    webhookFailures: (await prisma.webhookFailure.deleteMany({ where: { status: { in: [WebhookFailureStatus.RESOLVED, WebhookFailureStatus.IGNORED] }, updatedAt: { lt: cutoff } } })).count
  };
}

async function requireArchiveForDestructiveRetention(policy: RetentionPolicyId, cutoff: Date) {
  const archiveTypes: Record<RetentionPolicyId, ArchiveJobType[]> = {
    short_operational: ["JOB_RUNS" as ArchiveJobType, "WEBHOOK_FAILURES" as ArchiveJobType],
    medium_exports: ["EXPORT_JOBS" as ArchiveJobType],
    long_audit: ["FUNNEL_EVENTS" as ArchiveJobType]
  };
  const requiredTypes = archiveTypes[policy];
  const archives = await prisma.archiveJob.findMany({
    where: {
      type: { in: requiredTypes },
      status: ArchiveJobStatus.COMPLETED,
      dateTo: { gte: cutoff },
      objects: { some: {} }
    },
    select: { type: true }
  });
  const archived = new Set(archives.map((archive) => archive.type));
  const missing = requiredTypes.filter((type) => !archived.has(type));
  if (missing.length > 0) {
    throw new Error(`Archive obrigatório ausente antes da retenção destrutiva: ${missing.join(", ")}.`);
  }
}

export async function runRetentionPolicy(input: { admin: AdminUser; policyId?: string | null; execute?: boolean }) {
  const policy = getRetentionPolicy(input.policyId);
  const cutoff = cutoffFor(policy.days);
  const run = await prisma.retentionRun.create({
    data: {
      requestedByUserId: input.admin.id,
      policy: policy.id,
      dryRun: !input.execute,
      status: RetentionRunStatus.DRY_RUN,
      cutoff,
      startedAt: new Date()
    }
  });

  try {
    if (input.execute) {
      await requireArchiveForDestructiveRetention(policy.id, cutoff);
    }
    const result = input.execute ? await executeRetention(policy.id, cutoff) : await collectRetentionCounts(policy.id, cutoff);
    const updated = await prisma.retentionRun.update({
      where: { id: run.id },
      data: {
        status: input.execute ? RetentionRunStatus.COMPLETED : RetentionRunStatus.DRY_RUN,
        result: result as Prisma.InputJsonValue,
        finishedAt: new Date()
      }
    });
    await recordAdminAuditEvent({
      actorUserId: input.admin.id,
      action: input.execute ? "admin.retention.executed" : "admin.retention.dry_run",
      resourceType: "retention_run",
      resourceId: updated.id,
      outcome: "success",
      metadata: { policy: policy.id, cutoff, result }
    });
    return updated;
  } catch (error) {
    const updated = await prisma.retentionRun.update({
      where: { id: run.id },
      data: {
        status: RetentionRunStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "Falha de retenção.",
        finishedAt: new Date()
      }
    });
    await recordAdminAuditEvent({
      actorUserId: input.admin.id,
      action: "admin.retention.failed",
      resourceType: "retention_run",
      resourceId: updated.id,
      outcome: "failure",
      metadata: { policy: policy.id, error: updated.errorMessage }
    });
    return updated;
  }
}

export async function listRetentionRuns(input?: { page?: string | number; pageSize?: string | number; status?: string; policy?: string }) {
  const page = Math.max(Number(input?.page ?? 1) || 1, 1);
  const pageSize = Math.min(Math.max(Number(input?.pageSize ?? 25) || 25, 10), 100);
  const where: Prisma.RetentionRunWhereInput = {
    ...(input?.policy ? { policy: input.policy } : {}),
    ...(Object.values(RetentionRunStatus).includes(input?.status as RetentionRunStatus) ? { status: input?.status as RetentionRunStatus } : {})
  };
  const [items, total] = await Promise.all([
    prisma.retentionRun.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { requestedBy: true } }),
    prisma.retentionRun.count({ where })
  ]);
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
