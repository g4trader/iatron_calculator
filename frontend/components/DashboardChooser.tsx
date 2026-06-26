import Link from "next/link";
import { Activity, ArrowRight, Pill } from "lucide-react";
import { CalculatorShell } from "@/components/CalculatorShell";
import { showCompleteCalculator } from "@/lib/features";

export function DashboardChooser() {
  return (
    <CalculatorShell active="home">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-black text-cyan-200">MVP Folha PCR</p>
          <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">Folha PCR para plantão pediátrico.</h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-300">
            A experiência atual do iatron.PED é focada na Folha PCR: entubação, parada cardíaca, drogas úteis, desfibrilação e dados operacionais para uso rápido.
          </p>
        </div>

        <div className={`grid gap-4 ${showCompleteCalculator ? "md:grid-cols-2" : ""}`}>
          <Link href="/dashboard/pcr" className="group rounded-xl border border-cyan-300/15 bg-slate-950/75 p-5 shadow-2xl shadow-black/20 transition hover:border-cyan-300/45">
            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-cyan-300 text-slate-950">
                <Activity className="h-6 w-6" aria-hidden="true" />
              </span>
              <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-200" aria-hidden="true" />
            </div>
            <h2 className="mt-6 text-2xl font-black text-white">Folha PCR</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Réplica da planilha usada no dia a dia para entubação, parada cardíaca, drogas úteis e desfibrilação.
            </p>
          </Link>

          {showCompleteCalculator ? (
            <Link href="/dashboard/completa" className="group rounded-xl border border-cyan-300/15 bg-slate-950/75 p-5 shadow-2xl shadow-black/20 transition hover:border-cyan-300/45">
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-950">
                  <Pill className="h-6 w-6" aria-hidden="true" />
                </span>
                <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-200" aria-hidden="true" />
              </div>
              <h2 className="mt-6 text-2xl font-black text-white">Calculadora completa</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Motor ampliado com medicações de emergência pediátrica, infusões, materiais de via aérea e acesso.
              </p>
            </Link>
          ) : null}
        </div>
      </div>
    </CalculatorShell>
  );
}
