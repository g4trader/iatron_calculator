import Link from "next/link";
import { Plan, SubscriptionStatus } from "@prisma/client";
import { AdminPageHeader, DataTable, EmptyState, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { getAdminCustomers, parseCustomerFilters, type CustomerActivityFilter, type CustomerRisk } from "@/lib/admin-customers";

export const runtime = "nodejs";

const riskOptions: Array<{ value: CustomerRisk; label: string }> = [
  { value: "healthy", label: "Healthy" },
  { value: "monitor", label: "Monitor" },
  { value: "at-risk", label: "At-risk" },
  { value: "critical", label: "Critical" }
];

const activityOptions: Array<{ value: CustomerActivityFilter; label: string }> = [
  { value: "active_7d", label: "Ativo 7 dias" },
  { value: "active_30d", label: "Ativo 30 dias" },
  { value: "inactive_30d", label: "Inativo 30+ dias" }
];

function TextFilter({ name, label, placeholder, defaultValue }: { name: string; label: string; placeholder: string; defaultValue?: string }) {
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

function SelectFilter({
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

function formatDate(date: Date | null) {
  return date ? date.toLocaleString("pt-BR") : "Sem atividade";
}

export default async function AdminCustomersPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; status?: string; plan?: string; risk?: string; organization?: string; activity?: string; message?: string; error?: string }>;
}) {
  await requireAdminPermission("admin.customers.view");
  const params = await searchParams;
  const filters = parseCustomerFilters(params);
  const customers = await getAdminCustomers(filters);
  const healthy = customers.filter((customer) => customer.risk === "healthy").length;
  const monitor = customers.filter((customer) => customer.risk === "monitor").length;
  const atRisk = customers.filter((customer) => customer.risk === "at-risk").length;
  const critical = customers.filter((customer) => customer.risk === "critical").length;

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Clientes"
        title="Clientes e Organizações"
        description="Visão 360 de clientes individuais e institucionais para suporte, sucesso do cliente e operação comercial. O health score é inicial e documentado."
      />

      {params?.message ? <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-bold text-emerald-100">{params.message}</div> : null}
      {params?.error ? <div className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm font-bold text-rose-100">{params.error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Clientes filtrados" value={customers.length} hint="Inclui contas individuais e organizações." />
        <KpiCard label="Healthy" value={healthy} hint="Score entre 80 e 100." />
        <KpiCard label="Monitor" value={monitor} hint="Score entre 60 e 79." />
        <KpiCard label="At-risk" value={atRisk} hint="Score entre 40 e 59." />
        <KpiCard label="Critical" value={critical} hint="Score entre 0 e 39." />
      </div>

      <form className="grid gap-3 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4 md:grid-cols-3 xl:grid-cols-7 xl:items-end">
        <TextFilter name="q" label="Busca" placeholder="nome ou e-mail" defaultValue={filters.q} />
        <SelectFilter name="status" label="Assinatura" defaultValue={filters.status} options={Object.values(SubscriptionStatus).map((status) => ({ value: status, label: status }))} />
        <SelectFilter name="plan" label="Plano" defaultValue={filters.plan} options={Object.values(Plan).map((plan) => ({ value: plan, label: plan }))} />
        <SelectFilter name="risk" label="Risco" defaultValue={filters.risk} options={riskOptions} />
        <TextFilter name="organization" label="Organização" placeholder="hospital ou grupo" defaultValue={filters.organization} />
        <SelectFilter name="activity" label="Atividade" defaultValue={filters.activity} options={activityOptions} />
        <button type="submit" className="h-10 rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200">Filtrar</button>
      </form>

      <DataTable
        rows={customers}
        empty={<EmptyState title="Nenhum cliente encontrado" description="Ajuste filtros ou confirme se há usuários/organizações no ambiente." />}
        columns={[
          {
            key: "customer",
            header: "Cliente",
            render: (customer) => (
              <div className="min-w-56">
                <Link href={`/admin/customers/${customer.id}`} className="font-black text-white transition hover:text-cyan-200">{customer.name}</Link>
                <p className="mt-1 text-xs text-slate-500">{customer.email}</p>
                <p className="mt-1 text-xs text-slate-600">{customer.organizationName ?? "Sem organização"}</p>
              </div>
            )
          },
          { key: "type", header: "Tipo", render: (customer) => <StatusBadge status={customer.type === "institutional" ? "institucional" : "individual"} /> },
          { key: "plan", header: "Plano", render: (customer) => customer.plan },
          { key: "subscription", header: "Assinatura", render: (customer) => <StatusBadge status={customer.subscriptionStatus} /> },
          { key: "license", header: "Licença", render: (customer) => <StatusBadge status={customer.licenseStatus} /> },
          { key: "activity", header: "Última atividade", render: (customer) => formatDate(customer.lastActivityAt) },
          {
            key: "health",
            header: "Health score",
            render: (customer) => (
              <div className="min-w-32">
                <p className="text-2xl font-black text-white">{customer.healthScore}</p>
                <StatusBadge status={customer.risk} />
              </div>
            )
          }
        ]}
      />
    </div>
  );
}
