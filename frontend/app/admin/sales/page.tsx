import { BillingCycle, Plan, SubscriptionOwnerType, SubscriptionStatus } from "@prisma/client";
import { AdminPageHeader, DataTable, EmptyState, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { FunnelChart, RevenueBreakdown, RevenueTimeline } from "@/components/admin/SalesCharts";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { formatCurrencyFromCents, getAdminSalesDashboard, parseSalesFilters, salesMetricNotes, salesPeriodLabels } from "@/lib/admin-sales";

export const runtime = "nodejs";

function Select({
  name,
  label,
  defaultValue,
  options
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: Array<{ value: string; label: string }>;
}) {
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

export default async function AdminSalesPage({ searchParams }: { searchParams?: Promise<{ period?: string; plan?: string; ownerType?: string; status?: string }> }) {
  await requireAdminPermission("admin.sales.view");
  const params = await searchParams;
  const filters = parseSalesFilters(params);
  const dashboard = await getAdminSalesDashboard(filters);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Vendas"
        title="Painel de Vendas"
        description="Dashboard executivo de receita e crescimento. Métricas de receita usam agregação server-side; dados sem base histórica aparecem como estimativa ou placeholder técnico."
      />

      <form className="grid gap-3 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4 md:grid-cols-5 md:items-end">
        <Select
          name="period"
          label="Período"
          defaultValue={filters.period}
          options={Object.entries(salesPeriodLabels).map(([value, label]) => ({ value, label }))}
        />
        <Select
          name="plan"
          label="Plano"
          defaultValue={filters.plan}
          options={Object.values(Plan).map((plan) => ({ value: plan, label: plan }))}
        />
        <Select
          name="ownerType"
          label="Tipo de cliente"
          defaultValue={filters.ownerType}
          options={[
            { value: SubscriptionOwnerType.USER, label: "Individual" },
            { value: SubscriptionOwnerType.ORGANIZATION, label: "Institucional" }
          ]}
        />
        <Select
          name="status"
          label="Status"
          defaultValue={filters.status}
          options={Object.values(SubscriptionStatus).map((status) => ({ value: status, label: status }))}
        />
        <button type="submit" className="h-10 rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
          Aplicar filtros
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboard.metrics.map((metric) => (
          <KpiCard
            key={metric.label}
            label={metric.label}
            value={
              <span className="flex flex-col gap-2">
                <span>{metric.value}</span>
                <StatusBadge status={metric.precision} />
              </span>
            }
            hint={metric.note}
          />
        ))}
      </div>

      <RevenueTimeline points={dashboard.revenueTimeline} />

      <div className="grid gap-4 xl:grid-cols-2">
        <RevenueBreakdown
          title="Receita por ciclo"
          description="Mensal equivalente por ciclo. Não há ciclo vitalício modelado no banco atual."
          rows={dashboard.revenueByCycle}
        />
        <RevenueBreakdown
          title="Receita por tipo de cliente"
          description="Individual versus institucional, considerando apenas receita com preço estruturado."
          rows={dashboard.revenueByOwnerType}
        />
      </div>

      <FunnelChart rows={dashboard.funnel} />

      <div className="grid gap-4 xl:grid-cols-2">
        <DataTable
          rows={dashboard.statusBreakdown}
          empty={<EmptyState title="Sem assinaturas no filtro" />}
          columns={[
            { key: "status", header: "Status", render: (row) => <StatusBadge status={row.label} /> },
            { key: "count", header: "Assinaturas", render: (row) => row.count },
            { key: "precision", header: "Precisão", render: (row) => <StatusBadge status={row.precision} /> }
          ]}
        />

        <DataTable
          rows={dashboard.averageTicketByPlan}
          empty={<EmptyState title="Sem ticket por plano" />}
          columns={[
            { key: "plan", header: "Plano", render: (row) => row.label },
            { key: "ticket", header: "Ticket médio", render: (row) => row.valueCents === null ? "N/D" : formatCurrencyFromCents(row.valueCents) },
            { key: "count", header: "Clientes", render: (row) => row.count },
            { key: "precision", header: "Precisão", render: (row) => <StatusBadge status={row.precision} /> }
          ]}
        />
      </div>

      <DataTable
        rows={[
          { id: "mrr", metric: "MRR", formula: salesMetricNotes.mrr, precision: "precise" },
          { id: "arr", metric: "ARR", formula: salesMetricNotes.arr, precision: "estimated" },
          { id: "customer_churn", metric: "Churn de clientes", formula: salesMetricNotes.customerChurn, precision: "estimated" },
          { id: "revenue_churn", metric: "Churn de receita", formula: salesMetricNotes.revenueChurn, precision: "estimated" },
          { id: "upgrades", metric: "Upgrades/downgrades", formula: salesMetricNotes.upgradesDowngrades, precision: "placeholder" },
          { id: "funnel", metric: "Funil", formula: salesMetricNotes.funnel, precision: "placeholder" },
          { id: "lifetime", metric: "Vitalício", formula: "TODO: o modelo atual não possui BillingCycle vitalício; BIENNIAL representa 2 anos.", precision: "placeholder" }
        ]}
        columns={[
          { key: "metric", header: "Métrica", render: (row) => row.metric },
          { key: "formula", header: "Fórmula/limite", render: (row) => row.formula },
          { key: "precision", header: "Precisão", render: (row) => <StatusBadge status={row.precision} /> }
        ]}
      />
    </div>
  );
}
