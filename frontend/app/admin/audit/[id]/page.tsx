import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { describeAuditAction, getAdminAuditEvent, sanitizeAuditMetadata } from "@/lib/admin-audit";

export const runtime = "nodejs";

function meta(label: string, value: string | null | undefined) {
  return (
    <div className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-600">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-slate-200">{value ?? "-"}</p>
    </div>
  );
}

export default async function AdminAuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPermission("admin.audit.view");
  const { id } = await params;
  const event = await getAdminAuditEvent(id);
  if (!event) notFound();

  const metadata = JSON.stringify(sanitizeAuditMetadata(event.metadata), null, 2);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Audit trail"
        title={describeAuditAction(event.action)}
        description="Detalhe de evento administrativo com metadata sanitizada. Valores sensíveis são ocultados quando a chave indica secret, token, senha, cookie, assinatura, sessão, hash ou payload raw."
        actions={<Link href="/admin/audit" className="rounded-md border border-cyan-300/20 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/10">Voltar</Link>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Outcome" value={<StatusBadge status={event.outcome} />} hint="Resultado registrado pela mutation." />
        <KpiCard label="Recurso" value={event.resourceType} hint={event.resourceId ?? "Sem resourceId"} />
        <KpiCard label="Ator" value={event.actor?.email ?? event.actor?.name ?? event.actorUserId ?? "sistema"} />
        <KpiCard label="Timestamp" value={event.createdAt.toLocaleString("pt-BR")} />
      </div>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-white">Identificação</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {meta("Event ID", event.id)}
          {meta("Ação técnica", event.action)}
          {meta("Descrição", describeAuditAction(event.action))}
          {meta("Outcome", event.outcome)}
          {meta("Actor user", event.actor?.email ?? event.actorUserId)}
          {meta("Target user/org", event.targetUser?.email ?? event.targetUserId ?? event.organizationId)}
          {meta("IP", event.ipAddress)}
          {meta("User-Agent", event.userAgent)}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-white">Metadata sanitizada</h2>
        <pre className="overflow-x-auto rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5 text-sm leading-6 text-slate-200">
          {metadata}
        </pre>
      </section>
    </div>
  );
}
