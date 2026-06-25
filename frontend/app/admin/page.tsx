import Link from "next/link";
import { AdminModuleLink, AdminPageHeader, DataTable, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { adminNavigation } from "@/components/admin/AdminShell";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { getAdminExecutiveDashboard } from "@/lib/admin-executive";
import { getAdminReleaseReadinessItems, summarizeAdminReleaseReadiness } from "@/lib/admin-release-readiness";

export const runtime = "nodejs";

function ExecutiveSignal({
  label,
  value,
  detail,
  tone = "neutral"
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: "neutral" | "positive" | "warning" | "critical";
}) {
  const toneClass = {
    neutral: "border-cyan-300/10 bg-slate-950/75 text-cyan-100",
    positive: "border-emerald-300/15 bg-emerald-300/5 text-emerald-100",
    warning: "border-amber-300/15 bg-amber-300/5 text-amber-100",
    critical: "border-rose-300/15 bg-rose-300/5 text-rose-100"
  }[tone];

  return (
    <div className={`rounded-xl border p-5 shadow-2xl shadow-black/20 ${toneClass}`}>
      <p className="text-sm font-black text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black md:text-4xl">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </div>
  );
}

export default async function AdminPage() {
  const admin = await requireAdminPermission("admin.dashboard.view");
  const [dashboard, releaseItems] = await Promise.all([
    getAdminExecutiveDashboard(),
    Promise.resolve(getAdminReleaseReadinessItems())
  ]);
  const releaseSummary = summarizeAdminReleaseReadiness(releaseItems);
  const visibleModules = adminNavigation
    .filter((item) => admin.adminPermissions.includes(item.permission))
    .filter((item) => item.href.startsWith("/admin"))
    .filter((item) => !["/admin", "/admin/users", "/admin/system"].includes(item.href))
    .slice(0, 8);

  const riskTone = dashboard.metrics.revenueRiskCount > 0 || dashboard.metrics.missingLicenseCount > 0 ? "warning" : "positive";
  const readinessTone = releaseSummary.status === "ready" ? "positive" : releaseSummary.status === "blocked" ? "critical" : "warning";

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Business cockpit"
        title="Visão executiva do SaaS"
        description="Painel para liderança acompanhar receita recorrente, crescimento, adoção, riscos comerciais e prontidão operacional do Iatron."
        actions={
          <>
            <Link href="/admin/sales" className="rounded-lg border border-cyan-300/20 px-4 py-2 text-sm font-black text-cyan-100 transition hover:border-cyan-300/50">
              Ver vendas
            </Link>
            <Link href="/admin/billing" className="rounded-lg bg-cyan-200 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-100">
              Riscos de receita
            </Link>
          </>
        }
      />

      <section className="rounded-2xl border border-cyan-300/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_34%),rgba(2,6,23,0.84)] p-5 shadow-2xl shadow-black/30 md:p-7">
        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status="SaaS metrics" />
              <StatusBadge status={dashboard.periodLabel} />
              <StatusBadge status={releaseSummary.label} />
            </div>
            <h2 className="mt-6 max-w-4xl text-3xl font-black tracking-tight text-white md:text-5xl">
              Receita, crescimento e risco em uma única visão.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
              Esta tela usa dados server-side de assinaturas, licenças, uso clínico, checkout, webhook e auditoria. Métricas que exigem analytics histórico dedicado continuam marcadas nos módulos específicos.
            </p>
          </div>
          <div className="grid gap-3 rounded-xl border border-cyan-300/10 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-black text-slate-300">Prontidão operacional</span>
              <StatusBadge status={releaseSummary.label} />
            </div>
            <p className="text-sm leading-6 text-slate-400">{releaseSummary.detail}</p>
            <div className="grid gap-2">
              {releaseItems.slice(0, 5).map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/70 px-3 py-2">
                  <span className="text-xs font-bold text-slate-300">{item.label}</span>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ExecutiveSignal label="MRR atual" value={dashboard.metrics.mrr} detail="Receita mensal recorrente com preço estruturado." tone="positive" />
        <ExecutiveSignal label="ARR estimado" value={dashboard.metrics.arr} detail="MRR atual multiplicado por 12." tone="positive" />
        <ExecutiveSignal label="Clientes ativos" value={dashboard.metrics.activeCustomers} detail={`${dashboard.metrics.individualCustomers} individuais · ${dashboard.metrics.institutionalCustomers} institucionais`} />
        <ExecutiveSignal label="Receita em risco" value={dashboard.metrics.revenueAtRisk} detail={`${dashboard.metrics.revenueRiskCount} assinatura(s) com cobrança pendente/incompleta.`} tone={riskTone} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Novos clientes" value={dashboard.metrics.newCustomers} hint={`Entradas comerciais nos ${dashboard.periodLabel.toLowerCase()}.`} />
        <KpiCard label="Churn de clientes" value={dashboard.metrics.customerChurn} hint="Estimado com cancelamentos do período." />
        <KpiCard label="Uso do produto" value={dashboard.metrics.calculationsLast7d} hint={`${dashboard.metrics.activeProductUsers7d} usuário(s) com cálculo nos últimos 7 dias.`} />
        <KpiCard label="Licenças ativas" value={dashboard.metrics.activeLicenses} hint={`${dashboard.metrics.missingLicenseCount} inconsistência(s) de entitlement.`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <section className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-black text-white">Contas que movem receita</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">Maiores contas ativas por MRR conhecido. Contratos sob consulta sem valor estruturado aparecem como N/D.</p>
            </div>
            <Link href="/admin/customers" className="text-sm font-black text-cyan-200 hover:text-cyan-100">Ver clientes</Link>
          </div>
          <DataTable
            rows={dashboard.topAccounts}
            empty="Ainda não há assinaturas ativas com dados suficientes."
            columns={[
              { key: "account", header: "Conta", render: (row) => row.account },
              { key: "plan", header: "Plano", render: (row) => <StatusBadge status={row.plan} /> },
              { key: "type", header: "Tipo", render: (row) => row.type },
              { key: "mrr", header: "MRR", render: (row) => row.mrrCents === null ? "N/D" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(row.mrrCents / 100) },
              { key: "license", header: "Licença", render: (row) => <StatusBadge status={row.licenseStatus} /> }
            ]}
          />
        </section>

        <section className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-black text-white">Focos executivos</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">O que C-Level deve olhar antes de discutir crescimento, operação ou captação.</p>
            </div>
            <StatusBadge status={readinessTone === "positive" ? "controlado" : readinessTone === "critical" ? "bloqueado" : "atenção"} />
          </div>
          <div className="grid gap-3">
            <div className="rounded-lg border border-cyan-300/10 bg-slate-900/50 p-4">
              <p className="font-black text-white">Crescimento</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{dashboard.metrics.newUsers} novo(s) usuário(s), {dashboard.metrics.newCustomers} novo(s) cliente(s) e {dashboard.metrics.trialingCustomers} trial(s) ativo(s) nos últimos 30 dias.</p>
            </div>
            <div className="rounded-lg border border-cyan-300/10 bg-slate-900/50 p-4">
              <p className="font-black text-white">Risco de receita</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{dashboard.metrics.revenueRiskCount} cobrança(s) em risco, {dashboard.metrics.checkoutFailures} falha(s) de checkout e churn de receita estimado em {dashboard.metrics.revenueChurn}.</p>
            </div>
            <div className="rounded-lg border border-cyan-300/10 bg-slate-900/50 p-4">
              <p className="font-black text-white">Qualidade operacional</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{dashboard.metrics.webhookFailures} webhook(s) aberto(s), {dashboard.metrics.missingLicenseCount} licença(s) inconsistente(s) e {dashboard.metrics.customRevenueWithoutAmountCount} contrato(s) custom sem valor estruturado.</p>
            </div>
          </div>
        </section>
      </div>

      <section className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-black text-white">Riscos que exigem ação</h2>
            <p className="mt-1 text-sm leading-6 text-slate-400">Cobrança pendente, licença inconsistente ou entitlement fora do esperado.</p>
          </div>
          <Link href="/admin/billing" className="text-sm font-black text-cyan-200 hover:text-cyan-100">Abrir billing</Link>
        </div>
        <DataTable
          rows={dashboard.riskAccounts}
          empty="Sem riscos comerciais críticos no momento."
          columns={[
            { key: "account", header: "Conta", render: (row) => row.account },
            { key: "risk", header: "Risco", render: (row) => <StatusBadge status={row.risk} /> },
            { key: "impact", header: "Impacto", render: (row) => row.impact },
            { key: "action", header: "Próxima ação", render: (row) => row.action }
          ]}
        />
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Áreas do backoffice</h2>
          <p className="mt-1 text-sm text-slate-400">Módulos operacionais para investigar os sinais do cockpit.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleModules.map((item) => (
            <AdminModuleLink key={item.href} href={item.href} title={item.label} description={item.description} permission={item.permission} />
          ))}
        </div>
      </section>

      <DataTable
        rows={dashboard.recentAuditEvents}
        empty="Sem eventos administrativos recentes."
        columns={[
          { key: "action", header: "Última governança", render: (event) => event.action },
          { key: "resource", header: "Recurso", render: (event) => event.resourceType },
          { key: "outcome", header: "Resultado", render: (event) => <StatusBadge status={event.outcome} /> },
          { key: "actor", header: "Ator", render: (event) => event.actor?.email ?? event.actor?.name ?? "sistema" },
          { key: "created", header: "Data", render: (event) => event.createdAt.toLocaleString("pt-BR") }
        ]}
      />
    </div>
  );
}
