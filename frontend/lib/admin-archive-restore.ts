import { createHash } from "crypto";
import { ArchiveRestoreEventType, ArchiveRestoreStatus, type ArchiveJobType, type Prisma } from "@prisma/client";
import { getArchiveStorage } from "@/lib/archive-storage";
import { recordAdminAuditEvent, type AdminUser } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

function checksum(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

function parseJsonLines(content: string) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line)) as Prisma.InputJsonObject[];
}

type RestoreDelegate = {
  findMany(input: { where: { id: { in: string[] } }; select: { id: true } }): Promise<Array<{ id: string }>>;
  createMany(input: { data: Prisma.InputJsonObject[]; skipDuplicates?: boolean }): Promise<{ count: number }>;
};

async function analyzeRestoreRows(delegate: RestoreDelegate, rows: Prisma.InputJsonObject[]) {
  const ids = rows.map((row) => typeof row.id === "string" ? row.id : null);
  const missingIdRows = ids.map((id, index) => id ? null : index + 1).filter((value): value is number => value !== null);
  const validIds = ids.filter((id): id is string => Boolean(id));
  const seen = new Set<string>();
  const duplicateIds: string[] = [];
  for (const id of validIds) {
    if (seen.has(id)) duplicateIds.push(id);
    seen.add(id);
  }
  const existing = validIds.length > 0
    ? await delegate.findMany({ where: { id: { in: Array.from(new Set(validIds)) } }, select: { id: true } })
    : [];
  const existingIds = existing.map((item) => item.id);
  return {
    totalRows: rows.length,
    validIdRows: validIds.length,
    missingIdRows,
    duplicateIds: Array.from(new Set(duplicateIds)),
    existingIds,
    candidateRows: rows.filter((row) => typeof row.id === "string" && !existingIds.includes(row.id))
  };
}

async function restoreEvent(input: {
  restoreJobId: string;
  actorUserId?: string | null;
  type: ArchiveRestoreEventType;
  outcome?: string;
  message?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.archiveRestoreEvent.create({
    data: {
      restoreJobId: input.restoreJobId,
      actorUserId: input.actorUserId ?? null,
      type: input.type,
      outcome: input.outcome ?? "success",
      message: input.message,
      metadata: input.metadata
    }
  });
}

function delegateFor(type: ArchiveJobType) {
  if (type === "ADMIN_AUDIT") return prisma.adminAuditEvent;
  if (type === "FUNNEL_EVENTS") return prisma.funnelEvent;
  if (type === "WEBHOOK_FAILURES") return prisma.webhookFailure;
  if (type === "JOB_RUNS") return prisma.jobRun;
  if (type === "EXPORT_JOBS") return prisma.exportJob;
  return prisma.retentionRun;
}

export async function readArchiveObjectForAdmin(admin: AdminUser, archiveObjectId: string) {
  const object = await prisma.archiveObject.findUnique({
    where: { id: archiveObjectId },
    include: { archiveJob: true }
  });
  if (!object) throw new Error("ArchiveObject não encontrado.");
  const content = await getArchiveStorage().readObject(object.storageKey);
  const actualChecksum = checksum(content);
  if (actualChecksum !== object.checksum) {
    await recordAdminAuditEvent({
      actorUserId: admin.id,
      action: "admin.archive.download.blocked",
      resourceType: "archive_object",
      resourceId: object.id,
      outcome: "denied",
      metadata: { reason: "checksum_mismatch", expected: object.checksum, actual: actualChecksum }
    });
    throw new Error("Checksum do archive inválido. Download bloqueado.");
  }
  await recordAdminAuditEvent({
    actorUserId: admin.id,
    action: "admin.archive.downloaded",
    resourceType: "archive_object",
    resourceId: object.id,
    outcome: "success",
    metadata: { storageProvider: object.storageProvider, rowCount: object.rowCount, type: object.archiveJob.type }
  });
  return { object, content, actualChecksum };
}

export async function createArchiveRestoreJob(input: {
  admin: AdminUser;
  archiveObjectId: string;
  reason: string;
  dryRun?: boolean;
  force?: boolean;
}) {
  const reason = input.reason.trim();
  if (reason.length < 8) throw new Error("Restore exige motivo com pelo menos 8 caracteres.");

  const object = await prisma.archiveObject.findUnique({
    where: { id: input.archiveObjectId },
    include: { archiveJob: true }
  });
  if (!object) throw new Error("ArchiveObject não encontrado.");

  const previousCompleted = await prisma.archiveRestoreJob.findFirst({
    where: {
      archiveObjectId: object.id,
      dryRun: false,
      status: ArchiveRestoreStatus.COMPLETED
    },
    orderBy: { createdAt: "desc" }
  });
  if (previousCompleted && !input.force) {
    const blocked = await prisma.archiveRestoreJob.create({
      data: {
        requestedByUserId: input.admin.id,
        archiveObjectId: object.id,
        dryRun: input.dryRun ?? true,
        force: false,
        reason,
        status: ArchiveRestoreStatus.BLOCKED,
        errorMessage: "Restore já executado para este ArchiveObject. Use confirmação forçada apenas em contingência documentada.",
        finishedAt: new Date()
      }
    });
    await restoreEvent({
      restoreJobId: blocked.id,
      actorUserId: input.admin.id,
      type: ArchiveRestoreEventType.RESTORE_BLOCKED,
      outcome: "denied",
      message: blocked.errorMessage ?? undefined,
      metadata: { previousRestoreJobId: previousCompleted.id }
    });
    await recordAdminAuditEvent({
      actorUserId: input.admin.id,
      action: "admin.archive_restore.blocked",
      resourceType: "archive_restore_job",
      resourceId: blocked.id,
      outcome: "denied",
      metadata: { archiveObjectId: object.id, reason: "duplicate_restore" }
    });
    return blocked;
  }

  const job = await prisma.archiveRestoreJob.create({
    data: {
      requestedByUserId: input.admin.id,
      archiveObjectId: object.id,
      dryRun: input.dryRun ?? true,
      force: input.force ?? false,
      reason,
      status: ArchiveRestoreStatus.REQUESTED
    }
  });
  await restoreEvent({
    restoreJobId: job.id,
    actorUserId: input.admin.id,
    type: ArchiveRestoreEventType.REQUESTED,
    metadata: { archiveObjectId: object.id, dryRun: job.dryRun, force: job.force }
  });
  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.archive_restore.requested",
    resourceType: "archive_restore_job",
    resourceId: job.id,
    outcome: "success",
    metadata: { archiveObjectId: object.id, dryRun: job.dryRun, force: job.force, type: object.archiveJob.type }
  });
  return job;
}

export async function processArchiveRestoreJob(restoreJobId: string) {
  const job = await prisma.archiveRestoreJob.update({
    where: { id: restoreJobId },
    data: { status: ArchiveRestoreStatus.RUNNING, startedAt: new Date() },
    include: { archiveObject: { include: { archiveJob: true } } }
  });

  try {
    const content = await getArchiveStorage().readObject(job.archiveObject.storageKey);
    const actualChecksum = checksum(content);
    if (actualChecksum !== job.archiveObject.checksum) {
      await restoreEvent({
        restoreJobId: job.id,
        actorUserId: job.requestedByUserId,
        type: ArchiveRestoreEventType.RESTORE_FAILED,
        outcome: "failure",
        message: "Checksum inválido.",
        metadata: { expected: job.archiveObject.checksum, actual: actualChecksum }
      });
      throw new Error("Checksum inválido. Restore bloqueado.");
    }

    const rows = parseJsonLines(content);
    const delegate = delegateFor(job.archiveObject.archiveJob.type) as unknown as RestoreDelegate;
    const analysis = await analyzeRestoreRows(delegate, rows);
    await restoreEvent({
      restoreJobId: job.id,
      actorUserId: job.requestedByUserId,
      type: ArchiveRestoreEventType.CHECKSUM_VERIFIED,
      metadata: { checksum: actualChecksum, rows: rows.length, existing: analysis.existingIds.length, missingIds: analysis.missingIdRows.length, duplicates: analysis.duplicateIds.length }
    });

    if (job.dryRun) {
      const updated = await prisma.archiveRestoreJob.update({
        where: { id: job.id },
        data: {
          status: ArchiveRestoreStatus.DRY_RUN,
          rowCount: rows.length,
          restoredCount: 0,
          skippedCount: analysis.existingIds.length + analysis.missingIdRows.length + analysis.duplicateIds.length,
          checksumVerified: true,
          checksumActual: actualChecksum,
          result: {
            mode: "dry_run",
            totalRows: analysis.totalRows,
            candidateRows: analysis.candidateRows.length,
            existingIds: analysis.existingIds,
            missingIdRows: analysis.missingIdRows,
            duplicateIds: analysis.duplicateIds,
            preconditionFailures: analysis.missingIdRows.length > 0 ? ["rows_without_id"] : []
          },
          finishedAt: new Date()
        }
      });
      await restoreEvent({ restoreJobId: job.id, actorUserId: job.requestedByUserId, type: ArchiveRestoreEventType.DRY_RUN_COMPLETED, metadata: { rows: rows.length, candidateRows: analysis.candidateRows.length, existingIds: analysis.existingIds.length } });
      await recordAdminAuditEvent({
        actorUserId: job.requestedByUserId,
        action: "admin.archive_restore.dry_run_completed",
        resourceType: "archive_restore_job",
        resourceId: job.id,
        outcome: "success",
        metadata: { archiveObjectId: job.archiveObjectId, rows: rows.length }
      });
      return updated;
    }

    if (analysis.missingIdRows.length > 0) throw new Error(`Restore bloqueado: ${analysis.missingIdRows.length} linha(s) sem id.`);

    await restoreEvent({ restoreJobId: job.id, actorUserId: job.requestedByUserId, type: ArchiveRestoreEventType.RESTORE_STARTED, metadata: { rows: rows.length, candidateRows: analysis.candidateRows.length, type: job.archiveObject.archiveJob.type } });
    const restored = analysis.candidateRows.length > 0 ? await delegate.createMany({ data: analysis.candidateRows, skipDuplicates: true }) : { count: 0 };
    const updated = await prisma.archiveRestoreJob.update({
      where: { id: job.id },
      data: {
        status: ArchiveRestoreStatus.COMPLETED,
        rowCount: rows.length,
        restoredCount: restored.count,
        skippedCount: rows.length - restored.count,
        checksumVerified: true,
        checksumActual: actualChecksum,
        result: {
          mode: "restore",
          totalRows: analysis.totalRows,
          candidateRows: analysis.candidateRows.length,
          restoredRows: restored.count,
          skippedRows: rows.length - restored.count,
          existingIds: analysis.existingIds,
          duplicateIds: analysis.duplicateIds,
          missingIdRows: analysis.missingIdRows
        },
        finishedAt: new Date()
      }
    });
    await restoreEvent({
      restoreJobId: job.id,
      actorUserId: job.requestedByUserId,
      type: ArchiveRestoreEventType.RESTORE_COMPLETED,
      metadata: { rows: rows.length, restored: restored.count, skipped: rows.length - restored.count }
    });
    await recordAdminAuditEvent({
      actorUserId: job.requestedByUserId,
      action: "admin.archive_restore.completed",
      resourceType: "archive_restore_job",
      resourceId: job.id,
      outcome: "success",
      metadata: { archiveObjectId: job.archiveObjectId, rows: rows.length, restored: restored.count }
    });
    return updated;
  } catch (error) {
    const updated = await prisma.archiveRestoreJob.update({
      where: { id: job.id },
      data: {
        status: ArchiveRestoreStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "Falha no restore.",
        finishedAt: new Date()
      }
    });
    await recordAdminAuditEvent({
      actorUserId: job.requestedByUserId,
      action: "admin.archive_restore.failed",
      resourceType: "archive_restore_job",
      resourceId: job.id,
      outcome: "failure",
      metadata: { archiveObjectId: job.archiveObjectId, error: updated.errorMessage }
    });
    return updated;
  }
}

export async function listArchiveRestoreJobs(input?: { page?: string | number; pageSize?: string | number; status?: string }) {
  const page = Math.max(Number(input?.page ?? 1) || 1, 1);
  const pageSize = Math.min(Math.max(Number(input?.pageSize ?? 25) || 25, 10), 100);
  const validStatuses = Object.values(ArchiveRestoreStatus);
  const where: Prisma.ArchiveRestoreJobWhereInput = validStatuses.includes(input?.status as ArchiveRestoreStatus)
    ? { status: input?.status as ArchiveRestoreStatus }
    : {};
  const [items, total] = await Promise.all([
    prisma.archiveRestoreJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        requestedBy: true,
        archiveObject: { include: { archiveJob: true } },
        events: { orderBy: { createdAt: "desc" }, take: 5 }
      }
    }),
    prisma.archiveRestoreJob.count({ where })
  ]);
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
