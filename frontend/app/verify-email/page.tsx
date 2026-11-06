import Link from "next/link";
import { headers } from "next/headers";
import { verifyEmailToken } from "@/lib/account-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { NeuralCard, PremiumButton, SaaSPage } from "@/components/saas/SaaSChrome";

export default async function VerifyEmailPage({ searchParams }: { searchParams?: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = params?.token ?? "";
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
  const rateLimit = token ? await checkRateLimit("verifyEmail", ip, token.slice(0, 12)) : null;
  const result = token && rateLimit?.allowed ? await verifyEmailToken(token) : { ok: false };
  const rateLimited = Boolean(rateLimit && !rateLimit.allowed);

  return (
    <SaaSPage>
      <div className="mx-auto grid min-h-screen max-w-md place-items-center px-4 py-10">
        <NeuralCard className="w-full p-6">
          <Link href="/" className="mb-8 block text-sm font-black text-cyan-200">iatron.PED</Link>
          <h1 className="text-3xl font-black text-white">{result.ok ? "Email verificado." : rateLimited ? "Muitas tentativas." : "Link inválido ou expirado."}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {result.ok
              ? "Sua conta foi liberada. Você já pode entrar na plataforma clínica."
              : rateLimited
                ? "Aguarde alguns minutos antes de tentar verificar novamente."
                : "Solicite um novo cadastro ou entre em contato com o suporte quando disponível."}
          </p>
          <div className="mt-8">
            <PremiumButton href={result.ok ? "/login?verified=1" : "/register"}>{result.ok ? "Entrar" : "Criar conta"}</PremiumButton>
          </div>
        </NeuralCard>
      </div>
    </SaaSPage>
  );
}
