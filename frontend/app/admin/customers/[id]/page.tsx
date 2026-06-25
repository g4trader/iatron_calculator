import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader, DataTable, EmptyState, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { getAdminCustomerDetail, healthScoreWeights } from "@/lib/admin-customers";
import { addCustomerNoteAction } from "../actions";

export const runtime = "nodejs";

function meta(label: string, value: string | null | undefined) {
  return (
    <div className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-slate-200">{value ?? "-"}</p>
    </div>
  );
}

function formatDate(date?: Date | null) {
  return date ? date.toLocaleString("pt-BR") : "-";
}

function metadataNote(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || !("note" in metadata)) return "-";
  const note = (metadata as { note?: unknown }).note;
  return typeof note === "string" ? note : "-";
}

export default async function AdminCustomerDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ message?: string; error?: string }>;
}) {
  await requireAdminPermission("admin.customers.view");
  const { id } = await params;
  const query = await searchParams;
  const detail = await getAdminCustomerDetail(id);
  if (!detail) notFound();

  const isOrganization = detail.kind === "organization";
  const customerType = isOrganization ? "institutional" : "individual";
  const user = detail.kind === "user" ? detail.user : null;
  const organization = detail.kind === "organization" ? detail.organization : null;
  const subscriptions = user?.subscriptions ?? organization?.subscriptions ?? [];
  const licenses = user?.licenses ?? organization?.licenses ?? [];
  const members = organization?.memberships ?? user?.organizationMemberships.flatMap((membership) => membership.organization.memberships) ?? [];
  const usage = user?.calculationHistory ?? [];
  const sessions = user?.userSessions ?? [];
  const securityEvents = user?.securityEvents ?? [];

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Cliente"
        title={detail.row.name}
        description="Visão operacional sem exposição de tokens, hashes ou secrets. Use notas internas para contexto de suporte com trilha de auditoria."
        actions={<Link href="/admin/customers" className="rounded-md border border-cyan-300/20 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/10">Voltar</Link>}
      />

      {query?.message ? <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-bold text-emerald-100">{query.message}</div> : null}
      {query?.error ? <div className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm font-bold text-rose-100">{query.error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Health score" value={detail.row.healthScore} hint={`Faixa atual: ${detail.row.risk}`} />
        <KpiCard label="Plano" value={detail.row.plan} hint="Plano primário atual." />
        <KpiCard label="Assinatura" value={<StatusBadge status={detail.row.subscriptionStatus} />} hint="Status comercial primário." />
        <KpiCard label="Licença" value={<StatusBadge status={detail.row.licenseStatus} />} hint="Status de licença primária." />
      </div>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-white">Dados principais</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {meta("Tipo", customerType)}
          {meta("E-mail", detail.row.email)}
          {meta("ID", detail.row.id)}
          {meta("Última atividade", formatDate(detail.row.lastActivityAt))}
          {user ? meta("Nome clínico", user.clinicalName) : null}
          {user ? meta("Role", user.role) : null}
          {organization ? meta("Slug", organization.slug) : null}
          {organization ? meta("Seats mínimos", String(organization.minimumSeats)) : null}
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
        <div>
          <h2 className="text-xl font-black text-white">Nota interna administrativa</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">A nota é registrada como `AdminAuditEvent` e não deve conter informações sensíveis desnecessárias.</p>
        </div>
        <form action={addCustomerNoteAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input type="hidden" name="customerId" value={detail.row.id} />
          <input type="hidden" name="customerType" value={customerType} />
          <textarea
            name="note"
            required
            minLength={8}
            placeholder="Contexto de suporte, sucesso do cliente ou operação comercial"
            className="min-h-24 rounded-md border border-cyan-300/10 bg-slate-950 px-3 py-3 text-sm font-semibold text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-300/50"
          />
          <button type="submit" className="h-10 self-end rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200">Registrar nota</button>
        </form>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">Organizações e membros</h2>
          <DataTable
            rows={members.map((membership) => ({ ...membership, id: membership.id }))}
            empty={<EmptyState title="Sem membros vinculados" />}
            columns={[
              { key: "name", header: "Nome", render: (membership) => membership.user.name ?? "Sem nome" },
              { key: "email", header: "E-mail", render: (membership) => membership.user.email ?? "-" },
              { key: "role", header: "Role", render: (membership) => <StatusBadge status={membership.role} /> }
            ]}
          />
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">Assinaturas e licenças</h2>
          <DataTable
            rows={subscriptions}
            empty={<EmptyState title="Sem assinaturas" />}
            columns={[
              { key: "plan", header: "Plano", render: (subscription) => subscription.plan },
              { key: "status", header: "Status", render: (subscription) => <StatusBadge status={subscription.status} /> },
              { key: "cycle", header: "Ciclo", render: (subscription) => subscription.billingCycle },
              { key: "updated", header: "Atualização", render: (subscription) => formatDate(subscription.updatedAt) }
            ]}
          />
          <DataTable
            rows={licenses}
            empty={<EmptyState title="Sem licenças" />}
            columns={[
              { key: "status", header: "Status", render: (license) => <StatusBadge status={license.status} /> },
              { key: "origin", header: "Origem", render: (license) => <StatusBadge status={license.origin.toLowerCase()} /> },
              { key: "owner", header: "Titular", render: (license) => license.user?.email ?? license.organization?.name ?? "-" },
              { key: "ends", header: "Fim", render: (license) => formatDate(license.endsAt) }
            ]}
          />
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">Histórico de uso</h2>
          <DataTable
            rows={usage}
            empty={<EmptyState title="Sem cálculos registrados" />}
            columns={[
              { key: "patient", header: "Paciente", render: (item) => `${item.patientWeight} kg` },
              { key: "age", header: "Idade", render: (item) => `${item.ageYears}a ${item.ageMonths}m` },
              { key: "created", header: "Data", render: (item) => formatDate(item.createdAt) }
            ]}
          />
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">Sessões recentes</h2>
          <DataTable
            rows={sessions}
            empty={<EmptyState title="Sem sessões registradas" />}
            columns={[
              { key: "status", header: "Status", render: (session) => <StatusBadge status={session.status} /> },
              { key: "last", header: "Última atividade", render: (session) => formatDate(session.lastSeenAt) },
              { key: "expires", header: "Expira", render: (session) => formatDate(session.expiresAt) }
            ]}
          />
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">Eventos de segurança</h2>
          <DataTable
            rows={securityEvents}
            empty={<EmptyState title="Sem eventos de segurança" />}
            columns={[
              { key: "type", header: "Tipo", render: (event) => event.type },
              { key: "severity", header: "Severidade", render: (event) => <StatusBadge status={event.severity} /> },
              { key: "created", header: "Data", render: (event) => formatDate(event.createdAt) }
            ]}
          />
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">Tickets/observações internas</h2>
          <DataTable
            rows={detail.notes}
            empty={<EmptyState title="Sem notas internas" description="Registre uma nota acima para criar trilha operacional." />}
            columns={[
              { key: "note", header: "Nota", render: (event) => metadataNote(event.metadata) },
              { key: "actor", header: "Operador", render: (event) => event.actor?.email ?? event.actor?.name ?? "sistema" },
              { key: "created", header: "Data", render: (event) => formatDate(event.createdAt) }
            ]}
          />
        </section>
      </div>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-white">Ações administrativas disponíveis</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Link href={`/admin/licenses?q=${encodeURIComponent(detail.row.id)}`} className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4 font-black text-cyan-100 transition hover:bg-cyan-300/10">Gerenciar licenças</Link>
          <Link href="/admin/billing" className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4 font-black text-cyan-100 transition hover:bg-cyan-300/10">Revisar billing</Link>
          <Link href="/admin/audit" className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4 font-black text-cyan-100 transition hover:bg-cyan-300/10">Ver auditoria</Link>
        </div>
      </section>

      <section className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
        <h2 className="text-xl font-black text-white">Cálculo do health score</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Score inicial de 0 a 100: atividade ({healthScoreWeights.activity}), recência ({healthScoreWeights.recency}), uso de features-chave ({healthScoreWeights.featureUsage}),
          problemas de billing ({healthScoreWeights.billing}) e volume de suporte/sinais operacionais ({healthScoreWeights.support}). Faixas: 80-100 healthy, 60-79 monitor,
          40-59 at-risk, 0-39 critical.
        </p>
      </section>
    </div>
  );
}
