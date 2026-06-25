"use server";

import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { createOperationalIncident, updateOperationalIncident } from "@/lib/admin-operational-data";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : null;
}

export async function createOperationalIncidentAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.contingency.manage");
  let destination = "/admin/operations?message=Incidente registrado";
  try {
    await createOperationalIncident({
      admin,
      title: value(formData, "title"),
      description: value(formData, "description"),
      severity: value(formData, "severity"),
      source: value(formData, "source"),
      impactedArea: value(formData, "impactedArea"),
      assignedToUserId: value(formData, "assignedToUserId")
    });
  } catch (error) {
    destination = `/admin/operations?error=${encodeURIComponent(error instanceof Error ? error.message : "Falha ao registrar incidente")}`;
  }
  redirect(destination);
}

export async function updateOperationalIncidentAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.contingency.manage");
  let destination = "/admin/operations?message=Incidente atualizado";
  try {
    await updateOperationalIncident({
      admin,
      incidentId: value(formData, "incidentId") ?? "",
      status: value(formData, "status"),
      severity: value(formData, "severity"),
      assignedToUserId: value(formData, "assignedToUserId"),
      comment: value(formData, "comment")
    });
  } catch (error) {
    destination = `/admin/operations?error=${encodeURIComponent(error instanceof Error ? error.message : "Falha ao atualizar incidente")}`;
  }
  redirect(destination);
}
