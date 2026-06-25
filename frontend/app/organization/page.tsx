import { Building2, KeyRound, Mail, Users } from "lucide-react";
import { OrganizationRole } from "@prisma/client";
import { NeuralCard, PremiumButton, SaaSNav, SaaSPage } from "@/components/saas/SaaSChrome";
import { CommercialBlock } from "@/components/paywall/CommercialBlock";
import { OrganizationCreateForm } from "@/components/organization/OrganizationCreateForm";
import { OrganizationInviteForm } from "@/components/organization/OrganizationInviteForm";
import { OrganizationLicenseAssignForm } from "@/components/organization/OrganizationLicenseAssignForm";
import { PortalButton } from "@/components/billing/PortalButton";
import { requireAuth } from "@/lib/authz";
import { getCommercialEntitlement } from "@/lib/commercial-access";
import { canManageOrganization } from "@/lib/organization-authz";
import { getOrganizationOverview, getPrimaryOrganizationForUser } from "@/lib/organizations";

export default async function OrganizationPage() {
  const user = await requireAuth();
  const entitlement = await getCommercialEntitlement(user.id);
  const primaryMembership = await getPrimaryOrganizationForUser(user.id);

  if (!primaryMembership) {
    return (
      <SaaSPage>
        <SaaSNav />
        <section className="mx-auto grid max-w-2xl gap-5 px-4 py-10 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-cyan-200">Institucional</p>
            <h1 className="mt-2 text-4xl font-black text-white">Criar organização.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-400">Crie a unidade B2B para gerenciar membros, convites e licenças.</p>
          </div>
          <NeuralCard className="p-6">
            <OrganizationCreateForm />
          </NeuralCard>
        </section>
      </SaaSPage>
    );
  }

  const overview = await getOrganizationOverview(user.id, primaryMembership.organizationId);
  const canManage = canManageOrganization(overview.currentRole);
  const memberOptions = overview.memberships.map((membership) => ({
    userId: membership.userId,
    label: `${membership.user.name ?? "Sem nome"} · ${membership.user.email ?? "sem email"}`
  }));

  return (
    <SaaSPage>
      <SaaSNav />
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-semibold text-cyan-200">Institucional</p>
          <h1 className="mt-2 text-4xl font-black text-white">{overview.organization.name}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Seu papel: {overview.currentRole}</p>
        </div>

        {!entitlement.hasAccess && entitlement.accountType === "ORGANIZATION" ? <CommercialBlock entitlement={entitlement} compact /> : null}

        <div className="grid gap-4 md:grid-cols-3">
          <NeuralCard className="p-5">
            <Building2 className="mb-4 h-5 w-5 text-cyan-200" aria-hidden="true" />
            <p className="text-sm text-slate-400">Licenças contratadas</p>
            <p className="mt-2 text-3xl font-black text-white">{overview.seats.seatsPurchased}</p>
          </NeuralCard>
          <NeuralCard className="p-5">
            <KeyRound className="mb-4 h-5 w-5 text-cyan-200" aria-hidden="true" />
            <p className="text-sm text-slate-400">Licenças em uso</p>
            <p className="mt-2 text-3xl font-black text-white">{overview.seats.seatsUsed}</p>
          </NeuralCard>
          <NeuralCard className="p-5">
            <Users className="mb-4 h-5 w-5 text-cyan-200" aria-hidden="true" />
            <p className="text-sm text-slate-400">Disponíveis</p>
            <p className="mt-2 text-3xl font-black text-white">{overview.seats.availableSeats}</p>
          </NeuralCard>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <NeuralCard className="overflow-hidden">
            <div className="border-b border-cyan-300/10 p-4 font-black text-white">Membros</div>
            <div className="divide-y divide-cyan-300/10">
              {overview.memberships.map((membership) => (
                <div key={membership.id} className="grid gap-1 p-4 text-sm md:grid-cols-3">
                  <span className="font-semibold text-white">{membership.user.name ?? "Sem nome"}</span>
                  <span className="text-slate-400">{membership.user.email}</span>
                  <span className="text-slate-400">{membership.role}</span>
                </div>
              ))}
            </div>
          </NeuralCard>

          <NeuralCard className="overflow-hidden">
            <div className="border-b border-cyan-300/10 p-4 font-black text-white">Convites</div>
            <div className="divide-y divide-cyan-300/10">
              {overview.invites.length === 0 ? <p className="p-4 text-sm text-slate-400">Nenhum convite criado.</p> : null}
              {overview.invites.map((invite) => (
                <div key={invite.id} className="grid gap-1 p-4 text-sm md:grid-cols-3">
                  <span className="font-semibold text-white">{invite.email}</span>
                  <span className="text-slate-400">{invite.role}</span>
                  <span className="text-slate-400">{invite.status}</span>
                </div>
              ))}
            </div>
          </NeuralCard>
        </div>

        {canManage ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <NeuralCard className="p-5">
              <Mail className="mb-4 h-5 w-5 text-cyan-200" aria-hidden="true" />
              <h2 className="mb-4 font-black text-white">Criar convite</h2>
              <OrganizationInviteForm organizationId={overview.organization.id} />
            </NeuralCard>
            <NeuralCard className="p-5">
              <KeyRound className="mb-4 h-5 w-5 text-cyan-200" aria-hidden="true" />
              <h2 className="mb-4 font-black text-white">Atribuir licença</h2>
              <OrganizationLicenseAssignForm organizationId={overview.organization.id} members={memberOptions} />
            </NeuralCard>
            <NeuralCard className="p-5 lg:col-span-2">
              <Building2 className="mb-4 h-5 w-5 text-cyan-200" aria-hidden="true" />
              <h2 className="mb-4 font-black text-white">Billing institucional</h2>
              <div className="flex flex-col gap-3 sm:flex-row">
                <PremiumButton href="/checkout">Ver planos institucionais</PremiumButton>
                <PortalButton ownerType="ORGANIZATION" organizationId={overview.organization.id} />
              </div>
            </NeuralCard>
          </div>
        ) : null}
      </section>
    </SaaSPage>
  );
}
