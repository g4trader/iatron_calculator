import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, Droplets, FileText, Menu, Pill, Syringe } from "lucide-react";
import { ProductUserPanel } from "@/components/ProductUserPanel";

export type ProductNavKey = "prescription" | "doses" | "fluids" | "intubation" | "pcr";

type CalculatorShellProps = {
  active?: ProductNavKey;
  children: ReactNode;
  headerActions?: ReactNode;
};

const links = [
  { href: "/dashboard/modelo-prescricao", label: "Modelo de prescrição", key: "prescription", icon: FileText },
  { href: "/dashboard/doses-medicacoes", label: "Cálculo de doses de medicações (Top 100)", key: "doses", icon: Pill },
  { href: "/dashboard/soroterapia", label: "Cálculo de soroterapia", key: "fluids", icon: Droplets },
  { href: "/dashboard/intubacao-rapida", label: "Sequência rápida de intubação", key: "intubation", icon: Syringe },
  { href: "/dashboard/pcr", label: "Folha de PCR", key: "pcr", icon: Activity }
];

function ProductNavLinks({ active, mobile = false }: { active: ProductNavKey; mobile?: boolean }) {
  return (
    <>
      {links.map((item) => {
        const Icon = item.icon;
        const selected = active === item.key;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold transition ${
              mobile ? "w-full justify-start" : "min-w-0 shrink"
            } ${
              selected
                ? "border-cyan-300/40 bg-cyan-300 text-slate-950"
                : "border-cyan-300/10 bg-slate-900/60 text-slate-300 hover:border-cyan-300/30 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}

export function CalculatorShell({ active = "pcr", children, headerActions }: CalculatorShellProps) {
  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#050816] text-slate-100">
      <div className="mx-auto grid min-h-screen w-full max-w-full min-w-0 lg:max-w-[1500px] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="no-print min-w-0 border-b border-cyan-300/10 bg-slate-950/80 px-3 py-4 backdrop-blur sm:px-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 lg:block">
            <Link href="/dashboard" className="text-xl font-black text-cyan-200">iatron.PED</Link>
            <div className="flex items-center gap-2 lg:hidden">
              {headerActions}
              <details className="group relative lg:hidden">
                <summary className="inline-flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md border border-cyan-300/15 bg-slate-900/70 text-cyan-100 transition hover:border-cyan-300/40 hover:text-white [&::-webkit-details-marker]:hidden">
                  <Menu className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only">Abrir menu</span>
                </summary>
                <nav className="absolute right-0 z-50 mt-3 grid w-[min(86vw,340px)] gap-2 rounded-xl border border-cyan-300/15 bg-slate-950/95 p-3 shadow-2xl shadow-black/40 backdrop-blur">
                  <ProductNavLinks active={active} mobile />
                  <ProductUserPanel mobile />
                </nav>
              </details>
            </div>
          </div>

          <div className="hidden min-h-0 flex-1 lg:flex lg:flex-col">
            <div className="mt-8 flex items-center justify-end">{headerActions}</div>

            <nav className="mt-8 grid min-w-0 gap-2">
              <ProductNavLinks active={active} />
            </nav>

            <div className="mt-6 rounded-md border border-red-300/20 bg-red-950/30 p-3 text-xs font-medium leading-5 text-red-100">
              Ferramenta de apoio. Conferir protocolo institucional e avaliação clínica antes da administração.
            </div>

            <div className="mt-auto pt-6">
              <ProductUserPanel />
            </div>
          </div>
        </aside>

        <section className="min-w-0 max-w-full overflow-x-hidden">{children}</section>
      </div>
    </main>
  );
}
