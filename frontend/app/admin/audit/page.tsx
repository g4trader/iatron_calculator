import Link from "next/link";
import { AdminPageHeader, DataTable, EmptyState, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { describeAuditAction, getAdminAuditDashboard, parseAuditFilters } from "@/lib/admin-audit";

export const runtime = "nodejs";

function textFilter(name: string, label: string, placeholder: string, defaultValue?: string) {
  return (
    <label className="grid gap-1 text-xs font-bold text-slate-500">
      {label}
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-300/50"
      />
    </label>
  );
}

function dateFilter(name: string, label: string, defaultValue?: string) {
  return (
    <label className="grid gap-1 text-xs font-bold text-slate-500">
      {label}
      <input
        type="date"
        name={name}
        defaultValue={defaultValue ?? ""}
        className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none transition focus:border-cyan-300/50"
      />
    </label>
  );
}

function buildQuery(filters: ReturnType<typeof parseAuditFilters>, patch: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries({ ...filters, ...patch }).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params.toString();
}

function ExportForm({ filters, format }: { filters: ReturnType<typeof parseAuditFilters>; format: "csv" | "json" }) {
  return (
    <form action="/admin/audit/export" className="flex flex-wrap gap-2">
      {Object.entries(filters).map(([key, value]) => value === undefined || key === "page" || key === "pageSize" ? null : (
        <input key={key} type="hidden" name={key} value={String(value)} />
      ))}
      <input type="hidden" name="format" value={format} />
      <input name="stepUpPassword" type="password" required placeholder="Senha atual" className="h-10 w-36 rounded-md border border-rose-300/20 bg-slate-950 px-3 text-xs font-bold text-rose-100 outline-none placeholder:text-slate-700 focus:border-rose-300/50" />
      <button type="submit" className="rounded-md border border-cyan-300/20 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/10">Exportar {format.toUpperCase()}</button>
    </form>
  );
}

export default async function AdminAuditPage({
  searchParams
}: {
  searchParams?: Promise<{ actor?: string; action?: string; resourceType?: string; outcome?: string; dateFrom?: string; dateTo?: string; page?: string; pageSize?: string }>;
}) {
  await requireAdminPermission("admin.audit.view");
  const params = await searchParams;
  const filters = parseAuditFilters(params);
  const dashboard = await getAdminAuditDashboard(filters);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Audit trail"
        title="Auditoria administrativa"
        description="Rastreamento de ações administrativas e eventos de governança. Metadata é sanitizada para evitar exibição de tokens, secrets, cookies ou hashes."
        actions={
          <>
            <ExportForm filters={filters} format="csv" />
            <ExportForm filters={filters} format="json" />
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Eventos filtrados" value={dashboard.total} hint="Paginação server-side." />
        <KpiCard label="Outcomes" value={dashboard.outcomes.length} hint="Resultados distintos." />
        <KpiCard label="Recursos" value={dashboard.resourceTypes.length} hint="Tipos de recurso auditados." />
        <KpiCard label="Página" value={`${filters.page}/${dashboard.totalPages}`} hint={`${filters.pageSize} eventos por página.`} />
      </div>

      <form className="grid gap-3 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4 md:grid-cols-3 xl:grid-cols-8 xl:items-end">
        {textFilter("actor", "Ator", "email, nome ou user id", filters.actor)}
        {textFilter("action", "Ação", "admin.license", filters.action)}
        {textFilter("resourceType", "Recurso", "license, user, subscription", filters.resourceType)}
        {textFilter("outcome", "Outcome", "success, failure, denied", filters.outcome)}
        {dateFilter("dateFrom", "De", filters.dateFrom)}
        {dateFilter("dateTo", "Até", filters.dateTo)}
        <input type="hidden" name="pageSize" value={filters.pageSize} />
        <button type="submit" className="h-10 rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200">Filtrar</button>
        <Link href="/admin/audit" className="grid h-10 place-items-center rounded-md border border-cyan-300/20 px-4 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/10">Limpar</Link>
      </form>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-white">Timeline</h2>
        <div className="rounded-xl border border-cyan-300/10 bg-slate-950/75">
          {dashboard.events.length === 0 ? <EmptyState title="Sem eventos no filtro" /> : null}
          {dashboard.events.slice(0, 10).map((event) => (
            <Link key={event.id} href={`/admin/audit/${event.id}`} className="grid gap-2 border-b border-cyan-300/10 p-4 transition last:border-b-0 hover:bg-cyan-300/5 md:grid-cols-[1fr_auto]">
              <div>
                <p className="font-black text-white">{describeAuditAction(event.action)}</p>
                <p className="mt-1 text-sm text-slate-400">{event.actor?.email ?? event.actor?.name ?? event.actorUserId ?? "sistema"} · {event.resourceType}:{event.resourceId ?? "-"}</p>
              </div>
              <div className="flex items-center gap-3 md:justify-end">
                <StatusBadge status={event.outcome} />
                <span className="text-sm text-slate-500">{event.createdAt.toLocaleString("pt-BR")}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <DataTable
        rows={dashboard.events}
        empty={<EmptyState title="Sem eventos administrativos" />}
        columns={[
          {
            key: "action",
            header: "Ação",
            render: (event) => (
              <div className="min-w-64">
                <Link href={`/admin/audit/${event.id}`} className="font-black text-white transition hover:text-cyan-200">{describeAuditAction(event.action)}</Link>
                <p className="mt-1 text-xs text-slate-500">{event.action}</p>
              </div>
            )
          },
          { key: "actor", header: "Ator", render: (event) => event.actor?.email ?? event.actor?.name ?? event.actorUserId ?? "sistema" },
          { key: "resource", header: "Recurso", render: (event) => `${event.resourceType}:${event.resourceId ?? "-"}` },
          { key: "target", header: "Target", render: (event) => event.targetUser?.email ?? event.targetUser?.name ?? event.targetUserId ?? event.organizationId ?? "-" },
          { key: "outcome", header: "Outcome", render: (event) => <StatusBadge status={event.outcome} /> },
          { key: "ip", header: "IP/UserAgent", render: (event) => <span className="text-xs text-slate-500">{event.ipAddress ?? "-"}<br />{event.userAgent ? `${event.userAgent.slice(0, 90)}${event.userAgent.length > 90 ? "..." : ""}` : "-"}</span> },
          { key: "created", header: "Timestamp", render: (event) => event.createdAt.toLocaleString("pt-BR") }
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/admin/audit?${buildQuery(filters, { page: Math.max(1, filters.page - 1) })}`}
          className="rounded-md border border-cyan-300/20 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/10"
        >
          Página anterior
        </Link>
        <span className="text-sm font-bold text-slate-500">Página {filters.page} de {dashboard.totalPages}</span>
        <Link
          href={`/admin/audit?${buildQuery(filters, { page: Math.min(dashboard.totalPages, filters.page + 1) })}`}
          className="rounded-md border border-cyan-300/20 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/10"
        >
          Próxima página
        </Link>
      </div>
    </div>
  );
}
