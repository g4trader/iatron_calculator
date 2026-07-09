"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Activity, Zap } from "lucide-react";
import { CalculatorShell } from "@/components/CalculatorShell";
import { InputForm } from "@/components/InputForm";
import { PrintButton } from "@/components/PrintButton";
import { ResultSection } from "@/components/ResultSection";
import { AlertBanner, MetricCard, SmartAccordion } from "@/components/design-system";
import { calculatePcr } from "@/lib/api";
import type { CalculationRequest, PcrCalculationResponse, PcrDrug, PcrMetric } from "@/types/calculations";

function validate(values: CalculationRequest): Partial<Record<keyof CalculationRequest, string>> {
  const errors: Partial<Record<keyof CalculationRequest, string>> = {};
  if (!Number.isFinite(values.pesoKg) || values.pesoKg <= 0) errors.pesoKg = "Informe um peso maior que 0.";
  if (!Number.isInteger(values.idadeAnos) || values.idadeAnos < 0) errors.idadeAnos = "Informe idade em anos maior ou igual a 0.";
  if (!Number.isInteger(values.idadeMeses) || values.idadeMeses < 0 || values.idadeMeses > 11) errors.idadeMeses = "Informe meses entre 0 e 11.";
  return errors;
}

function PcrDrugGrid({ items }: { items: PcrDrug[] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <article key={item.id} className={`rounded-md border p-3 ${item.isLessThan1Ml ? "border-amber-300/35 bg-amber-300/10" : "border-cyan-300/15 bg-slate-950/70"}`}>
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="font-black text-white">{item.name}</h3>
              <p className="text-xs font-medium text-slate-400">{item.presentation} · {item.dose}</p>
              {item.dilution ? <p className="mt-1 text-xs font-semibold text-cyan-100">{item.dilution}</p> : null}
            </div>
            <div className="rounded-md bg-slate-900/80 px-3 py-2 text-left md:text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Volume</p>
              <p className="text-xl font-black text-emerald-300">{item.volume}</p>
            </div>
          </div>
          {item.note ? <p className="mt-2 text-xs font-medium text-amber-100">{item.note}</p> : null}
        </article>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR") : "-";
}

function formatAgeWeight(input: CalculationRequest | PcrCalculationResponse["input"]) {
  const weight = Number.isFinite(input.pesoKg) ? `${input.pesoKg}kg` : "--kg";
  const years = Number.isFinite(input.idadeAnos) ? `${input.idadeAnos}a` : "--a";
  const months = Number.isFinite(input.idadeMeses) ? `${input.idadeMeses}m` : "--m";
  return `${years} ${months} ${weight}`;
}

function PcrPrintMetricTable({ title, items }: { title: string; items: PcrMetric[] }) {
  return (
    <section className="print-report-section">
      <h2>{title}</h2>
      <table>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <th>{item.label}</th>
              <td>{item.value}{item.unit ? ` ${item.unit}` : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function PcrPrintDrugTable({ title, items }: { title: string; items: PcrDrug[] }) {
  return (
    <section className="print-report-section">
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>Medicação</th>
            <th>Apresentação</th>
            <th>Dose</th>
            <th>Volume</th>
            <th>Diluição/observação</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.presentation}</td>
              <td>{item.dose}</td>
              <td><strong>{item.volume}</strong>{item.ui100 ? ` (${item.ui100} UI)` : ""}</td>
              <td>{item.dilution ?? item.note ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function PcrPrintReport({
  patientName,
  calculationDate,
  result
}: {
  patientName: string;
  calculationDate: string;
  result: PcrCalculationResponse | null;
}) {
  if (!result) {
    return (
      <div className="print-only print-report">
        <h1>Folha PCR</h1>
        <p>Nenhum resultado calculado.</p>
      </div>
    );
  }

  return (
    <div className="print-only print-report">
      <header className="print-report-section">
        <h1>Folha PCR - Entubação e PCR</h1>
        <table>
          <tbody>
            <tr>
              <th>Paciente</th>
              <td>{patientName.trim() || "-"}</td>
              <th>Data</th>
              <td>{formatDate(calculationDate)}</td>
            </tr>
            <tr>
              <th>Peso</th>
              <td>{result.input.pesoKg} kg</td>
              <th>Idade</th>
              <td>{result.input.idadeAnos} anos e {result.input.idadeMeses} meses ({result.input.idadeTotalMeses} meses)</td>
            </tr>
          </tbody>
        </table>
      </header>

      <PcrPrintMetricTable title="Via aérea" items={result.airway} />
      <PcrPrintMetricTable title="Desfibrilação" items={result.shock} />
      <PcrPrintDrugTable title="Parada cardíaca" items={result.cardiacArrest} />
      <PcrPrintDrugTable title="Entubação" items={result.intubation} />
      <PcrPrintDrugTable title="Agentes de reversão" items={result.reversal} />
      <PcrPrintDrugTable title="Outras drogas úteis" items={result.usefulDrugs} />

      <div className="print-report-alert">
        Ferramenta de apoio ao cálculo. Conferir dose, apresentação, concentração, protocolo institucional e avaliação clínica antes da administração.
      </div>
    </div>
  );
}

export function PcrCalculatorApp() {
  const [values, setValues] = useState<CalculationRequest>({ pesoKg: 15, idadeAnos: 5, idadeMeses: 2 });
  const [patientName, setPatientName] = useState("");
  const [calculationDate, setCalculationDate] = useState("");
  const [result, setResult] = useState<PcrCalculationResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showCalculating, setShowCalculating] = useState(false);
  const requestIdRef = useRef(0);
  const errors = useMemo(() => validate(values), [values]);
  const canCalculate = Object.keys(errors).length === 0;

  useEffect(() => {
    setCalculationDate(new Date().toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (!isCalculating) {
      setShowCalculating(false);
      return;
    }

    const timeout = window.setTimeout(() => setShowCalculating(true), 350);
    return () => window.clearTimeout(timeout);
  }, [isCalculating]);

  const runCalculation = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (!canCalculate) {
      setResult(null);
      setIsCalculating(false);
      return;
    }
    setApiError(null);
    setIsCalculating(true);
    try {
      const response = await calculatePcr(values);
      if (requestIdRef.current === requestId) setResult(response);
    } catch (error) {
      if (requestIdRef.current === requestId) {
        setApiError(error instanceof Error ? error.message : "Erro inesperado ao calcular.");
      }
    } finally {
      if (requestIdRef.current === requestId) setIsCalculating(false);
    }
  }, [canCalculate, values]);

  useEffect(() => {
    const timeout = window.setTimeout(runCalculation, 250);
    return () => window.clearTimeout(timeout);
  }, [runCalculation]);

  return (
    <CalculatorShell active="pcr" headerActions={<PrintButton iconOnly />}>
      {showCalculating ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/65 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-cyan-300/20 bg-slate-950 p-5 shadow-2xl shadow-cyan-950/40">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
              <div>
                <p className="text-sm font-black text-white">Calculando Folha PCR</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Processando idade, peso, via aérea, choque e medicações.
                </p>
              </div>
            </div>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-1/2 animate-[pulse_0.8s_ease-in-out_infinite] rounded-full bg-cyan-300" />
            </div>
          </div>
        </div>
      ) : null}
      <PcrPrintReport patientName={patientName} calculationDate={calculationDate} result={result} />
      <div className="pcr-calculator-surface no-print grid max-w-full min-w-0 gap-5 px-3 py-5 sm:px-6 lg:px-8">
        <header className="min-w-0 rounded-xl border border-cyan-300/15 bg-slate-950/70 p-4 shadow-2xl shadow-black/20 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-black text-cyan-200">
                <Activity className="h-4 w-4" aria-hidden="true" />
                Folha PCR
              </p>
              <h1 className="mt-3 max-w-full break-words text-2xl font-black leading-tight text-white sm:text-3xl md:text-4xl">Entubação e PCR</h1>
            </div>
          </div>
        </header>

        <section className="min-w-0 rounded-xl border border-cyan-300/15 bg-slate-950/70 p-4 shadow-2xl shadow-black/20 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-cyan-700">
              <Activity className="h-5 w-5 text-cyan-300" aria-hidden="true" />
              <h2 className="text-base font-semibold text-cyan-100">Dados do paciente</h2>
            </div>
            <span className="rounded-md border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-xs font-semibold text-emerald-200">
              Online
            </span>
          </div>

          <div className="grid min-w-0 gap-4">
            <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
              <label className="grid gap-2 text-sm font-semibold text-slate-300">
                Nome do paciente
                <input
                  className="h-12 rounded-md border border-cyan-300/15 bg-slate-900/80 px-3 text-base font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
                  value={patientName}
                  onChange={(event) => setPatientName(event.target.value)}
                  placeholder="Nome completo"
                  type="text"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-300">
                Data
                <input
                  className="h-12 rounded-md border border-cyan-300/15 bg-slate-900/80 px-3 text-base font-semibold text-white outline-none transition focus:border-cyan-300/60"
                  value={calculationDate}
                  onChange={(event) => setCalculationDate(event.target.value)}
                  type="date"
                />
              </label>
            </div>

            <InputForm values={values} errors={errors} onChange={setValues} onCalculate={runCalculation} canCalculate={canCalculate} embedded />
          </div>
        </section>

        <div className="min-w-0 rounded-xl border border-cyan-300/15 bg-slate-950/70 p-4 shadow-2xl shadow-black/20 sm:p-5">
          <p className="inline-flex items-center gap-2 text-sm font-black text-cyan-200">
            <Activity className="h-4 w-4" aria-hidden="true" />
            Folha PCR
          </p>
          <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Identificação e cálculo</h2>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-400">
            Resumo calculado para consulta rápida durante o atendimento.
          </p>
        </div>

        <div className="grid min-w-0 gap-3">
          <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,4fr)_minmax(150px,1fr)]">
            <MetricCard label="Paciente" value={patientName.trim() || "--"} />
            <MetricCard label="Data" value={calculationDate ? formatDate(calculationDate) : "--"} valueClassName="text-2xl sm:text-3xl lg:text-2xl xl:text-3xl" />
          </div>
          <div className="grid min-w-0 gap-3 md:grid-cols-3">
            <MetricCard label="Idade e Peso" value={formatAgeWeight(result?.input ?? values)} />
            <MetricCard label="Tubo" value={result?.airway.find((item) => item.id === "tubo")?.value ?? "--"} />
            <MetricCard label="Choque inicial" value={result ? `${result.shock[0].value} J` : "--"} tone="danger" icon={<Zap className="h-4 w-4" aria-hidden="true" />} />
          </div>
        </div>

        {apiError ? <div className="rounded-lg border border-red-300/35 bg-red-400/10 p-4 text-sm font-medium text-red-100">{apiError}</div> : null}

        {result ? (
          <div className="grid min-w-0 gap-4">
            <ResultSection title="Via aérea">
              <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {result.airway.map((item) => (
                  <div key={item.id} className="rounded-md border border-cyan-300/15 bg-slate-900/70 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
                    <p className="mt-1 text-xl font-black text-cyan-100">{item.value}{item.unit ? ` ${item.unit}` : ""}</p>
                  </div>
                ))}
              </div>
            </ResultSection>

            <div className="grid gap-4 xl:grid-cols-3">
              {result.shock.map((item) => (
                <MetricCard key={item.id} label={item.label} value={`${item.value} ${item.unit ?? ""}`} tone="danger" icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />} />
              ))}
            </div>

            <SmartAccordion title="Parada cardíaca" defaultOpen>
              <PcrDrugGrid items={result.cardiacArrest} />
            </SmartAccordion>
            <SmartAccordion title="Entubação" defaultOpen>
              <PcrDrugGrid items={result.intubation} />
            </SmartAccordion>
            <SmartAccordion title="Agentes de reversão">
              <PcrDrugGrid items={result.reversal} />
            </SmartAccordion>
            <SmartAccordion title="Outras drogas úteis">
              <PcrDrugGrid items={result.usefulDrugs} />
            </SmartAccordion>
            <ResultSection title="Alertas importantes" tone="alert">
              <div className="grid gap-2">
                {result.warnings.map((warning) => <AlertBanner key={warning}>{warning}</AlertBanner>)}
              </div>
            </ResultSection>
          </div>
        ) : null}
      </div>
    </CalculatorShell>
  );
}
