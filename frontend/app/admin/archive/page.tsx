import { ArchiveJobStatus, ArchiveJobType, ArchiveRestoreStatus } from "@prisma/client";
import { AdminPageHeader, DataTable, EmptyState, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { listArchiveRestoreJobs } from "@/lib/admin-archive-restore";
import { ARCHIVE_POLICIES, listArchiveJobs } from "@/lib/admin-archive";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { processArchiveJobAction, requestArchiveJobAction, requestArchiveRestoreAction } from "./actions";

export const runtime = "nodejs";

export default async function AdminArchivePage({
  searchParams
}: {
  searchParams?: Promise<{ message?: string; error?: string; page?: string; pageSize?: string; status?: string; type?: string }>;
}) {
  await requireAdminPermission("admin.contingency.manage");
  const params = await searchParams;
  const archive = await listArchiveJobs(params);
  const restores = await listArchiveRestoreJobs(params);
  const completed = archive.items.filter((job) => job.status === ArchiveJobStatus.COMPLETED).length;
  const failed = archive.items.filter((job) => job.status === ArchiveJobStatus.FAILED).length;
  const restoreFailures = restores.items.filter((job) => job.status === ArchiveRestoreStatus.FAILED || job.status === ArchiveRestoreStatus.BLOCKED).length;

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Produção ampla"
        title="Arquivamento externo"
        description="Archive histórico para storage privado com referência rastreável em ArchiveObject. Produção ampla exige provider S3-compatible; local_private é permitido apenas em desenvolvimento/teste."
      />

      {params?.message ? <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-bold text-emerald-100">{params.message}</div> : null}
      {params?.error ? <div className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm font-bold text-rose-100">{params.error}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Jobs filtrados" value={archive.total} hint="Paginação server-side." />
        <KpiCard label="Concluídos na página" value={completed} hint="Status COMPLETED." />
        <KpiCard label="Falhas archive/restore" value={failed + restoreFailures} hint="Investigar antes de retenção destrutiva ou restore." />
      </div>

      <section className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4">
        <h2 className="text-xl font-black text-white">Criar archive</h2>
        <form action={requestArchiveJobAction} className="grid gap-3 md:grid-cols-5">
          <select name="type" defaultValue={ArchiveJobType.FUNNEL_EVENTS} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-300/50">
            {ARCHIVE_POLICIES.map((policy) => <option key={policy.type} value={policy.type}>{policy.label}</option>)}
          </select>
          <input name="dateTo" type="date" className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-300/50" />
          <input name="stepUpPassword" type="password" required placeholder="Senha atual" className="h-10 rounded-md border border-rose-300/20 bg-slate-950 px-3 text-sm font-bold text-rose-100 outline-none placeholder:text-slate-700 focus:border-rose-300/50" />
          <button type="submit" className="h-10 rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200 md:col-span-2">Arquivar agora</button>
        </form>
      </section>

      <form className="grid gap-3 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4 md:grid-cols-4">
        <select name="type" defaultValue={params?.type ?? ""} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-300/50">
          <option value="">Todos os tipos</option>
          {Object.values(ArchiveJobType).map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <select name="status" defaultValue={params?.status ?? ""} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-300/50">
          <option value="">Todos os status</option>
          {Object.values(ArchiveJobStatus).map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <input name="pageSize" defaultValue={params?.pageSize ?? "25"} className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none focus:border-cyan-300/50" />
        <button type="submit" className="h-10 rounded-md border border-cyan-300/20 px-4 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/10">Filtrar</button>
      </form>

      <DataTable
        rows={archive.items}
        empty={<EmptyState title="Sem archives" description="Crie um archive para começar a mover histórico para storage privado." />}
        columns={[
          { key: "type", header: "Tipo", render: (job) => job.type },
          { key: "status", header: "Status", render: (job) => <StatusBadge status={job.status} /> },
          { key: "dateTo", header: "Até", render: (job) => job.dateTo.toLocaleDateString("pt-BR") },
          { key: "rows", header: "Linhas", render: (job) => job.rowCount ?? "-" },
          { key: "objects", header: "Objetos", render: (job) => job.objects.map((object) => `${object.storageProvider}:${object.rowCount}`).join(", ") || "-" },
          { key: "created", header: "Criado", render: (job) => job.createdAt.toLocaleString("pt-BR") },
          {
            key: "actions",
            header: "Ações",
            render: (job) => job.status === ArchiveJobStatus.FAILED || job.status === ArchiveJobStatus.QUEUED ? (
              <form action={processArchiveJobAction} className="grid min-w-48 gap-2">
                <input type="hidden" name="jobId" value={job.id} />
                <input name="stepUpPassword" type="password" required placeholder="Senha atual" className="h-8 rounded-md border border-rose-300/20 bg-slate-950 px-2 text-xs font-bold text-rose-100 outline-none" />
                <button type="submit" className="text-xs font-black text-amber-200">Processar</button>
              </form>
            ) : "-"
          }
        ]}
      />

      <section className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4">
        <h2 className="text-xl font-black text-white">Restore controlado</h2>
        <p className="text-sm font-semibold text-slate-400">
          Restore exige motivo, senha atual e validação de checksum. Use dry-run antes de executar restauração real.
        </p>
        <DataTable
          rows={archive.items.flatMap((job) => job.objects.map((object) => ({ ...object, archiveType: job.type })))}
          empty={<EmptyState title="Nenhum objeto arquivado" description="Conclua um archive antes de solicitar restore." />}
          columns={[
            { key: "type", header: "Tipo", render: (object) => object.archiveType },
            { key: "provider", header: "Provider", render: (object) => object.storageProvider },
            { key: "rows", header: "Linhas", render: (object) => object.rowCount },
            { key: "checksum", header: "Checksum", render: (object) => <span className="font-mono text-xs">{object.checksum.slice(0, 12)}...</span> },
            {
              key: "restore",
              header: "Restore",
              render: (object) => (
                <form action={requestArchiveRestoreAction} className="grid min-w-64 gap-2">
                  <input type="hidden" name="archiveObjectId" value={object.id} />
                  <select name="mode" defaultValue="dry-run" className="h-8 rounded-md border border-cyan-300/10 bg-slate-950 px-2 text-xs font-semibold text-slate-200 outline-none">
                    <option value="dry-run">Dry-run</option>
                    <option value="execute">Executar restore</option>
                  </select>
                  <input name="reason" required minLength={8} placeholder="Motivo operacional" className="h-8 rounded-md border border-cyan-300/10 bg-slate-950 px-2 text-xs font-semibold text-slate-200 outline-none" />
                  <input name="stepUpPassword" type="password" required placeholder="Senha atual" className="h-8 rounded-md border border-rose-300/20 bg-slate-950 px-2 text-xs font-bold text-rose-100 outline-none" />
                  <input name="force" placeholder="confirm_force_restore se duplicado" className="h-8 rounded-md border border-amber-300/20 bg-slate-950 px-2 text-xs font-semibold text-amber-100 outline-none" />
                  <button type="submit" className="h-8 rounded-md bg-cyan-300 px-3 text-xs font-black text-slate-950">Solicitar</button>
                </form>
              )
            }
          ]}
        />
      </section>

      <section className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4">
        <h2 className="text-xl font-black text-white">Restore jobs recentes</h2>
        <DataTable
          rows={restores.items}
          empty={<EmptyState title="Sem restores" description="Nenhum dry-run ou restore foi solicitado para os archives filtrados." />}
          columns={[
            { key: "status", header: "Status", render: (job) => <StatusBadge status={job.status} /> },
            { key: "type", header: "Tipo", render: (job) => job.archiveObject.archiveJob.type },
            { key: "mode", header: "Modo", render: (job) => job.dryRun ? "Dry-run" : "Restore real" },
            { key: "rows", header: "Linhas", render: (job) => job.rowCount ?? "-" },
            { key: "restored", header: "Restauradas", render: (job) => job.restoredCount ?? "-" },
            { key: "reason", header: "Motivo", render: (job) => job.reason },
            { key: "created", header: "Criado", render: (job) => job.createdAt.toLocaleString("pt-BR") }
          ]}
        />
      </section>
    </div>
  );
}
