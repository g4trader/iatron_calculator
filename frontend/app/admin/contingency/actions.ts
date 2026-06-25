"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-permissions";
import {
  AdminContingencyError,
  generateEmergencyLicense,
  invalidateUserSessionsFromContingency,
  refreshEntitlementFromContingency,
  registerOperationalIncidentFromContingency,
  reprocessReconcileFromContingency,
  resendActivationFromContingency
} from "@/lib/admin-contingency";
import { CRITICAL_ADMIN_ACTIONS, stepUpPasswordFromForm, validateAdminStepUp } from "@/lib/admin-step-up";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

function redirectContingency(params: Record<string, string>): never {
  const search = new URLSearchParams(params);
  redirect(`/admin/contingency?${search.toString()}`);
}

function errorMessage(error: unknown) {
  if (error instanceof AdminContingencyError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro operacional de contingência.";
}

export async function generateEmergencyLicenseAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.contingency.manage");

  try {
    await validateAdminStepUp({ admin, action: CRITICAL_ADMIN_ACTIONS.contingency, password: stepUpPasswordFromForm(formData), resourceType: "contingency_action", resourceId: "emergency_license" });
    await generateEmergencyLicense({
      admin,
      userEmail: getString(formData, "userEmail"),
      userId: getString(formData, "userId"),
      organizationId: getString(formData, "organizationId"),
      preset: getString(formData, "preset"),
      reason: getString(formData, "reason"),
      confirmation: getString(formData, "confirmation")
    });
  } catch (error) {
    redirectContingency({ error: errorMessage(error) });
  }

  revalidatePath("/admin/contingency");
  redirectContingency({ message: "Licença emergencial gerada com auditoria." });
}

export async function reprocessReconcileAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.contingency.manage");

  try {
    await validateAdminStepUp({ admin, action: CRITICAL_ADMIN_ACTIONS.contingency, password: stepUpPasswordFromForm(formData), resourceType: "contingency_action", resourceId: "reprocess_reconcile" });
    await reprocessReconcileFromContingency({
      admin,
      subscriptionId: getString(formData, "subscriptionId"),
      reason: getString(formData, "reason"),
      confirmation: getString(formData, "confirmation")
    });
  } catch (error) {
    redirectContingency({ error: errorMessage(error) });
  }

  revalidatePath("/admin/contingency");
  redirectContingency({ message: "Reconcile reprocessado com auditoria." });
}

export async function resendActivationAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.contingency.manage");

  try {
    await validateAdminStepUp({ admin, action: CRITICAL_ADMIN_ACTIONS.contingency, password: stepUpPasswordFromForm(formData), resourceType: "contingency_action", resourceId: "resend_activation" });
    await resendActivationFromContingency({
      admin,
      email: getString(formData, "email"),
      reason: getString(formData, "reason"),
      confirmation: getString(formData, "confirmation")
    });
  } catch (error) {
    redirectContingency({ error: errorMessage(error) });
  }

  revalidatePath("/admin/contingency");
  redirectContingency({ message: "Ativação reenviada quando aplicável." });
}

export async function invalidateUserSessionsAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.contingency.manage");

  try {
    await validateAdminStepUp({ admin, action: CRITICAL_ADMIN_ACTIONS.contingency, password: stepUpPasswordFromForm(formData), resourceType: "contingency_action", resourceId: "invalidate_sessions" });
    await invalidateUserSessionsFromContingency({
      admin,
      userId: getString(formData, "userId"),
      reason: getString(formData, "reason"),
      confirmation: getString(formData, "confirmation")
    });
  } catch (error) {
    redirectContingency({ error: errorMessage(error) });
  }

  revalidatePath("/admin/contingency");
  redirectContingency({ message: "Sessões ativas invalidadas com auditoria." });
}

export async function refreshEntitlementAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.contingency.manage");

  try {
    await validateAdminStepUp({ admin, action: CRITICAL_ADMIN_ACTIONS.contingency, password: stepUpPasswordFromForm(formData), resourceType: "contingency_action", resourceId: "refresh_entitlement" });
    await refreshEntitlementFromContingency({
      admin,
      subscriptionId: getString(formData, "subscriptionId"),
      reason: getString(formData, "reason"),
      confirmation: getString(formData, "confirmation")
    });
  } catch (error) {
    redirectContingency({ error: errorMessage(error) });
  }

  revalidatePath("/admin/contingency");
  redirectContingency({ message: "Entitlement recalculado com auditoria." });
}

export async function registerOperationalIncidentAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.contingency.manage");

  try {
    await validateAdminStepUp({ admin, action: CRITICAL_ADMIN_ACTIONS.contingency, password: stepUpPasswordFromForm(formData), resourceType: "contingency_action", resourceId: "register_incident" });
    await registerOperationalIncidentFromContingency({
      admin,
      title: getString(formData, "title"),
      severity: getString(formData, "severity"),
      origin: getString(formData, "origin"),
      impact: getString(formData, "impact"),
      reason: getString(formData, "reason"),
      confirmation: getString(formData, "confirmation")
    });
  } catch (error) {
    redirectContingency({ error: errorMessage(error) });
  }

  revalidatePath("/admin/contingency");
  redirectContingency({ message: "Incidente operacional registrado." });
}
