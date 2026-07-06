"use client";

import { Activity, Calculator } from "lucide-react";
import type { CalculationRequest } from "@/types/calculations";
import { ClinicalCard, CriticalActionButton, NeuralInput } from "@/components/design-system";

type Props = {
  values: CalculationRequest;
  errors: Partial<Record<keyof CalculationRequest, string>>;
  onChange: (values: CalculationRequest) => void;
  onCalculate: () => void;
  canCalculate: boolean;
};

export function InputForm({ values, errors, onChange, onCalculate, canCalculate }: Props) {
  function update(key: keyof CalculationRequest, value: string) {
    onChange({ ...values, [key]: value === "" ? Number.NaN : Number(value) });
  }

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
      <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
        <NeuralInput label="A" error={errors.idadeAnos} inputMode="numeric" min="0" step="1" type="number" value={Number.isNaN(values.idadeAnos) ? "" : values.idadeAnos} onChange={(event) => update("idadeAnos", event.target.value)} className="px-2 text-xl sm:px-3 sm:text-2xl" />
        <NeuralInput label="M" error={errors.idadeMeses} inputMode="numeric" min="0" max="11" step="1" type="number" value={Number.isNaN(values.idadeMeses) ? "" : values.idadeMeses} onChange={(event) => update("idadeMeses", event.target.value)} className="px-2 text-xl sm:px-3 sm:text-2xl" />
        <NeuralInput label="kg" error={errors.pesoKg} inputMode="decimal" min="0" step="0.1" type="number" value={Number.isNaN(values.pesoKg) ? "" : values.pesoKg} onChange={(event) => update("pesoKg", event.target.value)} className="px-2 text-xl sm:px-3 sm:text-2xl" />
      </div>
      <div className="mt-4 flex justify-end">
        <CriticalActionButton
          type="button"
          disabled={!canCalculate}
          onClick={onCalculate}
        >
          <Calculator className="h-4 w-4" aria-hidden="true" />
          Calcular
        </CriticalActionButton>
      </div>
    </ClinicalCard>
  );
}
