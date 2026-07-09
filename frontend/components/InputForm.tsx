"use client";

import { Activity, CheckCircle2, Loader2 } from "lucide-react";
import type { CalculationRequest } from "@/types/calculations";
import { ClinicalCard, CriticalActionButton, NeuralInput } from "@/components/design-system";

type CalculationStatus = "fill" | "calculating" | "calculated";

type Props = {
  values: CalculationRequest;
  errors: Partial<Record<keyof CalculationRequest, string>>;
  onChange: (values: CalculationRequest) => void;
  onCalculate?: () => void;
  canCalculate?: boolean;
  calculationStatus?: CalculationStatus;
  embedded?: boolean;
};

const statusConfig: Record<CalculationStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  fill: {
    label: "Preencha os dados",
    className: "border-slate-500/25 bg-slate-800/55 text-slate-200",
    Icon: Activity
  },
  calculating: {
    label: "Calculando",
    className: "border-cyan-300/30 bg-cyan-300/10 text-cyan-100",
    Icon: Loader2
  },
  calculated: {
    label: "Calculado",
    className: "border-cyan-300/35 bg-cyan-300/15 text-cyan-100",
    Icon: CheckCircle2
  }
};

export function InputForm({ values, errors, onChange, onCalculate, canCalculate = false, calculationStatus, embedded = false }: Props) {
  function update(key: keyof CalculationRequest, value: string) {
    onChange({ ...values, [key]: value === "" ? Number.NaN : Number(value) });
  }

  const status = calculationStatus ? statusConfig[calculationStatus] : null;
  const StatusIcon = status?.Icon;

  const formContent = (
    <>
      <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
        <NeuralInput label="A" error={errors.idadeAnos} inputMode="numeric" min="0" step="1" type="number" value={Number.isNaN(values.idadeAnos) ? "" : values.idadeAnos} onChange={(event) => update("idadeAnos", event.target.value)} className="px-2 text-xl sm:px-3 sm:text-2xl" />
        <NeuralInput label="M" error={errors.idadeMeses} inputMode="numeric" min="0" max="11" step="1" type="number" value={Number.isNaN(values.idadeMeses) ? "" : values.idadeMeses} onChange={(event) => update("idadeMeses", event.target.value)} className="px-2 text-xl sm:px-3 sm:text-2xl" />
        <NeuralInput label="kg" error={errors.pesoKg} inputMode="decimal" min="0" step="0.1" type="number" value={Number.isNaN(values.pesoKg) ? "" : values.pesoKg} onChange={(event) => update("pesoKg", event.target.value)} className="px-2 text-xl sm:px-3 sm:text-2xl" />
      </div>
      {status && StatusIcon ? (
        <div className="mt-4 flex justify-end">
          <span className={`inline-flex h-11 items-center gap-2 rounded-md border px-4 text-sm font-black ${status.className}`}>
            <StatusIcon className={`h-4 w-4 ${calculationStatus === "calculating" ? "animate-spin" : ""}`} aria-hidden="true" />
            {status.label}
          </span>
        </div>
      ) : (
        <div className="mt-4 flex justify-end">
          <CriticalActionButton
            type="button"
            disabled={!canCalculate}
            onClick={onCalculate}
          >
            Calcular
          </CriticalActionButton>
        </div>
      )}
    </>
  );

  if (embedded) return formContent;

  return (
    <ClinicalCard className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-cyan-700">
          <Activity className="h-5 w-5 text-cyan-300" aria-hidden="true" />
          <h2 className="text-base font-semibold text-cyan-100">Paciente</h2>
        </div>
        <span className="rounded-md border border-emerald-300/30 bg-emerald-300/10 px-2 py-1 text-xs font-semibold text-emerald-200">
          Online
        </span>
      </div>
      {formContent}
    </ClinicalCard>
  );
}
