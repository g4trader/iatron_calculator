import { LicenseOrigin } from "@prisma/client";
import { resendVerificationEmail } from "@/lib/account-auth";
import { recordAdminAuditEvent, type AdminUser } from "@/lib/admin-permissions";
import { reconcileAdminBillingSubscription } from "@/lib/admin-billing";
import { createManualLicense } from "@/lib/admin-licenses";
import { createOperationalIncident } from "@/lib/admin-operational-data";
import { syncLicenseForSubscription } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { revokeAllUserSessions } from "@/lib/session-control";

export const CONTINGENCY_CONFIRMATION_TEXT = "CONTINGENCIA";

export type ContingencyActionId =
  | "emergency_license"
  | "reprocess_reconcile"
  | "resend_activation"
  | "invalidate_sessions"
  | "refresh_entitlement"
  | "register_incident";

export type ContingencyPlaybook = {
  id: string;
  title: string;
  description: string;
  actions: Array<{
    id: ContingencyActionId;
    title: string;
    impact: string;
    risk: "medium" | "high";
  }>;
};

export const CONTINGENCY_PLAYBOOKS: ContingencyPlaybook[] = [
  {
    id: "access",
    title: "Acesso emergencial",
    description: "Ações para recuperar acesso legítimo ou conter risco de sessão em incidentes pontuais.",
    actions: [
      {
        id: "emergency_license",
        title: "Gerar licença emergencial",
        impact: "Cria uma licença ACTIVE com origem CONTINGENCY e expiração obrigatória para um usuário existente.",
        risk: "high"
      },
      {
        id: "resend_activation",
        title: "Reenviar ativação",
        impact: "Reenvia verificação de e-mail quando aplicável; não revela existência de conta fora da trilha administrativa.",
        risk: "medium"
      },
      {
        id: "invalidate_sessions",
        title: "Invalidar sessões do usuário",
        impact: "Revoga todas as sessões ativas do usuário e força novo login.",
        risk: "high"
      }
    ]
  },
  {
    id: "billing",
    title: "Billing e entitlement",
    description: "Ações para corrigir divergências entre Stripe, assinatura local e licença sem editar cobrança manualmente.",
    actions: [
      {
        id: "reprocess_reconcile",
        title: "Reprocessar reconcile",
        impact: "Busca a assinatura na Stripe e sincroniza Subscription/License pelo fluxo oficial.",
        risk: "high"
      },
      {
        id: "refresh_entitlement",
        title: "Forçar refresh de entitlement",
        impact: "Recalcula licença local a partir de uma assinatura já existente no banco.",
        risk: "medium"
      }
    ]
  },
  {
    id: "incident",
    title: "Incidente operacional",
    description: "Registro auditado de uma ocorrência para que o time tenha contexto mínimo de troubleshooting.",
    actions: [
      {
        id: "register_incident",
        title: "Registrar incidente operacional",
        impact: "Cria um evento administrativo com severidade, origem, impacto e nota operacional.",
        risk: "medium"
      }
    ]
  }
];

export class AdminContingencyError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export function requireContingencyReason(reason?: string | null) {
  const normalized = reason?.trim();
  if (!normalized || normalized.length < 8) {
    throw new AdminContingencyError("Informe um motivo de contingência com pelo menos 8 caracteres.", "REASON_REQUIRED");
  }
  return normalized;
}

export function requireContingencyConfirmation(confirmation?: string | null) {
  if ((confirmation ?? "").trim().toUpperCase() !== CONTINGENCY_CONFIRMATION_TEXT) {
    throw new AdminContingencyError(`Confirmação obrigatória: digite ${CONTINGENCY_CONFIRMATION_TEXT}.`, "CONFIRMATION_REQUIRED");
  }
}

async function recordContingencyAudit(input: {
  admin: AdminUser;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  organizationId?: string | null;
  targetUserId?: string | null;
  reason: string;
  metadata?: Record<string, unknown>;
  outcome?: "success" | "failure" | "denied";
}) {
  return recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId ?? null,
    organizationId: input.organizationId ?? null,
    targetUserId: input.targetUserId ?? null,
    outcome: input.outcome ?? "success",
    metadata: {
      reason: input.reason,
      confirmation: "reinforced",
      reauthentication: "password_step_up_required",
      ...input.metadata
    }
  });
}

export async function generateEmergencyLicense(input: {
  admin: AdminUser;
  userEmail?: string | null;
  userId?: string | null;
  organizationId?: string | null;
  preset?: string | null;
  reason?: string | null;
  confirmation?: string | null;
}) {
  const reason = requireContingencyReason(input.reason);
  requireContingencyConfirmation(input.confirmation);

  const license = await createManualLicense({
    admin: input.admin,
    userEmail: input.userEmail,
    userId: input.userId,
    organizationId: input.organizationId,
    origin: LicenseOrigin.CONTINGENCY,
    preset: input.preset,
    reason,
    note: `Contingência: ${reason}`
  });

  await recordContingencyAudit({
    admin: input.admin,
    action: "admin.contingency.emergency_license_generated",
    resourceType: "license",
    resourceId: license.id,
    organizationId: license.organizationId,
    targetUserId: license.userId,
    reason,
    metadata: { preset: input.preset ?? "72h", origin: LicenseOrigin.CONTINGENCY, endsAt: license.endsAt?.toISOString() ?? null }
  });

  return license;
}

export async function reprocessReconcileFromContingency(input: {
  admin: AdminUser;
  subscriptionId?: string | null;
  reason?: string | null;
  confirmation?: string | null;
}) {
  const reason = requireContingencyReason(input.reason);
  requireContingencyConfirmation(input.confirmation);
  const subscriptionId = input.subscriptionId?.trim();
  if (!subscriptionId) throw new AdminContingencyError("Informe o subscriptionId local.", "SUBSCRIPTION_REQUIRED");

  const synced = await reconcileAdminBillingSubscription({ admin: input.admin, subscriptionId, reason });

  await recordContingencyAudit({
    admin: input.admin,
    action: "admin.contingency.reconcile_reprocessed",
    resourceType: "subscription",
    resourceId: subscriptionId,
    organizationId: synced?.organizationId ?? null,
    targetUserId: synced?.userId ?? null,
    reason,
    metadata: { syncedSubscriptionId: synced?.id ?? null }
  });

  return synced;
}

export async function resendActivationFromContingency(input: {
  admin: AdminUser;
  email?: string | null;
  reason?: string | null;
  confirmation?: string | null;
}) {
  const reason = requireContingencyReason(input.reason);
  requireContingencyConfirmation(input.confirmation);
  const email = input.email?.trim().toLowerCase();
  if (!email) throw new AdminContingencyError("Informe o e-mail do usuário.", "EMAIL_REQUIRED");

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  const result = await resendVerificationEmail(email);

  await recordContingencyAudit({
    admin: input.admin,
    action: "admin.contingency.activation_resent",
    resourceType: "user",
    resourceId: user?.id ?? null,
    targetUserId: user?.id ?? null,
    reason,
    metadata: { email, status: result.status }
  });

  return result;
}

export async function invalidateUserSessionsFromContingency(input: {
  admin: AdminUser;
  userId?: string | null;
  reason?: string | null;
  confirmation?: string | null;
}) {
  const reason = requireContingencyReason(input.reason);
  requireContingencyConfirmation(input.confirmation);
  const userId = input.userId?.trim();
  if (!userId) throw new AdminContingencyError("Informe o userId.", "USER_REQUIRED");

  await revokeAllUserSessions(userId, "admin_contingency");
  await recordContingencyAudit({
    admin: input.admin,
    action: "admin.contingency.sessions_invalidated",
    resourceType: "user",
    resourceId: userId,
    targetUserId: userId,
    reason,
    metadata: { scope: "all_active_sessions" }
  });
}

export async function refreshEntitlementFromContingency(input: {
  admin: AdminUser;
  subscriptionId?: string | null;
  reason?: string | null;
  confirmation?: string | null;
}) {
  const reason = requireContingencyReason(input.reason);
  requireContingencyConfirmation(input.confirmation);
  const subscriptionId = input.subscriptionId?.trim();
  if (!subscriptionId) throw new AdminContingencyError("Informe o subscriptionId local.", "SUBSCRIPTION_REQUIRED");

  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription) throw new AdminContingencyError("Assinatura local não encontrada.", "SUBSCRIPTION_NOT_FOUND");

  await syncLicenseForSubscription(subscriptionId);
  await recordContingencyAudit({
    admin: input.admin,
    action: "admin.contingency.entitlement_refreshed",
    resourceType: "subscription",
    resourceId: subscription.id,
    organizationId: subscription.organizationId,
    targetUserId: subscription.userId,
    reason,
    metadata: { status: subscription.status, ownerType: subscription.ownerType }
  });
}

export async function registerOperationalIncidentFromContingency(input: {
  admin: AdminUser;
  severity?: string | null;
  origin?: string | null;
  impact?: string | null;
  title?: string | null;
  reason?: string | null;
  confirmation?: string | null;
}) {
  const reason = requireContingencyReason(input.reason);
  requireContingencyConfirmation(input.confirmation);
  const title = input.title?.trim();
  if (!title || title.length < 4) throw new AdminContingencyError("Informe um título de incidente.", "TITLE_REQUIRED");
  const severity = input.severity?.trim();
  const operationalSeverity = severity === "critical" ? "CRITICAL" : severity === "high" || severity === "medium" ? "WARNING" : "INFO";
  const incident = await createOperationalIncident({
    admin: input.admin,
    title,
    description: reason,
    severity: operationalSeverity,
    source: input.origin?.trim() || "contingency",
    impactedArea: input.impact?.trim() || "Não informado",
    metadata: { sourceAction: "admin.contingency.incident_registered" }
  });

  await recordContingencyAudit({
    admin: input.admin,
    action: "admin.contingency.incident_registered",
    resourceType: "operational_incident",
    resourceId: incident.id,
    reason,
    metadata: {
      title,
      severity: severity || "medium",
      operationalSeverity,
      origin: input.origin?.trim() || "manual",
      impact: input.impact?.trim() || "Não informado"
    }
  });
}

export async function getContingencyHistory(limit = 30) {
  return prisma.adminAuditEvent.findMany({
    where: { action: { startsWith: "admin.contingency." } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: true, targetUser: true }
  });
}
