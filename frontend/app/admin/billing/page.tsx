import Link from "next/link";
import { SubscriptionStatus } from "@prisma/client";
import { AdminPageHeader, DataTable, EmptyState, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { requireAdminPermission } from "@/lib/admin-permissions";
import {
  getAdminBillingDashboard,
  parseAdminBillingFilters,
  sourceLabel,
  stripeCustomerDashboardUrl,
  stripeSubscriptionDashboardUrl
} from "@/lib/admin-billing";
import { markBillingReviewAction, reconcileSubscriptionAction, requestWebhookReprocessAction } from "./actions";

export const runtime = "nodejs";

function SourceBadge({ source }: { source: string }) {
  return <StatusBadge status={sourceLabel(source as "stripe" | "local cache" | "derived")} />;
}

function reasonInput(placeholder = "Motivo obrigatório") {
  return (
    <input
      name="reason"
      required
      minLength={8}
      placeholder={placeholder}
      className="h-9 min-w-48 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-xs font-semibold text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-300/50"
    />
  );
}

function stepUpInput() {
  return (
    <input
      name="stepUpPassword"
      type="password"
      required
      placeholder="Senha atual para step-up"
      className="h-9 min-w-44 rounded-md border border-rose-300/20 bg-slate-950 px-3 text-xs font-bold text-rose-100 outline-none transition placeholder:text-slate-700 focus:border-rose-300/50"
    />
  );
}

function formatMoney(cents?: number | null, currency = "brl") {
  if (cents === null || cents === undefined) return "N/D";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2
  }).format(cents / 100);
}

function formatDateFromUnix(value?: number | null) {
  return value ? new Date(value * 1000).toLocaleString("pt-BR") : "-";
}

function formatDate(value?: Date | null) {
  return value ? value.toLocaleString("pt-BR") : "-";
}

export default async function AdminBillingPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; status?: string; message?: string; error?: string }>;
}) {
  await requireAdminPermission("admin.billing.manage");
  const params = await searchParams;
  const filters = parseAdminBillingFilters(params);
  const dashboard = await getAdminBillingDashboard(filters);
  const pastDue = dashboard.subscriptions.filter((subscription) => subscription.status === SubscriptionStatus.PAST_DUE).length;
  const active = dashboard.subscriptions.filter((subscription) => subscription.status === SubscriptionStatus.ACTIVE).length;
  const failedPayments = dashboard.paymentFailures.length;
  const divergences = dashboard.divergences.length;

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Billing"
        title="Cobrança e Assinaturas"
        description="Painel administrativo para observar e operar billing sem substituir a Stripe. Campos financeiros críticos permanecem na Stripe; o banco local atua como cache operacional."
      />

      {params?.message ? <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-bold text-emerald-100">{params.message}</div> : null}
      {params?.error ? <div className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm font-bold text-rose-100">{params.error}</div> : null}
      {dashboard.stripeErrors.map((error) => (
        <div key={error} className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm font-bold text-amber-100">{error}</div>
      ))}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Assinaturas" value={dashboard.subscriptions.length} hint="Fonte: local cache." />
        <KpiCard label="Ativas" value={active} hint="Fonte: local cache." />
        <KpiCard label="Past due" value={pastDue} hint="Risco de receita." />
        <KpiCard label="Falhas recentes" value={failedPayments} hint="Fonte: Stripe invoices quando configurado." />
        <KpiCard label="Divergências" value={divergences} hint="Fonte: derived/local + Stripe quando disponível." />
      </div>

      <form className="grid gap-3 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4 md:grid-cols-[1fr_220px_auto] md:items-end">
        <label className="grid gap-1 text-xs font-bold text-slate-500">
          Busca
          <input
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="customer id, subscription id, user id ou e-mail"
            className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-300/50"
          />
        </label>
        <label className="grid gap-1 text-xs font-bold text-slate-500">
          Status
          <select name="status" defaultValue={filters.status ?? ""} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none transition focus:border-cyan-300/50">
            <option value="">Todos</option>
            {Object.values(SubscriptionStatus).map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-10 rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200">Filtrar</button>
      </form>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-white">Subscriptions por status</h2>
        <DataTable
          rows={dashboard.statusBreakdown}
          columns={[
            { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
            { key: "count", header: "Total", render: (row) => row.count },
            { key: "source", header: "Fonte", render: (row) => <SourceBadge source={row.source} /> }
          ]}
        />
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-white">Assinaturas locais e ações controladas</h2>
        <DataTable
          rows={dashboard.subscriptions}
          empty={<EmptyState title="Nenhuma assinatura encontrada" />}
          columns={[
            {
              key: "owner",
              header: "Cliente",
              render: (subscription) => (
                <div className="min-w-56">
                  <p className="font-black text-white">{subscription.user?.email ?? subscription.organization?.name ?? "Sem titular"}</p>
                  <p className="mt-1 text-xs text-slate-500">{subscription.ownerType}</p>
                </div>
              )
            },
            { key: "status", header: "Status", render: (subscription) => <StatusBadge status={subscription.status} /> },
            { key: "plan", header: "Plano", render: (subscription) => `${subscription.plan} · ${subscription.billingCycle}` },
            { key: "license", header: "Licenças", render: (subscription) => `${subscription.licenses.filter((license) => license.status === "ACTIVE").length}/${subscription.licenses.length}` },
            {
              key: "stripe",
              header: "Stripe",
              render: (subscription) => {
                const customerUrl = stripeCustomerDashboardUrl(subscription.stripeCustomerId);
                const subscriptionUrl = stripeSubscriptionDashboardUrl(subscription.stripeSubscriptionId);
                return (
                  <div className="grid min-w-52 gap-2">
                    <p className="text-xs text-slate-500">{subscription.stripeCustomerId ?? "Sem customer"}</p>
                    <p className="text-xs text-slate-500">{subscription.stripeSubscriptionId ?? "Sem subscription"}</p>
                    <div className="flex flex-wrap gap-2">
                      {customerUrl ? <Link href={customerUrl} target="_blank" className="text-xs font-black text-cyan-200">Customer</Link> : null}
                      {subscriptionUrl ? <Link href={subscriptionUrl} target="_blank" className="text-xs font-black text-cyan-200">Subscription</Link> : null}
                    </div>
                  </div>
                );
              }
            },
            {
              key: "actions",
              header: "Ações auditadas",
              render: (subscription) => (
                <div className="grid min-w-[360px] gap-3">
                  <form action={reconcileSubscriptionAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="subscriptionId" value={subscription.id} />
                    {reasonInput("Motivo do reconcile")}
                    {stepUpInput()}
                    <button type="submit" className="h-9 rounded-md bg-cyan-300 px-3 text-xs font-black text-slate-950 transition hover:bg-cyan-200">Reexecutar reconcile</button>
                  </form>
                  <form action={markBillingReviewAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="subscriptionId" value={subscription.id} />
                    {reasonInput("Motivo da análise")}
                    <button type="submit" className="h-9 rounded-md border border-amber-300/20 px-3 text-xs font-black text-amber-100 transition hover:bg-amber-300/10">Marcar análise</button>
                  </form>
                </div>
              )
            }
          ]}
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">Riscos de receita</h2>
          <DataTable
            rows={dashboard.risks}
            empty={<EmptyState title="Sem riscos detectados" />}
            columns={[
              { key: "kind", header: "Tipo", render: (risk) => risk.kind },
              { key: "severity", header: "Severidade", render: (risk) => <StatusBadge status={risk.severity} /> },
              { key: "description", header: "Descrição", render: (risk) => risk.description },
              { key: "source", header: "Fonte", render: (risk) => <SourceBadge source={risk.source} /> }
            ]}
          />
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">Divergências billing local x Stripe</h2>
          <DataTable
            rows={dashboard.divergences}
            empty={<EmptyState title="Sem divergências detectadas" description="Comparação usa Stripe somente quando STRIPE_SECRET_KEY está configurada." />}
            columns={[
              { key: "kind", header: "Tipo", render: (risk) => risk.kind },
              { key: "severity", header: "Severidade", render: (risk) => <StatusBadge status={risk.severity} /> },
              { key: "description", header: "Descrição", render: (risk) => risk.description },
              { key: "source", header: "Fonte", render: (risk) => <SourceBadge source={risk.source} /> }
            ]}
          />
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">Invoices recentes</h2>
          <DataTable
            rows={dashboard.invoices.map((invoice) => ({ ...invoice, id: invoice.id ?? `invoice-${invoice.created}` }))}
            empty={<EmptyState title="Sem invoices disponíveis" description="Fonte Stripe; requer STRIPE_SECRET_KEY." />}
            columns={[
              { key: "id", header: "Invoice", render: (invoice) => invoice.id },
              { key: "status", header: "Status", render: (invoice) => <StatusBadge status={invoice.status ?? "unknown"} /> },
              { key: "amount", header: "Valor", render: (invoice) => formatMoney(invoice.amount_due, invoice.currency) },
              { key: "created", header: "Criada", render: (invoice) => formatDateFromUnix(invoice.created) },
              { key: "source", header: "Fonte", render: () => <SourceBadge source="stripe" /> }
            ]}
          />
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">Falhas de pagamento</h2>
          <DataTable
            rows={dashboard.paymentFailures.map((invoice) => ({ ...invoice, id: invoice.id ?? `failure-${invoice.created}` }))}
            empty={<EmptyState title="Sem falhas recentes" />}
            columns={[
              { key: "id", header: "Invoice", render: (invoice) => invoice.id },
              { key: "status", header: "Status", render: (invoice) => <StatusBadge status={invoice.status ?? "unknown"} /> },
              { key: "amount", header: "Valor", render: (invoice) => formatMoney(invoice.amount_due, invoice.currency) },
              { key: "attempt", header: "Tentativa", render: (invoice) => invoice.attempt_count ?? 0 },
              { key: "source", header: "Fonte", render: () => <SourceBadge source="stripe" /> }
            ]}
          />
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">Reembolsos/cancelamentos disponíveis</h2>
          <DataTable
            rows={dashboard.refunds}
            empty={<EmptyState title="Sem refunds recentes" description="Cancelamentos são observados por status local e cancel_at_period_end quando a Stripe está configurada." />}
            columns={[
              { key: "id", header: "Refund", render: (refund) => refund.id },
              { key: "status", header: "Status", render: (refund) => <StatusBadge status={refund.status ?? "unknown"} /> },
              { key: "amount", header: "Valor", render: (refund) => formatMoney(refund.amount, refund.currency) },
              { key: "created", header: "Criado", render: (refund) => formatDateFromUnix(refund.created) },
              { key: "source", header: "Fonte", render: () => <SourceBadge source="stripe" /> }
            ]}
          />
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">Eventos recentes de webhook</h2>
          <DataTable
            rows={dashboard.webhookEvents}
            empty={<EmptyState title="Sem eventos Stripe registrados" />}
            columns={[
              { key: "event", header: "Evento", render: (event) => event.type },
              { key: "stripe", header: "Stripe ID", render: (event) => event.stripeEventId },
              { key: "processed", header: "Processado", render: (event) => formatDate(event.processedAt) },
              {
                key: "actions",
                header: "Ações",
                render: (event) => (
                  <div className="grid min-w-72 gap-2">
                    <form action={requestWebhookReprocessAction} className="flex flex-wrap gap-2">
                      <input type="hidden" name="webhookEventId" value={event.id} />
                      {reasonInput("Motivo do reprocessamento")}
                      {stepUpInput()}
                      <button type="submit" className="h-9 rounded-md border border-cyan-300/20 px-3 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/10">Solicitar</button>
                    </form>
                    <form action={markBillingReviewAction} className="flex flex-wrap gap-2">
                      <input type="hidden" name="webhookEventId" value={event.id} />
                      {reasonInput("Motivo da análise")}
                      <button type="submit" className="h-9 rounded-md border border-amber-300/20 px-3 text-xs font-black text-amber-100 transition hover:bg-amber-300/10">Análise</button>
                    </form>
                  </div>
                )
              }
            ]}
          />
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">Falhas persistidas de webhook</h2>
          <DataTable
            rows={dashboard.webhookFailures}
            empty={<EmptyState title="Sem falhas abertas" description="Fonte: WebhookFailure. Payload bruto não é armazenado em claro." />}
            columns={[
              { key: "eventType", header: "Evento", render: (failure) => failure.eventType },
              { key: "errorType", header: "Erro", render: (failure) => failure.errorType },
              { key: "status", header: "Status", render: (failure) => <StatusBadge status={failure.status} /> },
              { key: "retry", header: "Retentativas", render: (failure) => failure.retryCount },
              { key: "updated", header: "Atualizado", render: (failure) => formatDate(failure.updatedAt) },
              { key: "source", header: "Fonte", render: () => <SourceBadge source="local cache" /> }
            ]}
          />
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-black text-white">Billing issues persistidos</h2>
          <DataTable
            rows={dashboard.billingIssues}
            empty={<EmptyState title="Sem issues abertas" description="Fonte: BillingIssue criado por reconcile, marcação manual ou detecção operacional." />}
            columns={[
              { key: "type", header: "Tipo", render: (issue) => issue.type },
              { key: "owner", header: "Cliente", render: (issue) => issue.user?.email ?? issue.organization?.name ?? "-" },
              { key: "severity", header: "Severidade", render: (issue) => <StatusBadge status={issue.severity} /> },
              { key: "status", header: "Status", render: (issue) => <StatusBadge status={issue.status} /> },
              { key: "updated", header: "Atualizado", render: (issue) => formatDate(issue.updatedAt) },
              { key: "source", header: "Fonte", render: (issue) => <SourceBadge source={issue.source === "stripe" ? "stripe" : issue.source === "derived" ? "derived" : "local cache"} /> }
            ]}
          />
        </section>
      </div>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-white">Casos marcados para análise manual</h2>
        <DataTable
          rows={dashboard.reviews}
          empty={<EmptyState title="Sem casos marcados" />}
          columns={[
            { key: "resource", header: "Recurso", render: (event) => `${event.resourceType}:${event.resourceId ?? "-"}` },
            { key: "actor", header: "Operador", render: (event) => event.actor?.email ?? event.actor?.name ?? "sistema" },
            { key: "outcome", header: "Resultado", render: (event) => <StatusBadge status={event.outcome} /> },
            { key: "created", header: "Data", render: (event) => formatDate(event.createdAt) },
            { key: "source", header: "Fonte", render: () => <SourceBadge source="local cache" /> }
          ]}
        />
      </section>

      <section className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
        <h2 className="text-xl font-black text-white">Fonte de verdade</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Valores financeiros, invoices, refunds, cancel_at_period_end e customer/subscription dashboard são Stripe. Assinaturas, licenças e webhooks processados são cache local.
          Riscos e divergências são derivados. Este painel não permite alteração financeira crítica direta no banco; mudanças devem passar pela Stripe e por reconcile/webhook auditado.
        </p>
      </section>
    </div>
  );
}
