import Link from "next/link";
import { redirect } from "next/navigation";
import { PasswordLoginForm } from "@/components/auth/PasswordLoginForm";
import { TemporaryLoginForm } from "@/components/auth/TemporaryLoginForm";
import { NeuralCard, SaaSPage } from "@/components/saas/SaaSChrome";
import { getCurrentUser } from "@/lib/authz";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ callbackUrl?: string; verified?: string; reset?: string }> }) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const callbackUrl = params?.callbackUrl ?? "/dashboard";
  if (user) redirect(callbackUrl);

  const temporaryLoginEnabled = process.env.TEMP_LOGIN_ENABLED === "true" && process.env.NODE_ENV !== "production";

  return (
    <SaaSPage>
      <div className="mx-auto grid min-h-screen max-w-md place-items-center px-4 py-10">
        <NeuralCard className="w-full p-6">
          <Link href="/" className="mb-8 block text-sm font-black text-cyan-200">Iatron</Link>
          <h1 className="text-3xl font-black text-white">Acesse sua plataforma clínica.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Entre com email e senha para acessar a área clínica e seu histórico de cálculos.</p>
          {params?.verified === "1" ? (
            <p className="mt-5 rounded-md border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm font-semibold text-emerald-100">
              Email verificado. Você já pode entrar.
            </p>
          ) : null}
          {params?.reset === "1" ? (
            <p className="mt-5 rounded-md border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm font-semibold text-emerald-100">
              Senha redefinida. Você já pode entrar.
            </p>
          ) : null}
          <PasswordLoginForm callbackUrl={callbackUrl} />
          <div className="mt-5 rounded-md border border-cyan-300/10 bg-cyan-300/[0.04] p-4 text-sm font-semibold text-cyan-100">
            Login social será habilitado em breve
          </div>
          {temporaryLoginEnabled ? <TemporaryLoginForm callbackUrl={callbackUrl} enabled /> : null}
        </NeuralCard>
      </div>
    </SaaSPage>
  );
}
