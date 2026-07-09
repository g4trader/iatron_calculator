import { LicenseOrigin, ManualPaymentMethod, ManualPaymentStatus } from "@prisma/client";
import { recordAdminAuditEvent, type AdminUser } from "@/lib/admin-permissions";
import { createManualLicense, requireLicenseReason } from "@/lib/admin-licenses";
import { prisma } from "@/lib/prisma";

export class AdminManualPaymentError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export const MANUAL_PAYMENT_METHOD_LABELS: Record<ManualPaymentMethod, string> = {
  PIX: "PIX",
  BANK_TRANSFER: "Transferência",
  EXTERNAL_CHECKOUT_LINK: "Link externo",
  BOLETO: "Boleto",
  COURTESY: "Cortesia",
  OTHER: "Outro"
};

export const MANUAL_PAYMENT_STATUS_LABELS: Record<ManualPaymentStatus, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  REJECTED: "Recusado",
  RECONCILED: "Conciliado"
};

export function parseManualPaymentMethod(value?: string | null) {
  if (value && Object.values(ManualPaymentMethod).includes(value as ManualPaymentMethod)) return value as ManualPaymentMethod;
  throw new AdminManualPaymentError("Método de pagamento inválido.", "INVALID_METHOD");
}

export function parseManualPaymentStatus(value?: string | null) {
  if (value && Object.values(ManualPaymentStatus).includes(value as ManualPaymentStatus)) return value as ManualPaymentStatus;
  return undefined;
}

export function parseAmountToCents(value?: string | null) {
  const normalized = value?.trim().replace(/\./g, "").replace(",", ".");
  if (!normalized) throw new AdminManualPaymentError("Informe o valor recebido.", "AMOUNT_REQUIRED");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) throw new AdminManualPaymentError("Valor recebido inválido.", "INVALID_AMOUNT");
  return Math.round(amount * 100);
}

export function formatCentsBRL(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amountCents / 100);
}

export function parsePaidAt(value?: string | null) {
  if (!value?.trim()) throw new AdminManualPaymentError("Informe a data/hora do pagamento.", "PAID_AT_REQUIRED");
  const paidAt = new Date(value);
  if (Number.isNaN(paidAt.getTime())) throw new AdminManualPaymentError("Data/hora do pagamento inválida.", "INVALID_PAID_AT");
  return paidAt;
}

async function findPaymentUser(userId?: string | null, userEmail?: string | null) {
  if (userId?.trim()) return prisma.user.findUnique({ where: { id: userId.trim() } });
  if (userEmail?.trim()) return prisma.user.findUnique({ where: { email: userEmail.trim().toLowerCase() } });
  return null;
}

async function assertOrganization(organizationId?: string | null) {
  const id = organizationId?.trim();
  if (!id) return null;
  const organization = await prisma.organization.findUnique({ where: { id } });
  if (!organization) throw new AdminManualPaymentError("Organização não encontrada.", "ORGANIZATION_NOT_FOUND");
  return organization;
}

export async function createManualPayment(input: {
  admin: AdminUser;
  userEmail?: string | null;
  userId?: string | null;
  organizationId?: string | null;
  method?: string | null;
  amount?: string | null;
  paidAt?: string | null;
  proofReference?: string | null;
  externalReference?: string | null;
  reason?: string | null;
  internalNote?: string | null;
}) {
  const reason = requireLicenseReason(input.reason);
  const method = parseManualPaymentMethod(input.method);
  const amountCents = parseAmountToCents(input.amount);
  const paidAt = parsePaidAt(input.paidAt);
  const user = await findPaymentUser(input.userId, input.userEmail);
  const organization = await assertOrganization(input.organizationId);
  const proofReference = input.proofReference?.trim() || null;
  const externalReference = input.externalReference?.trim() || null;

  if (!user && !organization) {
    throw new AdminManualPaymentError("Vincule o pagamento a um usuário ou organização.", "OWNER_REQUIRED");
  }
  if (method !== ManualPaymentMethod.COURTESY && amountCents <= 0) {
    throw new AdminManualPaymentError("Pagamentos não cortesia exigem valor maior que zero.", "AMOUNT_REQUIRED");
  }
  if (!proofReference && !externalReference) {
    throw new AdminManualPaymentError("Informe comprovante, link ou referência textual do pagamento.", "PROOF_REQUIRED");
  }
  if (externalReference) {
    const duplicate = await prisma.manualPayment.findFirst({
      where: { method, externalReference, status: { not: ManualPaymentStatus.REJECTED } },
      select: { id: true }
    });
    if (duplicate) throw new AdminManualPaymentError("Já existe pagamento manual ativo com essa referência externa.", "DUPLICATE_REFERENCE");
  }

  const payment = await prisma.manualPayment.create({
    data: {
      userId: user?.id ?? null,
      organizationId: organization?.id ?? null,
      method,
      amountCents,
      paidAt,
      proofReference,
      externalReference,
      reason,
      internalNote: input.internalNote?.trim() || null,
      createdByUserId: input.admin.id
    }
  });

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.manual_payment.created",
    resourceType: "manual_payment",
    resourceId: payment.id,
    organizationId: payment.organizationId,
    targetUserId: payment.userId,
    outcome: "success",
    metadata: { reason, method, amountCents, paidAt: paidAt.toISOString(), proofReference, externalReference }
  });

  return payment;
}

export async function updateManualPaymentStatus(input: {
  admin: AdminUser;
  paymentId: string;
  status: Extract<ManualPaymentStatus, "CONFIRMED" | "REJECTED" | "RECONCILED">;
  reason?: string | null;
  reconciliationReference?: string | null;
  reconciliationNote?: string | null;
}) {
  const reason = requireLicenseReason(input.reason);
  const current = await prisma.manualPayment.findUnique({ where: { id: input.paymentId } });
  if (!current) throw new AdminManualPaymentError("Pagamento manual não encontrado.", "PAYMENT_NOT_FOUND");

  if (current.status === ManualPaymentStatus.RECONCILED) {
    throw new AdminManualPaymentError("Pagamento já conciliado não pode ser alterado.", "ALREADY_RECONCILED");
  }
  if (current.status === ManualPaymentStatus.REJECTED) {
    throw new AdminManualPaymentError("Pagamento recusado não pode ser reativado. Registre um novo pagamento.", "REJECTED_LOCKED");
  }
  if (input.status === ManualPaymentStatus.CONFIRMED && current.status !== ManualPaymentStatus.PENDING) {
    throw new AdminManualPaymentError("Somente pagamentos pendentes podem ser confirmados.", "INVALID_CONFIRM_TRANSITION");
  }
  if (input.status === ManualPaymentStatus.REJECTED && current.status !== ManualPaymentStatus.PENDING) {
    throw new AdminManualPaymentError("Somente pagamentos pendentes podem ser recusados.", "INVALID_REJECT_TRANSITION");
  }
  if (input.status === ManualPaymentStatus.RECONCILED) {
    if (current.status !== ManualPaymentStatus.CONFIRMED) {
      throw new AdminManualPaymentError("Somente pagamentos confirmados podem ser conciliados.", "CONFIRMATION_REQUIRED");
    }
    if (!current.licenseId) {
      throw new AdminManualPaymentError("Conciliação exige licença vinculada ao pagamento.", "LICENSE_REQUIRED_FOR_RECONCILIATION");
    }
  }

  const now = new Date();
  const payment = await prisma.manualPayment.update({
    where: { id: input.paymentId },
    data: {
      status: input.status,
      confirmedByUserId: input.status === ManualPaymentStatus.CONFIRMED ? input.admin.id : current.confirmedByUserId,
      confirmedAt: input.status === ManualPaymentStatus.CONFIRMED ? now : current.confirmedAt,
      reconciledByUserId: input.status === ManualPaymentStatus.RECONCILED ? input.admin.id : current.reconciledByUserId,
      reconciledAt: input.status === ManualPaymentStatus.RECONCILED ? now : current.reconciledAt,
      rejectedAt: input.status === ManualPaymentStatus.REJECTED ? now : current.rejectedAt,
      reconciliationReference: input.status === ManualPaymentStatus.RECONCILED ? input.reconciliationReference?.trim() || current.reconciliationReference : current.reconciliationReference,
      reconciliationNote: input.status === ManualPaymentStatus.RECONCILED ? input.reconciliationNote?.trim() || current.reconciliationNote : current.reconciliationNote
    }
  });

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: `admin.manual_payment.${input.status.toLowerCase()}`,
    resourceType: "manual_payment",
    resourceId: payment.id,
    organizationId: payment.organizationId,
    targetUserId: payment.userId,
    outcome: "success",
    metadata: {
      reason,
      previousStatus: current.status,
      status: payment.status,
      reconciliationReference: payment.reconciliationReference,
      reconciliationNote: payment.reconciliationNote
    }
  });

  return payment;
}

export async function releaseLicenseFromManualPayment(input: {
  admin: AdminUser;
  paymentId: string;
  preset?: string | null;
  reason?: string | null;
  note?: string | null;
}) {
  const reason = requireLicenseReason(input.reason);
  const payment = await prisma.manualPayment.findUnique({
    where: { id: input.paymentId },
    include: { user: true, organization: true, license: true }
  });
  if (!payment) throw new AdminManualPaymentError("Pagamento manual não encontrado.", "PAYMENT_NOT_FOUND");
  if (payment.status !== ManualPaymentStatus.CONFIRMED) {
    throw new AdminManualPaymentError("Confirme o pagamento antes de liberar a licença.", "PAYMENT_NOT_CONFIRMED");
  }
  if (payment.licenseId) throw new AdminManualPaymentError("Este pagamento já está vinculado a uma licença.", "LICENSE_ALREADY_LINKED");
  if (!payment.userId) throw new AdminManualPaymentError("A liberação de licença exige usuário vinculado ao pagamento.", "USER_REQUIRED");

  const license = await createManualLicense({
    admin: input.admin,
    userId: payment.userId,
    organizationId: payment.organizationId,
    origin: LicenseOrigin.MANUAL_SUPPORT,
    preset: input.preset,
    reason,
    note: input.note ?? `Pagamento manual ${payment.id}`
  });

  const updated = await prisma.manualPayment.update({
    where: { id: payment.id },
    data: {
      licenseId: license.id,
      status: ManualPaymentStatus.RECONCILED,
      reconciledByUserId: input.admin.id,
      reconciledAt: new Date(),
      reconciliationReference: `license:${license.id}`,
      reconciliationNote: input.note?.trim() || `Licença liberada a partir do pagamento manual ${payment.id}`
    }
  });

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.manual_payment.license_released",
    resourceType: "manual_payment",
    resourceId: payment.id,
    organizationId: payment.organizationId,
    targetUserId: payment.userId,
    outcome: "success",
    metadata: {
      reason,
      licenseId: license.id,
      previousStatus: payment.status,
      status: updated.status,
      reconciliationReference: updated.reconciliationReference,
      reconciliationNote: updated.reconciliationNote
    }
  });

  return { payment: updated, license };
}

export async function listManualPayments(input: {
  q?: string | null;
  status?: string | null;
  method?: string | null;
  from?: string | null;
  to?: string | null;
}) {
  const q = input.q?.trim();
  const status = parseManualPaymentStatus(input.status);
  const method = input.method && Object.values(ManualPaymentMethod).includes(input.method as ManualPaymentMethod) ? (input.method as ManualPaymentMethod) : undefined;
  const from = input.from ? new Date(input.from) : null;
  const to = input.to ? new Date(input.to) : null;

  return prisma.manualPayment.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(method ? { method } : {}),
      ...(from && !Number.isNaN(from.getTime()) ? { paidAt: { gte: from } } : {}),
      ...(to && !Number.isNaN(to.getTime()) ? { paidAt: { ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}), lte: to } } : {}),
      ...(q
        ? {
            OR: [
              { id: q },
              { externalReference: { contains: q, mode: "insensitive" } },
              { proofReference: { contains: q, mode: "insensitive" } },
              { user: { is: { email: { contains: q, mode: "insensitive" } } } },
              { user: { is: { name: { contains: q, mode: "insensitive" } } } },
              { organization: { is: { name: { contains: q, mode: "insensitive" } } } },
              { license: { is: { licenseKey: { contains: q, mode: "insensitive" } } } }
            ]
          }
        : {})
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, email: true, name: true } },
      organization: { select: { id: true, name: true } },
      license: { select: { id: true, licenseKey: true, status: true, endsAt: true } },
      createdBy: { select: { email: true, name: true } },
      confirmedBy: { select: { email: true, name: true } },
      reconciledBy: { select: { email: true, name: true } }
    }
  });
}
