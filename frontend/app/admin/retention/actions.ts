"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { runRetentionPolicy } from "@/lib/admin-retention";
import { CRITICAL_ADMIN_ACTIONS, stepUpPasswordFromForm, validateAdminStepUp } from "@/lib/admin-step-up";

export async function runRetentionPolicyAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.contingency.manage");
  const policyId = String(formData.get("policyId") ?? "");
  const execute = formData.get("execute") === "true";
  let destination = "/admin/retention?message=Retenção executada";
  try {
    if (execute) {
      await validateAdminStepUp({
        admin,
        action: CRITICAL_ADMIN_ACTIONS.contingency,
        password: stepUpPasswordFromForm(formData),
        resourceType: "retention_policy",
        resourceId: policyId,
        metadata: { execute }
      });
    }
    await runRetentionPolicy({ admin, policyId, execute });
    revalidatePath("/admin/retention");
  } catch (error) {
    destination = `/admin/retention?error=${encodeURIComponent(error instanceof Error ? error.message : "Falha ao executar retenção")}`;
  }
  redirect(destination);
}
