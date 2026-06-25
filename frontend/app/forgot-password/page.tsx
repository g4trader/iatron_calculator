import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { NeuralCard, SaaSPage } from "@/components/saas/SaaSChrome";

export default function ForgotPasswordPage() {
  return (
    <SaaSPage>
      <div className="mx-auto grid min-h-screen max-w-md place-items-center px-4 py-10">
        <NeuralCard className="w-full p-6">
          <Link href="/" className="mb-8 block text-sm font-black text-cyan-200">Iatron</Link>
          <h1 className="text-3xl font-black text-white">Redefina sua senha.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Informe seu email. Se houver uma conta associada, enviaremos um link seguro.</p>
          <ForgotPasswordForm />
        </NeuralCard>
      </div>
    </SaaSPage>
  );
}
