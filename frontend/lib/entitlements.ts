import { LicenseStatus, SubscriptionOwnerType, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CommercialAccountType = "NONE" | "INDIVIDUAL" | "ORGANIZATION";

export type CommercialAccess = {
  accountType: CommercialAccountType;
  plan: string;
  status: string;
  isActive: boolean;
  billingCycle: string | null;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
  licenseStatus: string;
  organization: {
    id: string;
    name: string;
  } | null;
  organizationRole: string | null;
  seatsPurchased: number;
  seatsUsed: number;
};

export function isCommercialStatusActive(status?: string | null) {
  return status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.TRIALING || status === "active" || status === "trialing";
}

async function countUsedSeats(subscriptionId?: string | null, organizationId?: string | null) {
  if (!subscriptionId && !organizationId) return 0;
  return prisma.license.count({
    where: {
      status: LicenseStatus.ACTIVE,
      ...(subscriptionId ? { subscriptionId } : {}),
      ...(organizationId ? { organizationId } : {})
    }
  });
}

function emptyAccess(): CommercialAccess {
  return {
    accountType: "NONE",
    plan: "FREE",
    status: "INACTIVE",
    isActive: false,
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

export async function getUserCommercialAccess(userId: string): Promise<CommercialAccess> {
  const individualSubscription = await prisma.subscription.findFirst({
    where: {
      ownerType: SubscriptionOwnerType.USER,
      userId
    },
    orderBy: { updatedAt: "desc" }
  });

  if (individualSubscription) {
    const seatsUsed = await countUsedSeats(individualSubscription.id);
    return {
      accountType: "INDIVIDUAL",
      plan: individualSubscription.plan,
      status: individualSubscription.status,
      isActive: isCommercialStatusActive(individualSubscription.status),
      billingCycle: individualSubscription.billingCycle,
      currentPeriodEnd: individualSubscription.currentPeriodEnd,
      trialEndsAt: individualSubscription.trialEndsAt,
      licenseStatus: isCommercialStatusActive(individualSubscription.status) ? "ACTIVE" : "INACTIVE",
      organization: null,
      organizationRole: null,
      seatsPurchased: individualSubscription.seatsPurchased,
      seatsUsed
    };
  }

  const membership = await prisma.organizationMembership.findFirst({
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

  const organizationSubscription = membership?.organization.subscriptions[0];
  if (membership?.organization && organizationSubscription) {
    const [seatsUsed, assignedLicense] = await Promise.all([
      countUsedSeats(organizationSubscription.id, membership.organizationId),
      prisma.license.findFirst({
        where: {
          userId,
          organizationId: membership.organizationId,
          subscriptionId: organizationSubscription.id,
          status: LicenseStatus.ACTIVE
        }
      })
    ]);

    return {
      accountType: "ORGANIZATION",
      plan: organizationSubscription.plan,
      status: organizationSubscription.status,
      isActive: isCommercialStatusActive(organizationSubscription.status) && Boolean(assignedLicense),
      billingCycle: organizationSubscription.billingCycle,
      currentPeriodEnd: organizationSubscription.currentPeriodEnd,
      trialEndsAt: organizationSubscription.trialEndsAt,
      licenseStatus: assignedLicense?.status ?? "INACTIVE",
      organization: {
        id: membership.organization.id,
        name: membership.organization.name
      },
      organizationRole: membership.role,
      seatsPurchased: organizationSubscription.seatsPurchased,
      seatsUsed
    };
  }

  return emptyAccess();
}

export async function getOrganizationSeatSummary(organizationId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      organizationId,
      ownerType: SubscriptionOwnerType.ORGANIZATION
    },
    orderBy: { updatedAt: "desc" }
  });

  if (!subscription) {
    return { seatsPurchased: 0, seatsUsed: 0, availableSeats: 0 };
  }

  const seatsUsed = await countUsedSeats(subscription.id, organizationId);
  return {
    seatsPurchased: subscription.seatsPurchased,
    seatsUsed,
    availableSeats: Math.max(subscription.seatsPurchased - seatsUsed, 0)
  };
}
