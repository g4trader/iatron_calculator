"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { DocumentDetail } from "./DocumentDetail";
import { clinicalCapabilities, type ClinicalCatalog } from "@/lib/clinical-resources";

export function InfusionCatalog({ catalog }: { catalog: ClinicalCatalog }) {
  const [selected, setSelected] = useState(catalog.entries[0].id);
  const entry = catalog.entries.find(e => e.id === selected)!;
  const vasopressin = entry.search.name === "vasopressina";
  return <>
    <header className="cr-heading"><p className="cr-eyebrow">Catálogo documental · 6 drogas</p><h1>Infusão contínua</h1><p>Consulte as transcrições originais. Fórmulas e preparos ainda não foram homologados para cálculo.</p></header>
    <div className="cr-infusion-grid">
      <section className="cr-infusion-controls" aria-label="Consulta e estado da calculadora">
        <label className="cr-drug-select" htmlFor="infusion-drug">Selecionar droga<select id="infusion-drug" value={selected} onChange={e => setSelected(e.target.value)}>{catalog.entries.map(item => <option key={item.id} value={item.id}>{item.raw.name?.trim()}</option>)}</select></label>
        <div className="cr-locked" aria-labelledby="infusion-lock-title">
          <LockKeyhole aria-hidden="true" /><h2 id="infusion-lock-title">Aguardando homologação clínica</h2>
          <p>Não há cálculo de taxa, volume de preparo ou recomendação disponível para esta droga.</p>
          <p id="infusion-lock-reason">A liberação exige revisão externa de cada fórmula e preparo, casos de referência do médico, conferência dimensional e versão do protocolo.</p>
          <fieldset disabled={!clinicalCapabilities(entry.status).calculate} aria-describedby="infusion-lock-reason"><legend>Calculadora indisponível</legend>
            <label>Peso (kg)<input type="number" placeholder="Bloqueado" /></label>
            <label>{vasopressin ? "Dose (mui/kg/min — unidade original)" : "Dose (mcg/kg/min)"}<input type="number" placeholder="Bloqueado" /></label>
            <label>Concentração / preparo<input type="text" placeholder="Protocolo não homologado" /></label>
            <label>Taxa (ml/h)<input type="text" placeholder="Não calculada" /></label>
            <button type="button" className="ped-button ped-button-primary">Calcular infusão — bloqueado</button>
          </fieldset>
          {vasopressin && <p className="cr-unit-alert">Vasopressina é tratada separadamente. Nenhuma conversão entre mUI/UI e mcg é executada.</p>}
        </div>
      </section>
      <DocumentDetail key={entry.id} entry={entry} catalog={catalog} infusion />
    </div>
  </>;
}
