import { ManualPaymentStatus } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader, AuditTimeline, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { LICENSE_DURATION_PRESETS } from "@/lib/admin-licenses";
import { formatCentsBRL, MANUAL_PAYMENT_METHOD_LABELS, MANUAL_PAYMENT_STATUS_LABELS } from "@/lib/admin-manual-payments";
import { prisma } from "@/lib/prisma";
import { releaseManualPaymentLicenseAction, updateManualPaymentStatusAction } from "../actions";
import { ManualPaymentAttachmentUploader } from "./ManualPaymentAttachmentUploader";

export const runtime = "nodejs";

function formatDate(value: Date | null) {
  return value ? value.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "-";
}

function reasonInput() {
  return (
    <input
      name="reason"
      required
      minLength={8}
      placeholder="Motivo obrigatório"
      className="h-9 min-w-52 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-xs font-semibold text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-300/50"
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
      className="h-9 min-w-48 rounded-md border border-rose-300/20 bg-slate-950 px-3 text-xs font-bold text-rose-100 outline-none transition placeholder:text-slate-700 focus:border-rose-300/50"
    />
  );
}

function presetSelect() {
  return (
    <select name="preset" defaultValue="30d" className="h-9 rounded-md border border-cyan-300/10 bg-slate-950 px-2 text-xs font-bold text-slate-200 outline-none transition focus:border-cyan-300/50">
      {Object.entries(LICENSE_DURATION_PRESETS).map(([value, preset]) => (
        <option key={value} value={value}>{preset.label}</option>
      ))}
    </select>
  );
}

function StatusActionForm({ paymentId, status, label, tone }: { paymentId: string; status: Extract<ManualPaymentStatus, "CONFIRMED" | "REJECTED" | "RECONCILED">; label: string; tone: "cyan" | "rose" | "emerald" }) {
  const classes = {
    cyan: "border-cyan-300/20 text-cyan-100 hover:bg-cyan-300/10",
    rose: "border-rose-300/20 text-rose-100 hover:bg-rose-300/10",
    emerald: "border-emerald-300/20 text-emerald-100 hover:bg-emerald-300/10"
  };

  return (
    <form action={updateManualPaymentStatusAction} className="flex flex-wrap items-end gap-2 rounded-lg border border-cyan-300/10 bg-slate-900/35 p-3">
      <input type="hidden" name="paymentId" value={paymentId} />
      <input type="hidden" name="status" value={status} />
      {reasonInput()}
      {stepUpInput()}
      <button type="submit" className={`h-9 rounded-md border px-3 text-xs font-black transition ${classes[tone]}`}>{label}</button>
    </form>
  );
}

function ReconciliationForm({ paymentId }: { paymentId: string }) {
  return (
    <form action={updateManualPaymentStatusAction} className="grid gap-3 rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-3 md:grid-cols-2 xl:grid-cols-5">
      <input type="hidden" name="paymentId" value={paymentId} />
      <input type="hidden" name="status" value={ManualPaymentStatus.RECONCILED} />
      {reasonInput()}
      {stepUpInput()}
      <input
        name="reconciliationReference"
        placeholder="Referência interna"
        className="h-9 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-xs font-semibold text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-300/50"
      />
      <input
        name="reconciliationNote"
        placeholder="Observação de conciliação"
        className="h-9 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-xs font-semibold text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-300/50"
      />
      <button type="submit" className="h-9 rounded-md border border-cyan-300/20 px-3 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/10">Marcar conciliado</button>
    </form>
  );
}

export default async function AdminManualPaymentDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ message?: string; error?: string }>;
}) {
  await requireAdminPermission("admin.billing.manage");
  const { id } = await params;
  const query = await searchParams;

  const payment = await prisma.manualPayment.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true } },
      organization: { select: { id: true, name: true } },
      license: { select: { id: true, licenseKey: true, status: true, origin: true, endsAt: true } },
      createdBy: { select: { email: true, name: true } },
      confirmedBy: { select: { email: true, name: true } },
      reconciledBy: { select: { email: true, name: true } },
      attachments: {
        orderBy: { createdAt: "desc" },
        select: { id: true, fileName: true, contentType: true, byteSize: true, status: true, uploadedAt: true }
      }
    }
  });
  if (!payment) notFound();

  const auditEvents = await prisma.adminAuditEvent.findMany({
    where: {
      OR: [
        { resourceType: "manual_payment", resourceId: payment.id },
        ...(payment.licenseId ? [{ resourceType: "license", resourceId: payment.licenseId }] : [])
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 80,
    include: { actor: { select: { email: true, name: true } } }
  });

  const canReleaseLicense = payment.status === ManualPaymentStatus.CONFIRMED && !payment.licenseId && Boolean(payment.userId);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Pagamento manual"
        title="Detalhe e liberação"
        description="Confirme o recebimento, concilie e libere a licença somente quando houver evidência operacional suficiente."
        actions={<Link href="/admin/payments-manual" className="rounded-md border border-cyan-300/20 px-3 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/10">Voltar</Link>}
      />

      {query?.message ? <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-bold text-emerald-100">{query.message}</div> : null}
      {query?.error ? <div className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm font-bold text-rose-100">{query.error}</div> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Status" value={<StatusBadge status={MANUAL_PAYMENT_STATUS_LABELS[payment.status]} />} hint="Estado financeiro operacional." />
        <KpiCard label="Valor" value={formatCentsBRL(payment.amountCents)} hint={MANUAL_PAYMENT_METHOD_LABELS[payment.method]} />
        <KpiCard label="Pago em" value={formatDate(payment.paidAt)} hint="Data informada pelo operador." />
        <KpiCard label="Licença" value={payment.license ? payment.license.status : "Não liberada"} hint={payment.license?.licenseKey ?? payment.license?.id ?? "Sem vínculo"} />
      </div>

      <section className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
        <h2 className="text-xl font-black text-white">Contexto operacional</h2>
        <div className="grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">Cliente</p>
            <p className="mt-2 font-bold text-slate-200">{payment.user?.email ?? payment.user?.name ?? "Sem usuário"}</p>
            <p className="mt-1 text-xs text-slate-500">{payment.userId ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">Organização</p>
            <p className="mt-2 font-bold text-slate-200">{payment.organization?.name ?? "Individual"}</p>
            <p className="mt-1 text-xs text-slate-500">{payment.organizationId ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">Comprovante</p>
            <p className="mt-2 font-bold text-slate-200">{payment.proofReference ?? "Sem referência textual"}</p>
            <p className="mt-1 text-xs text-slate-500">{payment.externalReference ?? "Sem referência externa"} · {payment.attachments.length} anexo(s)</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">Motivo</p>
            <p className="mt-2 font-bold text-slate-200">{payment.reason}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">Operadores</p>
            <p className="mt-2 text-slate-300">Criado por {payment.createdBy.email ?? payment.createdBy.name ?? "admin"}</p>
            <p className="text-slate-500">Confirmado por {payment.confirmedBy?.email ?? payment.confirmedBy?.name ?? "-"}</p>
            <p className="text-slate-500">Conciliado por {payment.reconciledBy?.email ?? payment.reconciledBy?.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">Datas</p>
            <p className="mt-2 text-slate-300">Criado: {formatDate(payment.createdAt)}</p>
            <p className="text-slate-500">Confirmado: {formatDate(payment.confirmedAt)}</p>
            <p className="text-slate-500">Conciliado: {formatDate(payment.reconciledAt)}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">Conciliação</p>
            <p className="mt-2 text-slate-300">{payment.reconciliationReference ?? "Sem referência interna"}</p>
            <p className="text-slate-500">{payment.reconciliationNote ?? "Sem observação de conciliação"}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
        <div>
          <h2 className="text-xl font-black text-white">Comprovante privado</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Anexe evidências sem expor arquivo publicamente. O acesso de abertura gera URL temporária e evento de auditoria.</p>
        </div>
        <ManualPaymentAttachmentUploader
          paymentId={payment.id}
          attachments={payment.attachments.map((attachment) => ({
            ...attachment,
            uploadedAt: attachment.uploadedAt?.toISOString() ?? null
          }))}
        />
      </section>

      <section className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
        <div>
          <h2 className="text-xl font-black text-white">Ações auditadas</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Ações críticas exigem motivo e step-up. Pagamento pendente não libera licença.</p>
        </div>
        <div className="grid gap-3">
          {payment.status === ManualPaymentStatus.PENDING ? (
            <>
              <StatusActionForm paymentId={payment.id} status={ManualPaymentStatus.CONFIRMED} label="Confirmar recebimento" tone="emerald" />
              <StatusActionForm paymentId={payment.id} status={ManualPaymentStatus.REJECTED} label="Recusar registro" tone="rose" />
            </>
          ) : null}
          {payment.status === ManualPaymentStatus.CONFIRMED && !payment.licenseId ? (
            <form action={releaseManualPaymentLicenseAction} className="flex flex-wrap items-end gap-2 rounded-lg border border-emerald-300/20 bg-emerald-300/5 p-3">
              <input type="hidden" name="paymentId" value={payment.id} />
              {presetSelect()}
              {reasonInput()}
              {stepUpInput()}
              <input name="note" placeholder="Nota interna da licença" className="h-9 min-w-44 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-xs font-semibold text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-300/50" />
              <button type="submit" disabled={!canReleaseLicense} className="h-9 rounded-md bg-cyan-300 px-3 text-xs font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40">Liberar licença</button>
            </form>
          ) : null}
          {payment.status === ManualPaymentStatus.CONFIRMED && payment.licenseId ? (
            <ReconciliationForm paymentId={payment.id} />
          ) : null}
          {!canReleaseLicense && !payment.licenseId && payment.status !== ManualPaymentStatus.PENDING ? (
            <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm font-bold text-amber-100">
              Liberação bloqueada: o pagamento precisa estar confirmado e vinculado a um usuário.
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-white">Auditoria</h2>
        <AuditTimeline events={auditEvents} />
      </section>
    </div>
  );
}
