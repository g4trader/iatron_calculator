import { AlertTriangle, Building2, CreditCard, LockKeyhole } from "lucide-react";
import { NeuralCard, PremiumButton } from "@/components/saas/SaaSChrome";
import type { CommercialEntitlement } from "@/lib/commercial-access";

const institutionalContactHref =
  "mailto:contato@iatron.com.br?subject=Ativacao%20institucional%20iatron.PED&body=Preciso%20de%20apoio%20para%20ativar%20ou%20atribuir%20licencas%20institucionais%20no%20iatron.PED.%0A%0AInstituicao%3A%0AUsuario%20afetado%3A";

const copyByReason = {
  NO_SUBSCRIPTION: {
    title: "Acesso à Folha PCR necessário",
    message: "Ative uma assinatura para usar a Folha PCR digital e manter histórico de cálculos.",
    Icon: LockKeyhole
  },
  PAYMENT_REQUIRED: {
    title: "Pagamento pendente",
    message: "Sua assinatura precisa de regularização antes de liberar a Folha PCR digital.",
    Icon: CreditCard
  },
  SUBSCRIPTION_CANCELED: {
    title: "Assinatura cancelada",
    message: "Reative seu plano para voltar a acessar a Folha PCR digital.",
    Icon: AlertTriangle
  },
  SUBSCRIPTION_EXPIRED: {
    title: "Assinatura expirada",
    message: "Renove sua assinatura para recuperar o acesso à Folha PCR digital.",
    Icon: AlertTriangle
  },
  SUBSCRIPTION_INACTIVE: {
    title: "Assinatura inativa",
    message: "Escolha um plano para liberar a Folha PCR digital.",
    Icon: LockKeyhole
  },
  NO_ORGANIZATION: {
    title: "Organização não encontrada",
    message: "Entre em uma organização válida ou ative um plano individual.",
    Icon: Building2
  },
  NO_ORGANIZATION_SUBSCRIPTION: {
    title: "Plano institucional ausente",
    message: "A organização precisa concluir a implantação assistida do plano Hospital antes de liberar licenças para membros.",
    Icon: Building2
  },
  NO_ORGANIZATION_LICENSE: {
    title: "Licença institucional não atribuída",
    message: "Você é membro da organização, mas ainda não recebeu uma licença ativa. Solicite a atribuição ao administrador ou ao time Iatron.",
    Icon: Building2
  },
  LICENSE_INACTIVE: {
    title: "Licença institucional inativa",
    message: "Sua licença institucional não está ativa. Solicite revisão ao administrador da organização.",
    Icon: Building2
  }
} as const;

export function CommercialBlock({ entitlement, compact = false }: { entitlement: CommercialEntitlement; compact?: boolean }) {
  const reason = entitlement.blockReason ?? "NO_SUBSCRIPTION";
  const content = copyByReason[reason];
  const Icon = content.Icon;
  const isInstitutionalIssue = entitlement.accountType === "ORGANIZATION";

  return (
    <NeuralCard className={compact ? "p-5" : "p-6 sm:p-8"}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/20">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-5 text-sm font-semibold text-cyan-200">Acesso comercial</p>
          <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">{content.title}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{content.message}</p>
          {entitlement.organization ? (
            <p className="mt-3 text-sm text-slate-400">
              Organização: <span className="font-semibold text-slate-200">{entitlement.organization.name}</span>
            </p>
          ) : null}
        </div>
        <div className="grid gap-3 sm:min-w-56">
          {isInstitutionalIssue ? (
            <>
              <PremiumButton href="/organization">Abrir organização</PremiumButton>
              <a href={institutionalContactHref} className="inline-flex h-12 items-center justify-center rounded-md border border-cyan-300/20 bg-white/[0.03] px-5 text-sm font-bold text-slate-100 transition hover:border-cyan-300/50">
                Solicitar ativação
              </a>
            </>
          ) : (
            <PremiumButton href="/checkout">Assinar agora</PremiumButton>
          )}
          <PremiumButton href="/billing" variant="secondary">Ver billing</PremiumButton>
        </div>
      </div>
    </NeuralCard>
  );
}
