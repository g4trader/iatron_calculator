"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { addCustomerInternalNote, type CustomerType } from "@/lib/admin-customers";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

export async function addCustomerNoteAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.customers.write");
  const customerId = getString(formData, "customerId") ?? "";
  const customerType = getString(formData, "customerType") as CustomerType | null;

  if (!customerId || !customerType || !["individual", "institutional"].includes(customerType)) {
    redirect("/admin/customers?error=Cliente inválido para nota interna.");
  }

  try {
    await addCustomerInternalNote({
      admin,
      customerId,
      customerType,
      note: getString(formData, "note")
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao registrar nota interna.";
    redirect(`/admin/customers/${customerId}?error=${encodeURIComponent(message)}`);
  }

  revalidatePath(`/admin/customers/${customerId}`);
  redirect(`/admin/customers/${customerId}?message=Nota interna registrada com auditoria.`);
}
