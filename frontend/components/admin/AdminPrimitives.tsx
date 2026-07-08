import Link from "next/link";
import { Activity, AlertCircle, CheckCircle2, Circle, Search } from "lucide-react";
import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? <p className="text-sm font-black text-cyan-200">{eyebrow}</p> : null}
        <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function KpiCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5 shadow-2xl shadow-black/20">
      <p className="text-sm font-semibold text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
      {hint ? <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function DataTable<T extends { id: string }>({ columns, rows, empty }: { columns: DataTableColumn<T>[]; rows: T[]; empty?: ReactNode }) {
  if (rows.length === 0) {
    return <div className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-6">{empty ?? <EmptyState title="Nenhum registro" />}</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-cyan-300/10 bg-slate-950/75">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-cyan-300/10 text-left text-sm">
          <thead className="bg-slate-900/70 text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-4 py-3 font-black ${column.className ?? ""}`}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-300/10">
            {rows.map((row) => (
              <tr key={row.id} className="text-slate-300">
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-4 align-top ${column.className ?? ""}`}>{column.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FilterBar({ children }: { children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex min-h-10 items-center gap-2 rounded-md border border-cyan-300/10 bg-slate-900/60 px-3 text-sm text-slate-500 md:min-w-72">
        <Search className="h-4 w-4" aria-hidden="true" />
        <span>Busca administrativa</span>
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center py-10 text-center">
      <Circle className="h-8 w-8 text-slate-600" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-black text-white">{title}</h2>
      {description ? <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const positive = ["active", "success", "configured", "ok", "trialing", "ready", "confirmado", "conciliado"].includes(normalized);
  const warning = ["pending", "past_due", "unpaid", "incomplete", "partial", "pendente"].includes(normalized);
  const negative = ["blocked", "failed", "failure", "denied", "incident", "critical", "recusado"].includes(normalized);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-black ${
      positive
        ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
        : warning
          ? "border-amber-300/20 bg-amber-300/10 text-amber-200"
          : negative
            ? "border-rose-300/20 bg-rose-300/10 text-rose-200"
            : "border-slate-300/15 bg-slate-300/10 text-slate-300"
    }`}>
      {positive ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : warning || negative ? <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {status}
    </span>
  );
}

export function AuditTimeline({
  events
}: {
  events: Array<{ id: string; action: string; resourceType: string; outcome: string; createdAt: Date; actor?: { email?: string | null; name?: string | null } | null }>;
}) {
  if (events.length === 0) {
    return <EmptyState title="Sem eventos administrativos" description="As mutations administrativas futuras serão registradas aqui." />;
  }

  return (
    <div className="rounded-xl border border-cyan-300/10 bg-slate-950/75">
      {events.map((event) => (
        <div key={event.id} className="grid gap-2 border-b border-cyan-300/10 p-4 last:border-b-0 md:grid-cols-[1fr_auto]">
          <div>
            <p className="font-black text-white">{event.action}</p>
            <p className="mt-1 text-sm text-slate-400">{event.resourceType} · {event.actor?.email ?? event.actor?.name ?? "sistema"}</p>
          </div>
          <div className="flex items-center gap-3 md:justify-end">
            <StatusBadge status={event.outcome} />
            <span className="text-sm text-slate-500">{event.createdAt.toLocaleString("pt-BR")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminModuleLink({ href, title, description, permission }: { href: string; title: string; description: string; permission: string }) {
  return (
    <Link href={href} prefetch className="group rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5 shadow-2xl shadow-black/20 transition hover:border-cyan-300/40">
      <Activity className="h-5 w-5 text-cyan-200" aria-hidden="true" />
      <h2 className="mt-5 text-xl font-black text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      <p className="mt-4 text-xs font-black text-slate-600">{permission}</p>
    </Link>
  );
}
