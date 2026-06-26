"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BrainCircuit, ShieldCheck, Sparkles, Zap } from "lucide-react";
import type { CalculationRequest, CalculationResponse } from "@/types/calculations";
import { calculateEmergency } from "@/lib/api";
import { AlertDose } from "@/components/AlertDose";
import { AirwayMaterials } from "@/components/AirwayMaterials";
import { CalculatorShell } from "@/components/CalculatorShell";
import { InputForm } from "@/components/InputForm";
import { MedicationTable } from "@/components/MedicationTable";
import { PrintButton } from "@/components/PrintButton";
import { ResultSection } from "@/components/ResultSection";
import { ShockCard } from "@/components/ShockCard";
import { AlertBanner, FloatingActionBar, MetricCard, SmartAccordion } from "@/components/design-system";

const DISCLAIMER =
  "Ferramenta de apoio ao cálculo. Conferir dose, apresentação, concentração, protocolo institucional e avaliação clínica antes da administração.";

export type SerializedHistoryItem = {
  id: string;
  patientWeight: number;
  ageYears: number;
  ageMonths: number;
  createdAt: string;
};

type CalculatorAppProps = {
  initialHistory?: SerializedHistoryItem[];
  subscription?: {
    status: string;
    plan: string;
    isActive: boolean;
    currentPeriodEnd?: string | null;
    trialEndsAt?: string | null;
  };
};

function validate(values: CalculationRequest): Partial<Record<keyof CalculationRequest, string>> {
  const errors: Partial<Record<keyof CalculationRequest, string>> = {};
  if (!Number.isFinite(values.pesoKg) || values.pesoKg <= 0) errors.pesoKg = "Informe um peso maior que 0.";
  if (!Number.isInteger(values.idadeAnos) || values.idadeAnos < 0) errors.idadeAnos = "Informe idade em anos maior ou igual a 0.";
  if (!Number.isInteger(values.idadeMeses) || values.idadeMeses < 0 || values.idadeMeses > 11) errors.idadeMeses = "Informe meses entre 0 e 11.";
  return errors;
}

export function CalculatorApp({ initialHistory = [], subscription }: CalculatorAppProps) {
  const [values, setValues] = useState<CalculationRequest>({ pesoKg: 15, idadeAnos: 4, idadeMeses: 1 });
  const [result, setResult] = useState<CalculationResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState(initialHistory);
  const errors = useMemo(() => validate(values), [values]);
  const canCalculate = Object.keys(errors).length === 0;

  const runCalculation = useCallback(async () => {
    if (!canCalculate) {
      setResult(null);
      return;
    }
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await calculateEmergency(values);
      setResult(response);
      void saveHistory(response);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Erro inesperado ao calcular.");
    } finally {
      setIsLoading(false);
    }
  }, [canCalculate, values]);

  useEffect(() => {
    if (!canCalculate) {
      setResult(null);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setApiError(null);
      try {
        const response = await calculateEmergency(values);
        if (!controller.signal.aborted) {
          setResult(response);
          void saveHistory(response);
        }
      } catch (error) {
        if (!controller.signal.aborted) setApiError(error instanceof Error ? error.message : "Erro inesperado ao calcular.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [canCalculate, values]);

  const medications = result?.medications.filter((item) => item.category !== "continuous_infusion") ?? [];
  const infusions = result?.medications.filter((item) => item.category === "continuous_infusion") ?? [];
  const smallDoseCount = result?.medications.filter((item) => item.isLessThan1Ml).length ?? 0;

  async function saveHistory(response: CalculationResponse) {
    try {
      const res = await fetch("/api/calculation-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientWeight: response.input.pesoKg,
          ageYears: response.input.idadeAnos,
          ageMonths: response.input.idadeMeses,
          calculatedData: response
        })
      });
      if (!res.ok) return;
      const data = await res.json();
      setHistory((items) => [
        {
          id: data.item.id,
          patientWeight: data.item.patientWeight,
          ageYears: data.item.ageYears,
          ageMonths: data.item.ageMonths,
          createdAt: data.item.createdAt
        },
        ...items.filter((item) => item.id !== data.item.id)
      ].slice(0, 8));
    } catch {
      // Historico e conveniente, mas nao deve bloquear o calculo clinico.
    }
  }

  async function clearHistory() {
    await fetch("/api/calculation-history", { method: "DELETE" });
    setHistory([]);
  }

  return (
    <CalculatorShell active="complete">
      <header className="neural-surface border-b border-cyan-300/20 text-white">
        <div className="neural-content mx-auto grid w-full max-w-7xl min-w-0 gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 max-w-3xl">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex max-w-full items-center gap-2 rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-[11px] font-black tracking-[0.12em] text-cyan-200 sm:h-8 sm:text-xs">
                  <BrainCircuit className="h-4 w-4" aria-hidden="true" />
                  <span className="min-w-0 truncate">iatron.PED Neural Core</span>
                </span>
                <span className="inline-flex max-w-full items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-[11px] font-black tracking-[0.12em] text-emerald-200 sm:h-8 sm:text-xs">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span className="min-w-0 truncate">Clinical Support</span>
                </span>
              </div>
              <h1 className="max-w-full text-[2rem] font-black leading-tight tracking-normal text-white sm:text-4xl">
                Calculadora de Emergência Pediátrica
              </h1>
              <p className="mt-2 text-base font-medium text-slate-300">Medicações, via aérea e desfibrilação</p>
            </div>
            <PrintButton />
          </div>

          <p className="rounded-lg border border-red-300/25 bg-red-950/35 p-3 text-sm font-medium text-red-100 shadow-lg shadow-red-950/20">
            {DISCLAIMER}
          </p>

          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <InputForm values={values} errors={errors} onChange={setValues} onCalculate={runCalculation} canCalculate={canCalculate} />

            <div className="grid min-w-0 gap-3">
              <div className="no-print flex min-w-0 flex-col gap-2 rounded-lg border border-cyan-300/20 bg-slate-950/55 p-3 text-sm text-slate-300 shadow-2xl shadow-cyan-950/20 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0 font-semibold">{canCalculate ? "Resultado instantâneo ativo" : "Cálculo bloqueado"}</span>
                <span className="rounded-md bg-cyan-300 px-2 py-1 text-xs font-black uppercase tracking-[0.12em] text-slate-950">
                  {isLoading ? "Processando" : result ? "Sincronizado" : "Standby"}
                </span>
              </div>

              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <MetricCard label="Peso" value={result ? `${result.input.pesoKg} kg` : "--"} />
                <MetricCard label="Idade total" value={result ? `${result.input.idadeTotalMeses} m` : "--"} />
                <MetricCard label="Doses < 1 ml" value={result ? smallDoseCount : "--"} tone="warning" icon={<AlertTriangle className="h-4 w-4" aria-hidden="true" />} />
                <MetricCard label="Choque inicial" value={result ? `${result.shock.desfibrilacaoPrimeiraDoseJ} J` : "--"} tone="danger" icon={<Zap className="h-4 w-4" aria-hidden="true" />} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:px-8">
        {subscription && !subscription.isActive ? (
          <AlertBanner>
            Plano {subscription.plan}. Assinatura {subscription.status}. Recursos premium completos exigem trial ou assinatura ativa.
          </AlertBanner>
        ) : null}

        <ResultSection title="Últimos cálculos">
          <div className="grid gap-2">
            {history.length === 0 ? (
              <p className="text-sm text-slate-300">Nenhum cálculo salvo ainda.</p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border border-cyan-300/10 bg-slate-900/60 p-3 text-sm">
                  <span className="font-semibold text-white">{item.patientWeight} kg · {item.ageYears}a {item.ageMonths}m</span>
                  <span className="text-slate-400">{new Date(item.createdAt).toLocaleString("pt-BR")}</span>
                </div>
              ))
            )}
            {history.length ? (
              <button type="button" onClick={clearHistory} className="justify-self-start text-sm font-semibold text-cyan-200 hover:text-cyan-100">
                Limpar histórico
              </button>
            ) : null}
          </div>
        </ResultSection>

        {apiError ? <div className="rounded-lg border border-red-300/35 bg-red-400/10 p-4 text-sm font-medium text-red-100">{apiError}</div> : null}

        {result ? (
          <div className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              <ResultSection title="Doses menores que 1 ml" tone="alert">
                <AlertDose medications={result.medications} />
              </ResultSection>

              <ResultSection title="Desfibrilação/Cardioversão">
                <ShockCard shock={result.shock} />
              </ResultSection>
            </div>

            <ResultSection title="Via aérea e acesso">
              <AirwayMaterials materials={result.airwayMaterials} />
            </ResultSection>

            <ResultSection title="Alertas importantes" tone="alert">
              <div className="grid gap-2">
                {result.warnings.map((warning) => (
                  <AlertBanner key={warning}>{warning}</AlertBanner>
                ))}
              </div>
            </ResultSection>

            <SmartAccordion title="Infusões contínuas" defaultOpen>
              <MedicationTable medications={infusions} filterLabel="Filtrar infusão contínua" />
            </SmartAccordion>

            <SmartAccordion title="Medicações" defaultOpen>
              <MedicationTable medications={medications} filterLabel="Filtrar por medicação, apresentação ou via" />
            </SmartAccordion>

            <SmartAccordion title="Resumo de algoritmos">
              <div className="grid gap-3 text-sm text-slate-200 md:grid-cols-3">
                <p className="rounded-md border border-cyan-300/25 bg-cyan-300/10 p-3">
                  <Sparkles className="mb-2 h-4 w-4 text-cyan-200" aria-hidden="true" />
                  Doses calculadas principalmente por peso, com limites máximos aplicados quando definidos.
                </p>
                <p className="rounded-md border border-emerald-300/25 bg-emerald-300/10 p-3">
                  Volumes menores que 1 ml exibem conversão aproximada para seringa de 100 UI.
                </p>
                <p className="rounded-md border border-slate-500/25 bg-slate-800/80 p-3">
                  Materiais de via aérea e acesso seguem regras condicionais por peso e idade em anos.
                </p>
              </div>
            </SmartAccordion>
          </div>
        ) : null}
      </div>
      <FloatingActionBar>
        <button type="button" disabled={!canCalculate} onClick={runCalculation} className="h-11 w-full rounded-md bg-cyan-300 text-sm font-black text-slate-950 disabled:bg-slate-700 disabled:text-slate-400">
          Calcular agora
        </button>
      </FloatingActionBar>
    </CalculatorShell>
  );
}
