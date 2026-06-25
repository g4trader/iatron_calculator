"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-permissions";
import {
  AdminAccessError,
  deactivateAdminAccess,
  grantAdminPermission,
  grantAdminRole,
  removeAdminRole,
  revokeAdminPermission
} from "@/lib/admin-admin-users";
import { CRITICAL_ADMIN_ACTIONS, stepUpPasswordFromForm, validateAdminStepUp } from "@/lib/admin-step-up";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

function redirectAdminUsers(params: Record<string, string>): never {
  const search = new URLSearchParams(params);
  redirect(`/admin/admin-users?${search.toString()}`);
}

function handleAccessError(error: unknown): never {
  if (error instanceof AdminAccessError || error instanceof Error) {
    redirectAdminUsers({ error: error.message });
  }
  redirectAdminUsers({ error: "Erro ao alterar acesso administrativo." });
}

export async function grantAdminRoleAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.users.manage");
  try {
    await validateAdminStepUp({ admin, action: CRITICAL_ADMIN_ACTIONS.accessGrantRole, password: stepUpPasswordFromForm(formData), resourceType: "user", resourceId: getString(formData, "targetUserId") });
    await grantAdminRole({ admin, targetUserId: getString(formData, "targetUserId") ?? "", roleCode: getString(formData, "roleCode"), reason: getString(formData, "reason") });
  } catch (error) {
    handleAccessError(error);
  }
  revalidatePath("/admin/admin-users");
  redirectAdminUsers({ message: "Role ADMIN concedida." });
}

export async function removeAdminRoleAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.users.manage");
  try {
    await validateAdminStepUp({ admin, action: CRITICAL_ADMIN_ACTIONS.accessRemoveRole, password: stepUpPasswordFromForm(formData), resourceType: "user", resourceId: getString(formData, "targetUserId") });
    await removeAdminRole({
      admin,
      targetUserId: getString(formData, "targetUserId") ?? "",
      roleCode: getString(formData, "roleCode"),
      reason: getString(formData, "reason"),
      confirmation: getString(formData, "confirmation")
    });
  } catch (error) {
    handleAccessError(error);
  }
  revalidatePath("/admin/admin-users");
  redirectAdminUsers({ message: "Role ADMIN removida." });
}

export async function grantAdminPermissionAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.users.manage");
  try {
    await validateAdminStepUp({ admin, action: CRITICAL_ADMIN_ACTIONS.accessGrantPermission, password: stepUpPasswordFromForm(formData), resourceType: "user", resourceId: getString(formData, "targetUserId"), metadata: { permission: getString(formData, "permission") } });
    await grantAdminPermission({
      admin,
      targetUserId: getString(formData, "targetUserId") ?? "",
      permission: getString(formData, "permission"),
      reason: getString(formData, "reason"),
      confirmation: getString(formData, "confirmation")
    });
  } catch (error) {
    handleAccessError(error);
  }
  revalidatePath("/admin/admin-users");
  redirectAdminUsers({ message: "Permissão pontual concedida." });
}

export async function revokeAdminPermissionAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.users.manage");
  try {
    await validateAdminStepUp({ admin, action: CRITICAL_ADMIN_ACTIONS.accessRevokePermission, password: stepUpPasswordFromForm(formData), resourceType: "user", resourceId: getString(formData, "targetUserId"), metadata: { permission: getString(formData, "permission") } });
    await revokeAdminPermission({
      admin,
      targetUserId: getString(formData, "targetUserId") ?? "",
      permission: getString(formData, "permission"),
      reason: getString(formData, "reason"),
      confirmation: getString(formData, "confirmation")
    });
  } catch (error) {
    handleAccessError(error);
  }
  revalidatePath("/admin/admin-users");
  redirectAdminUsers({ message: "Permissão pontual revogada." });
}

export async function deactivateAdminAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.users.manage");
  try {
    await validateAdminStepUp({ admin, action: CRITICAL_ADMIN_ACTIONS.accessDeactivate, password: stepUpPasswordFromForm(formData), resourceType: "user", resourceId: getString(formData, "targetUserId") });
    await deactivateAdminAccess({
      admin,
      targetUserId: getString(formData, "targetUserId") ?? "",
      reason: getString(formData, "reason"),
      confirmation: getString(formData, "confirmation")
    });
  } catch (error) {
    handleAccessError(error);
  }
  revalidatePath("/admin/admin-users");
  redirectAdminUsers({ message: "Admin desativado." });
}
