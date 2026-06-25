"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-permissions";
import {
  AdminLicenseError,
  createManualLicense,
  extendLicense,
  updateLicenseStatus,
  type AdminLicenseAction
} from "@/lib/admin-licenses";
import { CRITICAL_ADMIN_ACTIONS, stepUpPasswordFromForm, validateAdminStepUp } from "@/lib/admin-step-up";

const licenseStatusActions = ["suspend", "revoke", "reactivate", "convert_regular"] as const;
type LicenseStatusAction = (typeof licenseStatusActions)[number];

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

function licensesRedirect(params: Record<string, string>): never {
  const search = new URLSearchParams(params);
  redirect(`/admin/licenses?${search.toString()}`);
}

function handleLicenseActionError(error: unknown) {
  if (error instanceof AdminLicenseError) {
    licensesRedirect({ error: error.message });
  }
  if (error instanceof Error) {
    licensesRedirect({ error: error.message });
  }
  licensesRedirect({ error: "Erro operacional de licença." });
}

export async function createManualLicenseAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.licenses.manage");

  try {
    await validateAdminStepUp({ admin, action: CRITICAL_ADMIN_ACTIONS.licenseCreate, password: stepUpPasswordFromForm(formData), resourceType: "license" });
    await createManualLicense({
      admin,
      userEmail: getString(formData, "userEmail"),
      userId: getString(formData, "userId"),
      organizationId: getString(formData, "organizationId"),
      origin: getString(formData, "origin"),
      preset: getString(formData, "preset"),
      reason: getString(formData, "reason"),
      note: getString(formData, "note")
    });
  } catch (error) {
    handleLicenseActionError(error);
  }

  revalidatePath("/admin/licenses");
  licensesRedirect({ message: "Licença manual criada com auditoria." });
}

export async function extendLicenseAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.licenses.manage");
  const licenseId = getString(formData, "licenseId") ?? "";

  try {
    await validateAdminStepUp({ admin, action: CRITICAL_ADMIN_ACTIONS.licenseExtend, password: stepUpPasswordFromForm(formData), resourceType: "license", resourceId: licenseId });
    await extendLicense({
      admin,
      licenseId,
      preset: getString(formData, "preset"),
      reason: getString(formData, "reason"),
      note: getString(formData, "note")
    });
  } catch (error) {
    handleLicenseActionError(error);
  }

  revalidatePath("/admin/licenses");
  licensesRedirect({ message: "Validade da licença estendida." });
}

export async function updateLicenseStatusAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.licenses.manage");
  const action = getString(formData, "action");
  const licenseId = getString(formData, "licenseId") ?? "";

  if (!isLicenseStatusAction(action)) {
    licensesRedirect({ error: "Ação de licença inválida." });
  }
  const safeAction = action;

  try {
    await validateAdminStepUp({ admin, action: CRITICAL_ADMIN_ACTIONS.licenseStatus, password: stepUpPasswordFromForm(formData), resourceType: "license", resourceId: licenseId, metadata: { licenseAction: safeAction } });
    await updateLicenseStatus({
      admin,
      licenseId,
      action: safeAction,
      reason: getString(formData, "reason"),
      confirmation: getString(formData, "confirmation"),
      note: getString(formData, "note")
    });
  } catch (error) {
    handleLicenseActionError(error);
  }

  revalidatePath("/admin/licenses");
  licensesRedirect({ message: "Licença atualizada com auditoria." });
}

function isLicenseStatusAction(action: string | null): action is LicenseStatusAction & Extract<AdminLicenseAction, "suspend" | "revoke" | "reactivate" | "convert_regular"> {
  return Boolean(action && licenseStatusActions.includes(action as LicenseStatusAction));
}
