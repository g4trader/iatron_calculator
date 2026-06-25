import { ArchiveJobStatus, ArchiveJobType, type Prisma } from "@prisma/client";
import { getArchiveStorage } from "@/lib/archive-storage";
import { recordAdminAuditEvent, type AdminUser } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

export const ARCHIVE_JOB_TYPES = [
  "ADMIN_AUDIT",
  "FUNNEL_EVENTS",
  "WEBHOOK_FAILURES",
  "JOB_RUNS",
  "EXPORT_JOBS",
  "RETENTION_RUNS"
] as const satisfies readonly ArchiveJobType[];

export const ARCHIVE_POLICIES = [
  { type: "ADMIN_AUDIT" as ArchiveJobType, label: "Auditoria administrativa", windowDays: 730, compliance: "long" },
  { type: "FUNNEL_EVENTS" as ArchiveJobType, label: "Eventos de funil", windowDays: 365, compliance: "medium" },
  { type: "WEBHOOK_FAILURES" as ArchiveJobType, label: "Falhas de webhook", windowDays: 180, compliance: "medium" },
  { type: "JOB_RUNS" as ArchiveJobType, label: "Execuções de jobs", windowDays: 180, compliance: "short" },
  { type: "EXPORT_JOBS" as ArchiveJobType, label: "Export jobs", windowDays: 90, compliance: "medium" },
  { type: "RETENTION_RUNS" as ArchiveJobType, label: "Retention runs", windowDays: 365, compliance: "medium" }
] as const;

export function parseArchiveType(value?: string | null) {
  return ARCHIVE_JOB_TYPES.includes(value as ArchiveJobType) ? value as ArchiveJobType : "FUNNEL_EVENTS" as ArchiveJobType;
}

export function archiveCutoffFor(type: ArchiveJobType, now = new Date()) {
  const policy = ARCHIVE_POLICIES.find((item) => item.type === type) ?? ARCHIVE_POLICIES[0];
  return new Date(now.getTime() - policy.windowDays * 24 * 60 * 60 * 1000);
}

function jsonLines(rows: unknown[]) {
  return rows.map((row) => JSON.stringify(row)).join("\n");
}

async function loadRows(type: ArchiveJobType, dateTo: Date, limit = 5000) {
  if (type === "ADMIN_AUDIT") {
    return prisma.adminAuditEvent.findMany({ where: { createdAt: { lt: dateTo } }, orderBy: { createdAt: "asc" }, take: limit });
  }
  if (type === "FUNNEL_EVENTS") {
    return prisma.funnelEvent.findMany({ where: { createdAt: { lt: dateTo } }, orderBy: { createdAt: "asc" }, take: limit });
  }
  if (type === "WEBHOOK_FAILURES") {
    return prisma.webhookFailure.findMany({ where: { createdAt: { lt: dateTo } }, orderBy: { createdAt: "asc" }, take: limit });
  }
  if (type === "JOB_RUNS") {
    return prisma.jobRun.findMany({ where: { createdAt: { lt: dateTo } }, orderBy: { createdAt: "asc" }, take: limit });
  }
  if (type === "EXPORT_JOBS") {
    return prisma.exportJob.findMany({ where: { createdAt: { lt: dateTo } }, orderBy: { createdAt: "asc" }, take: limit });
  }
  return prisma.retentionRun.findMany({ where: { createdAt: { lt: dateTo } }, orderBy: { createdAt: "asc" }, take: limit });
}

export async function createArchiveJob(input: {
  admin: AdminUser;
  type: ArchiveJobType;
  dateTo?: Date;
  filterPayload?: Prisma.InputJsonValue;
}) {
  const dateTo = input.dateTo ?? archiveCutoffFor(input.type);
  const job = await prisma.archiveJob.create({
    data: {
      requestedByUserId: input.admin.id,
      type: input.type,
      dateTo,
      filterPayload: input.filterPayload
    }
  });
  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.archive.requested",
    resourceType: "archive_job",
    resourceId: job.id,
    outcome: "success",
    metadata: { type: job.type, dateTo }
  });
  return job;
}

export async function processArchiveJob(jobId: string) {
  await prisma.archiveJob.update({ where: { id: jobId }, data: { status: ArchiveJobStatus.RUNNING, startedAt: new Date() } });
  const storage = getArchiveStorage();
  try {
    const job = await prisma.archiveJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error("ArchiveJob não encontrado.");
    const rows = await loadRows(job.type, job.dateTo);
    const content = jsonLines(rows);
    const key = `${job.type.toLowerCase()}/${job.dateTo.toISOString().slice(0, 10)}/${job.id}.jsonl`;
    const stored = await storage.writeObject(key, content);
    const object = await prisma.archiveObject.create({
      data: {
        archiveJobId: job.id,
        storageProvider: stored.provider,
        storageKey: stored.storageKey,
        checksum: stored.checksum,
        byteSize: stored.byteSize,
        rowCount: rows.length,
        metadata: { type: job.type, dateTo: job.dateTo.toISOString(), format: "jsonl" }
      }
    });
    const updated = await prisma.archiveJob.update({
      where: { id: job.id },
      data: { status: ArchiveJobStatus.COMPLETED, rowCount: rows.length, finishedAt: new Date() }
    });
    await recordAdminAuditEvent({
      actorUserId: updated.requestedByUserId,
      action: "admin.archive.completed",
      resourceType: "archive_job",
      resourceId: updated.id,
      outcome: "success",
      metadata: { type: updated.type, archiveObjectId: object.id, rowCount: rows.length, storageProvider: stored.provider }
    });
    return updated;
  } catch (error) {
    const updated = await prisma.archiveJob.update({
      where: { id: jobId },
      data: {
        status: ArchiveJobStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "Falha ao arquivar.",
        finishedAt: new Date()
      }
    });
    await recordAdminAuditEvent({
      actorUserId: updated.requestedByUserId,
      action: "admin.archive.failed",
      resourceType: "archive_job",
      resourceId: updated.id,
      outcome: "failure",
      metadata: { type: updated.type, error: updated.errorMessage }
    });
    return updated;
  }
}

export async function listArchiveJobs(input?: { page?: string | number; pageSize?: string | number; status?: string; type?: string }) {
  const page = Math.max(Number(input?.page ?? 1) || 1, 1);
  const pageSize = Math.min(Math.max(Number(input?.pageSize ?? 25) || 25, 10), 100);
  const where: Prisma.ArchiveJobWhereInput = {
    ...(ARCHIVE_JOB_TYPES.includes(input?.type as ArchiveJobType) ? { type: input?.type as ArchiveJobType } : {}),
    ...(Object.values(ArchiveJobStatus).includes(input?.status as ArchiveJobStatus) ? { status: input?.status as ArchiveJobStatus } : {})
  };
  const [items, total] = await Promise.all([
    prisma.archiveJob.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { requestedBy: true, objects: true } }),
    prisma.archiveJob.count({ where })
  ]);
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
