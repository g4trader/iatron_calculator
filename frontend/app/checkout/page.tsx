import { CheckCircle2 } from "lucide-react";
import { NeuralCard, PremiumButton, SaaSNav, SaaSPage } from "@/components/saas/SaaSChrome";
import { PricingSelector } from "@/components/pricing/PricingSelector";
import { getCommercialEntitlement } from "@/lib/commercial-access";
import { requireAuth } from "@/lib/authz";
import { trackFunnelEvent } from "@/lib/funnel";
import { canManageOrganization } from "@/lib/organization-authz";
import { getPrimaryOrganizationForUser } from "@/lib/organizations";
import { getPricingView } from "@/lib/pricing";

export default async function CheckoutPage() {
  const user = await requireAuth();
  await trackFunnelEvent({ step: "pricing_view", userId: user.id, source: "checkout", scope: "pricing_page" }).catch(() => null);
  const [pricing, entitlement, primaryMembership] = await Promise.all([
    getPricingView(),
    getCommercialEntitlement(user.id),
    getPrimaryOrganizationForUser(user.id)
  ]);

  const organization = primaryMembership
    ? {
        id: primaryMembership.organizationId,
        name: primaryMembership.organization.name,
        canManage: canManageOrganization(primaryMembership.role),
        minimumSeats: primaryMembership.organization.minimumSeats
      }
    : null;

  return (
    <SaaSPage>
      <SaaSNav />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.55fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-cyan-200">Pricing</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black text-white md:text-5xl">Escolha o acesso comercial do iatron.PED.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Planos carregados do catálogo comercial versionado. A validação final de preço, seats e permissão continua no servidor.
            </p>
          </div>
          {entitlement.hasAccess ? (
            <NeuralCard className="p-5">
              <CheckCircle2 className="mb-4 h-5 w-5 text-cyan-200" aria-hidden="true" />
              <p className="text-sm font-semibold text-cyan-200">Acesso ativo</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Você já possui acesso {entitlement.accountType === "ORGANIZATION" ? "institucional" : "individual"} no plano {entitlement.plan}.
              </p>
              <div className="mt-4">
                <PremiumButton href="/billing" variant="secondary">Gerenciar assinatura</PremiumButton>
              </div>
            </NeuralCard>
          ) : null}
        </div>

        <PricingSelector
          individualPlans={pricing.individualPlans}
          institutionalPlans={pricing.institutionalPlans}
          accountType={entitlement.accountType}
          hasAccess={entitlement.hasAccess}
          organization={organization}
        />
      </section>
    </SaaSPage>
  );
}
