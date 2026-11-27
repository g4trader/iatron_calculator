import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { PortalAuthFrame } from "../minha-pediatron/PortalAuthFrame";

export default function ForgotPasswordPage() {
  return (
    <PortalAuthFrame>
          <h1 className="text-3xl font-black text-white">Redefina sua senha.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Informe seu email. Se houver uma conta associada, enviaremos um link seguro.</p>
          <ForgotPasswordForm />
    </PortalAuthFrame>
  );
}
