import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { NeuralCard, SaaSPage } from "@/components/saas/SaaSChrome";
import { getCurrentUser } from "@/lib/authz";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <SaaSPage>
      <div className="mx-auto grid min-h-screen max-w-md place-items-center px-4 py-10">
        <NeuralCard className="w-full p-6">
          <Link href="/" className="mb-8 block text-sm font-black text-cyan-200">iatron.PED</Link>
          <h1 className="text-3xl font-black text-white">Crie sua conta clínica.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Após o cadastro, enviaremos um link de verificação para liberar o acesso.</p>
          <RegisterForm />
        </NeuralCard>
      </div>
    </SaaSPage>
  );
}
