import { AlertTriangle, BadgeCheck, RefreshCw, RotateCcw, Send, ShieldAlert, Siren, UserX } from "lucide-react";
import { AdminPageHeader, DataTable, EmptyState, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { CONTINGENCY_CONFIRMATION_TEXT, CONTINGENCY_PLAYBOOKS, getContingencyHistory, type ContingencyActionId } from "@/lib/admin-contingency";
import {
  generateEmergencyLicenseAction,
  invalidateUserSessionsAction,
  refreshEntitlementAction,
  registerOperationalIncidentAction,
  reprocessReconcileAction,
  resendActivationAction
} from "./actions";

export const runtime = "nodejs";

const actionIcons: Record<ContingencyActionId, typeof Siren> = {
  emergency_license: BadgeCheck,
  reprocess_reconcile: RotateCcw,
  resend_activation: Send,
  invalidate_sessions: UserX,
  refresh_entitlement: RefreshCw,
  register_incident: ShieldAlert
};

function fieldClass() {
  return "h-10 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-sm font-semibold text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-300/50";
}

function textAreaClass() {
  return "min-h-20 rounded-md border border-cyan-300/10 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-300/50";
}

function ReasonAndConfirmation() {
  return (
    <>
      <label className="grid gap-1 text-xs font-bold text-slate-500">
        Motivo obrigatório
        <textarea name="reason" required minLength={8} placeholder="Explique o contexto operacional da contingência" className={textAreaClass()} />
      </label>
      <label className="grid gap-1 text-xs font-bold text-slate-500">
        Confirmação explícita
        <input name="confirmation" required placeholder={`Digite ${CONTINGENCY_CONFIRMATION_TEXT}`} className={fieldClass()} />
      </label>
      <label className="grid gap-1 text-xs font-bold text-slate-500">
        Step-up
        <input name="stepUpPassword" type="password" required placeholder="Senha atual para step-up" className={fieldClass()} />
      </label>
    </>
  );
}

function SubmitButton({ label, highRisk = false }: { label: string; highRisk?: boolean }) {
  return (
    <button
      type="submit"
      className={highRisk
        ? "h-10 rounded-md bg-rose-300 px-4 text-sm font-black text-slate-950 transition hover:bg-rose-200"
        : "h-10 rounded-md bg-cyan-300 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-200"}
    >
      {label}
    </button>
  );
}

function ActionForm({ actionId, highRisk }: { actionId: ContingencyActionId; highRisk: boolean }) {
  if (actionId === "emergency_license") {
    return (
      <form action={generateEmergencyLicenseAction} className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <input name="userEmail" placeholder="E-mail do usuário" className={fieldClass()} />
          <input name="userId" placeholder="Ou userId" className={fieldClass()} />
          <input name="organizationId" placeholder="organizationId opcional" className={fieldClass()} />
          <select name="preset" defaultValue="72h" className={fieldClass()}>
            <option value="24h">24h</option>
            <option value="72h">72h</option>
            <option value="7d">7 dias</option>
            <option value="30d">30 dias</option>
          </select>
        </div>
        <ReasonAndConfirmation />
        <SubmitButton label="Gerar licença emergencial" highRisk={highRisk} />
      </form>
    );
  }

  if (actionId === "reprocess_reconcile") {
    return (
      <form action={reprocessReconcileAction} className="grid gap-3">
        <input name="subscriptionId" required placeholder="subscriptionId local" className={fieldClass()} />
        <ReasonAndConfirmation />
        <SubmitButton label="Reprocessar reconcile" highRisk={highRisk} />
      </form>
    );
  }

  if (actionId === "resend_activation") {
    return (
      <form action={resendActivationAction} className="grid gap-3">
        <input name="email" required type="email" placeholder="E-mail do usuário" className={fieldClass()} />
        <ReasonAndConfirmation />
        <SubmitButton label="Reenviar ativação" highRisk={highRisk} />
      </form>
    );
  }

  if (actionId === "invalidate_sessions") {
    return (
      <form action={invalidateUserSessionsAction} className="grid gap-3">
        <input name="userId" required placeholder="userId" className={fieldClass()} />
        <ReasonAndConfirmation />
        <SubmitButton label="Invalidar sessões" highRisk={highRisk} />
      </form>
    );
  }

  if (actionId === "refresh_entitlement") {
    return (
      <form action={refreshEntitlementAction} className="grid gap-3">
        <input name="subscriptionId" required placeholder="subscriptionId local" className={fieldClass()} />
        <ReasonAndConfirmation />
        <SubmitButton label="Forçar refresh" highRisk={highRisk} />
      </form>
    );
  }

  return (
    <form action={registerOperationalIncidentAction} className="grid gap-3">
      <input name="title" required placeholder="Título do incidente" className={fieldClass()} />
      <div className="grid gap-3 md:grid-cols-3">
        <select name="severity" defaultValue="medium" className={fieldClass()}>
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high">Alta</option>
          <option value="critical">Crítica</option>
        </select>
        <input name="origin" placeholder="Origem" className={fieldClass()} />
        <input name="impact" placeholder="Impacto esperado" className={fieldClass()} />
      </div>
      <ReasonAndConfirmation />
      <SubmitButton label="Registrar incidente" highRisk={highRisk} />
    </form>
  );
}

export default async function AdminContingencyPage({
  searchParams
}: {
  searchParams?: Promise<{ message?: string; error?: string }>;
}) {
  await requireAdminPermission("admin.contingency.manage");
  const params = await searchParams;
  const history = await getContingencyHistory();
  const highRiskActions = CONTINGENCY_PLAYBOOKS.flatMap((playbook) => playbook.actions).filter((action) => action.risk === "high").length;

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Contingência"
        title="Central de Contingência"
        description="Playbooks para ações operacionais excepcionais. Toda execução exige motivo, confirmação explícita e grava auditoria administrativa."
      />

      {params?.message ? <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-bold text-emerald-100">{params.message}</div> : null}
      {params?.error ? <div className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm font-bold text-rose-100">{params.error}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Playbooks" value={CONTINGENCY_PLAYBOOKS.length} hint="Organizados por acesso, billing e incidente." />
        <KpiCard label="Ações disponíveis" value={CONTINGENCY_PLAYBOOKS.flatMap((playbook) => playbook.actions).length} hint="Todas auditadas em AdminAuditEvent." />
        <KpiCard label="Alto risco" value={highRiskActions} hint={`Confirmação reforçada: ${CONTINGENCY_CONFIRMATION_TEXT}.`} />
      </div>

      <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            A base atual ainda não possui MFA. Ações de alto risco exigem confirmação reforçada, senha atual como step-up e auditoria server-side; MFA deve ser o próximo endurecimento antes de operação em larga escala.
          </p>
        </div>
      </div>

      <div className="grid gap-5">
        {CONTINGENCY_PLAYBOOKS.map((playbook) => (
          <section key={playbook.id} className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
            <div>
              <p className="text-sm font-black text-cyan-200">{playbook.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{playbook.description}</p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {playbook.actions.map((action) => {
                const Icon = actionIcons[action.id];
                const highRisk = action.risk === "high";
                return (
                  <div key={action.id} className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-900/40 p-4">
                    <div className="flex items-start gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${highRisk ? "bg-rose-300/15 text-rose-200" : "bg-cyan-300/15 text-cyan-200"}`}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-black text-white">{action.title}</h2>
                          <StatusBadge status={highRisk ? "alto risco" : "risco médio"} />
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{action.impact}</p>
                      </div>
                    </div>
                    <ActionForm actionId={action.id} highRisk={highRisk} />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="grid gap-4">
        <h2 className="text-xl font-black text-white">Histórico recente de contingência</h2>
        <DataTable
          rows={history}
          empty={<EmptyState title="Sem ações de contingência" description="Quando uma ação for executada, o evento aparecerá aqui e também no módulo de auditoria." />}
          columns={[
            { key: "action", header: "Ação", render: (event) => event.action },
            { key: "resource", header: "Recurso", render: (event) => `${event.resourceType}${event.resourceId ? ` · ${event.resourceId}` : ""}` },
            { key: "target", header: "Alvo", render: (event) => event.targetUser?.email ?? event.targetUserId ?? "-" },
            { key: "actor", header: "Operador", render: (event) => event.actor?.email ?? event.actorUserId ?? "sistema" },
            { key: "outcome", header: "Resultado", render: (event) => <StatusBadge status={event.outcome} /> },
            { key: "created", header: "Data", render: (event) => event.createdAt.toLocaleString("pt-BR") }
          ]}
        />
      </section>
    </div>
  );
}
