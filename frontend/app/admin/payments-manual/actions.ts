"use server";

import { ManualPaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-permissions";
import {
  AdminManualPaymentError,
  createManualPayment,
  releaseLicenseFromManualPayment,
  updateManualPaymentStatus
} from "@/lib/admin-manual-payments";
import { CRITICAL_ADMIN_ACTIONS, stepUpPasswordFromForm, validateAdminStepUp } from "@/lib/admin-step-up";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

function paymentsRedirect(params: Record<string, string>): never {
  const search = new URLSearchParams(params);
  redirect(`/admin/payments-manual?${search.toString()}`);
}

function detailRedirect(paymentId: string, params: Record<string, string>): never {
  const search = new URLSearchParams(params);
  redirect(`/admin/payments-manual/${paymentId}?${search.toString()}`);
}

function handlePaymentError(error: unknown, paymentId?: string | null): never {
  const message =
    error instanceof AdminManualPaymentError || error instanceof Error
      ? error.message
      : "Erro operacional de pagamento manual.";
  if (paymentId) detailRedirect(paymentId, { error: message });
  paymentsRedirect({ error: message });
}

export async function createManualPaymentAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.billing.manage");

  try {
    await createManualPayment({
      admin,
      userEmail: getString(formData, "userEmail"),
      userId: getString(formData, "userId"),
      organizationId: getString(formData, "organizationId"),
      method: getString(formData, "method"),
      amount: getString(formData, "amount"),
      paidAt: getString(formData, "paidAt"),
      proofReference: getString(formData, "proofReference"),
      externalReference: getString(formData, "externalReference"),
      reason: getString(formData, "reason"),
      internalNote: getString(formData, "internalNote")
    });
  } catch (error) {
    handlePaymentError(error);
  }

  revalidatePath("/admin/payments-manual");
  paymentsRedirect({ message: "Pagamento manual registrado como pendente." });
}

export async function updateManualPaymentStatusAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.billing.manage");
  const paymentId = getString(formData, "paymentId") ?? "";
  const status = getString(formData, "status") as ManualPaymentStatus | null;

  if (!isAllowedStatus(status)) paymentsRedirect({ error: "Status de pagamento inválido." });

  try {
    await validateAdminStepUp({
      admin,
      action: stepUpActionForStatus(status),
      password: stepUpPasswordFromForm(formData),
      resourceType: "manual_payment",
      resourceId: paymentId,
      metadata: { status }
    });
    await updateManualPaymentStatus({
      admin,
      paymentId,
      status,
      reason: getString(formData, "reason"),
      reconciliationReference: getString(formData, "reconciliationReference"),
      reconciliationNote: getString(formData, "reconciliationNote")
    });
  } catch (error) {
    handlePaymentError(error, paymentId);
  }

  revalidatePath("/admin/payments-manual");
  revalidatePath(`/admin/payments-manual/${paymentId}`);
  detailRedirect(paymentId, { message: "Status do pagamento atualizado." });
}

export async function releaseManualPaymentLicenseAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.billing.manage");
  const paymentId = getString(formData, "paymentId") ?? "";

  try {
    await validateAdminStepUp({
      admin,
      action: CRITICAL_ADMIN_ACTIONS.manualPaymentReleaseLicense,
      password: stepUpPasswordFromForm(formData),
      resourceType: "manual_payment",
      resourceId: paymentId
    });
    await releaseLicenseFromManualPayment({
      admin,
      paymentId,
      preset: getString(formData, "preset"),
      reason: getString(formData, "reason"),
      note: getString(formData, "note")
    });
  } catch (error) {
    handlePaymentError(error, paymentId);
  }

  revalidatePath("/admin/payments-manual");
  revalidatePath(`/admin/payments-manual/${paymentId}`);
  revalidatePath("/admin/licenses");
  detailRedirect(paymentId, { message: "Licença liberada e pagamento conciliado." });
}

function isAllowedStatus(status: ManualPaymentStatus | null): status is Extract<ManualPaymentStatus, "CONFIRMED" | "REJECTED" | "RECONCILED"> {
  return status === ManualPaymentStatus.CONFIRMED || status === ManualPaymentStatus.REJECTED || status === ManualPaymentStatus.RECONCILED;
}

function stepUpActionForStatus(status: Extract<ManualPaymentStatus, "CONFIRMED" | "REJECTED" | "RECONCILED">) {
  if (status === ManualPaymentStatus.CONFIRMED) return CRITICAL_ADMIN_ACTIONS.manualPaymentConfirm;
  if (status === ManualPaymentStatus.REJECTED) return CRITICAL_ADMIN_ACTIONS.manualPaymentReject;
  return CRITICAL_ADMIN_ACTIONS.manualPaymentReconcile;
}
