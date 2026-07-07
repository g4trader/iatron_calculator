import { BillingCycle, Plan, SubscriptionOwnerType, SubscriptionStatus, type Subscription } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type SalesPeriod = "7d" | "30d" | "90d" | "365d";

export type SalesFilters = {
  period: SalesPeriod;
  plan?: Plan;
  ownerType?: SubscriptionOwnerType;
  status?: SubscriptionStatus;
};

export type SalesMetric = {
  label: string;
  value: string;
  precision: "precise" | "estimated" | "placeholder";
  note?: string;
};

export type SalesChartPoint = {
  label: string;
  valueCents: number;
  count?: number;
};

export type SalesBreakdownRow = {
  id: string;
  label: string;
  valueCents: number | null;
  count: number;
  precision: "precise" | "estimated" | "placeholder";
  note?: string;
};

type RevenueSubscription = Pick<Subscription, "id" | "status" | "plan" | "billingCycle" | "ownerType" | "seatsPurchased" | "createdAt" | "updatedAt"> & {
  planPrice: { amountCents: number | null; intervalCount: number; billingCycle: BillingCycle } | null;
  licenses?: Array<{ id: string }>;
};

export const salesPeriodLabels: Record<SalesPeriod, string> = {
  "7d": "7 dias",
  "30d": "30 dias",
  "90d": "90 dias",
  "365d": "12 meses"
};

export const salesMetricNotes = {
  mrr: "Preciso para assinaturas com PlanPrice.amountCents. Planos custom/sob consulta ficam fora do MRR até terem valor contratual estruturado.",
  arr: "Estimado como MRR atual x 12.",
  customerChurn: "Estimado com base em assinaturas canceladas no período e base atual; não substitui coorte histórica.",
  revenueChurn: "Estimado usando MRR das assinaturas canceladas no período quando o preço está disponível.",
  upgradesDowngrades: "TODO: requer histórico de troca de plano/preço ou eventos comerciais versionados.",
  funnel: "Landing e checkout dependem de analytics/eventos dedicados. Ativação e primeiro uso usam dados atuais de assinatura/licença/cálculo."
} as const;

export function getPeriodStart(period: SalesPeriod, now = new Date()) {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export function formatCurrencyFromCents(amountCents: number | null) {
  if (amountCents === null) return "N/D";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(amountCents / 100);
}

export function getMonthlyRevenueCents(subscription: RevenueSubscription) {
  const amountCents = subscription.planPrice?.amountCents;
  if (amountCents === null || amountCents === undefined) return null;

  const intervalCount = Math.max(subscription.planPrice?.intervalCount ?? 1, 1);
  const seats = subscription.ownerType === SubscriptionOwnerType.ORGANIZATION ? Math.max(subscription.seatsPurchased, 1) : 1;
  return Math.round((amountCents / intervalCount) * seats);
}

export function isRevenueActive(status: SubscriptionStatus) {
  return status === SubscriptionStatus.ACTIVE;
}

export function sumRevenueCents(subscriptions: RevenueSubscription[]) {
  return subscriptions.reduce((total, subscription) => {
    if (!isRevenueActive(subscription.status)) return total;
    return total + (getMonthlyRevenueCents(subscription) ?? 0);
  }, 0);
}

export function calculateCustomerChurn(activeCustomers: number, canceledInPeriod: number) {
  const base = activeCustomers + canceledInPeriod;
  if (base === 0) return 0;
  return canceledInPeriod / base;
}

export function calculateRevenueChurn(currentMrrCents: number, canceledMrrCents: number) {
  const base = currentMrrCents + canceledMrrCents;
  if (base === 0) return 0;
  return canceledMrrCents / base;
}

export function buildRevenueByCycle(subscriptions: RevenueSubscription[]): SalesBreakdownRow[] {
  const rows = Object.values(BillingCycle).map((cycle) => {
    const subset = subscriptions.filter((subscription) => subscription.billingCycle === cycle && isRevenueActive(subscription.status));
    const preciseValues = subset.map(getMonthlyRevenueCents).filter((value): value is number => value !== null);
    const hasUnknown = subset.some((subscription) => getMonthlyRevenueCents(subscription) === null);
    return {
      id: cycle,
      label: cycle === BillingCycle.MONTHLY ? "Mensal" : cycle === BillingCycle.SEMIANNUAL ? "Semestral" : cycle === BillingCycle.ANNUAL ? "Anual" : cycle === BillingCycle.BIENNIAL ? "2 anos" : "Sob consulta",
      valueCents: preciseValues.length > 0 ? preciseValues.reduce((total, value) => total + value, 0) : hasUnknown ? null : 0,
      count: subset.length,
      precision: hasUnknown ? "estimated" as const : "precise" as const,
      note: cycle === BillingCycle.BIENNIAL ? "Não há ciclo vitalício modelado; BIENNIAL representa 2 anos." : hasUnknown ? "Há receita custom sem amountCents estruturado." : undefined
    };
  });
  return rows;
}

export function buildRevenueByOwnerType(subscriptions: RevenueSubscription[]): SalesBreakdownRow[] {
  return Object.values(SubscriptionOwnerType).map((ownerType) => {
    const subset = subscriptions.filter((subscription) => subscription.ownerType === ownerType && isRevenueActive(subscription.status));
    const values = subset.map(getMonthlyRevenueCents).filter((value): value is number => value !== null);
    const hasUnknown = subset.some((subscription) => getMonthlyRevenueCents(subscription) === null);
    return {
      id: ownerType,
      label: ownerType === SubscriptionOwnerType.USER ? "Individual" : "Institucional",
      valueCents: values.length > 0 ? values.reduce((total, value) => total + value, 0) : hasUnknown ? null : 0,
      count: subset.length,
      precision: hasUnknown ? "estimated" as const : "precise" as const,
      note: hasUnknown ? "Planos custom institucionais podem não ter valor estruturado." : undefined
    };
  });
}

export function buildAverageTicketByPlan(subscriptions: RevenueSubscription[]): SalesBreakdownRow[] {
  return Object.values(Plan).map((plan) => {
    const subset = subscriptions.filter((subscription) => subscription.plan === plan && isRevenueActive(subscription.status));
    const values = subset.map(getMonthlyRevenueCents).filter((value): value is number => value !== null);
    const hasUnknown = subset.some((subscription) => getMonthlyRevenueCents(subscription) === null);
    return {
      id: plan,
      label: plan,
      valueCents: values.length > 0 ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : hasUnknown ? null : 0,
      count: subset.length,
      precision: hasUnknown ? "estimated" as const : "precise" as const,
      note: hasUnknown ? "Ticket não calculado para contratos sem amountCents." : undefined
    };
  }).filter((row) => row.count > 0 || row.id !== Plan.FREE);
}

function percent(value: number) {
  return `${(value * 100).toFixed(1).replace(".", ",")}%`;
}

function groupRevenueByDay(subscriptions: RevenueSubscription[], periodStart: Date, now = new Date()): SalesChartPoint[] {
  const days = Math.min(31, Math.ceil((now.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000)));
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(periodStart.getTime() + index * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    const createdUntilDay = subscriptions.filter((subscription) => subscription.createdAt < dayEnd && isRevenueActive(subscription.status));
    return {
      label: day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      valueCents: sumRevenueCents(createdUntilDay),
      count: createdUntilDay.length
    };
  });
}

function buildSalesDashboardFromSubscriptions(input: {
  subscriptions: RevenueSubscription[];
  periodStart: Date;
  now?: Date;
  firstUseCount: number;
  funnelCounts?: Record<string, number>;
}) {
  const now = input.now ?? new Date();
  const activeSubscriptions = input.subscriptions.filter((subscription) => subscription.status === SubscriptionStatus.ACTIVE);
  const trialingSubscriptions = input.subscriptions.filter((subscription) => subscription.status === SubscriptionStatus.TRIALING);
  const canceledInPeriod = input.subscriptions.filter((subscription) => subscription.status === SubscriptionStatus.CANCELED && subscription.updatedAt >= input.periodStart);
  const newCustomersInPeriod = input.subscriptions.filter((subscription) => subscription.createdAt >= input.periodStart);
  const currentMrrCents = sumRevenueCents(input.subscriptions);
  const canceledMrrCents = canceledInPeriod.reduce((total, subscription) => total + (getMonthlyRevenueCents(subscription) ?? 0), 0);

  return {
    metrics: [
      { label: "MRR atual", value: formatCurrencyFromCents(currentMrrCents), precision: "precise" as const, note: salesMetricNotes.mrr },
      { label: "ARR estimado", value: formatCurrencyFromCents(currentMrrCents * 12), precision: "estimated" as const, note: salesMetricNotes.arr },
      { label: "Clientes ativos", value: String(activeSubscriptions.length), precision: "precise" as const },
      { label: "Churn de clientes", value: percent(calculateCustomerChurn(activeSubscriptions.length, canceledInPeriod.length)), precision: "estimated" as const, note: salesMetricNotes.customerChurn },
      { label: "Churn de receita", value: percent(calculateRevenueChurn(currentMrrCents, canceledMrrCents)), precision: "estimated" as const, note: salesMetricNotes.revenueChurn },
      { label: "Upgrades/downgrades", value: "N/D", precision: "placeholder" as const, note: salesMetricNotes.upgradesDowngrades },
      { label: "Novos clientes", value: String(newCustomersInPeriod.length), precision: "precise" as const },
      { label: "Trials ativos", value: String(trialingSubscriptions.length), precision: "precise" as const }
    ],
    revenueTimeline: groupRevenueByDay(input.subscriptions, input.periodStart, now),
    revenueByCycle: buildRevenueByCycle(input.subscriptions),
    revenueByOwnerType: buildRevenueByOwnerType(input.subscriptions),
    averageTicketByPlan: buildAverageTicketByPlan(input.subscriptions),
    statusBreakdown: Object.values(SubscriptionStatus).map((status) => ({
      id: status,
      label: status,
      valueCents: null,
      count: input.subscriptions.filter((subscription) => subscription.status === status).length,
      precision: "precise" as const
    })),
    funnel: [
      {
        id: "landing",
        label: "Landing",
        count: input.funnelCounts?.landing_view ?? null,
        note: input.funnelCounts?.landing_view === undefined ? "TODO: instrumentar FunnelEvent landing_view na LP." : "Fonte: FunnelEvent landing_view."
      },
      {
        id: "checkout",
        label: "Checkout",
        count: input.funnelCounts?.checkout_started ?? input.subscriptions.filter((subscription) => subscription.status === SubscriptionStatus.INCOMPLETE).length,
        note: input.funnelCounts?.checkout_started === undefined ? "Fallback: Subscription.INCOMPLETE até todos os checkouts emitirem FunnelEvent." : "Fonte: FunnelEvent checkout_started."
      },
      {
        id: "activation",
        label: "Ativação",
        count: input.funnelCounts?.license_activated ?? activeSubscriptions.length + trialingSubscriptions.length,
        note: input.funnelCounts?.license_activated === undefined ? "Fallback: assinaturas ACTIVE/TRIALING." : "Fonte: FunnelEvent license_activated."
      },
      {
        id: "first_use",
        label: "Primeiro uso",
        count: input.funnelCounts?.first_use ?? input.firstUseCount,
        note: input.funnelCounts?.first_use === undefined ? "Fallback: usuários com CalculationHistory." : "Fonte: FunnelEvent first_use."
      }
    ]
  };
}

export const buildSalesDashboardForTests = buildSalesDashboardFromSubscriptions;

export async function getAdminSalesDashboard(filters: SalesFilters) {
  const periodStart = getPeriodStart(filters.period);
  const where = {
    ...(filters.plan ? { plan: filters.plan } : {}),
    ...(filters.ownerType ? { ownerType: filters.ownerType } : {}),
    ...(filters.status ? { status: filters.status } : {})
  };

  const subscriptions = await prisma.subscription.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 500,
    include: {
      planPrice: true,
      licenses: { select: { id: true } }
    }
  });
  const firstUseUsers = await prisma.calculationHistory.findMany({
    where: { createdAt: { gte: periodStart } },
    distinct: ["userId"],
    select: { userId: true }
  });
  const funnelEvents = await prisma.funnelEvent.groupBy({
    by: ["step"],
    where: { createdAt: { gte: periodStart } },
    _count: { _all: true }
  });
  const funnelCounts = Object.fromEntries(funnelEvents.map((event) => [event.step, event._count._all]));

  return buildSalesDashboardFromSubscriptions({
    subscriptions,
    periodStart,
    firstUseCount: firstUseUsers.length,
    funnelCounts
  });
}

export function parseSalesFilters(input?: { period?: string; plan?: string; ownerType?: string; status?: string }): SalesFilters {
  const period = input?.period === "7d" || input?.period === "90d" || input?.period === "365d" ? input.period : "30d";
  return {
    period,
    plan: input?.plan && Object.values(Plan).includes(input.plan as Plan) ? input.plan as Plan : undefined,
    ownerType: input?.ownerType && Object.values(SubscriptionOwnerType).includes(input.ownerType as SubscriptionOwnerType) ? input.ownerType as SubscriptionOwnerType : undefined,
    status: input?.status && Object.values(SubscriptionStatus).includes(input.status as SubscriptionStatus) ? input.status as SubscriptionStatus : undefined
  };
}
