import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, Droplets, FileText, Pill, Syringe } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

export type ProductNavKey = "prescription" | "doses" | "fluids" | "intubation" | "pcr";

type CalculatorShellProps = {
  active?: ProductNavKey;
  children: ReactNode;
};

const links = [
  { href: "/dashboard/modelo-prescricao", label: "Modelo de prescrição", key: "prescription", icon: FileText },
  { href: "/dashboard/doses-medicacoes", label: "Cálculo de doses de medicações (Top 100)", key: "doses", icon: Pill },
  { href: "/dashboard/soroterapia", label: "Cálculo de soroterapia", key: "fluids", icon: Droplets },
  { href: "/dashboard/intubacao-rapida", label: "Sequência rápida de intubação", key: "intubation", icon: Syringe },
  { href: "/dashboard/pcr", label: "Folha de PCR", key: "pcr", icon: Activity }
];

export function CalculatorShell({ active = "pcr", children }: CalculatorShellProps) {
  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#050816] text-slate-100">
      <div className="mx-auto grid min-h-screen w-full max-w-full min-w-0 lg:max-w-[1500px] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="no-print min-w-0 border-b border-cyan-300/10 bg-slate-950/80 px-3 py-4 backdrop-blur sm:px-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 lg:block">
            <Link href="/dashboard" className="text-xl font-black text-cyan-200">iatron.PED</Link>
            <div className="lg:mt-8">
              <LogoutButton />
            </div>
          </div>

          <nav className="mt-4 flex max-w-full min-w-0 gap-2 overflow-x-auto overscroll-x-contain lg:mt-8 lg:grid lg:overflow-visible">
            {links.map((item) => {
              const Icon = item.icon;
              const selected = active === item.key;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex min-w-fit shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold transition lg:min-w-0 lg:shrink ${
                    selected
                      ? "border-cyan-300/40 bg-cyan-300 text-slate-950"
                      : "border-cyan-300/10 bg-slate-900/60 text-slate-300 hover:border-cyan-300/30 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 hidden rounded-md border border-red-300/20 bg-red-950/30 p-3 text-xs font-medium leading-5 text-red-100 lg:block">
            Ferramenta de apoio. Conferir protocolo institucional e avaliação clínica antes da administração.
          </div>
        </aside>

        <section className="min-w-0 max-w-full overflow-x-hidden">{children}</section>
      </div>
    </main>
  );
}
