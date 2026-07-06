import type { ReactNode } from "react";
import { Activity, ArrowRight, CheckCircle2 } from "lucide-react";
import { CalculatorShell, type ProductNavKey } from "@/components/CalculatorShell";

type ProductMockPageProps = {
  active: ProductNavKey;
  eyebrow: string;
  title: string;
  description: string;
  primaryMetric: string;
  secondaryMetric: string;
  sections: Array<{
    title: string;
    description: string;
    items: string[];
  }>;
};

function MockCard({ title, description, items }: ProductMockPageProps["sections"][number]) {
  return (
    <article className="rounded-xl border border-cyan-300/15 bg-slate-950/75 p-4 shadow-2xl shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
        </div>
        <span className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100">
          Preview
        </span>
      </div>
      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2 rounded-md border border-cyan-300/10 bg-slate-900/65 p-3 text-sm font-semibold text-slate-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function MetricTile({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-cyan-300/15 bg-slate-950/75 p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-cyan-100">{value}</p>
      {children ? <p className="mt-2 text-sm leading-6 text-slate-400">{children}</p> : null}
    </div>
  );
}

export function ProductMockPage({ active, eyebrow, title, description, primaryMetric, secondaryMetric, sections }: ProductMockPageProps) {
  return (
    <CalculatorShell active={active}>
      <div className="grid max-w-full min-w-0 gap-5 px-3 py-5 sm:px-6 lg:px-8">
        <header className="rounded-xl border border-cyan-300/15 bg-slate-950/75 p-4 shadow-2xl shadow-black/20 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-sm font-black text-cyan-200">
                <Activity className="h-4 w-4" aria-hidden="true" />
                {eyebrow}
              </p>
              <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight text-white sm:text-4xl">{title}</h1>
              <p className="mt-4 max-w-3xl text-sm font-medium leading-7 text-slate-300 sm:text-base">{description}</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md border border-cyan-300/15 bg-cyan-300/[0.04] px-3 py-2 text-xs font-black text-cyan-100">
              Fluxo em validação
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2">
          <MetricTile label="Entrada clínica" value={primaryMetric}>
            Estrutura visual preparada para consulta rápida durante atendimento pediátrico.
          </MetricTile>
          <MetricTile label="Saída esperada" value={secondaryMetric}>
            Cards e tabelas compactas no mesmo padrão visual da Folha PCR.
          </MetricTile>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          {sections.map((section) => (
            <MockCard key={section.title} {...section} />
          ))}
        </section>
      </div>
    </CalculatorShell>
  );
}
