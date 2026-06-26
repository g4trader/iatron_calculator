import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { NeuralCard, SaaSPage } from "@/components/saas/SaaSChrome";

export default async function ResetPasswordPage({ searchParams }: { searchParams?: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = params?.token ?? "";

  return (
    <SaaSPage>
      <div className="mx-auto grid min-h-screen max-w-md place-items-center px-4 py-10">
        <NeuralCard className="w-full p-6">
          <Link href="/" className="mb-8 block text-sm font-black text-cyan-200">iatron.PED</Link>
          <h1 className="text-3xl font-black text-white">Defina uma nova senha.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">O link é de uso único e expira por segurança.</p>
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="mt-8 rounded-md border border-red-300/25 bg-red-400/10 p-4 text-sm font-semibold text-red-100">
              Link inválido. Solicite uma nova redefinição de senha.
            </div>
          )}
        </NeuralCard>
      </div>
    </SaaSPage>
  );
}
