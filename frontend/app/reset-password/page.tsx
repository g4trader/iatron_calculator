import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { PortalAuthFrame } from "../minha-pediatron/PortalAuthFrame";

export default async function ResetPasswordPage({ searchParams }: { searchParams?: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = params?.token ?? "";

  return (
    <PortalAuthFrame>
          <h1 className="text-3xl font-black text-white">Defina uma nova senha.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">O link é de uso único e expira por segurança.</p>
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <div className="mt-8 rounded-md border border-red-300/25 bg-red-400/10 p-4 text-sm font-semibold text-red-100">
              Link inválido. Solicite uma nova redefinição de senha.
            </div>
          )}
    </PortalAuthFrame>
  );
}
