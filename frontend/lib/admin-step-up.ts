import { AdminStepUpStatus } from "@prisma/client";
import { auth } from "@/auth";
import { recordAdminAuditEvent, type AdminUser } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

const STEP_UP_TTL_MINUTES = Number(process.env.ADMIN_STEP_UP_TTL_MINUTES ?? 5);

export class AdminStepUpError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export const CRITICAL_ADMIN_ACTIONS = {
  licenseCreate: "admin.license.create_manual",
  licenseExtend: "admin.license.extend",
  licenseStatus: "admin.license.status_update",
  accessGrantRole: "admin.access.role_granted",
  accessRemoveRole: "admin.access.role_removed",
  accessGrantPermission: "admin.access.permission_granted",
  accessRevokePermission: "admin.access.permission_revoked",
  accessDeactivate: "admin.access.deactivated",
  contingency: "admin.contingency.execute",
  auditExport: "admin.audit.export",
  billingReconcile: "admin.billing.reconcile_executed",
  billingWebhookReprocess: "admin.billing.webhook_reprocess_requested",
  manualPaymentConfirm: "admin.manual_payment.confirmed",
  manualPaymentReject: "admin.manual_payment.rejected",
  manualPaymentReconcile: "admin.manual_payment.reconciled",
  manualPaymentReleaseLicense: "admin.manual_payment.license_released"
} as const;

function expiresAt(now = new Date()) {
  return new Date(now.getTime() + STEP_UP_TTL_MINUTES * 60 * 1000);
}

async function currentSessionId() {
  const session = await auth().catch(() => null);
  return session?.user?.sessionId ?? null;
}

export async function validateAdminStepUp(input: {
  admin: AdminUser;
  action: string;
  password?: string | null;
  resourceType?: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const password = input.password?.trim();
  const userSessionId = await currentSessionId();

  if (!password) {
    await recordAdminAuditEvent({
      actorUserId: input.admin.id,
      action: "admin.step_up.blocked",
      resourceType: input.resourceType ?? "admin_action",
      resourceId: input.resourceId ?? input.action,
      outcome: "denied",
      metadata: { stepUpAction: input.action, reason: "missing_password", ...input.metadata }
    });
    throw new AdminStepUpError("Ação crítica exige step-up com senha atual.", "STEP_UP_REQUIRED");
  }

  const credential = await prisma.passwordCredential.findUnique({ where: { userId: input.admin.id } });
  const valid = credential ? await verifyPassword(password, credential.passwordHash) : false;

  if (!valid) {
    await prisma.adminStepUpSession.create({
      data: {
        userId: input.admin.id,
        userSessionId,
        action: input.action,
        status: AdminStepUpStatus.DENIED,
        expiresAt: new Date()
      }
    });
    await recordAdminAuditEvent({
      actorUserId: input.admin.id,
      action: "admin.step_up.denied",
      resourceType: input.resourceType ?? "admin_action",
      resourceId: input.resourceId ?? input.action,
      outcome: "denied",
      metadata: { stepUpAction: input.action, reason: "invalid_password", ...input.metadata }
    });
    throw new AdminStepUpError("Step-up inválido. Confirme a senha atual.", "STEP_UP_DENIED");
  }

  const stepUp = await prisma.adminStepUpSession.create({
    data: {
      userId: input.admin.id,
      userSessionId,
      action: input.action,
      status: AdminStepUpStatus.USED,
      expiresAt: expiresAt(),
      usedAt: new Date()
    }
  });

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.step_up.validated",
    resourceType: input.resourceType ?? "admin_action",
    resourceId: input.resourceId ?? input.action,
    outcome: "success",
    metadata: {
      stepUpSessionId: stepUp.id,
      stepUpAction: input.action,
      userSessionId,
      ttlMinutes: STEP_UP_TTL_MINUTES,
      ...input.metadata
    }
  });

  return stepUp;
}

export function stepUpPasswordFromForm(formData: FormData) {
  const value = formData.get("stepUpPassword");
  return typeof value === "string" ? value : null;
}
