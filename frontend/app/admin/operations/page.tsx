import Link from "next/link";
import { OperationalIncidentSeverity, OperationalIncidentStatus } from "@prisma/client";
import { AdminPageHeader, DataTable, StatusBadge } from "@/components/admin/AdminPrimitives";
import { IncidentsTable, IntegrationsGrid, OperationsMetricGrid, QueuesGrid, StatusSummaryCard } from "@/components/admin/OperationsStatus";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { getOperationsDashboard } from "@/lib/admin-operations";
import { createOperationalIncidentAction, updateOperationalIncidentAction } from "./actions";

export const runtime = "nodejs";

export default async function AdminOperationsPage({
  searchParams
}: {
  searchParams?: Promise<{ message?: string; error?: string }>;
}) {
  await requireAdminPermission("admin.operations.view");
  const params = await searchParams;
  const dashboard = await getOperationsDashboard();

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Operações"
        title="Painel Operacional e Status"
        description="Visibilidade operacional do SaaS com agregações server-side. Uptime/latência e filas reais serão conectados por adaptadores dedicados quando as fontes existirem."
        actions={<Link href="/admin/operations" className="rounded-md border border-cyan-300/20 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/10">Atualizar</Link>}
      />

      {params?.message ? <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-bold text-emerald-100">{params.message}</div> : null}
      {params?.error ? <div className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm font-bold text-rose-100">{params.error}</div> : null}

      <StatusSummaryCard status={dashboard.summary.status} label={dashboard.summary.label} detail={dashboard.summary.detail} />

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-white">Métricas operacionais</h2>
        <OperationsMetricGrid metrics={dashboard.metrics} />
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-white">Integrações</h2>
        <IntegrationsGrid integrations={dashboard.integrations} />
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-white">Jobs agendados</h2>
        <DataTable
          rows={dashboard.jobs}
          columns={[
            { key: "name", header: "Job", render: (job) => job.name },
            { key: "lastRun", header: "Última execução", render: (job) => job.lastRun },
            { key: "status", header: "Status", render: (job) => <StatusBadge status={job.status} /> },
            { key: "note", header: "Nota", render: (job) => job.note }
          ]}
        />
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-white">Incidentes recentes</h2>
        <IncidentsTable incidents={dashboard.incidents} />
      </section>

      <section className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4">
        <div>
          <h2 className="text-xl font-black text-white">Gestão mínima de incidente</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Ações exigem permissão de contingência e gravam AdminAuditEvent. Use para registrar ou atualizar incidentes operacionais sem edição direta no banco.
          </p>
        </div>
        <form action={createOperationalIncidentAction} className="grid gap-3 md:grid-cols-2">
          <input name="title" required minLength={3} placeholder="Título do incidente" className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50" />
          <input name="source" required minLength={3} placeholder="Origem: stripe, auth, backend, banco..." className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50" />
          <input name="impactedArea" required minLength={3} placeholder="Área impactada" className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50" />
          <select name="severity" defaultValue={OperationalIncidentSeverity.WARNING} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-300/50">
            {Object.values(OperationalIncidentSeverity).map((severity) => <option key={severity} value={severity}>{severity}</option>)}
          </select>
          <input name="assignedToUserId" placeholder="ID do responsável (opcional)" className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50" />
          <textarea name="description" required minLength={8} placeholder="Descrição operacional" className="min-h-24 rounded-md border border-cyan-300/10 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50 md:col-span-2" />
          <button type="submit" className="h-10 rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200 md:w-fit">Registrar incidente</button>
        </form>
        <form action={updateOperationalIncidentAction} className="grid gap-3 border-t border-cyan-300/10 pt-4 md:grid-cols-2">
          <input name="incidentId" required placeholder="ID do incidente" className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50" />
          <input name="assignedToUserId" placeholder="Novo responsável (opcional)" className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50" />
          <select name="status" defaultValue={OperationalIncidentStatus.MONITORING} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-300/50">
            {Object.values(OperationalIncidentStatus).map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select name="severity" defaultValue={OperationalIncidentSeverity.WARNING} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-300/50">
            {Object.values(OperationalIncidentSeverity).map((severity) => <option key={severity} value={severity}>{severity}</option>)}
          </select>
          <input name="comment" placeholder="Comentário de atualização" className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50 md:col-span-2" />
          <button type="submit" className="h-10 rounded-md border border-cyan-300/20 px-4 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/10 md:w-fit">Atualizar incidente</button>
        </form>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-white">Filas e pendências</h2>
        <QueuesGrid queues={dashboard.queues} />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">SecurityEvents por tipo</h2>
          <DataTable
            rows={dashboard.securityEventsByType}
            empty="Sem eventos de segurança nas últimas 24h."
            columns={[
              { key: "type", header: "Tipo", render: (row) => row.type },
              { key: "count", header: "Volume", render: (row) => row.count }
            ]}
          />
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">Sessões por status</h2>
          <DataTable
            rows={dashboard.sessionsByStatus}
            empty="Sem sessões registradas."
            columns={[
              { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
              { key: "count", header: "Volume", render: (row) => row.count }
            ]}
          />
        </section>
      </div>
    </div>
  );
}
