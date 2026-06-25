import { unstable_cache } from "next/cache";
import { BillingCycle, LicenseStatus, OperationalEventStatus, SubscriptionOwnerType, SubscriptionStatus, type Subscription } from "@prisma/client";
import {
  calculateCustomerChurn,
  calculateRevenueChurn,
  formatCurrencyFromCents,
  getMonthlyRevenueCents,
  getPeriodStart,
  sumRevenueCents
} from "@/lib/admin-sales";
import { prisma } from "@/lib/prisma";

type ExecutiveSubscription = Pick<
  Subscription,
  "id" | "status" | "plan" | "billingCycle" | "ownerType" | "seatsPurchased" | "createdAt" | "updatedAt" | "userId" | "organizationId"
> & {
  user: { email: string | null; name: string | null } | null;
  organization: { name: string } | null;
  planPrice: { amountCents: number | null; intervalCount: number; billingCycle: BillingCycle } | null;
  licenses: Array<{ id: string; status: LicenseStatus }>;
};

function percent(value: number) {
  return `${(value * 100).toFixed(1).replace(".", ",")}%`;
}

function accountLabel(subscription: ExecutiveSubscription) {
  return subscription.organization?.name ?? subscription.user?.name ?? subscription.user?.email ?? "Conta sem titular";
}

function hasActiveLicense(subscription: ExecutiveSubscription) {
  return subscription.licenses.some((license) => license.status === LicenseStatus.ACTIVE);
}

function mrrOrNull(subscription: ExecutiveSubscription) {
  return getMonthlyRevenueCents(subscription);
}

export async function getAdminExecutiveDashboard() {
  return unstable_cache(async () => {
    const now = new Date();
    const periodStart = getPeriodStart("30d", now);
    const sevenDaysAgo = getPeriodStart("7d", now);

    const [
      subscriptions,
      totalUsers,
      newUsers,
      organizations,
      activeLicenses,
      calculationsLast7d,
      activeProductUsers7d,
      checkoutFailures,
      webhookFailures,
      recentAuditEvents
    ] = await Promise.all([
      prisma.subscription.findMany({
        orderBy: { updatedAt: "desc" },
        take: 500,
        include: {
          user: { select: { email: true, name: true } },
          organization: { select: { name: true } },
          planPrice: true,
          licenses: { select: { id: true, status: true } }
        }
      }),
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: periodStart } } }),
      prisma.organization.count(),
      prisma.license.count({ where: { status: LicenseStatus.ACTIVE } }),
      prisma.calculationHistory.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.calculationHistory.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        distinct: ["userId"],
        select: { userId: true }
      }),
      prisma.checkoutEvent.count({ where: { status: OperationalEventStatus.FAILED, createdAt: { gte: periodStart } } }),
      prisma.webhookFailure.count({ where: { status: "OPEN" } }),
      prisma.adminAuditEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { actor: { select: { email: true, name: true } } }
      })
    ]);

    const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === SubscriptionStatus.ACTIVE);
    const trialingSubscriptions = subscriptions.filter((subscription) => subscription.status === SubscriptionStatus.TRIALING);
    const canceledInPeriod = subscriptions.filter((subscription) => subscription.status === SubscriptionStatus.CANCELED && subscription.updatedAt >= periodStart);
    const newSubscriptions = subscriptions.filter((subscription) => subscription.createdAt >= periodStart);
    const currentMrrCents = sumRevenueCents(subscriptions);
    const currentArrCents = currentMrrCents * 12;
    const canceledMrrCents = canceledInPeriod.reduce((total, subscription) => total + (mrrOrNull(subscription) ?? 0), 0);

    const revenueRiskStatuses = new Set<SubscriptionStatus>([
      SubscriptionStatus.PAST_DUE,
      SubscriptionStatus.UNPAID,
      SubscriptionStatus.INCOMPLETE
    ]);
    const revenueRiskSubscriptions = subscriptions.filter((subscription) => revenueRiskStatuses.has(subscription.status));
    const revenueAtRiskCents = revenueRiskSubscriptions.reduce((total, subscription) => total + (mrrOrNull(subscription) ?? 0), 0);
    const accessExpectedStatuses = new Set<SubscriptionStatus>([
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.TRIALING
    ]);
    const missingLicense = subscriptions.filter((subscription) =>
      accessExpectedStatuses.has(subscription.status) && !hasActiveLicense(subscription)
    );
    const customRevenueWithoutAmount = activeSubscriptions.filter((subscription) => mrrOrNull(subscription) === null);
    const institutionalCustomers = activeSubscriptions.filter((subscription) => subscription.ownerType === SubscriptionOwnerType.ORGANIZATION).length;
    const individualCustomers = activeSubscriptions.filter((subscription) => subscription.ownerType === SubscriptionOwnerType.USER).length;

    const topAccounts = activeSubscriptions
      .map((subscription) => ({
        id: subscription.id,
        account: accountLabel(subscription),
        plan: subscription.plan,
        type: subscription.ownerType === SubscriptionOwnerType.ORGANIZATION ? "Institucional" : "Individual",
        mrrCents: mrrOrNull(subscription),
        seats: subscription.seatsPurchased,
        licenseStatus: hasActiveLicense(subscription) ? "Ativa" : "Sem licença ativa"
      }))
      .sort((a, b) => (b.mrrCents ?? -1) - (a.mrrCents ?? -1))
      .slice(0, 6);

    const riskAccounts = [
      ...revenueRiskSubscriptions.map((subscription) => ({
        id: `billing-${subscription.id}`,
        account: accountLabel(subscription),
        risk: subscription.status,
        impact: mrrOrNull(subscription) === null ? "Receita não estruturada" : formatCurrencyFromCents(mrrOrNull(subscription)),
        action: "Regularizar cobrança em Billing"
      })),
      ...missingLicense.map((subscription) => ({
        id: `license-${subscription.id}`,
        account: accountLabel(subscription),
        risk: "Sem licença ativa",
        impact: "Acesso pode estar inconsistente",
        action: "Reconciliar licença"
      }))
    ].slice(0, 8);

    return {
      periodLabel: "Últimos 30 dias",
      metrics: {
        mrr: formatCurrencyFromCents(currentMrrCents),
        arr: formatCurrencyFromCents(currentArrCents),
        activeCustomers: activeSubscriptions.length,
        newCustomers: newSubscriptions.length,
        customerChurn: percent(calculateCustomerChurn(activeSubscriptions.length, canceledInPeriod.length)),
        revenueChurn: percent(calculateRevenueChurn(currentMrrCents, canceledMrrCents)),
        revenueAtRisk: formatCurrencyFromCents(revenueAtRiskCents),
        revenueRiskCount: revenueRiskSubscriptions.length,
        activeLicenses,
        totalUsers,
        newUsers,
        organizations,
        trialingCustomers: trialingSubscriptions.length,
        individualCustomers,
        institutionalCustomers,
        calculationsLast7d,
        activeProductUsers7d: activeProductUsers7d.length,
        checkoutFailures,
        webhookFailures,
        missingLicenseCount: missingLicense.length,
        customRevenueWithoutAmountCount: customRevenueWithoutAmount.length
      },
      topAccounts,
      riskAccounts,
      recentAuditEvents
    };
  }, ["admin-executive-dashboard"], { revalidate: 60 })();
}
