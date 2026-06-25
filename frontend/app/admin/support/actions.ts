"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-permissions";
import type { CustomerType } from "@/lib/admin-customers";
import { addSupportIntervention } from "@/lib/admin-support";
import { createSupportTicket, updateSupportTicket } from "@/lib/admin-operational-data";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

function redirectSupport(params: Record<string, string>): never {
  const search = new URLSearchParams(params);
  redirect(`/admin/support?${search.toString()}`);
}

export async function addSupportInterventionAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.support.write");
  const customerId = getString(formData, "customerId") ?? "";
  const customerType = getString(formData, "customerType") as CustomerType | null;

  if (!customerId || !customerType || !["individual", "institutional"].includes(customerType)) {
    redirectSupport({ error: "Cliente inválido para intervenção de suporte." });
  }

  try {
    await addSupportIntervention({
      admin,
      customerId,
      customerType,
      supportNote: getString(formData, "supportNote"),
      riskReason: getString(formData, "riskReason"),
      actionTaken: getString(formData, "actionTaken"),
      followUpDate: getString(formData, "followUpDate")
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao registrar intervenção.";
    redirectSupport({ error: message });
  }

  revalidatePath("/admin/support");
  revalidatePath(`/admin/customers/${customerId}`);
  redirectSupport({ message: "Intervenção de suporte registrada com auditoria." });
}

export async function createSupportTicketAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.support.write");

  try {
    await createSupportTicket({
      admin,
      userId: getString(formData, "userId"),
      organizationId: getString(formData, "organizationId"),
      subject: getString(formData, "subject"),
      description: getString(formData, "description"),
      category: getString(formData, "category"),
      priority: getString(formData, "priority"),
      source: "admin",
      assigneeUserId: getString(formData, "assigneeUserId")
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar ticket.";
    redirectSupport({ error: message });
  }

  revalidatePath("/admin/support");
  redirectSupport({ message: "Ticket de suporte criado com auditoria." });
}

export async function updateSupportTicketAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.support.write");

  try {
    await updateSupportTicket({
      admin,
      ticketId: getString(formData, "ticketId") ?? "",
      status: getString(formData, "status"),
      assigneeUserId: getString(formData, "assigneeUserId"),
      comment: getString(formData, "comment")
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar ticket.";
    redirectSupport({ error: message });
  }

  revalidatePath("/admin/support");
  redirectSupport({ message: "Ticket atualizado com auditoria." });
}
