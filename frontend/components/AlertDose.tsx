import type { MedicationResult } from "@/types/calculations";
import { ml } from "@/lib/format";

type Props = {
  medications: MedicationResult[];
};

export function AlertDose({ medications }: Props) {
  const smallDoses = medications.filter((item) => item.isLessThan1Ml);

  if (smallDoses.length === 0) {
    return <p className="text-sm text-slate-300">Nenhuma dose menor que 1 ml no cálculo atual.</p>;
  }

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {smallDoses.map((item) => (
        <div key={item.id} className="rounded-md border border-amber-300/35 bg-amber-300/10 p-3 text-sm text-amber-100 shadow-sm shadow-amber-950/20">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-white">{item.name}</p>
              <p className="text-xs font-medium text-amber-200">{item.route ?? "Dose"}</p>
            </div>
            <p className="rounded-md bg-amber-300 px-2 py-1 text-sm font-black text-slate-950">{item.ui100} UI</p>
          </div>
          <p className="mt-2">
            {ml(item.administeredVolumeMl ?? item.volumeMl)} em seringa de 100 UI. Dose menor que 1 ml.
          </p>
        </div>
      ))}
    </div>
  );
}
