import Link from "next/link";
import { headers } from "next/headers";
import { verifyEmailToken } from "@/lib/account-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { PortalAuthFrame } from "../minha-pediatron/PortalAuthFrame";

export default async function VerifyEmailPage({ searchParams }: { searchParams?: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = params?.token ?? "";
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
  const rateLimit = token ? await checkRateLimit("verifyEmail", ip, token.slice(0, 12)) : null;
  const result = token && rateLimit?.allowed ? await verifyEmailToken(token) : { ok: false };
  const rateLimited = Boolean(rateLimit && !rateLimit.allowed);

  return (
    <PortalAuthFrame>
          <h1 className="text-3xl font-black text-white">{result.ok ? "Email verificado." : rateLimited ? "Muitas tentativas." : "Link inválido ou expirado."}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {result.ok
              ? ('mentory' in result && ('mentory' in result && result.mentory)) ? "E-mail confirmado! Entre na plataforma. A contratação da mentoria acontece com nossa equipe consultiva na comunidade aberta." : "Sua conta foi liberada. Você já pode entrar na plataforma clínica."
              : rateLimited
                ? "Aguarde alguns minutos antes de tentar verificar novamente."
                : "Solicite um novo link de verificação."}
          </p>
          <div className="mt-8">
            <Link className="portal-primary" href={result.ok ? "/minha-pediatron?verified=1" : "/resend-verification"}>{result.ok ? "Entrar" : "Reenviar verificação"}</Link>
          </div>
    </PortalAuthFrame>
  );
}
