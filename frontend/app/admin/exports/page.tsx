import Link from "next/link";
import { ExportJobFormat, ExportJobStatus, ExportJobType } from "@prisma/client";
import { AdminPageHeader, DataTable, EmptyState, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { listExportJobs } from "@/lib/admin-exports";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { requestAuditExportAction, processExportJobAction } from "./actions";

export const runtime = "nodejs";

function input(name: string, placeholder: string) {
  return <input name={name} placeholder={placeholder} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/50" />;
}

export default async function AdminExportsPage({
  searchParams
}: {
  searchParams?: Promise<{ message?: string; error?: string; page?: string; pageSize?: string; status?: string; type?: string }>;
}) {
  await requireAdminPermission("admin.audit.export");
  const params = await searchParams;
  const jobs = await listExportJobs(params);
  const ready = jobs.items.filter((job) => job.status === "COMPLETED").length;
  const failed = jobs.items.filter((job) => job.status === "FAILED").length;

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Governança"
        title="Exportações assíncronas"
        description="Exportações sensíveis são rastreadas por ExportJob, exigem step-up, usam storage privado e validam checksum antes do download."
      />

      {params?.message ? <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-bold text-emerald-100">{params.message}</div> : null}
      {params?.error ? <div className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm font-bold text-rose-100">{params.error}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Jobs filtrados" value={jobs.total} hint="Paginação server-side." />
        <KpiCard label="Prontos na página" value={ready} hint="Status COMPLETED." />
        <KpiCard label="Falhas na página" value={failed} hint="Exige análise operacional." />
      </div>

      <section className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4">
        <h2 className="text-xl font-black text-white">Solicitar exportação de auditoria</h2>
        <form action={requestAuditExportAction} className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
          {input("actor", "Ator")}
          {input("action", "Ação")}
          {input("resourceType", "Recurso")}
          {input("outcome", "Outcome")}
          <select name="format" defaultValue={ExportJobFormat.CSV} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-300/50">
            <option value="CSV">CSV</option>
            <option value="JSON">JSON</option>
          </select>
          <input name="stepUpPassword" type="password" required placeholder="Senha atual" className="h-10 rounded-md border border-rose-300/20 bg-slate-950 px-3 text-sm font-bold text-rose-100 outline-none placeholder:text-slate-700 focus:border-rose-300/50" />
          <button type="submit" className="h-10 rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200">Criar job</button>
        </form>
      </section>

      <form className="grid gap-3 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4 md:grid-cols-4">
        <select name="type" defaultValue={params?.type ?? ""} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-300/50">
          <option value="">Todos os tipos</option>
          {Object.values(ExportJobType).map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <select name="status" defaultValue={params?.status ?? ""} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-300/50">
          <option value="">Todos os status</option>
          {Object.values(ExportJobStatus).map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <input name="pageSize" defaultValue={params?.pageSize ?? "25"} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-300/50" />
        <button type="submit" className="h-10 rounded-md border border-cyan-300/20 px-4 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/10">Filtrar</button>
      </form>

      <DataTable
        rows={jobs.items}
        empty={<EmptyState title="Sem exportações" description="Solicite uma exportação para iniciar a trilha governada." />}
        columns={[
          { key: "type", header: "Tipo", render: (job) => job.type },
          { key: "status", header: "Status", render: (job) => <StatusBadge status={job.status} /> },
          { key: "format", header: "Formato", render: (job) => job.format },
          { key: "rows", header: "Linhas", render: (job) => job.rowCount ?? "-" },
          { key: "storage", header: "Storage", render: (job) => job.storageProvider ? `${job.storageProvider}:${job.byteSize ?? 0}b` : "pendente" },
          { key: "actor", header: "Solicitante", render: (job) => job.requestedBy?.email ?? job.requestedBy?.name ?? job.requestedByUserId ?? "-" },
          { key: "created", header: "Criado", render: (job) => job.createdAt.toLocaleString("pt-BR") },
          {
            key: "actions",
            header: "Ações",
            render: (job) => (
              <div className="flex flex-wrap gap-2">
                {job.status === "COMPLETED" ? <Link href={`/admin/exports/${job.id}/download`} className="text-xs font-black text-cyan-200">Download</Link> : null}
                {job.status === "QUEUED" || job.status === "FAILED" ? (
                  <form action={processExportJobAction} className="grid min-w-44 gap-2">
                    <input type="hidden" name="jobId" value={job.id} />
                    <input name="stepUpPassword" type="password" required placeholder="Senha atual" className="h-8 rounded-md border border-rose-300/20 bg-slate-950 px-2 text-xs font-bold text-rose-100 outline-none" />
                    <button type="submit" className="text-xs font-black text-amber-200">Processar</button>
                  </form>
                ) : null}
              </div>
            )
          }
        ]}
      />
    </div>
  );
}
