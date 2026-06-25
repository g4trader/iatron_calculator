import Link from "next/link";
import { redirect } from "next/navigation";
import { NeuralCard, PremiumButton, SaaSPage } from "@/components/saas/SaaSChrome";
import { requireAuth } from "@/lib/authz";
import { acceptOrganizationInvite } from "@/lib/organizations";

export default async function AcceptOrganizationInvitePage({ searchParams }: { searchParams?: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = params?.token ?? "";

  let user: Awaited<ReturnType<typeof requireAuth>>;
  try {
    user = await requireAuth();
  } catch {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/organization/invites/accept?token=${token}`)}`);
  }

  let message = "Convite aceito.";
  let ok = true;
  try {
    await acceptOrganizationInvite({ userId: user.id, token });
  } catch (error) {
    ok = false;
    message = error instanceof Error ? error.message : "Não foi possível aceitar o convite.";
  }

  return (
    <SaaSPage>
      <div className="mx-auto grid min-h-screen max-w-md place-items-center px-4 py-10">
        <NeuralCard className="w-full p-6">
          <Link href="/" className="mb-8 block text-sm font-black text-cyan-200">Iatron</Link>
          <h1 className="text-3xl font-black text-white">{ok ? "Convite aceito." : "Convite não aceito."}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">{message}</p>
          <div className="mt-8">
            <PremiumButton href="/organization">Abrir organização</PremiumButton>
          </div>
        </NeuralCard>
      </div>
    </SaaSPage>
  );
}
