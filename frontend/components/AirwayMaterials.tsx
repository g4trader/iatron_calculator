import type { AirwayMaterials as AirwayMaterialsType } from "@/types/calculations";

type Props = {
  materials: AirwayMaterialsType;
};

const labels: Array<[keyof AirwayMaterialsType, string]> = [
  ["tuboTraqueal", "Tubo traqueal"],
  ["lamina", "Lâmina"],
  ["fixacaoProfundidade", "Fixação/profundidade"],
  ["jelcoDescompressaoToracica", "Jelco descompressão torácica"],
  ["sondaAspiracao", "Sonda para aspirar"],
  ["drenoTorax", "Dreno de tórax"],
  ["cateterVenosoCentral", "Cateter venoso central"],
  ["jelcoPia", "Jelco PIA"],
  ["svd", "SVD"],
  ["bougie", "Bougie"]
];

export function AirwayMaterials({ materials }: Props) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {labels.map(([key, label]) => (
        <div key={key} className="rounded-md border border-cyan-300/15 bg-slate-900/70 p-3 shadow-sm transition hover:border-cyan-300/50 hover:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
          <p className="mt-1 text-xl font-bold text-cyan-100">{materials[key]}</p>
        </div>
      ))}
    </div>
  );
}
