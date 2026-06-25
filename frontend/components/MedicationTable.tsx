"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { MedicationResult } from "@/types/calculations";
import { ml, mlh } from "@/lib/format";

type Props = {
  medications: MedicationResult[];
  filterLabel?: string;
};

export function MedicationTable({ medications, filterLabel = "Filtrar medicação" }: Props) {
  const [query, setQuery] = useState("");
  const [onlySmallDoses, setOnlySmallDoses] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredMedications = useMemo(() => {
    return medications.filter((item) => {
      const haystack = [
        item.name,
        item.presentation,
        item.route ?? "",
        item.notes.join(" "),
        item.category
      ].join(" ").toLowerCase();

      return (!normalizedQuery || haystack.includes(normalizedQuery)) && (!onlySmallDoses || item.isLessThan1Ml);
    });
  }, [medications, normalizedQuery, onlySmallDoses]);

  return (
    <div className="grid gap-3">
      <div className="rounded-lg border border-cyan-300/15 bg-slate-950/65 p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="relative block flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={filterLabel}
              className="h-11 w-full rounded-md border border-cyan-300/15 bg-slate-900/80 pl-10 pr-10 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/5 hover:text-white"
                aria-label="Limpar filtro"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </label>

          <div className="flex items-center justify-between gap-2 md:justify-end">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              {filteredMedications.length}/{medications.length}
            </div>
            <button
              type="button"
              onClick={() => setOnlySmallDoses((value) => !value)}
              className={`h-9 rounded-md border px-3 text-xs font-bold transition ${
                onlySmallDoses
                  ? "border-amber-300 bg-amber-300 text-slate-950"
                  : "border-cyan-300/15 bg-slate-900/70 text-slate-300 hover:border-cyan-300/40"
              }`}
            >
              &lt; 1 ml
            </button>
          </div>
        </div>
      </div>

      {filteredMedications.length === 0 ? (
        <div className="rounded-md border border-cyan-300/15 bg-slate-950/70 p-4 text-sm text-slate-300">
          Nenhuma medicação encontrada para o filtro atual.
        </div>
      ) : null}

      <div className="grid gap-2 md:hidden">
        {filteredMedications.map((item) => (
          <article
            key={item.id}
            className={`rounded-md border p-3 ${
              item.isLessThan1Ml
                ? "border-amber-300/35 bg-amber-300/10"
                : "border-cyan-300/15 bg-slate-950/70"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-white">{item.name}</h3>
                <p className="text-xs text-slate-400">{item.presentation}{item.route ? ` · ${item.route}` : ""}</p>
              </div>
              {item.isLessThan1Ml ? (
                <span className="rounded-md bg-amber-300 px-2 py-1 text-xs font-black text-slate-950">{item.ui100} UI</span>
              ) : null}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md bg-slate-900/80 p-2">
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Volume</dt>
                <dd className="mt-1 font-black text-white">{ml(item.volumeMl)}</dd>
              </div>
              <div className="rounded-md bg-slate-900/80 p-2">
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Administrar</dt>
                <dd className="mt-1 font-black text-emerald-300">{ml(item.administeredVolumeMl)}</dd>
              </div>
              <div className="rounded-md bg-slate-900/80 p-2">
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Diluição</dt>
                <dd className="mt-1 font-semibold text-slate-200">{ml(item.dilutionMl)}</dd>
              </div>
              <div className="rounded-md bg-slate-900/80 p-2">
                <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Velocidade</dt>
                <dd className="mt-1 font-black text-emerald-300">{mlh(item.infusionRateMlH)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-md border border-cyan-300/15 shadow-inner md:block">
        <table className="min-w-[860px] w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-950 text-left text-xs uppercase tracking-[0.12em] text-cyan-100">
            <th className="border-b border-slate-800 p-3 font-semibold">Medicação</th>
            <th className="border-b border-slate-800 p-3 font-semibold">Apresentação</th>
            <th className="border-b border-slate-800 p-3 font-semibold">Via/uso</th>
            <th className="border-b border-slate-800 p-3 font-semibold">Volume</th>
            <th className="border-b border-slate-800 p-3 font-semibold">Diluição</th>
            <th className="border-b border-slate-800 p-3 font-semibold">Volume final</th>
            <th className="border-b border-slate-800 p-3 font-semibold text-emerald-100">Administrar</th>
            <th className="border-b border-slate-800 p-3 font-semibold text-emerald-100">Velocidade</th>
          </tr>
        </thead>
        <tbody>
          {filteredMedications.map((item) => (
            <tr key={item.id} className={item.isLessThan1Ml ? "bg-amber-300/10" : "odd:bg-slate-950/40 even:bg-slate-900/50"}>
              <td className="border-b border-cyan-300/10 p-3 font-semibold text-slate-100">
                {item.name}
                {item.notes.length ? <p className="mt-1 text-xs font-normal text-amber-200">{item.notes[0]}</p> : null}
              </td>
              <td className="border-b border-cyan-300/10 p-3 text-slate-300">{item.presentation}</td>
              <td className="border-b border-cyan-300/10 p-3 text-slate-300">{item.route ?? "-"}</td>
              <td className="border-b border-cyan-300/10 p-3 font-semibold text-white">{ml(item.volumeMl)}</td>
              <td className="border-b border-cyan-300/10 p-3 text-slate-300">{ml(item.dilutionMl)}</td>
              <td className="border-b border-cyan-300/10 p-3 text-slate-300">{ml(item.finalVolumeMl)}</td>
              <td className="border-b border-cyan-300/10 p-3 font-bold text-emerald-300">{ml(item.administeredVolumeMl)}</td>
              <td className="border-b border-cyan-300/10 p-3 font-bold text-emerald-300">{mlh(item.infusionRateMlH)}</td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}
