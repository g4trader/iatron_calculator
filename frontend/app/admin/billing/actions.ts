"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin-permissions";
import {
  markBillingManualReview,
  reconcileAdminBillingSubscription,
  recordWebhookReprocessAttempt
} from "@/lib/admin-billing";
import { CRITICAL_ADMIN_ACTIONS, stepUpPasswordFromForm, validateAdminStepUp } from "@/lib/admin-step-up";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

function redirectBilling(params: Record<string, string>): never {
  const search = new URLSearchParams(params);
  redirect(`/admin/billing?${search.toString()}`);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Erro operacional de billing.";
}

export async function reconcileSubscriptionAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.billing.reconcile");

  try {
    await validateAdminStepUp({ admin, action: CRITICAL_ADMIN_ACTIONS.billingReconcile, password: stepUpPasswordFromForm(formData), resourceType: "subscription", resourceId: getString(formData, "subscriptionId") });
    await reconcileAdminBillingSubscription({
      admin,
      subscriptionId: getString(formData, "subscriptionId") ?? "",
      reason: getString(formData, "reason")
    });
  } catch (error) {
    redirectBilling({ error: errorMessage(error) });
  }

  revalidatePath("/admin/billing");
  redirectBilling({ message: "Reconcile executado a partir da Stripe." });
}

export async function markBillingReviewAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.billing.manage");

  try {
    await markBillingManualReview({
      admin,
      subscriptionId: getString(formData, "subscriptionId"),
      webhookEventId: getString(formData, "webhookEventId"),
      reason: getString(formData, "reason")
    });
  } catch (error) {
    redirectBilling({ error: errorMessage(error) });
  }

  revalidatePath("/admin/billing");
  redirectBilling({ message: "Caso marcado para análise manual." });
}

export async function requestWebhookReprocessAction(formData: FormData) {
  const admin = await requireAdminPermission("admin.billing.manage");

  try {
    await validateAdminStepUp({ admin, action: CRITICAL_ADMIN_ACTIONS.billingWebhookReprocess, password: stepUpPasswordFromForm(formData), resourceType: "stripe_webhook_event", resourceId: getString(formData, "webhookEventId") });
    await recordWebhookReprocessAttempt({
      admin,
      webhookEventId: getString(formData, "webhookEventId") ?? "",
      reason: getString(formData, "reason")
    });
  } catch (error) {
    redirectBilling({ error: errorMessage(error) });
  }

  revalidatePath("/admin/billing");
  redirectBilling({ message: "Tentativa de reprocessamento registrada para análise." });
}
