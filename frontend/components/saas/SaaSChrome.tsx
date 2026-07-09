import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentUser } from "@/lib/authz";
export { NeuralCard, PremiumButton, SaaSPage, Section } from "@/components/saas/SaaSPrimitives";

export async function SaaSNav() {
  const user = await getCurrentUser();

  return (
    <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
      <Link href="/" className="flex items-center gap-2 text-sm font-black text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-300 text-slate-950">
          <BrainCircuit className="h-4 w-4" aria-hidden="true" />
        </span>
        iatron.PED
      </Link>
      <div className="hidden items-center gap-6 text-sm font-medium text-slate-400 md:flex">
        <a href="/#como-funciona" className="transition hover:text-white">Como funciona</a>
        <a href="/#beneficios" className="transition hover:text-white">Benefícios</a>
        <a href="/#planos" className="transition hover:text-white">Planos</a>
      </div>
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <Link href="/dashboard" className="hidden rounded-md px-3 py-2 text-sm font-semibold text-slate-300 transition hover:text-white sm:inline-flex">
              Folha PCR
            </Link>
            <Link href="/organization" className="hidden rounded-md px-3 py-2 text-sm font-semibold text-slate-300 transition hover:text-white sm:inline-flex">
              Organização
            </Link>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" className="hidden rounded-md px-3 py-2 text-sm font-semibold text-slate-300 transition hover:text-white sm:inline-flex">
              Entrar
            </Link>
            <Link href="/checkout" className="rounded-md bg-cyan-300 px-3 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
              Começar
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
