import { formatCurrencyFromCents, type SalesBreakdownRow, type SalesChartPoint } from "@/lib/admin-sales";
import { StatusBadge } from "@/components/admin/AdminPrimitives";

export function RevenueTimeline({ points }: { points: SalesChartPoint[] }) {
  const max = Math.max(...points.map((point) => point.valueCents), 1);

  return (
    <div className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-black text-white">Evolução de receita</h2>
          <p className="mt-1 text-xs text-slate-500">MRR acumulado por dia no período selecionado.</p>
        </div>
        <StatusBadge status="estimated" />
      </div>
      <div className="flex h-56 items-end gap-1 overflow-x-auto">
        {points.map((point) => (
          <div key={point.label} className="flex min-w-8 flex-1 flex-col items-center gap-2">
            <div className="flex h-44 w-full items-end rounded-t bg-slate-900/80">
              <div
                className="w-full rounded-t bg-cyan-300/80"
                style={{ height: `${Math.max(3, Math.round((point.valueCents / max) * 100))}%` }}
                title={`${point.label}: ${formatCurrencyFromCents(point.valueCents)}`}
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-500">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RevenueBreakdown({ title, description, rows }: { title: string; description?: string; rows: SalesBreakdownRow[] }) {
  const knownValues = rows.map((row) => row.valueCents ?? 0);
  const max = Math.max(...knownValues, 1);

  return (
    <div className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
      <h2 className="font-black text-white">{title}</h2>
      {description ? <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p> : null}
      <div className="mt-5 grid gap-4">
        {rows.map((row) => (
          <div key={row.id} className="grid gap-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-slate-200">{row.label}</span>
              <span className="text-slate-400">{row.valueCents === null ? "N/D" : formatCurrencyFromCents(row.valueCents)} · {row.count}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-900">
              <div className="h-2 rounded-full bg-cyan-300/80" style={{ width: `${Math.max(2, Math.round(((row.valueCents ?? 0) / max) * 100))}%` }} />
            </div>
            {row.note ? <p className="text-xs leading-5 text-amber-200/80">{row.note}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FunnelChart({ rows }: { rows: Array<{ id: string; label: string; count: number | null; note: string }> }) {
  const max = Math.max(...rows.map((row) => row.count ?? 0), 1);

  return (
    <div className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-black text-white">Conversão do funil</h2>
          <p className="mt-1 text-xs text-slate-500">Métricas disponíveis com o modelo atual; analytics dedicado ainda é necessário.</p>
        </div>
        <StatusBadge status="placeholder" />
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {rows.map((row) => (
          <div key={row.id} className="rounded-lg border border-cyan-300/10 bg-slate-900/60 p-4">
            <p className="text-sm font-black text-white">{row.label}</p>
            <p className="mt-2 text-3xl font-black text-cyan-100">{row.count === null ? "N/D" : row.count}</p>
            <div className="mt-3 h-1.5 rounded-full bg-slate-800">
              <div className="h-1.5 rounded-full bg-cyan-300" style={{ width: `${row.count === null ? 0 : Math.max(4, Math.round((row.count / max) * 100))}%` }} />
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">{row.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
