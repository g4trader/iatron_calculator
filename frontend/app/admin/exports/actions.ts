"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ExportJobType } from "@prisma/client";
import { createExportJob, parseExportFormat, processExportJob } from "@/lib/admin-exports";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { CRITICAL_ADMIN_ACTIONS, stepUpPasswordFromForm, validateAdminStepUp } from "@/lib/admin-step-up";

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function requestAuditExportAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.audit.export");
  let destination = "/admin/exports?message=Exportação solicitada";
  try {
    await validateAdminStepUp({
      admin,
      action: CRITICAL_ADMIN_ACTIONS.auditExport,
      password: stepUpPasswordFromForm(formData),
      resourceType: "export_job",
      metadata: { type: ExportJobType.AUDIT_EXPORT, format: formString(formData, "format") ?? "csv" }
    });
    const filterPayload = Object.fromEntries(["actor", "action", "resourceType", "outcome", "dateFrom", "dateTo"].map((key) => [key, formString(formData, key)]).filter(([, value]) => value));
    const job = await createExportJob({
      admin,
      type: ExportJobType.AUDIT_EXPORT,
      format: parseExportFormat(formString(formData, "format")),
      filterPayload
    });
    await processExportJob(job.id);
    revalidatePath("/admin/exports");
  } catch (error) {
    destination = `/admin/exports?error=${encodeURIComponent(error instanceof Error ? error.message : "Falha ao solicitar exportação")}`;
  }
  redirect(destination);
}

export async function processExportJobAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.audit.export");
  const jobId = formString(formData, "jobId");
  if (jobId) {
    await validateAdminStepUp({
      admin,
      action: CRITICAL_ADMIN_ACTIONS.auditExport,
      password: stepUpPasswordFromForm(formData),
      resourceType: "export_job",
      resourceId: jobId,
      metadata: { operation: "export_reprocess" }
    });
    await processExportJob(jobId);
  }
  revalidatePath("/admin/exports");
}
