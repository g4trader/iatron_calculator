import { cache } from "react";
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

// Request-scoped deduplication only: every new request revalidates the session.
async function loadCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  // Both reads are independent; never return user data until validation succeeds.
  const [validSession, user] = await Promise.all([
    validateCurrentUserSession(session.user.id, session.user.sessionId).catch(() => null),
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscriptions: { orderBy: { updatedAt: "desc" }, take: 1 } }
    })
  ]);
  return validSession ? user : null;
}

// Next RSC provides cache; standalone React 18 operational scripts do not.
// Outside RSC, keep ordinary fresh reads instead of any process-wide cache.
export const getCurrentUser = typeof cache === "function" ? cache(loadCurrentUser) : loadCurrentUser;

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
