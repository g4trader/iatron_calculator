import { BillingIssueStatus, LicenseStatus, SubscriptionStatus, WebhookFailureStatus, type Prisma, type Subscription } from "@prisma/client";
import { recordAdminAuditEvent, type AdminUser } from "@/lib/admin-permissions";
import { syncStripeSubscription } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

export type BillingSource = "stripe" | "local cache" | "derived";
export type BillingRiskKind = "past_due" | "cancel_at_period_end" | "repeated_failures" | "orphan_subscription" | "billing_desync";

export type AdminBillingFilters = {
  q?: string;
  status?: SubscriptionStatus;
};

export function parseAdminBillingFilters(input?: Record<string, string | undefined>): AdminBillingFilters {
  return {
    q: input?.q?.trim() || undefined,
    status: input?.status && Object.values(SubscriptionStatus).includes(input.status as SubscriptionStatus) ? (input.status as SubscriptionStatus) : undefined
  };
}

export function sourceLabel(source: BillingSource) {
  return source;
}

const revenueRiskStatuses: SubscriptionStatus[] = [
  SubscriptionStatus.PAST_DUE,
  SubscriptionStatus.UNPAID,
  SubscriptionStatus.INCOMPLETE,
  SubscriptionStatus.CANCELED
];

export function isRevenueRiskStatus(status: SubscriptionStatus) {
  return revenueRiskStatuses.includes(status);
}

export function detectLocalBillingDivergences(subscription: Pick<Subscription, "id" | "status" | "stripeCustomerId" | "stripeSubscriptionId" | "userId" | "organizationId"> & {
  licenses: Array<{ status: LicenseStatus }>;
}) {
  const divergences: Array<{ id: string; kind: BillingRiskKind; severity: "warning" | "critical"; description: string; source: BillingSource }> = [];

  if (!subscription.stripeCustomerId || !subscription.stripeSubscriptionId) {
    divergences.push({
      id: `${subscription.id}:orphan`,
      kind: "orphan_subscription",
      severity: "warning",
      description: "Assinatura local sem customer/subscription Stripe completo.",
      source: "derived"
    });
  }

  const shouldHaveActiveLicense = subscription.status === SubscriptionStatus.ACTIVE || subscription.status === SubscriptionStatus.TRIALING;
  const hasActiveLicense = subscription.licenses.some((license) => license.status === LicenseStatus.ACTIVE);
  if (shouldHaveActiveLicense && !hasActiveLicense) {
    divergences.push({
      id: `${subscription.id}:license`,
      kind: "billing_desync",
      severity: "critical",
      description: "Assinatura ativa/trial sem licença ativa local.",
      source: "derived"
    });
  }

  return divergences;
}

function stripeDashboardUrl(path: string) {
  return `https://dashboard.stripe.com/${path}`;
}

function asStripeSubscription(value: unknown) {
  return value as Stripe.Subscription & { cancel_at_period_end?: boolean };
}

async function safelyListStripeData(filters: AdminBillingFilters) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      configured: false,
      invoices: [],
      paymentFailures: [],
      refunds: [],
      stripeSubscriptionById: new Map<string, Stripe.Subscription & { cancel_at_period_end?: boolean }>(),
      errors: ["Stripe secret ausente; exibindo somente cache local."]
    };
  }

  const errors: string[] = [];
  const customer = filters.q?.startsWith("cus_") ? filters.q : undefined;
  const [invoicesResult, refundsResult] = await Promise.allSettled([
    stripe.invoices.list({ limit: 10, ...(customer ? { customer } : {}) }),
    stripe.refunds.list({ limit: 10 })
  ]);

  const invoices = invoicesResult.status === "fulfilled" ? invoicesResult.value.data : [];
  const refunds = refundsResult.status === "fulfilled" ? refundsResult.value.data : [];
  if (invoicesResult.status === "rejected") errors.push("Falha ao consultar invoices na Stripe.");
  if (refundsResult.status === "rejected") errors.push("Falha ao consultar refunds na Stripe.");

  return {
    configured: true,
    invoices,
    paymentFailures: invoices.filter((invoice) => ["open", "uncollectible", "void"].includes(invoice.status ?? "")),
    refunds,
    stripeSubscriptionById: new Map<string, Stripe.Subscription & { cancel_at_period_end?: boolean }>(),
    errors
  };
}

export async function getAdminBillingDashboard(filters: AdminBillingFilters) {
  const subscriptionWhere: Prisma.SubscriptionWhereInput = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.q
      ? {
          OR: [
            { stripeCustomerId: { contains: filters.q, mode: "insensitive" } },
            { stripeSubscriptionId: { contains: filters.q, mode: "insensitive" } },
            { userId: filters.q },
            { organizationId: filters.q },
            { user: { is: { email: { contains: filters.q, mode: "insensitive" } } } },
            { organization: { is: { name: { contains: filters.q, mode: "insensitive" } } } }
          ]
        }
      : {})
  };

  const [subscriptions, webhookEvents, adminReviews, webhookFailures, billingIssues, stripeData] = await Promise.all([
    prisma.subscription.findMany({
      where: subscriptionWhere,
      orderBy: { updatedAt: "desc" },
      take: 80,
      include: { user: true, organization: true, licenses: true, planPrice: true }
    }),
    prisma.stripeWebhookEvent.findMany({ orderBy: { processedAt: "desc" }, take: 30 }),
    prisma.adminAuditEvent.findMany({
      where: { action: "admin.billing.manual_review_marked" },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { actor: true }
    }),
    prisma.webhookFailure.findMany({ where: { status: { in: [WebhookFailureStatus.OPEN, WebhookFailureStatus.RETRYING] } }, orderBy: { updatedAt: "desc" }, take: 20 }),
    prisma.billingIssue.findMany({ where: { status: { in: [BillingIssueStatus.OPEN, BillingIssueStatus.INVESTIGATING] } }, orderBy: { updatedAt: "desc" }, take: 20, include: { user: true, organization: true } }),
    safelyListStripeData(filters)
  ]);

  if (stripeData.configured) {
    const stripeSubscriptions = await Promise.allSettled(
      subscriptions
        .filter((subscription) => subscription.stripeSubscriptionId)
        .slice(0, 20)
        .map(async (subscription) => stripe.subscriptions.retrieve(subscription.stripeSubscriptionId as string))
    );
    stripeSubscriptions.forEach((result) => {
      if (result.status === "fulfilled") stripeData.stripeSubscriptionById.set(result.value.id, asStripeSubscription(result.value));
    });
  }

  const statusBreakdown = Object.values(SubscriptionStatus).map((status) => ({
    id: status,
    status,
    count: subscriptions.filter((subscription) => subscription.status === status).length,
    source: "local cache" as BillingSource
  }));

  const localDivergences = subscriptions.flatMap(detectLocalBillingDivergences);
  const stripeDivergences = subscriptions.flatMap((subscription) => {
    const stripeSubscription = subscription.stripeSubscriptionId ? stripeData.stripeSubscriptionById.get(subscription.stripeSubscriptionId) : null;
    if (!stripeSubscription) return [];
    const statusMismatch = stripeSubscription.status.toUpperCase() !== subscription.status;
    return statusMismatch
      ? [{
          id: `${subscription.id}:stripe-status`,
          kind: "billing_desync" as const,
          severity: "warning" as const,
          description: `Status local ${subscription.status}; Stripe ${stripeSubscription.status}.`,
          source: "stripe" as BillingSource
        }]
      : [];
  });

  const risks = [
    ...subscriptions
      .filter((subscription) => isRevenueRiskStatus(subscription.status))
      .map((subscription) => ({
        id: `${subscription.id}:status`,
        kind: subscription.status === SubscriptionStatus.PAST_DUE ? "past_due" as const : "billing_desync" as const,
        severity: subscription.status === SubscriptionStatus.PAST_DUE ? "critical" as const : "warning" as const,
        description: `${subscription.user?.email ?? subscription.organization?.name ?? subscription.id} está ${subscription.status}.`,
        source: "local cache" as BillingSource
      })),
    ...subscriptions
      .filter((subscription) => subscription.stripeSubscriptionId && stripeData.stripeSubscriptionById.get(subscription.stripeSubscriptionId)?.cancel_at_period_end)
      .map((subscription) => ({
        id: `${subscription.id}:cancel_at_period_end`,
        kind: "cancel_at_period_end" as const,
        severity: "warning" as const,
        description: `${subscription.user?.email ?? subscription.organization?.name ?? subscription.id} com cancelamento ao fim do período.`,
        source: "stripe" as BillingSource
      })),
    ...localDivergences,
    ...stripeDivergences
  ];

  return {
    subscriptions,
    statusBreakdown,
    invoices: stripeData.invoices,
    paymentFailures: stripeData.paymentFailures,
    refunds: stripeData.refunds,
    webhookEvents,
    reviews: adminReviews,
    webhookFailures,
    billingIssues,
    divergences: [...localDivergences, ...stripeDivergences],
    risks,
    stripeConfigured: stripeData.configured,
    stripeErrors: stripeData.errors
  };
}

export async function reconcileAdminBillingSubscription(input: { admin: AdminUser; subscriptionId: string; reason?: string | null }) {
  const reason = input.reason?.trim();
  if (!reason || reason.length < 8) throw new Error("Informe um motivo com pelo menos 8 caracteres.");

  const subscription = await prisma.subscription.findUnique({ where: { id: input.subscriptionId } });
  if (!subscription?.stripeSubscriptionId) throw new Error("Assinatura sem stripeSubscriptionId para reconcile.");

  const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId, { expand: ["items.data.price"] });
  const synced = await syncStripeSubscription(stripeSubscription);

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.billing.reconcile_executed",
    resourceType: "subscription",
    resourceId: subscription.id,
    organizationId: subscription.organizationId,
    targetUserId: subscription.userId,
    outcome: "success",
    metadata: { reason, stripeSubscriptionId: subscription.stripeSubscriptionId, syncedSubscriptionId: synced?.id ?? null }
  });

  return synced;
}

export async function markBillingManualReview(input: { admin: AdminUser; subscriptionId?: string | null; webhookEventId?: string | null; reason?: string | null }) {
  const reason = input.reason?.trim();
  if (!reason || reason.length < 8) throw new Error("Informe um motivo com pelo menos 8 caracteres.");

  const subscription = input.subscriptionId ? await prisma.subscription.findUnique({ where: { id: input.subscriptionId } }) : null;
  await prisma.billingIssue.create({
    data: {
      userId: subscription?.userId ?? null,
      organizationId: subscription?.organizationId ?? null,
      type: input.subscriptionId ? "manual_review_subscription" : "manual_review_webhook",
      severity: "warning",
      status: BillingIssueStatus.OPEN,
      source: "admin_billing",
      metadata: { reason, subscriptionId: input.subscriptionId ?? null, webhookEventId: input.webhookEventId ?? null }
    }
  }).catch(() => null);

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.billing.manual_review_marked",
    resourceType: input.subscriptionId ? "subscription" : "stripe_webhook_event",
    resourceId: input.subscriptionId ?? input.webhookEventId ?? null,
    outcome: "success",
    metadata: { reason }
  });
}

export async function recordWebhookReprocessAttempt(input: { admin: AdminUser; webhookEventId: string; reason?: string | null }) {
  const reason = input.reason?.trim();
  if (!reason || reason.length < 8) throw new Error("Informe um motivo com pelo menos 8 caracteres.");

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.billing.webhook_reprocess_requested",
    resourceType: "stripe_webhook_event",
    resourceId: input.webhookEventId,
    outcome: "failure",
    metadata: {
      reason,
      blocked: true,
      explanation: "Reprocessamento automático indisponível porque o payload raw do webhook não é persistido."
    }
  });
}

export function stripeCustomerDashboardUrl(customerId?: string | null) {
  return customerId ? stripeDashboardUrl(`customers/${customerId}`) : null;
}

export function stripeSubscriptionDashboardUrl(subscriptionId?: string | null) {
  return subscriptionId ? stripeDashboardUrl(`subscriptions/${subscriptionId}`) : null;
}
