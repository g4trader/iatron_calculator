import { CheckoutReturnPanel } from "@/components/onboarding/CheckoutReturnPanel";
import { NeuralCard, SaaSNav, SaaSPage } from "@/components/saas/SaaSChrome";
import { requireAuth } from "@/lib/authz";
import { getCommercialEntitlement } from "@/lib/commercial-access";
import { normalizeCheckoutReturnStatus, resolveCheckoutOnboarding } from "@/lib/checkout-onboarding";
import { getPrimaryOrganizationForUser } from "@/lib/organizations";

export default async function CheckoutReturnPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const user = await requireAuth();
  const [entitlement, organization] = await Promise.all([
    getCommercialEntitlement(user.id),
    getPrimaryOrganizationForUser(user.id)
  ]);
  const view = resolveCheckoutOnboarding({
    returnStatus: normalizeCheckoutReturnStatus(params?.status),
    entitlement,
    hasOrganization: Boolean(organization)
  });

  return (
    <SaaSPage>
      <SaaSNav />
      <section className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:px-6 lg:px-8">
        <CheckoutReturnPanel view={view} />
        <NeuralCard className="p-5">
          <p className="text-sm font-semibold text-cyan-200">Estado interno</p>
          <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <p>Plano: <span className="font-semibold text-white">{entitlement.plan}</span></p>
            <p>Status: <span className="font-semibold text-white">{entitlement.status}</span></p>
            <p>Licença: <span className="font-semibold text-white">{entitlement.licenseStatus}</span></p>
          </div>
        </NeuralCard>
      </section>
    </SaaSPage>
  );
}
