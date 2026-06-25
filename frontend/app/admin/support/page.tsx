import Link from "next/link";
import { Plan, SupportTicketPriority, SupportTicketStatus } from "@prisma/client";
import { AdminPageHeader, DataTable, EmptyState, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { requireAdminPermission } from "@/lib/admin-permissions";
import type { CustomerRisk, CustomerType } from "@/lib/admin-customers";
import { getAdminSupportDashboard, parseSupportFilters } from "@/lib/admin-support";
import { addSupportInterventionAction, createSupportTicketAction, updateSupportTicketAction } from "./actions";

export const runtime = "nodejs";

const riskOptions: Array<{ value: CustomerRisk; label: string }> = [
  { value: "healthy", label: "Healthy" },
  { value: "monitor", label: "Monitor" },
  { value: "at-risk", label: "At-risk" },
  { value: "critical", label: "Critical" }
];

const accountTypes: Array<{ value: CustomerType; label: string }> = [
  { value: "individual", label: "Individual" },
  { value: "institutional", label: "Institucional" }
];

function selectFilter(name: string, label: string, defaultValue: string | undefined, options: Array<{ value: string; label: string }>) {
  return (
    <label className="grid gap-1 text-xs font-bold text-slate-500">
      {label}
      <select name={name} defaultValue={defaultValue ?? ""} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none transition focus:border-cyan-300/50">
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function formatDate(date?: Date | null) {
  return date ? date.toLocaleString("pt-BR") : "-";
}

function supportForm(customerId: string, customerType: CustomerType) {
  return (
    <form action={addSupportInterventionAction} className="grid min-w-[420px] gap-2">
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="customerType" value={customerType} />
      <input name="supportNote" required minLength={8} placeholder="Nota de suporte" className="h-9 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-xs font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50" />
      <input name="riskReason" required minLength={8} placeholder="Motivo de risco" className="h-9 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-xs font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50" />
      <input name="actionTaken" required minLength={8} placeholder="Ação tomada" className="h-9 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-xs font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50" />
      <div className="flex flex-wrap gap-2">
        <input name="followUpDate" type="date" className="h-9 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-xs font-semibold text-slate-200 outline-none focus:border-cyan-300/50" />
        <button type="submit" className="h-9 rounded-md bg-cyan-300 px-3 text-xs font-black text-slate-950 transition hover:bg-cyan-200">Registrar</button>
      </div>
    </form>
  );
}

export default async function AdminSupportPage({
  searchParams
}: {
  searchParams?: Promise<{ risk?: string; plan?: string; accountType?: string; billingIssue?: string; lackOfUse?: string; message?: string; error?: string }>;
}) {
  await requireAdminPermission("admin.support.view");
  const params = await searchParams;
  const filters = parseSupportFilters(params);
  const dashboard = await getAdminSupportDashboard(filters);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Suporte"
        title="Suporte e Customer Success"
        description="Centraliza sinais de risco, billing, baixa adoção e intervenção operacional. Não substitui um help desk; funciona como backoffice de triagem."
      />

      {params?.message ? <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-bold text-emerald-100">{params.message}</div> : null}
      {params?.error ? <div className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm font-bold text-rose-100">{params.error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Contas em risco" value={dashboard.metrics.atRisk} hint="Risk at-risk ou critical." />
        <KpiCard label="Billing problem" value={dashboard.metrics.billingIssues} hint="Past due, unpaid, incomplete ou canceled." />
        <KpiCard label="Baixa adoção" value={dashboard.metrics.lackOfUse} hint="Sem atividade nos últimos 30 dias." />
        <KpiCard label="Follow-ups" value={dashboard.metrics.followUps} hint="Notas recentes com follow-up date." />
      </div>

      <form className="grid gap-3 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4 md:grid-cols-3 xl:grid-cols-6 xl:items-end">
        {selectFilter("risk", "Risco", filters.risk, riskOptions)}
        {selectFilter("plan", "Plano", filters.plan, Object.values(Plan).map((plan) => ({ value: plan, label: plan })))}
        {selectFilter("accountType", "Tipo de conta", filters.accountType, accountTypes)}
        {selectFilter("billingIssue", "Billing issue", filters.billingIssue ? "true" : undefined, [{ value: "true", label: "Com problema" }])}
        {selectFilter("lackOfUse", "Falta de uso", filters.lackOfUse ? "true" : undefined, [{ value: "true", label: "Sem uso 30+ dias" }])}
        <button type="submit" className="h-10 rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200">Filtrar</button>
      </form>

      <section className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
        <div>
          <h2 className="text-xl font-black text-white">Criar ticket</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Ticket persistido em SupportTicket, separado da auditoria administrativa.</p>
        </div>
        <form action={createSupportTicketAction} className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <input name="userId" placeholder="userId opcional" className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50" />
          <input name="organizationId" placeholder="organizationId opcional" className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50" />
          <input name="subject" required placeholder="Assunto" className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50" />
          <input name="category" required placeholder="Categoria" className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50" />
          <select name="priority" defaultValue={SupportTicketPriority.MEDIUM} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-300/50">
            {Object.values(SupportTicketPriority).map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
          <input name="assigneeUserId" placeholder="assignee userId" className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50" />
          <textarea name="description" required minLength={8} placeholder="Descrição do ticket" className="min-h-20 rounded-md border border-cyan-300/10 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50 md:col-span-3 xl:col-span-5" />
          <button type="submit" className="h-10 rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200">Criar ticket</button>
        </form>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-white">Lista priorizada por risco</h2>
        <DataTable
          rows={dashboard.rows}
          empty={<EmptyState title="Nenhuma conta em risco no filtro" />}
          columns={[
            {
              key: "customer",
              header: "Conta",
              render: (row) => (
                <div className="min-w-56">
                  <Link href={`/admin/customers/${row.id}`} className="font-black text-white transition hover:text-cyan-200">{row.name}</Link>
                  <p className="mt-1 text-xs text-slate-500">{row.email}</p>
                  <p className="mt-1 text-xs text-slate-600">{row.type === "institutional" ? "Institucional" : "Individual"}</p>
                </div>
              )
            },
            { key: "risk", header: "Risco", render: (row) => <StatusBadge status={row.risk} /> },
            { key: "health", header: "Health", render: (row) => <span className="text-2xl font-black text-white">{row.healthScore}</span> },
            { key: "priority", header: "Prioridade", render: (row) => <span className="font-black text-cyan-100">{row.priorityScore}</span> },
            { key: "billing", header: "Billing", render: (row) => <StatusBadge status={row.billingIssue ? "billing_issue" : "ok"} /> },
            { key: "usage", header: "Uso", render: (row) => <StatusBadge status={row.lackOfUse ? "low_adoption" : "active"} /> },
            { key: "last", header: "Última atividade", render: (row) => formatDate(row.lastActivityAt) },
            { key: "action", header: "Registrar intervenção", render: (row) => supportForm(row.id, row.type) }
          ]}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">Tickets abertos</h2>
          <DataTable
            rows={dashboard.recentContacts}
            empty={<EmptyState title="Sem tickets abertos" />}
            columns={[
              { key: "subject", header: "Assunto", render: (ticket) => <div><p className="font-black text-white">{ticket.subject}</p><p className="mt-1 text-xs text-slate-500">{ticket.user?.email ?? ticket.organization?.name ?? ticket.userId ?? ticket.organizationId ?? "-"}</p></div> },
              { key: "status", header: "Status", render: (ticket) => <StatusBadge status={ticket.status} /> },
              { key: "priority", header: "Prioridade", render: (ticket) => <StatusBadge status={ticket.priority} /> },
              { key: "assignee", header: "Responsável", render: (ticket) => ticket.assignee?.email ?? ticket.assigneeUserId ?? "-" },
              { key: "created", header: "Data", render: (ticket) => formatDate(ticket.createdAt) },
              {
                key: "action",
                header: "Atualizar",
                render: (ticket) => (
                  <form action={updateSupportTicketAction} className="grid min-w-64 gap-2">
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    <select name="status" defaultValue={ticket.status} className="h-9 rounded-md border border-cyan-300/10 bg-slate-950 px-2 text-xs font-bold text-slate-200 outline-none focus:border-cyan-300/50">
                      {Object.values(SupportTicketStatus).map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <input name="assigneeUserId" placeholder="assignee userId" className="h-9 rounded-md border border-cyan-300/10 bg-slate-950 px-2 text-xs font-bold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50" />
                    <input name="comment" placeholder="Comentário interno" className="h-9 rounded-md border border-cyan-300/10 bg-slate-950 px-2 text-xs font-bold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50" />
                    <button type="submit" className="h-9 rounded-md border border-cyan-300/20 px-3 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/10">Salvar</button>
                  </form>
                )
              }
            ]}
          />
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">Usuários com falha recorrente de acesso</h2>
          <DataTable
            rows={dashboard.failedAccessEvents}
            empty={<EmptyState title="Sem falhas recentes" />}
            columns={[
              { key: "user", header: "Usuário", render: (event) => event.user?.email ?? event.userId ?? "-" },
              { key: "type", header: "Tipo", render: (event) => event.type },
              { key: "severity", header: "Severidade", render: (event) => <StatusBadge status={event.severity} /> },
              { key: "created", header: "Data", render: (event) => formatDate(event.createdAt) }
            ]}
          />
        </section>
      </div>
    </div>
  );
}
