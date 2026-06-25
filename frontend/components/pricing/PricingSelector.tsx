"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Check, CreditCard, Users } from "lucide-react";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { PortalButton } from "@/components/billing/PortalButton";
import { NeuralCard } from "@/components/saas/SaaSPrimitives";
import type { PricingPlanView, PricingPriceView } from "@/lib/pricing";

const institutionalContactHref =
  "mailto:contato@iatron.com.br?subject=Implantacao%20institucional%20Iatron&body=Quero%20avaliar%20o%20plano%20Hospital%20do%20Iatron.%0A%0AInstituicao%3A%0ANumero%20estimado%20de%20licencas%3A%0AResponsavel%3A";

function formatPrice(amountCents: number | null, currency: string) {
  if (amountCents === null) return "Sob consulta";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: amountCents % 100 === 0 ? 0 : 2
  }).format(amountCents / 100);
}

function initialSelectedPrices(plans: PricingPlanView[]) {
  return Object.fromEntries(plans.map((plan) => [plan.id, plan.prices.find((price) => price.billingCycle === "MONTHLY")?.id ?? plan.prices[0]?.id ?? ""]));
}

function getSelectedPrice(plan: PricingPlanView, selectedByPlan: Record<string, string>) {
  return plan.prices.find((price) => price.id === selectedByPlan[plan.id]) ?? plan.prices[0] ?? null;
}

function getPlanDescription(plan: PricingPlanView) {
  if (plan.code === "PROFESSIONAL") return "Acesso individual à Folha PCR digital do Iatron.";
  if (plan.code === "HOSPITAL") return "Implantação assistida da Folha PCR para equipes clínicas.";
  return plan.description ?? "Acesso ao Iatron.";
}

function PriceCycleSelector({
  plan,
  selectedPrice,
  onSelect
}: {
  plan: PricingPlanView;
  selectedPrice: PricingPriceView | null;
  onSelect: (priceId: string) => void;
}) {
  if (plan.prices.length <= 1) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {plan.prices.map((price) => {
        const selected = selectedPrice?.id === price.id;
        return (
          <button
            key={price.id}
            type="button"
            onClick={() => onSelect(price.id)}
            className={`rounded-md border px-3 py-2 text-left text-xs font-bold transition ${
              selected ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-cyan-300/10 bg-white/[0.03] text-slate-300 hover:border-cyan-300/40"
            }`}
          >
            <span className="block">{price.billingCycleLabel}</span>
            {price.savingsPercent ? <span className="mt-1 block text-[11px] opacity-80">-{price.savingsPercent}%</span> : null}
          </button>
        );
      })}
    </div>
  );
}

function IndividualPlanCard({
  plan,
  selectedPrice,
  hasIndividualAccess,
  onSelect
}: {
  plan: PricingPlanView;
  selectedPrice: PricingPriceView | null;
  hasIndividualAccess: boolean;
  onSelect: (priceId: string) => void;
}) {
  return (
    <NeuralCard className="grid gap-5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-cyan-200">Individual</p>
          <h3 className="mt-2 text-2xl font-black text-white">{plan.name}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{getPlanDescription(plan)}</p>
        </div>
        <CreditCard className="h-5 w-5 text-cyan-200" aria-hidden="true" />
      </div>

      <PriceCycleSelector plan={plan} selectedPrice={selectedPrice} onSelect={onSelect} />

      <div>
        <p className="text-4xl font-black text-white">{formatPrice(selectedPrice?.amountCents ?? null, selectedPrice?.currency ?? "BRL")}</p>
        {selectedPrice?.monthlyEquivalentCents && selectedPrice.billingCycle !== "MONTHLY" ? (
          <p className="mt-1 text-sm text-slate-400">Equivalente a {formatPrice(selectedPrice.monthlyEquivalentCents, selectedPrice.currency)}/mês</p>
        ) : (
          <p className="mt-1 text-sm text-slate-400">{selectedPrice?.billingCycleLabel ?? "Ciclo indisponível"}</p>
        )}
      </div>

      <div className="grid gap-2 text-sm text-slate-300">
        <p className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-cyan-200" aria-hidden="true" /> Folha PCR digital</p>
        <p className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-cyan-200" aria-hidden="true" /> Histórico autenticado da Folha PCR</p>
      </div>

      {hasIndividualAccess ? (
        <PortalButton />
      ) : selectedPrice && !selectedPrice.isCustom ? (
        <CheckoutButton planPriceId={selectedPrice.id}>Assinar {plan.name}</CheckoutButton>
      ) : (
        <Link href="mailto:contato@iatron.com.br" className="inline-flex h-12 items-center justify-center rounded-md border border-cyan-300/20 bg-white/[0.03] px-5 text-sm font-bold text-slate-100 transition hover:border-cyan-300/50">
          Falar com equipe
        </Link>
      )}
    </NeuralCard>
  );
}

function InstitutionalPlanCard({
  plan,
  selectedPrice,
  organization,
  hasInstitutionalAccess,
  onSelect
}: {
  plan: PricingPlanView;
  selectedPrice: PricingPriceView | null;
  organization: { id: string; name: string; canManage: boolean; minimumSeats: number } | null;
  hasInstitutionalAccess: boolean;
  onSelect: (priceId: string) => void;
}) {
  const minimumSeats = Math.max(3, plan.minSeats, organization?.minimumSeats ?? 3);
  const [seats, setSeats] = useState(minimumSeats);
  const normalizedSeats = Math.max(minimumSeats, Number.isFinite(seats) ? seats : minimumSeats);

  return (
    <NeuralCard className="grid gap-5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-cyan-200">Institucional</p>
          <h3 className="mt-2 text-2xl font-black text-white">{plan.name}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{getPlanDescription(plan)}</p>
        </div>
        <Building2 className="h-5 w-5 text-cyan-200" aria-hidden="true" />
      </div>

      <PriceCycleSelector plan={plan} selectedPrice={selectedPrice} onSelect={onSelect} />

      <div>
        <p className="text-4xl font-black text-white">{formatPrice(selectedPrice?.amountCents ?? null, selectedPrice?.currency ?? "BRL")}</p>
        <p className="mt-1 text-sm text-slate-400">{selectedPrice?.isCustom ? "Contrato institucional personalizado" : `${selectedPrice?.billingCycleLabel ?? "Ciclo indisponível"} por licença`}</p>
      </div>

      {selectedPrice?.isCustom ? (
        <div className="rounded-md border border-cyan-300/15 bg-cyan-300/[0.06] p-4">
          <p className="text-sm font-semibold text-cyan-100">Implantação assistida</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            O plano Hospital exige validação comercial, criação ou revisão da organização e atribuição de licenças aos usuários antes da liberação clínica.
          </p>
        </div>
      ) : null}

      <label className="grid gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Users className="h-4 w-4 text-cyan-200" aria-hidden="true" /> Licenças
        </span>
        <input
          type="number"
          min={minimumSeats}
          value={normalizedSeats}
          onChange={(event) => setSeats(Number(event.target.value))}
          className="h-12 rounded-md border border-cyan-300/15 bg-slate-950 px-4 text-base font-bold text-white outline-none transition focus:border-cyan-300/60"
        />
        <span className="text-xs text-slate-400">Mínimo institucional: {minimumSeats} licenças.</span>
      </label>

      <div className="grid gap-2 text-sm text-slate-300">
        <p className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-cyan-200" aria-hidden="true" /> Organização, membros e convites</p>
        <p className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-cyan-200" aria-hidden="true" /> Alocação controlada de licenças</p>
      </div>

      {hasInstitutionalAccess ? (
        <PortalButton ownerType="ORGANIZATION" organizationId={organization?.id} />
      ) : !organization ? (
        <div className="grid gap-3">
          <Link href="/organization" className="inline-flex h-12 items-center justify-center rounded-md bg-cyan-300 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
            Criar organização
          </Link>
          <Link href={institutionalContactHref} className="inline-flex h-12 items-center justify-center rounded-md border border-cyan-300/20 bg-white/[0.03] px-5 text-sm font-bold text-slate-100 transition hover:border-cyan-300/50">
            Solicitar implantação institucional
          </Link>
        </div>
      ) : !organization.canManage ? (
        <p className="rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-sm font-semibold text-amber-100">Somente OWNER ou ADMIN pode contratar o plano institucional.</p>
      ) : selectedPrice && !selectedPrice.isCustom ? (
        <CheckoutButton ownerType="ORGANIZATION" organizationId={organization.id} planPriceId={selectedPrice.id} seats={normalizedSeats}>
          Contratar {normalizedSeats} licenças
        </CheckoutButton>
      ) : (
        <Link href={institutionalContactHref} className="inline-flex h-12 items-center justify-center rounded-md border border-cyan-300/20 bg-white/[0.03] px-5 text-sm font-bold text-slate-100 transition hover:border-cyan-300/50">
          Solicitar implantação institucional
        </Link>
      )}
    </NeuralCard>
  );
}

export function PricingSelector({
  individualPlans,
  institutionalPlans,
  accountType,
  hasAccess,
  organization
}: {
  individualPlans: PricingPlanView[];
  institutionalPlans: PricingPlanView[];
  accountType: string;
  hasAccess: boolean;
  organization: { id: string; name: string; canManage: boolean; minimumSeats: number } | null;
}) {
  const allPlans = useMemo(() => [...individualPlans, ...institutionalPlans], [individualPlans, institutionalPlans]);
  const [selectedByPlan, setSelectedByPlan] = useState(() => initialSelectedPrices(allPlans));
  const hasIndividualAccess = hasAccess && accountType === "INDIVIDUAL";
  const hasInstitutionalAccess = hasAccess && accountType === "ORGANIZATION";

  function selectPrice(planId: string, priceId: string) {
    setSelectedByPlan((current) => ({ ...current, [planId]: priceId }));
  }

  return (
    <div className="grid gap-8">
      <section className="grid gap-4">
        <div>
          <p className="text-sm font-semibold text-cyan-200">Planos individuais</p>
          <h2 className="mt-2 text-2xl font-black text-white">Acesso individual à Folha PCR.</h2>
        </div>
        {individualPlans.length === 0 ? <p className="rounded-md border border-cyan-300/10 p-4 text-sm text-slate-400">Nenhum plano individual ativo no momento.</p> : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {individualPlans.map((plan) => (
            <IndividualPlanCard
              key={plan.id}
              plan={plan}
              selectedPrice={getSelectedPrice(plan, selectedByPlan)}
              hasIndividualAccess={hasIndividualAccess}
              onSelect={(priceId) => selectPrice(plan.id, priceId)}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <div>
          <p className="text-sm font-semibold text-cyan-200">Planos institucionais</p>
          <h2 className="mt-2 text-2xl font-black text-white">Implantação assistida da Folha PCR para equipes.</h2>
        </div>
        {institutionalPlans.length === 0 ? <p className="rounded-md border border-cyan-300/10 p-4 text-sm text-slate-400">Nenhum plano institucional ativo no momento.</p> : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {institutionalPlans.map((plan) => (
            <InstitutionalPlanCard
              key={plan.id}
              plan={plan}
              selectedPrice={getSelectedPrice(plan, selectedByPlan)}
              organization={organization}
              hasInstitutionalAccess={hasInstitutionalAccess}
              onSelect={(priceId) => selectPrice(plan.id, priceId)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
