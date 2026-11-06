import Link from "next/link";
import { ResendVerificationForm } from "@/components/auth/ResendVerificationForm";
import { NeuralCard, SaaSPage } from "@/components/saas/SaaSChrome";

export default function ResendVerificationPage() {
  return (
    <SaaSPage>
      <div className="mx-auto grid min-h-screen max-w-md place-items-center px-4 py-10">
        <NeuralCard className="w-full p-6">
          <Link href="/" className="mb-8 block text-sm font-black text-cyan-200">iatron.PED</Link>
          <h1 className="text-3xl font-black text-white">Reenviar verificação.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Informe o email cadastrado. Se houver uma conta pendente, enviaremos um novo link.</p>
          <ResendVerificationForm />
        </NeuralCard>
      </div>
    </SaaSPage>
  );
}
