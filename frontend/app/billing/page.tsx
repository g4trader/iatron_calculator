import { CreditCard, Receipt, RefreshCw } from "lucide-react";
import { NeuralCard, PremiumButton, SaaSNav, SaaSPage } from "@/components/saas/SaaSChrome";
import { PortalButton } from "@/components/billing/PortalButton";
import { CommercialBlock } from "@/components/paywall/CommercialBlock";
import { getSubscriptionStatus, requireAuth } from "@/lib/authz";
import { getCommercialEntitlement } from "@/lib/commercial-access";
import { normalizeCheckoutReturnStatus, resolveCheckoutOnboarding } from "@/lib/checkout-onboarding";

export default async function BillingPage() {
  const user = await requireAuth();
  const subscription = await getSubscriptionStatus(user.id);
  const entitlement = await getCommercialEntitlement(user.id);
  const recovery = resolveCheckoutOnboarding({
    returnStatus: normalizeCheckoutReturnStatus(null),
    entitlement,
    hasOrganization: Boolean(entitlement.organization)
  });
  const renewal = subscription.currentPeriodEnd?.toLocaleDateString("pt-BR") ?? "Indefinida";
  const trial = subscription.trialEndsAt?.toLocaleDateString("pt-BR") ?? "Sem trial";
  const cards = [
    { title: "Plano atual", value: subscription.plan, Icon: CreditCard },
    { title: "Status", value: subscription.status, Icon: RefreshCw },
    { title: "Renovação / trial", value: subscription.status === "TRIALING" || subscription.status === "trialing" ? trial : renewal, Icon: Receipt }
  ];

  return (
    <SaaSPage>
      <SaaSNav />
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-semibold text-cyan-200">Billing</p>
          <h1 className="mt-2 text-4xl font-black text-white">Gestão de assinatura.</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map(({ title, value, Icon }) => (
            <NeuralCard key={title} className="p-5">
              <Icon className="mb-5 h-5 w-5 text-cyan-200" aria-hidden="true" />
              <p className="text-sm text-slate-400">{title}</p>
              <p className="mt-2 text-xl font-black text-white">{value}</p>
            </NeuralCard>
          ))}
        </div>
        {!entitlement.hasAccess ? <CommercialBlock entitlement={entitlement} compact /> : null}
        {recovery.state === "PAYMENT_RECOVERY" || recovery.state === "AWAITING_WEBHOOK" ? (
          <NeuralCard className="p-5">
            <p className="text-sm font-semibold text-amber-200">{recovery.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{recovery.message}</p>
          </NeuralCard>
        ) : null}
        {entitlement.accountType === "ORGANIZATION" && entitlement.organization ? (
          <NeuralCard className="p-5">
            <p className="text-sm font-semibold text-cyan-200">Acesso institucional</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Organização {entitlement.organization.name} · licença {entitlement.licenseStatus} · função {entitlement.organizationRole}
            </p>
          </NeuralCard>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          <PortalButton />
          <PremiumButton href="/checkout">Ver assinatura anual</PremiumButton>
        </div>
      </section>
    </SaaSPage>
  );
}
