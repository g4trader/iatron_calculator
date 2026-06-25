import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getCommercialEntitlement, requirePremiumAccess } from "@/lib/commercial-access";
import { isCommercialStatusActive } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { validateCurrentUserSession } from "@/lib/session-control";

export type SubscriptionAccess = {
  status: string;
  plan: string;
  isActive: boolean;
  currentPeriodEnd: Date | null;
  trialEndsAt: Date | null;
};

export function isSubscriptionActive(status?: string | null) {
  return isCommercialStatusActive(status);
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const validSession = await validateCurrentUserSession(session.user.id, session.user.sessionId).catch(() => null);
  if (!validSession) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscriptions: {
        orderBy: { updatedAt: "desc" },
        take: 1
      }
    }
  });
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionAccess> {
  const access = await getCommercialEntitlement(userId);

  return {
    status: access.status,
    plan: access.plan,
    isActive: access.hasAccess,
    currentPeriodEnd: access.currentPeriodEnd,
    trialEndsAt: access.trialEndsAt
  };
}

export async function requireActiveSubscription() {
  const user = await requireAuth();
  const entitlement = await requirePremiumAccess(user.id, "dashboard").catch(() => null);
  if (!entitlement) redirect("/checkout");
  return {
    user,
    subscription: {
      status: entitlement.status,
      plan: entitlement.plan,
      isActive: entitlement.hasAccess,
      currentPeriodEnd: entitlement.currentPeriodEnd,
      trialEndsAt: entitlement.trialEndsAt
    }
  };
}
