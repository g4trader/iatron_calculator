import { randomBytes } from "crypto";
import { LicenseOrigin, LicenseStatus } from "@prisma/client";
import { recordAdminAuditEvent, type AdminUser } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

export const LICENSE_DURATION_PRESETS = {
  "24h": { label: "24h", hours: 24 },
  "72h": { label: "72h", hours: 72 },
  "7d": { label: "7 dias", hours: 24 * 7 },
  "30d": { label: "30 dias", hours: 24 * 30 }
} as const;

export type LicenseDurationPreset = keyof typeof LICENSE_DURATION_PRESETS;
export type AdminLicenseAction =
  | "create_manual"
  | "extend"
  | "suspend"
  | "revoke"
  | "reactivate"
  | "convert_regular";

export class AdminLicenseError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export function getLicenseAuditAction(action: AdminLicenseAction) {
  return `admin.license.${action}`;
}

export function requireLicenseReason(reason?: string | null) {
  const normalized = reason?.trim();
  if (!normalized || normalized.length < 8) {
    throw new AdminLicenseError("Informe um motivo interno com pelo menos 8 caracteres.", "REASON_REQUIRED");
  }
  return normalized;
}

export function requireDestructiveConfirmation(action: "suspend" | "revoke", confirmation?: string | null) {
  const expected = action === "revoke" ? "REVOGAR" : "SUSPENDER";
  if ((confirmation ?? "").trim().toUpperCase() !== expected) {
    throw new AdminLicenseError(`Confirmação obrigatória: digite ${expected}.`, "CONFIRMATION_REQUIRED");
  }
}

export function getPresetExpiration(preset: string | null | undefined, now = new Date()) {
  const selected = preset && preset in LICENSE_DURATION_PRESETS ? LICENSE_DURATION_PRESETS[preset as LicenseDurationPreset] : LICENSE_DURATION_PRESETS["72h"];
  return new Date(now.getTime() + selected.hours * 60 * 60 * 1000);
}

export function generateLicenseKey() {
  return `lic_${randomBytes(18).toString("base64url")}`;
}

export function parseLicenseOrigin(value?: string | null) {
  if (value && Object.values(LicenseOrigin).includes(value as LicenseOrigin)) return value as LicenseOrigin;
  return LicenseOrigin.MANUAL_SUPPORT;
}

export async function createManualLicense(input: {
  admin: AdminUser;
  userEmail?: string | null;
  userId?: string | null;
  organizationId?: string | null;
  origin?: string | null;
  preset?: string | null;
  reason?: string | null;
  note?: string | null;
}) {
  const reason = requireLicenseReason(input.reason);
  const user = input.userId
    ? await prisma.user.findUnique({ where: { id: input.userId } })
    : input.userEmail
      ? await prisma.user.findUnique({ where: { email: input.userEmail.trim().toLowerCase() } })
      : null;
  if (!user) throw new AdminLicenseError("Usuário não encontrado para concessão manual.", "USER_NOT_FOUND");

  const endsAt = getPresetExpiration(input.preset);
  const origin = parseLicenseOrigin(input.origin);
  const license = await prisma.license.create({
    data: {
      userId: user.id,
      organizationId: input.organizationId?.trim() || null,
      licenseKey: generateLicenseKey(),
      status: LicenseStatus.ACTIVE,
      origin,
      startsAt: new Date(),
      endsAt,
      assignedAt: new Date(),
      internalNote: input.note?.trim() || reason
    }
  });

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: getLicenseAuditAction("create_manual"),
    resourceType: "license",
    resourceId: license.id,
    organizationId: license.organizationId,
    targetUserId: license.userId,
    outcome: "success",
    metadata: { reason, origin, endsAt: endsAt.toISOString(), note: input.note?.trim() || null }
  });

  return license;
}

export async function extendLicense(input: {
  admin: AdminUser;
  licenseId: string;
  preset?: string | null;
  reason?: string | null;
  note?: string | null;
}) {
  const reason = requireLicenseReason(input.reason);
  const current = await prisma.license.findUnique({ where: { id: input.licenseId } });
  if (!current) throw new AdminLicenseError("Licença não encontrada.", "LICENSE_NOT_FOUND");

  const base = current.endsAt && current.endsAt > new Date() ? current.endsAt : new Date();
  const endsAt = getPresetExpiration(input.preset, base);
  const license = await prisma.license.update({
    where: { id: input.licenseId },
    data: {
      endsAt,
      status: LicenseStatus.ACTIVE,
      revokedAt: null,
      internalNote: input.note?.trim() || current.internalNote
    }
  });

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: getLicenseAuditAction("extend"),
    resourceType: "license",
    resourceId: license.id,
    organizationId: license.organizationId,
    targetUserId: license.userId,
    outcome: "success",
    metadata: { reason, previousEndsAt: current.endsAt?.toISOString() ?? null, endsAt: endsAt.toISOString(), note: input.note?.trim() || null }
  });

  return license;
}

export async function updateLicenseStatus(input: {
  admin: AdminUser;
  licenseId: string;
  action: Extract<AdminLicenseAction, "suspend" | "revoke" | "reactivate" | "convert_regular">;
  reason?: string | null;
  confirmation?: string | null;
  note?: string | null;
}) {
  const reason = requireLicenseReason(input.reason);
  if (input.action === "suspend" || input.action === "revoke") {
    requireDestructiveConfirmation(input.action, input.confirmation);
  }

  const current = await prisma.license.findUnique({ where: { id: input.licenseId } });
  if (!current) throw new AdminLicenseError("Licença não encontrada.", "LICENSE_NOT_FOUND");

  const data =
    input.action === "suspend"
      ? { status: LicenseStatus.INACTIVE, revokedAt: new Date(), internalNote: input.note?.trim() || current.internalNote }
      : input.action === "revoke"
        ? { status: LicenseStatus.REVOKED, revokedAt: new Date(), internalNote: input.note?.trim() || current.internalNote }
        : input.action === "reactivate"
          ? { status: LicenseStatus.ACTIVE, revokedAt: null, internalNote: input.note?.trim() || current.internalNote }
          : { origin: LicenseOrigin.BILLING, internalNote: input.note?.trim() || current.internalNote };

  const license = await prisma.license.update({
    where: { id: input.licenseId },
    data
  });

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: getLicenseAuditAction(input.action),
    resourceType: "license",
    resourceId: license.id,
    organizationId: license.organizationId,
    targetUserId: license.userId,
    outcome: "success",
    metadata: {
      reason,
      previousStatus: current.status,
      status: license.status,
      previousOrigin: current.origin,
      origin: license.origin,
      note: input.note?.trim() || null
    }
  });

  return license;
}
