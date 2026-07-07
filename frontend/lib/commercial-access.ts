import { LicenseStatus, SubscriptionOwnerType, SubscriptionStatus, type BillingCycle, type OrganizationRole, type Plan } from "@prisma/client";
import { auditCommercialEvent } from "@/lib/commercial-audit";
import { prisma } from "@/lib/prisma";

export type CommercialFeature = "dashboard" | "calculator_complete" | "calculator_pcr" | "calculation_history" | "organization";

export type CommercialAccountType = "NONE" | "INDIVIDUAL" | "ORGANIZATION";

export type CommercialBlockReason =
  | "NO_SUBSCRIPTION"
  | "PAYMENT_REQUIRED"
  | "SUBSCRIPTION_CANCELED"
  | "SUBSCRIPTION_EXPIRED"
  | "SUBSCRIPTION_INACTIVE"
  | "NO_ORGANIZATION"
  | "NO_ORGANIZATION_SUBSCRIPTION"
  | "NO_ORGANIZATION_LICENSE"
  | "LICENSE_INACTIVE";

export type CommercialEntitlement = {
  hasAccess: boolean;
  accountType: CommercialAccountType;
  blockReason: CommercialBlockReason | null;
  plan: Plan | "FREE";
  status: SubscriptionStatus | "INACTIVE";
  billingCycle: BillingCycle | null;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  licenseStatus: LicenseStatus | "INACTIVE";
  organization: {
    id: string;
    name: string;
  } | null;
  organizationRole: OrganizationRole | null;
  seatsPurchased: number;
  seatsUsed: number;
};

export class CommercialAccessError extends Error {
  status: number;
  code: CommercialBlockReason;
  entitlement: CommercialEntitlement;

  constructor(entitlement: CommercialEntitlement) {
    super("Acesso comercial insuficiente.");
    this.status = entitlement.blockReason === "PAYMENT_REQUIRED" ? 402 : 403;
    this.code = entitlement.blockReason ?? "NO_SUBSCRIPTION";
    this.entitlement = entitlement;
  }
}

type SubscriptionLike = {
  status: SubscriptionStatus | string | null;
  plan: Plan;
  billingCycle: BillingCycle;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  seatsPurchased: number;
};

type InstitutionalLike = {
  subscription: SubscriptionLike | null;
  licenseStatus?: LicenseStatus | string | null;
  organization?: { id: string; name: string } | null;
  organizationRole?: OrganizationRole | null;
  seatsUsed?: number;
};

export function isCommercialSubscriptionAllowed(status?: string | null) {
  return status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIALING || status === "active" || status === "trialing";
}

export function isCommercialLicenseAllowed(status?: string | null) {
  return status === LicenseStatus.ACTIVE;
}

export function getCommercialBlockReasonForStatus(status?: string | null): CommercialBlockReason {
  if (!status || status === SubscriptionStatus.INACTIVE) return "SUBSCRIPTION_INACTIVE";
  if (status === SubscriptionStatus.PAST_DUE || status === SubscriptionStatus.UNPAID || status === SubscriptionStatus.INCOMPLETE || status === SubscriptionStatus.PAUSED) {
    return "PAYMENT_REQUIRED";
  }
  if (status === SubscriptionStatus.CANCELED) return "SUBSCRIPTION_CANCELED";
  return "SUBSCRIPTION_EXPIRED";
}

function emptyEntitlement(reason: CommercialBlockReason = "NO_SUBSCRIPTION"): CommercialEntitlement {
  return {
    hasAccess: false,
    accountType: "NONE",
    blockReason: reason,
    plan: "FREE",
    status: "INACTIVE",
    billingCycle: null,
    currentPeriodEnd: null,
    trialEndsAt: null,
    licenseStatus: "INACTIVE",
    organization: null,
    organizationRole: null,
    seatsPurchased: 0,
    seatsUsed: 0
  };
}

export function assessIndividualAccess(subscription: SubscriptionLike | null): CommercialEntitlement {
  if (!subscription) return emptyEntitlement("NO_SUBSCRIPTION");
  const hasAccess = isCommercialSubscriptionAllowed(subscription.status);
  return {
    hasAccess,
    accountType: "INDIVIDUAL",
    blockReason: hasAccess ? null : getCommercialBlockReasonForStatus(subscription.status),
    plan: subscription.plan,
    status: subscription.status as SubscriptionStatus,
    billingCycle: subscription.billingCycle,
    currentPeriodEnd: subscription.currentPeriodEnd,
    trialEndsAt: subscription.trialEndsAt,
    licenseStatus: hasAccess ? LicenseStatus.ACTIVE : "INACTIVE",
    organization: null,
    organizationRole: null,
    seatsPurchased: subscription.seatsPurchased,
    seatsUsed: hasAccess ? 1 : 0
  };
}

export function assessInstitutionalAccess(input: InstitutionalLike): CommercialEntitlement {
  if (!input.organization) return emptyEntitlement("NO_ORGANIZATION");
  if (!input.subscription) {
    return {
      ...emptyEntitlement("NO_ORGANIZATION_SUBSCRIPTION"),
      accountType: "ORGANIZATION",
      organization: input.organization,
      organizationRole: input.organizationRole ?? null
    };
  }

  const subscriptionAllowed = isCommercialSubscriptionAllowed(input.subscription.status);
  const licenseAllowed = isCommercialLicenseAllowed(input.licenseStatus);
  const hasAccess = subscriptionAllowed && licenseAllowed;
  const blockReason = subscriptionAllowed
    ? licenseAllowed
      ? null
      : input.licenseStatus
        ? "LICENSE_INACTIVE"
        : "NO_ORGANIZATION_LICENSE"
    : getCommercialBlockReasonForStatus(input.subscription.status);

  return {
    hasAccess,
    accountType: "ORGANIZATION",
    blockReason,
    plan: input.subscription.plan,
    status: input.subscription.status as SubscriptionStatus,
    billingCycle: input.subscription.billingCycle,
    currentPeriodEnd: input.subscription.currentPeriodEnd,
    trialEndsAt: input.subscription.trialEndsAt,
    licenseStatus: (input.licenseStatus as LicenseStatus | undefined) ?? "INACTIVE",
    organization: input.organization,
    organizationRole: input.organizationRole ?? null,
    seatsPurchased: input.subscription.seatsPurchased,
    seatsUsed: input.seatsUsed ?? 0
  };
}

async function countActiveLicenses(subscriptionId?: string | null, organizationId?: string | null) {
  if (!subscriptionId && !organizationId) return 0;
  return prisma.license.count({
    where: {
      status: LicenseStatus.ACTIVE,
      ...(subscriptionId ? { subscriptionId } : {}),
      ...(organizationId ? { organizationId } : {})
    }
  });
}

function denialPriority(entitlement: CommercialEntitlement) {
  const order: Record<CommercialBlockReason, number> = {
    PAYMENT_REQUIRED: 1,
    NO_ORGANIZATION_LICENSE: 2,
    LICENSE_INACTIVE: 3,
    NO_ORGANIZATION_SUBSCRIPTION: 4,
    SUBSCRIPTION_CANCELED: 5,
    SUBSCRIPTION_EXPIRED: 6,
    SUBSCRIPTION_INACTIVE: 7,
    NO_ORGANIZATION: 8,
    NO_SUBSCRIPTION: 9
  };
  return entitlement.blockReason ? order[entitlement.blockReason] : 0;
}

export async function getCommercialEntitlement(userId: string): Promise<CommercialEntitlement> {
  const individualSubscription = await prisma.subscription.findFirst({
    where: {
      ownerType: SubscriptionOwnerType.USER,
      userId
    },
    orderBy: { updatedAt: "desc" }
  });

  const candidates: CommercialEntitlement[] = [];
  if (individualSubscription) {
    const individualAccess = assessIndividualAccess(individualSubscription);
    if (individualAccess.hasAccess) return individualAccess;
    candidates.push(individualAccess);
  }

  const memberships = await prisma.organizationMembership.findMany({
    where: {
      userId,
      removedAt: null
    },
    orderBy: { updatedAt: "desc" },
    include: {
      organization: {
        include: {
          subscriptions: {
            where: { ownerType: SubscriptionOwnerType.ORGANIZATION },
            orderBy: { updatedAt: "desc" },
            take: 1
          }
        }
      }
    }
  });

  for (const membership of memberships) {
    const subscription = membership.organization.subscriptions[0] ?? null;
    const [seatsUsed, assignedLicense] = await Promise.all([
      countActiveLicenses(subscription?.id, membership.organizationId),
      subscription
        ? prisma.license.findFirst({
            where: {
              userId,
              organizationId: membership.organizationId,
              subscriptionId: subscription.id,
              status: LicenseStatus.ACTIVE
            }
          })
        : Promise.resolve(null)
    ]);

    candidates.push(
      assessInstitutionalAccess({
        subscription,
        licenseStatus: assignedLicense?.status ?? null,
        organization: {
          id: membership.organization.id,
          name: membership.organization.name
        },
        organizationRole: membership.role,
        seatsUsed
      })
    );
  }

  const allowed = candidates.find((candidate) => candidate.hasAccess);
  if (allowed) return allowed;
  if (candidates.length === 0) return emptyEntitlement("NO_SUBSCRIPTION");
  return candidates.sort((a, b) => denialPriority(a) - denialPriority(b))[0];
}

export async function requirePremiumAccess(userId: string, feature: CommercialFeature) {
  const entitlement = await getCommercialEntitlement(userId);
  if (!entitlement.hasAccess) {
    auditCommercialEvent("commercial_access_denied", {
      userId,
      feature,
      reason: entitlement.blockReason ?? undefined,
      accountType: entitlement.accountType,
      status: entitlement.status,
      organizationId: entitlement.organization?.id
    });
    throw new CommercialAccessError(entitlement);
  }
  return entitlement;
}
