import { BillingCycle, PlanAudience, type Plan, type PlanCatalog, type PlanPrice } from "@prisma/client";
import { minimumInstitutionalSeats } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

const cycleOrder: Record<BillingCycle, number> = {
  [BillingCycle.MONTHLY]: 1,
  [BillingCycle.SEMIANNUAL]: 2,
  [BillingCycle.ANNUAL]: 3,
  [BillingCycle.BIENNIAL]: 4,
  [BillingCycle.CUSTOM]: 5
};

export const billingCycleLabels: Record<BillingCycle, string> = {
  [BillingCycle.MONTHLY]: "Mensal",
  [BillingCycle.SEMIANNUAL]: "6 meses",
  [BillingCycle.ANNUAL]: "1 ano",
  [BillingCycle.BIENNIAL]: "2 anos",
  [BillingCycle.CUSTOM]: "Sob consulta"
};

export type PricingCatalogRecord = PlanCatalog & {
  prices: PlanPrice[];
};

export type PricingPriceView = {
  id: string;
  billingCycle: BillingCycle;
  billingCycleLabel: string;
  currency: string;
  amountCents: number | null;
  intervalCount: number;
  isCustom: boolean;
  monthlyEquivalentCents: number | null;
  savingsPercent: number | null;
};

export type PricingPlanView = {
  id: string;
  code: Plan;
  name: string;
  audience: PlanAudience;
  description: string | null;
  minSeats: number;
  prices: PricingPriceView[];
};

export type PricingView = {
  individualPlans: PricingPlanView[];
  institutionalPlans: PricingPlanView[];
};

export function formatPrice(amountCents: number | null, currency = "BRL") {
  if (amountCents === null) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: amountCents % 100 === 0 ? 0 : 2
  }).format(amountCents / 100);
}

export function getMinimumInstitutionalCheckoutSeats(planMinSeats: number, organizationMinimumSeats?: number | null) {
  return minimumInstitutionalSeats(planMinSeats, organizationMinimumSeats ?? 3);
}

export function getDefaultPriceForPlan(plan: PricingPlanView) {
  return plan.prices.find((price) => price.billingCycle === BillingCycle.ANNUAL) ?? plan.prices[0] ?? null;
}

export function shouldUseBillingPortal(hasActiveAccess: boolean, planAudience: PlanAudience, currentAccountType?: string | null) {
  if (!hasActiveAccess) return false;
  if (planAudience === PlanAudience.INDIVIDUAL) return currentAccountType === "INDIVIDUAL";
  if (planAudience === PlanAudience.INSTITUTIONAL) return currentAccountType === "ORGANIZATION";
  return false;
}

function priceToView(price: PlanPrice, monthlyReferenceCents: number | null): PricingPriceView {
  const monthlyEquivalentCents = price.amountCents === null ? null : Math.round(price.amountCents / Math.max(price.intervalCount, 1));
  const savingsPercent =
    monthlyReferenceCents && monthlyEquivalentCents && price.billingCycle !== BillingCycle.MONTHLY
      ? Math.max(0, Math.round((1 - monthlyEquivalentCents / monthlyReferenceCents) * 100))
      : null;

  return {
    id: price.id,
    billingCycle: price.billingCycle,
    billingCycleLabel: billingCycleLabels[price.billingCycle],
    currency: price.currency,
    amountCents: price.amountCents,
    intervalCount: price.intervalCount,
    isCustom: price.billingCycle === BillingCycle.CUSTOM || price.amountCents === null,
    monthlyEquivalentCents,
    savingsPercent
  };
}

function isVisibleCommercialMvpPrice(catalog: PricingCatalogRecord, price: PlanPrice) {
  const fallbackStripePriceId = process.env[`STRIPE_PRICE_${catalog.code}_${price.billingCycle}`]?.trim();
  const hasStripePrice = Boolean(price.stripePriceId || fallbackStripePriceId);
  // Commercial MVP governance: expose only cycles validated end-to-end in staging.
  if (catalog.audience === PlanAudience.INDIVIDUAL) {
    return catalog.code === "PROFESSIONAL" && price.billingCycle === BillingCycle.ANNUAL && price.amountCents !== null && hasStripePrice;
  }

  if (catalog.audience === PlanAudience.INSTITUTIONAL) {
    return catalog.code === "HOSPITAL" && price.billingCycle === BillingCycle.CUSTOM;
  }

  return false;
}

export function buildPricingView(catalogs: PricingCatalogRecord[]): PricingView {
  const plans = catalogs
    .map((catalog): PricingPlanView => {
      const sortedPrices = catalog.prices
        .filter((price) => isVisibleCommercialMvpPrice(catalog, price))
        .sort((a, b) => cycleOrder[a.billingCycle] - cycleOrder[b.billingCycle]);
      const monthlyReferenceCents = sortedPrices.find((price) => price.billingCycle === BillingCycle.MONTHLY)?.amountCents ?? null;
      return {
        id: catalog.id,
        code: catalog.code,
        name: catalog.name,
        audience: catalog.audience,
        description: catalog.description,
        minSeats: catalog.minSeats,
        prices: sortedPrices.map((price) => priceToView(price, monthlyReferenceCents))
      };
    })
    .filter((plan) => plan.prices.length > 0);

  return {
    individualPlans: plans.filter((plan) => plan.audience === PlanAudience.INDIVIDUAL),
    institutionalPlans: plans.filter((plan) => plan.audience === PlanAudience.INSTITUTIONAL)
  };
}

export async function getPricingView() {
  const catalogs = await prisma.planCatalog.findMany({
    where: { isActive: true },
    include: {
      prices: {
        where: { isActive: true },
        orderBy: { intervalCount: "asc" }
      }
    },
    orderBy: [{ audience: "asc" }, { code: "asc" }]
  });

  return buildPricingView(catalogs);
}
