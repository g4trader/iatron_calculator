import { AlertTriangle, CheckCircle2, CircleHelp, Siren } from "lucide-react";
import { DataTable, StatusBadge } from "@/components/admin/AdminPrimitives";
import type { IntegrationStatus, OperationalIncident, OperationalMetric, OperationalQueueItem, OperationalStatus } from "@/lib/admin-operations";

function statusClasses(status: OperationalStatus) {
  if (status === "healthy") return "border-emerald-300/20 bg-emerald-300/10 text-emerald-100";
  if (status === "degraded") return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  if (status === "incident") return "border-red-300/20 bg-red-300/10 text-red-100";
  return "border-slate-300/10 bg-slate-300/10 text-slate-300";
}

function StatusIcon({ status }: { status: OperationalStatus }) {
  if (status === "healthy") return <CheckCircle2 className="h-5 w-5" aria-hidden="true" />;
  if (status === "degraded") return <AlertTriangle className="h-5 w-5" aria-hidden="true" />;
  if (status === "incident") return <Siren className="h-5 w-5" aria-hidden="true" />;
  return <CircleHelp className="h-5 w-5" aria-hidden="true" />;
}

export function StatusSummaryCard({ status, label, detail }: { status: OperationalStatus; label: string; detail: string }) {
  return (
    <div className={`rounded-xl border p-5 ${statusClasses(status)}`}>
      <div className="flex items-center gap-3">
        <StatusIcon status={status} />
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] opacity-80">Status geral</p>
          <h2 className="mt-1 text-3xl font-black">{label}</h2>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 opacity-90">{detail}</p>
    </div>
  );
}

export function OperationsMetricGrid({ metrics }: { metrics: OperationalMetric[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.id} className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5 shadow-2xl shadow-black/20">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-slate-400">{metric.label}</p>
            <StatusBadge status={metric.status} />
          </div>
          <p className="mt-3 text-3xl font-black text-white">{metric.value}</p>
          <div className="mt-3 flex items-center gap-2">
            <StatusBadge status={metric.precision} />
          </div>
          {metric.note ? <p className="mt-3 text-xs leading-5 text-slate-500">{metric.note}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function IntegrationsGrid({ integrations }: { integrations: IntegrationStatus[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {integrations.map((integration) => (
        <div key={integration.id} className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black text-white">{integration.label}</h2>
            <StatusBadge status={integration.status} />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-400">{integration.detail}</p>
          <p className="mt-4 text-xs text-slate-600">Checado em {integration.checkedAt.toLocaleTimeString("pt-BR")}</p>
        </div>
      ))}
    </div>
  );
}

export function IncidentsTable({ incidents }: { incidents: OperationalIncident[] }) {
  return (
    <DataTable
      rows={incidents}
      empty="Sem incidentes recentes nas fontes monitoradas."
      columns={[
        { key: "severity", header: "Severidade", render: (incident) => <StatusBadge status={incident.severity} /> },
        { key: "origin", header: "Origem", render: (incident) => incident.origin },
        { key: "impact", header: "Impacto", render: (incident) => incident.impact },
        { key: "status", header: "Status", render: (incident) => <StatusBadge status={incident.status} /> },
        { key: "created", header: "Data", render: (incident) => incident.createdAt.toLocaleString("pt-BR") }
      ]}
    />
  );
}

export function QueuesGrid({ queues }: { queues: OperationalQueueItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {queues.map((queue) => (
        <div key={queue.id} className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-black text-white">{queue.label}</h2>
            <StatusBadge status={queue.status} />
          </div>
          <p className="mt-3 text-3xl font-black text-cyan-100">{queue.value}</p>
          {queue.note ? <p className="mt-3 text-xs leading-5 text-slate-500">{queue.note}</p> : null}
        </div>
      ))}
    </div>
  );
}
