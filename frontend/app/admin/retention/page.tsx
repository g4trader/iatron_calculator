import { RetentionRunStatus } from "@prisma/client";
import { AdminPageHeader, DataTable, EmptyState, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { listRetentionRuns, RETENTION_POLICIES } from "@/lib/admin-retention";
import { runRetentionPolicyAction } from "./actions";

export const runtime = "nodejs";

export default async function AdminRetentionPage({
  searchParams
}: {
  searchParams?: Promise<{ message?: string; error?: string; page?: string; pageSize?: string; status?: string; policy?: string }>;
}) {
  await requireAdminPermission("admin.contingency.manage");
  const params = await searchParams;
  const runs = await listRetentionRuns(params);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Operação"
        title="Retenção e arquivamento"
        description="Políticas formais de retenção com dry-run por padrão. Execução real exige step-up e nunca apaga AdminAuditEvent sem estratégia externa de arquivo."
      />

      {params?.message ? <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-bold text-emerald-100">{params.message}</div> : null}
      {params?.error ? <div className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm font-bold text-rose-100">{params.error}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Políticas" value={RETENTION_POLICIES.length} hint="Curta, média e longa." />
        <KpiCard label="Execuções filtradas" value={runs.total} hint="Paginação server-side." />
        <KpiCard label="Falhas na página" value={runs.items.filter((run) => run.status === "FAILED").length} hint="Requer investigação." />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {RETENTION_POLICIES.map((policy) => (
          <section key={policy.id} className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4">
            <div>
              <h2 className="font-black text-white">{policy.label}</h2>
              <p className="mt-2 text-sm text-slate-400">Janela: {policy.days} dias.</p>
            </div>
            <form action={runRetentionPolicyAction} className="grid gap-2">
              <input type="hidden" name="policyId" value={policy.id} />
              <button type="submit" className="h-10 rounded-md border border-cyan-300/20 px-4 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/10">Dry-run</button>
            </form>
            <form action={runRetentionPolicyAction} className="grid gap-2">
              <input type="hidden" name="policyId" value={policy.id} />
              <input type="hidden" name="execute" value="true" />
              <input name="stepUpPassword" type="password" required placeholder="Senha atual" className="h-10 rounded-md border border-rose-300/20 bg-slate-950 px-3 text-sm font-bold text-rose-100 outline-none placeholder:text-slate-700 focus:border-rose-300/50" />
              <button type="submit" className="h-10 rounded-md bg-rose-300 px-4 text-sm font-black text-slate-950 transition hover:bg-rose-200">Executar limpeza</button>
            </form>
          </section>
        ))}
      </div>

      <form className="grid gap-3 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4 md:grid-cols-4">
        <select name="policy" defaultValue={params?.policy ?? ""} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-300/50">
          <option value="">Todas as políticas</option>
          {RETENTION_POLICIES.map((policy) => <option key={policy.id} value={policy.id}>{policy.id}</option>)}
        </select>
        <select name="status" defaultValue={params?.status ?? ""} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-300/50">
          <option value="">Todos os status</option>
          {Object.values(RetentionRunStatus).map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <input name="pageSize" defaultValue={params?.pageSize ?? "25"} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-300/50" />
        <button type="submit" className="h-10 rounded-md border border-cyan-300/20 px-4 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/10">Filtrar</button>
      </form>

      <DataTable
        rows={runs.items}
        empty={<EmptyState title="Sem execuções de retenção" />}
        columns={[
          { key: "policy", header: "Política", render: (run) => run.policy },
          { key: "status", header: "Status", render: (run) => <StatusBadge status={run.status} /> },
          { key: "dryRun", header: "Modo", render: (run) => run.dryRun ? "dry-run" : "execute" },
          { key: "cutoff", header: "Cutoff", render: (run) => run.cutoff.toLocaleDateString("pt-BR") },
          { key: "actor", header: "Operador", render: (run) => run.requestedBy?.email ?? run.requestedByUserId ?? "-" },
          { key: "result", header: "Resultado", render: (run) => <code className="text-xs text-slate-400">{run.errorMessage ?? JSON.stringify(run.result ?? {})}</code> }
        ]}
      />
    </div>
  );
}
