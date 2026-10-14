"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X, ArrowUpRight } from "lucide-react";
import { DocumentDetail, ReviewBadge } from "./DocumentDetail";
import { filterMedications, sourceText, type ClinicalCatalog } from "@/lib/clinical-resources";

export function MedicationLibrary({ catalog }: { catalog: ClinicalCatalog }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [route, setRoute] = useState("");
  const [selected, setSelected] = useState(catalog.entries[0]?.id);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const previousOverflow = useRef("");
  const scrollLocked = useRef(false);
  useEffect(() => () => { if (scrollLocked.current) document.body.style.overflow = previousOverflow.current; }, []);
  const categories = useMemo(() => Array.from(new Set(catalog.entries.map(e => e.raw.category!))).sort((a, b) => a.localeCompare(b, "pt-BR")), [catalog.entries]);
  const routes = useMemo(() => Array.from(new Set(catalog.entries.flatMap(e => (e.raw.route || "").split("/").map(v => v.trim()).filter(Boolean)))).sort(), [catalog.entries]);
  const matches = filterMedications(catalog.entries, query, category, route);
  const entry = matches.find(e => e.id === selected) || matches[0];
  function reset() { setQuery(""); setCategory(""); setRoute(""); }
  function filters(prefix: string) {
    return <div className="cr-filters">
      <label htmlFor={`${prefix}-category`}>Categoria<select id={`${prefix}-category`} value={category} onChange={e => setCategory(e.target.value)}><option value="">Todas as categorias</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
      <label htmlFor={`${prefix}-route`}>Via<select id={`${prefix}-route`} value={route} onChange={e => setRoute(e.target.value)}><option value="">Todas as vias</option>{routes.map(value => <option key={value}>{value}</option>)}</select></label>
      <button className="cr-text-button" onClick={reset}>Limpar busca e filtros</button>
    </div>;
  }
  return <>
    <header className="cr-heading"><p className="cr-eyebrow">Acervo documental</p><h1>Biblioteca de medicamentos</h1><p>69 apresentações · 16 categorias. Consulte os textos originais e as pendências de cada ficha.</p></header>
    <p className="cr-context">Todos os registros aguardam homologação clínica. Esta biblioteca é independente da prévia Top 100 e dos cálculos da Folha PCR.</p>
    <section className="cr-searchbar" aria-label="Busca na biblioteca">
      <label htmlFor="medication-search">Buscar medicamento<Search aria-hidden="true" /><input id="medication-search" type="search" autoComplete="off" placeholder="Nome, categoria, apresentação ou via" value={query} onChange={e => setQuery(e.target.value)} /></label>
      <button ref={trigger} className="cr-filter-trigger" onClick={() => { previousOverflow.current = document.body.style.overflow; scrollLocked.current = true; document.body.style.overflow = "hidden"; dialog.current?.showModal(); }}><SlidersHorizontal aria-hidden="true" />Filtros{(category || route) ? " ativos" : ""}</button>
    </section>
    <div className="cr-desktop-filters">{filters("desktop")}</div>
    <p role="status" aria-live="polite" className="cr-count">{matches.length} {matches.length === 1 ? "apresentação encontrada" : "apresentações encontradas"}{category && ` · ${category}`}{route && ` · Via ${route}`}</p>
    <div className="cr-library-grid">
      <section className="cr-results" aria-label="Resultados da busca">
        {matches.length === 0 ? <div className="cr-empty"><Search aria-hidden="true" /><h2>Nenhuma apresentação encontrada</h2><p>Tente outro nome ou remova os filtros.</p><button className="cr-text-button" onClick={reset}>Limpar busca e filtros</button></div> : <ul>{matches.map(item => <li key={item.id}>
          <Link className="cr-result" href={`/dashboard/biblioteca-medicamentos/${item.id}`} data-entry-id={item.id} aria-current={entry?.id === item.id ? "true" : undefined} onClick={e => {
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && window.matchMedia("(min-width: 1100px)").matches) { e.preventDefault(); setSelected(item.id); requestAnimationFrame(() => panel.current?.querySelector<HTMLHeadingElement>(".cr-detail-title")?.focus()); }
          }}>
            <span className="cr-eyebrow">{item.raw.category}</span><h2>{item.raw.name}</h2><p>{sourceText(item.raw.presentation)}</p><p className="cr-result-route">Via: {sourceText(item.raw.route)}</p><ReviewBadge />
          </Link>
        </li>)}</ul>}
      </section>
      {entry && <section ref={panel} className="cr-preview" aria-label="Ficha selecionada">
        <Link className="cr-page-link" href={`/dashboard/biblioteca-medicamentos/${entry.id}`}>Abrir ficha em página<ArrowUpRight aria-hidden="true" /></Link>
        <DocumentDetail entry={entry} catalog={catalog} />
      </section>}
    </div>
    <dialog ref={dialog} className="cr-filter-dialog" aria-labelledby="filter-title" onClose={() => { scrollLocked.current = false; document.body.style.overflow = previousOverflow.current; trigger.current?.focus(); }} onClick={e => { if (e.target === dialog.current) dialog.current.close(); }} onKeyDown={e => {
      if (e.key !== "Tab") return;
      const targets = Array.from(dialog.current!.querySelectorAll<HTMLElement>("button, select"));
      const first = targets[0], last = targets[targets.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }}>
      <div className="cr-filter-panel"><header><h2 id="filter-title">Filtrar apresentações</h2><button aria-label="Fechar filtros" onClick={() => dialog.current?.close()}><X aria-hidden="true" /></button></header>
        {filters("mobile")}<p role="status">{matches.length} apresentações encontradas</p><button className="ped-button ped-button-primary" onClick={() => dialog.current?.close()}>Ver resultados</button>
      </div>
    </dialog>
  </>;
}
