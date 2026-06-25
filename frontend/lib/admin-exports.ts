import { ExportJobFormat, ExportJobStatus, ExportJobType, type Prisma } from "@prisma/client";
import { buildAuditWhere, parseAuditFilters, serializeAuditEvents } from "@/lib/admin-audit";
import { getArchiveStorage } from "@/lib/archive-storage";
import { recordAdminAuditEvent, type AdminUser } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

export function parseExportFormat(value?: string | null) {
  return (value === "json" || value === "JSON" ? "JSON" : "CSV") as ExportJobFormat;
}

function contentType(format: ExportJobFormat) {
  return format === "JSON" ? "application/json; charset=utf-8" : "text/csv; charset=utf-8";
}

function canReadInlineExportFallback() {
  return process.env.NODE_ENV !== "production" || process.env.ADMIN_EXPORT_ALLOW_INLINE_FALLBACK === "true";
}

export function exportFilename(job: { id: string; type: ExportJobType; format: ExportJobFormat }) {
  return `iatron-${job.type.toLowerCase()}-${job.id}.${job.format.toLowerCase()}`;
}

export function exportContentType(format: ExportJobFormat) {
  return contentType(format);
}

export function exportStorageKey(job: { id: string; type: ExportJobType; format: ExportJobFormat }) {
  const date = new Date().toISOString().slice(0, 10);
  return `exports/${job.type.toLowerCase()}/${date}/${exportFilename(job)}`;
}

export async function createExportJob(input: {
  admin: AdminUser;
  type: ExportJobType;
  format: ExportJobFormat;
  filterPayload?: Prisma.InputJsonValue;
}) {
  const job = await prisma.exportJob.create({
    data: {
      requestedByUserId: input.admin.id,
      type: input.type,
      format: input.format,
      filterPayload: input.filterPayload,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.export.requested",
    resourceType: "export_job",
    resourceId: job.id,
    outcome: "success",
    metadata: { type: job.type, format: job.format }
  });

  return job;
}

async function processAuditExport(jobId: string) {
  const job = await prisma.exportJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("ExportJob não encontrado.");
  const filters = parseAuditFilters((job.filterPayload ?? {}) as Record<string, string | undefined>);
  const events = await prisma.adminAuditEvent.findMany({
    where: buildAuditWhere(filters),
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { actor: true, targetUser: true }
  });
  const fileContent = serializeAuditEvents(events, job.format === "JSON" ? "json" : "csv");
  return { fileContent, rowCount: events.length };
}

export async function processExportJob(jobId: string) {
  const startedAt = new Date();
  await prisma.exportJob.update({ where: { id: jobId }, data: { status: ExportJobStatus.RUNNING, startedAt } });

  try {
    const job = await prisma.exportJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error("ExportJob não encontrado.");
    const result = job.type === ExportJobType.AUDIT_EXPORT
      ? await processAuditExport(job.id)
      : { fileContent: JSON.stringify({ message: "Tipo de exportação ainda não implementado.", type: job.type }, null, 2), rowCount: 0 };
    const storage = getArchiveStorage();
    const stored = await storage.writeObject(exportStorageKey(job), result.fileContent);

    const updated = await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: ExportJobStatus.COMPLETED,
        fileContent: canReadInlineExportFallback() ? result.fileContent : null,
        storageProvider: stored.provider,
        storageKey: stored.storageKey,
        checksum: stored.checksum,
        byteSize: stored.byteSize,
        rowCount: result.rowCount,
        finishedAt: new Date()
      }
    });

    await recordAdminAuditEvent({
      actorUserId: updated.requestedByUserId,
      action: "admin.export.completed",
      resourceType: "export_job",
      resourceId: updated.id,
      outcome: "success",
      metadata: { type: updated.type, rowCount: updated.rowCount, storageProvider: stored.provider, checksum: stored.checksum, byteSize: stored.byteSize }
    });
    return updated;
  } catch (error) {
    const updated = await prisma.exportJob.update({
      where: { id: jobId },
      data: {
        status: ExportJobStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "Falha ao processar exportação.",
        finishedAt: new Date()
      }
    });
    await recordAdminAuditEvent({
      actorUserId: updated.requestedByUserId,
      action: "admin.export.failed",
      resourceType: "export_job",
      resourceId: updated.id,
      outcome: "failure",
      metadata: { type: updated.type, error: updated.errorMessage }
    });
    return updated;
  }
}

export function parseAdminListPagination(input?: { page?: string | number; pageSize?: string | number }) {
  const page = Math.max(Number(input?.page ?? 1) || 1, 1);
  const pageSize = Math.min(Math.max(Number(input?.pageSize ?? 25) || 25, 10), 100);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export async function listExportJobs(input?: { page?: string | number; pageSize?: string | number; status?: string; type?: string }) {
  const pagination = parseAdminListPagination(input);
  const where: Prisma.ExportJobWhereInput = {
    ...(Object.values(ExportJobStatus).includes(input?.status as ExportJobStatus) ? { status: input?.status as ExportJobStatus } : {}),
    ...(Object.values(ExportJobType).includes(input?.type as ExportJobType) ? { type: input?.type as ExportJobType } : {})
  };
  const [items, total] = await Promise.all([
    prisma.exportJob.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: pagination.skip,
    take: pagination.take,
    include: { requestedBy: true }
    }),
    prisma.exportJob.count({ where })
  ]);
  return { items, total, page: pagination.page, pageSize: pagination.pageSize, totalPages: Math.max(1, Math.ceil(total / pagination.pageSize)) };
}

export async function getExportJobForDownload(id: string, admin: AdminUser) {
  const job = await prisma.exportJob.findUnique({ where: { id } });
  if (!job) return null;
  if (job.requestedByUserId !== admin.id && !admin.adminPermissions.includes("admin.audit.export")) return null;
  if (job.status !== ExportJobStatus.COMPLETED) return null;

  if (job.storageKey && job.storageProvider) {
    const content = await getArchiveStorage().readObject(job.storageKey);
    const { createHash } = await import("crypto");
    const checksum = createHash("sha256").update(content).digest("hex");
    if (job.checksum && checksum !== job.checksum) {
      await recordAdminAuditEvent({
        actorUserId: admin.id,
        action: "admin.export.download.blocked",
        resourceType: "export_job",
        resourceId: job.id,
        outcome: "denied",
        metadata: { reason: "checksum_mismatch", expected: job.checksum, actual: checksum }
      });
      return null;
    }
    await recordAdminAuditEvent({
      actorUserId: admin.id,
      action: "admin.export.downloaded",
      resourceType: "export_job",
      resourceId: job.id,
      outcome: "success",
      metadata: { type: job.type, storageProvider: job.storageProvider, byteSize: job.byteSize }
    });
    return { job, content };
  }

  if (job.fileContent && canReadInlineExportFallback()) {
    await recordAdminAuditEvent({
      actorUserId: admin.id,
      action: "admin.export.downloaded_inline_fallback",
      resourceType: "export_job",
      resourceId: job.id,
      outcome: "success",
      metadata: { type: job.type, fallback: true }
    });
    return { job, content: job.fileContent };
  }

  await recordAdminAuditEvent({
    actorUserId: admin.id,
    action: "admin.export.download.blocked",
    resourceType: "export_job",
    resourceId: job.id,
    outcome: "denied",
    metadata: { reason: "missing_private_storage", storageKey: job.storageKey, storageProvider: job.storageProvider }
  });
  return null;
}
