import { AdminPageHeader, KpiCard } from "@/components/admin/AdminPrimitives";

export default function AdminSalesLoading() {
  return (
    <div className="grid gap-6">
      <AdminPageHeader eyebrow="Vendas" title="Painel de Vendas" description="Carregando métricas comerciais..." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {["MRR atual", "ARR estimado", "Clientes ativos", "Churn"].map((label) => (
          <KpiCard key={label} label={label} value="..." hint="Carregando" />
        ))}
      </div>
      <div className="h-72 rounded-xl border border-cyan-300/10 bg-slate-950/75" />
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="h-72 rounded-xl border border-cyan-300/10 bg-slate-950/75" />
        <div className="h-72 rounded-xl border border-cyan-300/10 bg-slate-950/75" />
      </div>
    </div>
  );
}
