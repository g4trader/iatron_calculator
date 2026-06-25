"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createArchiveRestoreJob, processArchiveRestoreJob } from "@/lib/admin-archive-restore";
import { createArchiveJob, parseArchiveType, processArchiveJob } from "@/lib/admin-archive";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { CRITICAL_ADMIN_ACTIONS, stepUpPasswordFromForm, validateAdminStepUp } from "@/lib/admin-step-up";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : null;
}

export async function requestArchiveJobAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.contingency.manage");
  let destination = "/admin/archive?message=Archive solicitado";
  try {
    const type = parseArchiveType(value(formData, "type"));
    await validateAdminStepUp({
      admin,
      action: CRITICAL_ADMIN_ACTIONS.contingency,
      password: stepUpPasswordFromForm(formData),
      resourceType: "archive_job",
      metadata: { type }
    });
    const dateToInput = value(formData, "dateTo");
    const job = await createArchiveJob({ admin, type, dateTo: dateToInput ? new Date(`${dateToInput}T23:59:59.999Z`) : undefined });
    await processArchiveJob(job.id);
    revalidatePath("/admin/archive");
  } catch (error) {
    destination = `/admin/archive?error=${encodeURIComponent(error instanceof Error ? error.message : "Falha ao arquivar")}`;
  }
  redirect(destination);
}

export async function processArchiveJobAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.contingency.manage");
  const jobId = value(formData, "jobId");
  if (jobId) {
    await validateAdminStepUp({
      admin,
      action: CRITICAL_ADMIN_ACTIONS.contingency,
      password: stepUpPasswordFromForm(formData),
      resourceType: "archive_job",
      resourceId: jobId,
      metadata: { operation: "archive_reprocess" }
    });
    await processArchiveJob(jobId);
  }
  revalidatePath("/admin/archive");
}

export async function requestArchiveRestoreAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.contingency.manage");
  let destination = "/admin/archive?message=Restore solicitado";
  try {
    const archiveObjectId = value(formData, "archiveObjectId");
    const reason = value(formData, "reason") ?? "";
    const dryRun = value(formData, "mode") !== "execute";
    const force = value(formData, "force") === "confirm_force_restore";
    if (!archiveObjectId) throw new Error("ArchiveObject obrigatório.");
    await validateAdminStepUp({
      admin,
      action: CRITICAL_ADMIN_ACTIONS.contingency,
      password: stepUpPasswordFromForm(formData),
      resourceType: "archive_object",
      resourceId: archiveObjectId,
      metadata: { operation: dryRun ? "archive_restore_dry_run" : "archive_restore_execute", force }
    });
    const job = await createArchiveRestoreJob({ admin, archiveObjectId, reason, dryRun, force });
    await processArchiveRestoreJob(job.id);
    revalidatePath("/admin/archive");
  } catch (error) {
    destination = `/admin/archive?error=${encodeURIComponent(error instanceof Error ? error.message : "Falha no restore")}`;
  }
  redirect(destination);
}
