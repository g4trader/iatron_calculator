import { AdminPageHeader, KpiCard } from "@/components/admin/AdminPrimitives";

export default function AdminOperationsLoading() {
  return (
    <div className="grid gap-6">
      <AdminPageHeader eyebrow="Operações" title="Painel Operacional e Status" description="Carregando status operacional..." />
      <div className="h-36 rounded-xl border border-cyan-300/10 bg-slate-950/75" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {["Erro de login", "Erro de checkout", "Webhooks Stripe", "Sessões ativas", "Sessões revogadas", "Sessões expiradas"].map((label) => (
          <KpiCard key={label} label={label} value="..." hint="Carregando" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="h-40 rounded-xl border border-cyan-300/10 bg-slate-950/75" />
        <div className="h-40 rounded-xl border border-cyan-300/10 bg-slate-950/75" />
        <div className="h-40 rounded-xl border border-cyan-300/10 bg-slate-950/75" />
        <div className="h-40 rounded-xl border border-cyan-300/10 bg-slate-950/75" />
      </div>
    </div>
  );
}
