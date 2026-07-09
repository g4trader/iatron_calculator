"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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

function ProductNavLinks({
  active,
  mobile = false,
  onNavigate
}: {
  active: ProductNavKey;
  mobile?: boolean;
  onNavigate: (label: string, href: string) => void;
}) {
  return (
    <>
      {links.map((item) => {
        const Icon = item.icon;
        const selected = active === item.key;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onClick={() => onNavigate(item.label, item.href)}
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
  const pathname = usePathname();
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);

  useEffect(() => {
    setLoadingLabel(null);
  }, [pathname]);

  function handleNavigate(label: string, href: string) {
    if (pathname !== href) setLoadingLabel(label);
  }

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#050816] text-slate-100">
      {loadingLabel ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/65 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-cyan-300/20 bg-slate-950 p-5 shadow-2xl shadow-cyan-950/40">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
              <div>
                <p className="text-sm font-black text-white">Carregando produto</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">{loadingLabel}</p>
              </div>
            </div>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-1/2 animate-[pulse_0.8s_ease-in-out_infinite] rounded-full bg-cyan-300" />
            </div>
          </div>
        </div>
      ) : null}
      <div className="mx-auto grid min-h-screen w-full max-w-full min-w-0 lg:max-w-[1500px] lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="no-print min-w-0 border-b border-cyan-300/10 bg-slate-950/80 px-3 py-4 backdrop-blur sm:px-4 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:h-dvh lg:w-[260px] lg:flex-col lg:border-b-0 lg:border-r">
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
                  <ProductNavLinks active={active} mobile onNavigate={handleNavigate} />
                  <ProductUserPanel mobile />
                </nav>
              </details>
            </div>
          </div>

          <div className="hidden min-h-0 flex-1 lg:flex lg:flex-col">
            <div className="mt-8 flex items-center justify-end">{headerActions}</div>

            <nav className="mt-8 grid min-w-0 gap-2">
              <ProductNavLinks active={active} onNavigate={handleNavigate} />
            </nav>

            <div className="mt-auto pt-6">
              <ProductUserPanel />
            </div>
          </div>
        </aside>

        <section className="min-w-0 max-w-full overflow-x-hidden lg:col-start-2">{children}</section>
      </div>
    </main>
  );
}
