import { UserRound } from "lucide-react";
import { NeuralCard, SaaSNav, SaaSPage } from "@/components/saas/SaaSChrome";
import { getSubscriptionStatus, requireAuth } from "@/lib/authz";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const user = await requireAuth();
  const subscription = await getSubscriptionStatus(user.id);

  return (
    <SaaSPage>
      <SaaSNav />
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <NeuralCard className="p-6">
          <UserRound className="mb-6 h-6 w-6 text-cyan-200" aria-hidden="true" />
          <h1 className="text-3xl font-black text-white">Perfil clínico</h1>
          <div className="mt-8 grid gap-4">
            <ProfileForm name={user.name ?? ""} clinicalName={user.clinicalName ?? ""} />
            <ProfileField label="Email" value={user.email ?? ""} readOnly />
            <ProfileField label="Plano" value={`${subscription.plan} · ${subscription.status}`} readOnly />
            <ProfileField label="Role" value={user.role} readOnly />
            <ProfileField label="Conta criada em" value={user.createdAt.toLocaleDateString("pt-BR")} readOnly />
          </div>
        </NeuralCard>
      </section>
    </SaaSPage>
  );
}

function ProfileField({ label, value, readOnly = false }: { label: string; value: string; readOnly?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-300">
      {label}
      <input
        readOnly={readOnly}
        defaultValue={value}
        className="h-12 rounded-md border border-cyan-300/15 bg-slate-900 px-3 text-white outline-none focus:border-cyan-300/60 read-only:text-slate-400"
      />
    </label>
  );
}
