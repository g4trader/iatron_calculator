import { ManualPaymentMethod, ManualPaymentStatus } from "@prisma/client";
import Link from "next/link";
import { AdminPageHeader, DataTable, EmptyState, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { requireAdminPermission } from "@/lib/admin-permissions";
import {
  formatCentsBRL,
  listManualPayments,
  MANUAL_PAYMENT_METHOD_LABELS,
  MANUAL_PAYMENT_STATUS_LABELS,
  parseManualPaymentStatus
} from "@/lib/admin-manual-payments";
import { createManualPaymentAction } from "./actions";

export const runtime = "nodejs";

function textInput(name: string, label: string, placeholder: string, required = false, type = "text", defaultValue?: string) {
  return (
    <label className="grid gap-1 text-xs font-bold text-slate-500">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-300/50"
      />
    </label>
  );
}

function selectInput(name: string, label: string, options: Array<{ value: string; label: string }>, defaultValue?: string, includeAll = true) {
  return (
    <label className="grid gap-1 text-xs font-bold text-slate-500">
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none transition focus:border-cyan-300/50"
      >
        {includeAll ? <option value="">Todos</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

function nowDatetimeLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function formatDate(value: Date) {
  return value.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default async function AdminManualPaymentsPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; status?: string; method?: string; from?: string; to?: string; message?: string; error?: string }>;
}) {
  await requireAdminPermission("admin.billing.manage");
  const params = await searchParams;
  const payments = await listManualPayments({
    q: params?.q,
    status: params?.status,
    method: params?.method,
    from: params?.from,
    to: params?.to
  });

  const total = payments.reduce((sum, payment) => sum + payment.amountCents, 0);
  const confirmed = payments.filter((payment) => payment.status === ManualPaymentStatus.CONFIRMED).length;
  const reconciled = payments.filter((payment) => payment.status === ManualPaymentStatus.RECONCILED).length;
  const pending = payments.filter((payment) => payment.status === ManualPaymentStatus.PENDING).length;

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Operação comercial"
        title="Pagamentos manuais"
        description="Registro auditado para pagamentos recebidos fora do Stripe, com confirmação operacional, conciliação e liberação controlada de licença."
      />

      {params?.message ? <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-bold text-emerald-100">{params.message}</div> : null}
      {params?.error ? <div className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm font-bold text-rose-100">{params.error}</div> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Registrados" value={payments.length} hint="Pagamentos manuais no filtro atual." />
        <KpiCard label="Pendentes" value={pending} hint="Ainda exigem confirmação ou recusa." />
        <KpiCard label="Confirmados" value={confirmed} hint="Podem liberar licença com step-up." />
        <KpiCard label="Valor filtrado" value={formatCentsBRL(total)} hint={`${reconciled} conciliado(s) com licença ou fechamento operacional.`} />
      </div>

      <section className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
        <div>
          <h2 className="text-xl font-black text-white">Registrar pagamento recebido</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Use para PIX, transferência, boleto, link externo ou cortesia. O registro nasce pendente; anexe o arquivo do comprovante no detalhe e mantenha confirmação, conciliação e licença como ações separadas e auditadas.
          </p>
        </div>
        <form action={createManualPaymentAction} className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {textInput("userEmail", "E-mail do cliente", "medico@hospital.com")}
          {textInput("userId", "User ID opcional", "cuid...")}
          {textInput("organizationId", "Organization ID opcional", "cuid...")}
          {selectInput("method", "Método", Object.entries(MANUAL_PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label })), ManualPaymentMethod.PIX, false)}
          {textInput("amount", "Valor recebido", "249,00", true)}
          {textInput("paidAt", "Data/hora", "", true, "datetime-local", nowDatetimeLocal())}
          {textInput("proofReference", "Comprovante/referência", "ID PIX, URL, descrição ou 'anexo no detalhe'", false)}
          {textInput("externalReference", "Referência externa", "txid, boleto, link...", false)}
          {textInput("reason", "Motivo operacional", "Pagamento recebido pelo suporte", true)}
          <label className="grid gap-1 text-xs font-bold text-slate-500 md:col-span-3">
            Nota interna
            <input
              name="internalNote"
              placeholder="Contexto para suporte/financeiro"
              className="h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-300/50"
            />
          </label>
          <button type="submit" className="h-10 rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200">
            Registrar
          </button>
        </form>
      </section>

      <form className="grid gap-3 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-4 md:grid-cols-6 md:items-end">
        {textInput("q", "Busca", "e-mail, org, licença ou referência", false, "text", params?.q)}
        {selectInput("status", "Status", Object.entries(MANUAL_PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label })), parseManualPaymentStatus(params?.status))}
        {selectInput("method", "Método", Object.entries(MANUAL_PAYMENT_METHOD_LABELS).map(([value, label]) => ({ value, label })), params?.method)}
        {textInput("from", "De", "", false, "date", params?.from)}
        {textInput("to", "Até", "", false, "date", params?.to)}
        <button type="submit" className="h-10 rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200">Filtrar</button>
      </form>

      <DataTable
        rows={payments}
        empty={<EmptyState title="Nenhum pagamento manual encontrado" description="Registre o primeiro pagamento recebido fora do Stripe ou ajuste os filtros." />}
        columns={[
          {
            key: "client",
            header: "Cliente",
            render: (payment) => (
              <div className="min-w-60">
                <p className="font-black text-white">{payment.user?.email ?? payment.organization?.name ?? "Sem titular"}</p>
                <p className="mt-1 text-xs text-slate-500">{payment.organization?.name ?? "Individual"}</p>
                <p className="mt-1 text-xs text-slate-600">{payment.id}</p>
              </div>
            )
          },
          { key: "status", header: "Status", render: (payment) => <StatusBadge status={MANUAL_PAYMENT_STATUS_LABELS[payment.status]} /> },
          { key: "method", header: "Método", render: (payment) => <span className="font-bold text-slate-200">{MANUAL_PAYMENT_METHOD_LABELS[payment.method]}</span> },
          {
            key: "amount",
            header: "Valor",
            render: (payment) => (
              <div className="min-w-32">
                <p className="font-black text-white">{formatCentsBRL(payment.amountCents)}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(payment.paidAt)}</p>
              </div>
            )
          },
          {
            key: "proof",
            header: "Comprovante",
            render: (payment) => (
              <div className="min-w-56 text-sm text-slate-300">
                <p className="line-clamp-2">{payment.proofReference ?? "Sem referência textual"}</p>
                <p className="mt-1 text-xs text-slate-500">{payment.externalReference ?? "Sem ref. externa"}</p>
              </div>
            )
          },
          {
            key: "license",
            header: "Licença",
            render: (payment) => payment.license ? (
              <div className="min-w-44">
                <StatusBadge status={payment.license.status} />
                <p className="mt-1 text-xs text-slate-500">{payment.license.licenseKey ?? payment.license.id}</p>
              </div>
            ) : <span className="text-xs font-bold text-amber-200">Não liberada</span>
          },
          {
            key: "actions",
            header: "Ações",
            render: (payment) => (
              <Link href={`/admin/payments-manual/${payment.id}`} className="inline-flex h-9 items-center rounded-md border border-cyan-300/20 px-3 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/10">
                Abrir detalhe
              </Link>
            )
          }
        ]}
      />
    </div>
  );
}
