import type { Shock } from "@/types/calculations";
import { joule } from "@/lib/format";

type Props = {
  shock: Shock;
};

export function ShockCard({ shock }: Props) {
  const items = [
    ["Desfibrilação 1ª dose", joule(shock.desfibrilacaoPrimeiraDoseJ), "bg-red-400/10 border-red-300/35 text-red-100"],
    ["Desfibrilação 2ª dose", joule(shock.desfibrilacaoSegundaDoseJ), "bg-red-400/10 border-red-300/35 text-red-100"],
    ["Cardioversão", joule(shock.cardioversaoJ), "bg-emerald-300/10 border-emerald-300/35 text-emerald-100"]
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {items.map(([label, value, className]) => (
        <div key={label} className={`rounded-md border p-4 ${className}`}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-75">{label}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
        </div>
      ))}
    </div>
  );
}
