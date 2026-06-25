import { SecurityEventType } from "@prisma/client";
import { syncLicenseForSubscription, syncStripeSubscription } from "@/lib/billing";
import { auditBillingEvent } from "@/lib/billing-audit";
import { prisma } from "@/lib/prisma";
import { auditSecurityEvent } from "@/lib/security-audit";
import { stripe } from "@/lib/stripe";

export async function reconcileBillingState(limit = 100) {
  const subscriptions = await prisma.subscription.findMany({
    where: { stripeSubscriptionId: { not: null } },
    orderBy: { updatedAt: "asc" },
    take: limit
  });

  let synced = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      if (subscription.stripeSubscriptionId) {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId, { expand: ["items.data.price"] });
        await syncStripeSubscription(stripeSubscription);
      } else {
        await syncLicenseForSubscription(subscription.id);
      }
      synced += 1;
    } catch (error) {
      failed += 1;
      auditBillingEvent("billing_authorization_denied", {
        subscriptionId: subscription.id,
        reason: "reconciliation_failed"
      });
      await auditSecurityEvent({
        userId: subscription.userId,
        type: SecurityEventType.BILLING_RECONCILED,
        severity: "warning",
        metadata: {
          subscriptionId: subscription.id,
          failed: true,
          error: error instanceof Error ? error.message : "unknown"
        }
      });
    }
  }

  await auditSecurityEvent({
    type: SecurityEventType.BILLING_RECONCILED,
    metadata: { checked: subscriptions.length, synced, failed }
  });

  return { checked: subscriptions.length, synced, failed };
}
