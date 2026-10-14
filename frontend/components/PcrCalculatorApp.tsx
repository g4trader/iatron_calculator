"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, FileText, Calculator, Loader2 } from "lucide-react";
import { CalculatorShell } from "@/components/CalculatorShell";
import { InputForm } from "@/components/InputForm";
import { PrintButton } from "@/components/PrintButton";
import { AlertBanner } from "@/components/design-system";
import { calculatePcr } from "@/lib/api";
import type {
  CalculationRequest,
  PcrCalculationResponse,
  PcrDrug,
  PcrMetric,
} from "@/types/calculations";

function validate(
  values: CalculationRequest,
): Partial<Record<keyof CalculationRequest, string>> {
  const errors: Partial<Record<keyof CalculationRequest, string>> = {};
  if (!Number.isFinite(values.pesoKg) || values.pesoKg <= 0)
    errors.pesoKg = "Informe um peso maior que 0.";
  if (!Number.isInteger(values.idadeAnos) || values.idadeAnos < 0)
    errors.idadeAnos = "Informe idade em anos maior ou igual a 0.";
  if (
    !Number.isInteger(values.idadeMeses) ||
    values.idadeMeses < 0 ||
    values.idadeMeses > 11
  )
    errors.idadeMeses = "Informe meses entre 0 e 11.";
  return errors;
}

function PcrDrugGrid({
  items,
  labelledBy,
}: {
  items: PcrDrug[];
  labelledBy: string;
}) {
  return (
    <table className="ped-drug-table" aria-labelledby={labelledBy} role="table">
      <thead>
        <tr role="row">
          <th scope="col">Medicação / apresentação</th>
          <th scope="col">Dose</th>
          <th scope="col">Volume</th>
          <th scope="col">Diluição/observação</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr
            key={item.id}
            role="row"
            className={item.isLessThan1Ml ? "ped-small-volume" : undefined}
          >
            <th scope="row" className="ped-drug-identity">
              <h3>{item.name}</h3>
              <span>{item.presentation}</span>
            </th>
            <td className="ped-drug-dose">
              <span className="ped-data-label">Dose</span>
              <strong>{item.dose}</strong>
            </td>
            <td className="ped-drug-amount">
              <span className="ped-data-label">Volume</span>
              <strong className="ped-drug-volume">{item.volume}</strong>
              {item.ui100 != null && (
                <p className="ped-ui100">{item.ui100} UI (seringa de 100 UI)</p>
              )}
            </td>
            <td className="ped-drug-instructions">
              {item.dilution != null && <p>{item.dilution}</p>}
              {item.note != null && (
                <p className="ped-drug-note">{item.note}</p>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatDate(value: string) {
  return value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR")
    : "-";
}

function formatAgeWeight(
  input: CalculationRequest | PcrCalculationResponse["input"],
) {
  const weight = Number.isFinite(input.pesoKg) ? `${input.pesoKg}kg` : "--kg";
  const years = Number.isFinite(input.idadeAnos)
    ? `${input.idadeAnos}a`
    : "--a";
  const months = Number.isFinite(input.idadeMeses)
    ? `${input.idadeMeses}m`
    : "--m";
  return `${years} ${months} ${weight}`;
}

function PcrPrintMetricTable({
  title,
  items,
}: {
  title: string;
  items: PcrMetric[];
}) {
  return (
    <section className="print-report-section">
      <h2>{title}</h2>
      <table>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <th>{item.label}</th>
              <td>
                {item.value}
                {item.unit ? ` ${item.unit}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function PcrPrintDrugTable({
  title,
  items,
}: {
  title: string;
  items: PcrDrug[];
}) {
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
              <td>
                <strong>{item.volume}</strong>
                {item.ui100 != null ? ` (${item.ui100} UI)` : ""}
              </td>
              <td>
                {[item.dilution, item.note].filter(Boolean).join(" · ") || "-"}
              </td>
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
  result,
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
              <td>
                {result.input.idadeAnos} anos e {result.input.idadeMeses} meses
                ({result.input.idadeTotalMeses} meses)
              </td>
            </tr>
          </tbody>
        </table>
      </header>

      <PcrPrintMetricTable title="Via aérea" items={result.airway} />
      <PcrPrintMetricTable title="Desfibrilação" items={result.shock} />
      <PcrPrintDrugTable title="Parada cardíaca" items={result.cardiacArrest} />
      <PcrPrintDrugTable title="Entubação" items={result.intubation} />
      <PcrPrintDrugTable title="Agentes de reversão" items={result.reversal} />
      <PcrPrintDrugTable
        title="Outras drogas úteis"
        items={result.usefulDrugs}
      />

      {result.warnings.map((warning) => (
        <div key={warning} className="print-report-alert">
          {warning}
        </div>
      ))}
    </div>
  );
}

export function PcrCalculatorApp() {
  const [values, setValues] = useState<CalculationRequest>({
    pesoKg: Number.NaN,
    idadeAnos: Number.NaN,
    idadeMeses: Number.NaN,
  });
  const [patientName, setPatientName] = useState("");
  const [calculationDate, setCalculationDate] = useState("");
  const [result, setResult] = useState<PcrCalculationResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showCalculating, setShowCalculating] = useState(false);
  const requestIdRef = useRef(0);
  const errors = useMemo(() => validate(values), [values]);
  const canCalculate = Object.keys(errors).length === 0;
  const visibleErrors = Object.fromEntries(
    Object.entries(errors).filter(
      ([key]) => !Number.isNaN(values[key as keyof CalculationRequest]),
    ),
  );
  const calculationStatus =
    isCalculating || (canCalculate && !result)
      ? "calculating"
      : result && canCalculate
        ? "calculated"
        : "fill";

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
        setApiError(
          error instanceof Error
            ? error.message
            : "Erro inesperado ao calcular.",
        );
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
      <PcrPrintReport
        patientName={patientName}
        calculationDate={calculationDate}
        result={result}
      />
      <div className="pcr-calculator-surface no-print ped-pcr">
        <header className="ped-page-heading">
          <h1>Entubação e PCR</h1>
          <p>Via aérea, desfibrilação e medicações em uma folha de consulta.</p>
        </header>

        <section
          className="ped-card ped-patient-card"
          aria-labelledby="patient-title"
        >
          <h2 id="patient-title" className="ped-card-title">
            <Activity aria-hidden="true" />
            Dados do paciente
          </h2>
          <div className="ped-patient-identity">
            <label>
              Nome do paciente
              <input
                value={patientName}
                onChange={(event) => setPatientName(event.target.value)}
                placeholder="Nome completo"
                type="text"
                autoComplete="off"
              />
            </label>
            <label>
              Data
              <input
                value={calculationDate}
                onChange={(event) => setCalculationDate(event.target.value)}
                type="date"
              />
            </label>
          </div>
          <InputForm
            values={values}
            errors={visibleErrors}
            onChange={setValues}
            calculationStatus={calculationStatus}
            embedded
            hideStatus
          />
          <button
            type="button"
            className="ped-button ped-button-primary ped-calculate"
            disabled={!canCalculate || isCalculating}
            onClick={runCalculation}
          >
            {showCalculating ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Calculator aria-hidden="true" />
            )}
            {showCalculating
              ? "Calculando Folha PCR…"
              : "Calcular e gerar resultados"}
          </button>
          <p className="ped-form-status" role="status">
            {apiError
              ? "Não foi possível atualizar o resultado."
              : isCalculating
                ? "Processando idade, peso, via aérea, choque e medicações."
                : result && canCalculate
                  ? "Resultados atualizados. Confira as informações abaixo."
                  : "Preencha idade, meses e peso. O cálculo também é atualizado automaticamente."}
          </p>
        </section>

        <section
          id="resumo"
          className="ped-card ped-result-summary"
          aria-labelledby="result-title"
          aria-busy={isCalculating}
        >
          <h2 id="result-title" className="ped-card-title">
            <FileText aria-hidden="true" />
            Resultado da análise
          </h2>

          {apiError ? (
            <div className="ped-api-error" role="alert">
              {apiError}
            </div>
          ) : null}
          {result ? (
            <div className="ped-clinical-summary">
              <dl className="ped-summary-identity">
                <div className="ped-summary-name">
                  <dt>Paciente</dt>
                  <dd>{patientName.trim() || "Não informado"}</dd>
                </div>
                <div>
                  <dt>Data</dt>
                  <dd>
                    {calculationDate ? formatDate(calculationDate) : "--"}
                  </dd>
                </div>
                <div>
                  <dt>Idade e Peso</dt>
                  <dd>{formatAgeWeight(result.input)}</dd>
                </div>
              </dl>
              <dl className="ped-summary-values">
                <div>
                  <dt>Tubo</dt>
                  <dd>
                    {result.airway.find((item) => item.id === "tubo")?.value ??
                      "--"}
                    {result.airway.find((item) => item.id === "tubo")?.unit
                      ? ` ${result.airway.find((item) => item.id === "tubo")?.unit}`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt>Choque inicial</dt>
                  <dd>{result.shock[0].value} J</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="ped-empty-state">
              <FileText aria-hidden="true" />
              <div>
                <h3>Preencha os dados do paciente</h3>
                <p>
                  Informe idade, meses e peso para consultar a Folha PCR
                  calculada.
                </p>
              </div>
            </div>
          )}
        </section>

        {result ? (
          <div className="ped-results">
            <section
              className="ped-clinical-alerts"
              aria-labelledby="warnings-title"
            >
              <h2 id="warnings-title">Alertas importantes</h2>
              {result.warnings.map((warning) => (
                <AlertBanner key={warning}>{warning}</AlertBanner>
              ))}
            </section>
            <nav className="ped-result-nav" aria-label="Grupos de resultados">
              <a href="#via-aerea">Via aérea</a>
              <a href="#choques">Choques</a>
              <a href="#drogas">Drogas</a>
              <a href="#entubacao">Entubação</a>
              <a href="#reversao">Reversão</a>
              <a href="#outras">Outras drogas</a>
            </nav>
            {[
              {
                id: "via-aerea",
                title: "Via aérea",
                items: result.airway,
                next: "choques",
                nextTitle: "Desfibrilação",
              },
              {
                id: "choques",
                title: "Desfibrilação",
                items: result.shock,
                next: "drogas",
                nextTitle: "Parada cardíaca",
              },
            ].map((group) => (
              <section
                id={group.id}
                className="ped-result-group"
                key={group.id}
                aria-labelledby={`${group.id}-title`}
              >
                <div className="ped-group-heading">
                  <h2 id={`${group.id}-title`}>{group.title}</h2>
                  <a href="#resumo">Voltar ao resumo ↑</a>
                </div>
                <dl className="ped-metric-list">
                  {group.items.map((item) => (
                    <div key={item.id}>
                      <dt>{item.label}</dt>
                      <dd>
                        {item.value}
                        {item.unit ? ` ${item.unit}` : ""}
                      </dd>
                    </div>
                  ))}
                </dl>
                <a className="ped-next-group" href={`#${group.next}`}>
                  Próximo grupo: {group.nextTitle} →
                </a>
              </section>
            ))}
            {[
              {
                id: "drogas",
                title: "Parada cardíaca",
                items: result.cardiacArrest,
                next: "entubacao",
                nextTitle: "Entubação",
              },
              {
                id: "entubacao",
                title: "Entubação",
                items: result.intubation,
                next: "reversao",
                nextTitle: "Agentes de reversão",
              },
              {
                id: "reversao",
                title: "Agentes de reversão",
                items: result.reversal,
                next: "outras",
                nextTitle: "Outras drogas úteis",
              },
              {
                id: "outras",
                title: "Outras drogas úteis",
                items: result.usefulDrugs,
                next: "resumo",
                nextTitle: "Resumo",
              },
            ].map((group) => (
              <section
                id={group.id}
                className="ped-result-group"
                key={group.id}
                aria-labelledby={`${group.id}-title`}
              >
                <div className="ped-group-heading">
                  <h2 id={`${group.id}-title`}>{group.title}</h2>
                  <a href="#resumo">Voltar ao resumo ↑</a>
                </div>
                <PcrDrugGrid
                  items={group.items}
                  labelledBy={`${group.id}-title`}
                />
                <a className="ped-next-group" href={`#${group.next}`}>
                  {group.next === "resumo"
                    ? "Voltar ao resumo ↑"
                    : `Próximo grupo: ${group.nextTitle} →`}
                </a>
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </CalculatorShell>
  );
}
