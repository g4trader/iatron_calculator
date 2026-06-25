import {
  BillingCycle,
  LicenseOrigin,
  LicenseStatus,
  PlanAudience,
  SubscriptionOwnerType,
  SubscriptionStatus
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stripe, getAppUrl } from "@/lib/stripe";
import { ORGANIZATION_ADMIN_ROLES, OrganizationAccessError, requireOrganizationRole } from "@/lib/organization-authz";
import { auditBillingEvent } from "@/lib/billing-audit";
import { trackFunnelEvent } from "@/lib/funnel";
import type Stripe from "stripe";

export type CheckoutOwnerType = "USER" | "ORGANIZATION";

export type CheckoutInput = {
  user: { id: string; email?: string | null; name?: string | null };
  ownerType: CheckoutOwnerType;
  planPriceId: string;
  organizationId?: string;
  seats?: number;
};

export type PortalInput = {
  userId: string;
  ownerType: CheckoutOwnerType;
  organizationId?: string;
};

export function minimumInstitutionalSeats(planMinSeats: number, organizationMinimumSeats: number) {
  return Math.max(3, planMinSeats, organizationMinimumSeats);
}

export function normalizeStripeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  if (status === "active") return SubscriptionStatus.ACTIVE;
  if (status === "trialing") return SubscriptionStatus.TRIALING;
  if (status === "incomplete" || status === "incomplete_expired") return SubscriptionStatus.INCOMPLETE;
  if (status === "past_due") return SubscriptionStatus.PAST_DUE;
  if (status === "canceled") return SubscriptionStatus.CANCELED;
  if (status === "unpaid") return SubscriptionStatus.UNPAID;
  if (status === "paused") return SubscriptionStatus.PAUSED;
  return SubscriptionStatus.INACTIVE;
}

export function isStripeStatusAccessActive(status: SubscriptionStatus) {
  return status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIALING;
}

export function fallbackStripePriceEnvName(planCode: string, billingCycle: BillingCycle) {
  return `STRIPE_PRICE_${planCode}_${billingCycle}`;
}

export function isPrismaUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002";
}

export async function resolvePlanPrice(planPriceId: string) {
  const planPrice = await prisma.planPrice.findUnique({
    where: { id: planPriceId },
    include: { planCatalog: true }
  });
  if (!planPrice || !planPrice.isActive || !planPrice.planCatalog.isActive) {
    throw new OrganizationAccessError("Preço indisponível.", 400, "PLAN_PRICE_NOT_AVAILABLE");
  }

  const fallbackEnv = fallbackStripePriceEnvName(planPrice.planCatalog.code, planPrice.billingCycle);
  const stripePriceId = planPrice.stripePriceId ?? process.env[fallbackEnv];
  if (!stripePriceId) {
    throw new OrganizationAccessError("Preço Stripe não configurado.", 400, "STRIPE_PRICE_NOT_CONFIGURED");
  }

  return { planPrice, stripePriceId };
}

async function getOrCreateCustomerForSubscription(input: {
  existingCustomerId?: string | null;
  email?: string | null;
  name?: string | null;
  metadata: Record<string, string>;
}) {
  if (input.existingCustomerId) return input.existingCustomerId;
  const customer = await stripe.customers.create({
    email: input.email ?? undefined,
    name: input.name ?? undefined,
    metadata: input.metadata
  });
  return customer.id;
}

export async function createBillingCheckoutSession(input: CheckoutInput) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new OrganizationAccessError("Stripe não configurado.", 400, "STRIPE_NOT_CONFIGURED");
  }

  const { planPrice, stripePriceId } = await resolvePlanPrice(input.planPriceId);
  const ownerType = input.ownerType === "ORGANIZATION" ? SubscriptionOwnerType.ORGANIZATION : SubscriptionOwnerType.USER;

  if (ownerType === SubscriptionOwnerType.USER && planPrice.planCatalog.audience !== PlanAudience.INDIVIDUAL) {
    throw new OrganizationAccessError("Preço inválido para assinatura individual.", 400, "INVALID_PLAN_AUDIENCE");
  }

  if (ownerType === SubscriptionOwnerType.ORGANIZATION && planPrice.planCatalog.audience !== PlanAudience.INSTITUTIONAL) {
    throw new OrganizationAccessError("Preço inválido para assinatura institucional.", 400, "INVALID_PLAN_AUDIENCE");
  }

  let organizationName: string | undefined;
  let organizationMinimumSeats = 3;
  if (ownerType === SubscriptionOwnerType.ORGANIZATION) {
    if (!input.organizationId) throw new OrganizationAccessError("Organização obrigatória.", 400, "ORGANIZATION_REQUIRED");
    const membership = await requireOrganizationRole(input.user.id, input.organizationId, ORGANIZATION_ADMIN_ROLES);
    organizationName = membership.organization.name;
    organizationMinimumSeats = membership.organization.minimumSeats;
  }

  const seats = ownerType === SubscriptionOwnerType.ORGANIZATION
    ? Math.max(input.seats ?? 0, minimumInstitutionalSeats(planPrice.planCatalog.minSeats, organizationMinimumSeats))
    : 1;

  if (ownerType === SubscriptionOwnerType.ORGANIZATION && (input.seats ?? 0) < seats) {
    throw new OrganizationAccessError(`Assinatura institucional exige pelo menos ${seats} licenças.`, 400, "INVALID_SEAT_QUANTITY");
  }

  const existingSubscription = await prisma.subscription.findFirst({
    where: ownerType === SubscriptionOwnerType.USER
      ? { ownerType, userId: input.user.id }
      : { ownerType, organizationId: input.organizationId },
    orderBy: { updatedAt: "desc" }
  });

  const customerId = await getOrCreateCustomerForSubscription({
    existingCustomerId: existingSubscription?.stripeCustomerId,
    email: input.user.email,
    name: ownerType === SubscriptionOwnerType.ORGANIZATION ? organizationName : input.user.name,
    metadata: {
      ownerType,
      userId: input.user.id,
      ...(input.organizationId ? { organizationId: input.organizationId } : {})
    }
  });

  const metadata = {
    ownerType,
    userId: input.user.id,
    planPriceId: planPrice.id,
    seats: String(seats),
    ...(input.organizationId ? { organizationId: input.organizationId } : {})
  };

  await prisma.subscription.upsert({
    where: existingSubscription?.id ? { id: existingSubscription.id } : { stripeCustomerId: customerId },
    create: {
      ownerType,
      userId: ownerType === SubscriptionOwnerType.USER ? input.user.id : null,
      organizationId: ownerType === SubscriptionOwnerType.ORGANIZATION ? input.organizationId : null,
      stripeCustomerId: customerId,
      status: SubscriptionStatus.INCOMPLETE,
      plan: planPrice.planCatalog.code,
      planCatalogId: planPrice.planCatalogId,
      planPriceId: planPrice.id,
      billingCycle: planPrice.billingCycle,
      seatsPurchased: seats
    },
    update: {
      stripeCustomerId: customerId,
      plan: planPrice.planCatalog.code,
      planCatalogId: planPrice.planCatalogId,
      planPriceId: planPrice.id,
      billingCycle: planPrice.billingCycle,
      seatsPurchased: seats
    }
  });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: stripePriceId, quantity: seats }],
    success_url: `${getAppUrl()}/checkout/return?status=success`,
    cancel_url: `${getAppUrl()}/checkout/return?status=cancelled`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata
    },
    metadata
  });

  await trackFunnelEvent({
    step: "checkout_started",
    userId: input.user.id,
    source: "stripe_checkout",
    scope: session.id,
    metadata: { ownerType, organizationId: input.organizationId ?? null, planPriceId: planPrice.id, billingCycle: planPrice.billingCycle, seats }
  }).catch(() => null);
  auditBillingEvent("checkout_session_created", { ownerType, userId: input.user.id, organizationId: input.organizationId, planPriceId: planPrice.id, seats });
  return session;
}

export async function createBillingPortalSession(input: PortalInput) {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new OrganizationAccessError("Stripe não configurado.", 400, "STRIPE_NOT_CONFIGURED");
  }

  if (input.ownerType === "ORGANIZATION") {
    if (!input.organizationId) throw new OrganizationAccessError("Organização obrigatória.", 400, "ORGANIZATION_REQUIRED");
    await requireOrganizationRole(input.userId, input.organizationId, ORGANIZATION_ADMIN_ROLES);
  }

  const ownerType = input.ownerType === "ORGANIZATION" ? SubscriptionOwnerType.ORGANIZATION : SubscriptionOwnerType.USER;
  const subscription = await prisma.subscription.findFirst({
    where: ownerType === SubscriptionOwnerType.USER
      ? { ownerType, userId: input.userId, stripeCustomerId: { not: null } }
      : { ownerType, organizationId: input.organizationId, stripeCustomerId: { not: null } },
    orderBy: { updatedAt: "desc" }
  });

  if (!subscription?.stripeCustomerId) {
    throw new OrganizationAccessError("Cliente Stripe não encontrado.", 400, "STRIPE_CUSTOMER_NOT_FOUND");
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${getAppUrl()}/billing`
  });

  auditBillingEvent("billing_portal_created", { ownerType, userId: input.userId, organizationId: input.organizationId });
  return portal;
}

function unixToDate(value?: number | null) {
  return value ? new Date(value * 1000) : null;
}

function getSubscriptionPeriod(subscription: Stripe.Subscription) {
  const typed = subscription as Stripe.Subscription & {
    current_period_end?: number;
    trial_end?: number | null;
  };
  return {
    currentPeriodEnd: unixToDate(typed.current_period_end),
    trialEndsAt: unixToDate(typed.trial_end)
  };
}

export async function syncStripeSubscription(subscription: Stripe.Subscription, fallbackMetadata: Record<string, string | undefined> = {}) {
  const customerId = subscription.customer.toString();
  const priceId = subscription.items.data[0]?.price.id;
  const quantity = subscription.items.data[0]?.quantity ?? Number(subscription.metadata.seats ?? fallbackMetadata.seats ?? 1);
  const planPrice = priceId
    ? await prisma.planPrice.findFirst({ where: { stripePriceId: priceId }, include: { planCatalog: true } })
    : null;
  const metadata = { ...fallbackMetadata, ...subscription.metadata };
  const ownerType = metadata.ownerType === "ORGANIZATION" ? SubscriptionOwnerType.ORGANIZATION : SubscriptionOwnerType.USER;
  const userId = metadata.userId;
  const organizationId = metadata.organizationId;
  const status = normalizeStripeSubscriptionStatus(subscription.status);
  const period = getSubscriptionPeriod(subscription);

  const existing = await prisma.subscription.findFirst({
    where: {
      OR: [
        { stripeSubscriptionId: subscription.id },
        { stripeCustomerId: customerId },
        ...(ownerType === SubscriptionOwnerType.USER && userId ? [{ ownerType, userId }] : []),
        ...(ownerType === SubscriptionOwnerType.ORGANIZATION && organizationId ? [{ ownerType, organizationId }] : [])
      ]
    }
  });

  if (ownerType === SubscriptionOwnerType.USER && !userId && !existing?.userId) return null;
  if (ownerType === SubscriptionOwnerType.ORGANIZATION && !organizationId && !existing?.organizationId) return null;

  const synced = await prisma.subscription.upsert({
    where: existing?.id ? { id: existing.id } : { stripeSubscriptionId: subscription.id },
    create: {
      ownerType,
      userId: ownerType === SubscriptionOwnerType.USER ? userId ?? existing?.userId ?? null : null,
      organizationId: ownerType === SubscriptionOwnerType.ORGANIZATION ? organizationId ?? existing?.organizationId ?? null : null,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      status,
      plan: planPrice?.planCatalog.code ?? existing?.plan ?? "FREE",
      planCatalogId: planPrice?.planCatalogId ?? existing?.planCatalogId ?? null,
      planPriceId: planPrice?.id ?? existing?.planPriceId ?? null,
      billingCycle: planPrice?.billingCycle ?? existing?.billingCycle ?? BillingCycle.MONTHLY,
      seatsPurchased: ownerType === SubscriptionOwnerType.ORGANIZATION ? Math.max(quantity, 3) : 1,
      currentPeriodEnd: period.currentPeriodEnd,
      trialEndsAt: period.trialEndsAt
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      status,
      plan: planPrice?.planCatalog.code ?? existing?.plan,
      planCatalogId: planPrice?.planCatalogId ?? existing?.planCatalogId,
      planPriceId: planPrice?.id ?? existing?.planPriceId,
      billingCycle: planPrice?.billingCycle ?? existing?.billingCycle,
      seatsPurchased: ownerType === SubscriptionOwnerType.ORGANIZATION ? Math.max(quantity, 3) : 1,
      currentPeriodEnd: period.currentPeriodEnd,
      trialEndsAt: period.trialEndsAt
    }
  });

  await syncLicenseForSubscription(synced.id);
  if (isStripeStatusAccessActive(status)) {
    await trackFunnelEvent({
      step: "license_activated",
      userId: synced.userId,
      source: "stripe_webhook",
      scope: synced.id,
      metadata: { subscriptionId: synced.id, stripeSubscriptionId: subscription.id, ownerType, organizationId: synced.organizationId }
    }).catch(() => null);
  }
  auditBillingEvent("subscription_synced", { subscriptionId: synced.id, stripeSubscriptionId: subscription.id, ownerType, status });
  return synced;
}

export async function syncLicenseForSubscription(subscriptionId: string) {
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) return;

  if (subscription.ownerType === SubscriptionOwnerType.USER && subscription.userId) {
    if (isStripeStatusAccessActive(subscription.status)) {
      const existingLicense = await prisma.license.findFirst({ where: { subscriptionId, userId: subscription.userId } });
      if (existingLicense) {
        await prisma.license.update({
          where: { id: existingLicense.id },
          data: {
            status: LicenseStatus.ACTIVE,
            endsAt: subscription.currentPeriodEnd,
            revokedAt: null
          }
        });
      } else {
        await prisma.license.create({
          data: {
            subscriptionId,
            userId: subscription.userId,
            status: LicenseStatus.ACTIVE,
            origin: LicenseOrigin.BILLING,
            startsAt: new Date(),
            endsAt: subscription.currentPeriodEnd,
            assignedAt: new Date()
          }
        });
      }
    } else {
      await prisma.license.updateMany({
        where: { subscriptionId, userId: subscription.userId, status: LicenseStatus.ACTIVE },
        data: { status: LicenseStatus.INACTIVE, revokedAt: new Date(), endsAt: subscription.currentPeriodEnd ?? new Date() }
      });
    }
    auditBillingEvent("license_synced", { subscriptionId, ownerType: "USER", userId: subscription.userId });
  }
}

export async function recordStripeWebhookEvent(event: Stripe.Event) {
  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { stripeEventId: event.id }
  });
  if (existing) {
    auditBillingEvent("stripe_webhook_duplicate", { stripeEventId: event.id, type: event.type });
    return { duplicate: true };
  }

  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type
      }
    });
    return { duplicate: false };
  } catch (error) {
    if (!isPrismaUniqueConstraintError(error)) throw error;
    auditBillingEvent("stripe_webhook_duplicate", { stripeEventId: event.id, type: event.type });
    return { duplicate: true };
  }
}
