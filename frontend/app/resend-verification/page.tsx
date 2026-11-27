import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { PortalAuthFrame } from "../minha-pediatron/PortalAuthFrame";

export default function ResendVerificationPage() {
  return (
    <PortalAuthFrame>
          <h1 className="text-3xl font-black text-white">Reenviar verificação.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Informe o email cadastrado. Se houver uma conta pendente, enviaremos um novo link.</p>
          <ResendVerificationForm />
    </PortalAuthFrame>
  );
}
