import Link from "next/link";
import { Activity, ArrowRight, Droplets, FileText, Pill, Syringe } from "lucide-react";
import { CalculatorShell } from "@/components/CalculatorShell";

export function DashboardChooser() {
  const productCards = [
    {
      href: "/dashboard/modelo-prescricao",
      title: "Modelo de prescrição",
      description: "Estrutura para organizar identificação, conduta, medicações, cuidados e conferência.",
      Icon: FileText
    },
    {
      href: "/dashboard/doses-medicacoes",
      title: "Cálculo de doses de medicações (Top 100)",
      description: "Base visual para consulta rápida das principais medicações pediátricas por peso.",
      Icon: Pill
    },
    {
      href: "/dashboard/soroterapia",
      title: "Cálculo de soroterapia",
      description: "Mockup para volume, manutenção, reposição e velocidade de infusão.",
      Icon: Droplets
    },
    {
      href: "/dashboard/intubacao-rapida",
      title: "Sequência rápida de intubação",
      description: "Checklist operacional para preparação, medicações, execução e pós-intubação.",
      Icon: Syringe
    },
    {
      href: "/dashboard/pcr",
      title: "Folha de PCR",
      description: "Fluxo atual para entubação, parada cardíaca, drogas úteis e desfibrilação.",
      Icon: Activity
    }
  ];

  return (
    <CalculatorShell active="pcr">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-black text-cyan-200">iatron.PED</p>
          <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">Produtos clínicos para plantão pediátrico.</h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-300">
            A entrada principal continua sendo a Folha de PCR, com módulos complementares em mockup para validação de experiência.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {productCards.map(({ href, title, description, Icon }) => (
            <Link key={href} href={href} className="group rounded-xl border border-cyan-300/15 bg-slate-950/75 p-5 shadow-2xl shadow-black/20 transition hover:border-cyan-300/45">
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-950">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <ArrowRight className="h-5 w-5 text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-200" aria-hidden="true" />
              </div>
              <h2 className="mt-6 text-2xl font-black text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
            </Link>
          ))}
        </div>
      </div>
    </CalculatorShell>
  );
}
