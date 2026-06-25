import { createHash } from "crypto";
import {
  BillingIssueStatus,
  JobRunStatus,
  OperationalEventStatus,
  OperationalIncidentSeverity,
  OperationalIncidentStatus,
  SupportTicketPriority,
  SupportTicketStatus,
  WebhookFailureStatus,
  type Prisma
} from "@prisma/client";
import { recordAdminAuditEvent, type AdminUser } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

export type PaginationInput = {
  page?: string | number;
  pageSize?: string | number;
};

export function parsePagination(input?: PaginationInput, defaults = { page: 1, pageSize: 25 }) {
  const page = Math.max(Number(input?.page ?? defaults.page) || defaults.page, 1);
  const pageSize = Math.min(Math.max(Number(input?.pageSize ?? defaults.pageSize) || defaults.pageSize, 10), 100);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function pageResult<T>(items: T[], total: number, page: number, pageSize: number) {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    hasNext: page * pageSize < total
  };
}

function requireText(value: string | null | undefined, label: string, min = 3) {
  const normalized = value?.trim();
  if (!normalized || normalized.length < min) throw new Error(`${label} obrigatório com pelo menos ${min} caracteres.`);
  return normalized;
}

function payloadHash(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) return null;
  return createHash("sha256").update(normalized).digest("hex");
}

export function enumValue<T extends string>(values: readonly T[], value?: string | null): T | undefined {
  return value && values.includes(value as T) ? (value as T) : undefined;
}

export async function createOperationalIncident(input: {
  admin: AdminUser;
  title?: string | null;
  description?: string | null;
  severity?: string | null;
  source?: string | null;
  impactedArea?: string | null;
  assignedToUserId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  const incident = await prisma.operationalIncident.create({
    data: {
      title: requireText(input.title, "Título"),
      description: requireText(input.description, "Descrição", 8),
      severity: enumValue(Object.values(OperationalIncidentSeverity), input.severity) ?? OperationalIncidentSeverity.WARNING,
      source: requireText(input.source, "Origem"),
      impactedArea: requireText(input.impactedArea, "Área impactada"),
      reportedByUserId: input.admin.id,
      assignedToUserId: input.assignedToUserId?.trim() || null,
      metadata: input.metadata
    }
  });

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.incident.created",
    resourceType: "operational_incident",
    resourceId: incident.id,
    targetUserId: incident.assignedToUserId,
    outcome: "success",
    metadata: { severity: incident.severity, source: incident.source, impactedArea: incident.impactedArea }
  });

  return incident;
}

export async function updateOperationalIncident(input: {
  admin: AdminUser;
  incidentId: string;
  status?: string | null;
  severity?: string | null;
  assignedToUserId?: string | null;
  comment?: string | null;
}) {
  const current = await prisma.operationalIncident.findUnique({ where: { id: input.incidentId } });
  if (!current) throw new Error("Incidente não encontrado.");
  const nextStatus = enumValue(Object.values(OperationalIncidentStatus), input.status) ?? current.status;
  const nextSeverity = enumValue(Object.values(OperationalIncidentSeverity), input.severity) ?? current.severity;
  const comment = input.comment?.trim();

  const [incident] = await prisma.$transaction([
    prisma.operationalIncident.update({
      where: { id: input.incidentId },
      data: {
        status: nextStatus,
        severity: nextSeverity,
        assignedToUserId: input.assignedToUserId?.trim() || current.assignedToUserId,
        resolvedAt: nextStatus === OperationalIncidentStatus.RESOLVED ? new Date() : current.resolvedAt
      }
    }),
    ...(comment ? [prisma.operationalIncidentComment.create({ data: { incidentId: input.incidentId, authorUserId: input.admin.id, body: comment } })] : [])
  ]);

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.incident.updated",
    resourceType: "operational_incident",
    resourceId: incident.id,
    targetUserId: incident.assignedToUserId,
    outcome: "success",
    metadata: { previousStatus: current.status, status: incident.status, previousSeverity: current.severity, severity: incident.severity, commented: Boolean(comment) }
  });

  return incident;
}

export async function createSupportTicket(input: {
  admin: AdminUser;
  userId?: string | null;
  organizationId?: string | null;
  subject?: string | null;
  description?: string | null;
  category?: string | null;
  priority?: string | null;
  source?: string | null;
  assigneeUserId?: string | null;
}) {
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: input.userId?.trim() || null,
      organizationId: input.organizationId?.trim() || null,
      subject: requireText(input.subject, "Assunto"),
      description: requireText(input.description, "Descrição", 8),
      category: requireText(input.category, "Categoria"),
      priority: enumValue(Object.values(SupportTicketPriority), input.priority) ?? SupportTicketPriority.MEDIUM,
      source: input.source?.trim() || "admin",
      assigneeUserId: input.assigneeUserId?.trim() || null
    }
  });

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.support.ticket_created",
    resourceType: "support_ticket",
    resourceId: ticket.id,
    organizationId: ticket.organizationId,
    targetUserId: ticket.userId,
    outcome: "success",
    metadata: { priority: ticket.priority, category: ticket.category, source: ticket.source }
  });

  return ticket;
}

export async function updateSupportTicket(input: {
  admin: AdminUser;
  ticketId: string;
  status?: string | null;
  assigneeUserId?: string | null;
  comment?: string | null;
}) {
  const current = await prisma.supportTicket.findUnique({ where: { id: input.ticketId } });
  if (!current) throw new Error("Ticket não encontrado.");
  const status = enumValue(Object.values(SupportTicketStatus), input.status) ?? current.status;
  const comment = input.comment?.trim();

  const [ticket] = await prisma.$transaction([
    prisma.supportTicket.update({
      where: { id: input.ticketId },
      data: {
        status,
        assigneeUserId: input.assigneeUserId?.trim() || current.assigneeUserId,
        closedAt: status === SupportTicketStatus.RESOLVED || status === SupportTicketStatus.CLOSED ? new Date() : current.closedAt
      }
    }),
    ...(comment ? [prisma.supportTicketComment.create({ data: { ticketId: input.ticketId, authorUserId: input.admin.id, body: comment } })] : [])
  ]);

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.support.ticket_updated",
    resourceType: "support_ticket",
    resourceId: ticket.id,
    organizationId: ticket.organizationId,
    targetUserId: ticket.userId,
    outcome: "success",
    metadata: { previousStatus: current.status, status: ticket.status, assignedTo: ticket.assigneeUserId, commented: Boolean(comment) }
  });

  return ticket;
}

export async function recordJobRun(input: {
  jobName: string;
  status: JobRunStatus;
  startedAt?: Date;
  finishedAt?: Date | null;
  recordsProcessed?: number | null;
  errorMessage?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  const startedAt = input.startedAt ?? new Date();
  const durationMs = input.finishedAt ? Math.max(0, input.finishedAt.getTime() - startedAt.getTime()) : null;
  return prisma.jobRun.create({
    data: {
      jobName: requireText(input.jobName, "Job"),
      status: input.status,
      startedAt,
      finishedAt: input.finishedAt ?? null,
      durationMs,
      recordsProcessed: input.recordsProcessed ?? null,
      errorMessage: input.errorMessage?.trim() || null,
      metadata: input.metadata
    }
  });
}

export async function recordCheckoutEvent(input: {
  userId?: string | null;
  provider?: string | null;
  eventType?: string | null;
  status?: OperationalEventStatus;
  stripeEventId?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.checkoutEvent.create({
    data: {
      userId: input.userId?.trim() || null,
      provider: input.provider?.trim() || "stripe",
      eventType: requireText(input.eventType, "Tipo do evento"),
      status: input.status ?? OperationalEventStatus.RECEIVED,
      stripeEventId: input.stripeEventId?.trim() || null,
      metadata: input.metadata
    }
  });
}

export async function recordWebhookFailure(input: {
  provider?: string | null;
  eventType?: string | null;
  errorType?: string | null;
  payload?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.webhookFailure.create({
    data: {
      provider: input.provider?.trim() || "stripe",
      eventType: requireText(input.eventType, "Tipo do webhook"),
      errorType: requireText(input.errorType, "Tipo do erro"),
      status: WebhookFailureStatus.OPEN,
      retryCount: 0,
      lastAttemptAt: new Date(),
      payloadHash: payloadHash(input.payload),
      metadata: input.metadata
    }
  });
}

export async function recordBillingIssue(input: {
  userId?: string | null;
  organizationId?: string | null;
  type?: string | null;
  severity?: string | null;
  source?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.billingIssue.create({
    data: {
      userId: input.userId?.trim() || null,
      organizationId: input.organizationId?.trim() || null,
      type: requireText(input.type, "Tipo do problema"),
      severity: input.severity?.trim() || "warning",
      status: BillingIssueStatus.OPEN,
      source: input.source?.trim() || "derived",
      metadata: input.metadata
    }
  });
}

export async function recordFunnelEvent(input: {
  userId?: string | null;
  sessionId?: string | null;
  step?: string | null;
  source?: string | null;
  campaign?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.funnelEvent.create({
    data: {
      userId: input.userId?.trim() || null,
      sessionId: input.sessionId?.trim() || null,
      step: requireText(input.step, "Etapa"),
      source: input.source?.trim() || "app",
      campaign: input.campaign?.trim() || null,
      metadata: input.metadata
    }
  });
}

export async function listOperationalIncidents(input?: PaginationInput & { status?: string; severity?: string; source?: string }) {
  const pagination = parsePagination(input);
  const where: Prisma.OperationalIncidentWhereInput = {
    ...(enumValue(Object.values(OperationalIncidentStatus), input?.status) ? { status: enumValue(Object.values(OperationalIncidentStatus), input?.status) } : {}),
    ...(enumValue(Object.values(OperationalIncidentSeverity), input?.severity) ? { severity: enumValue(Object.values(OperationalIncidentSeverity), input?.severity) } : {}),
    ...(input?.source ? { source: { contains: input.source, mode: "insensitive" } } : {})
  };
  const [items, total] = await Promise.all([
    prisma.operationalIncident.findMany({ where, orderBy: { updatedAt: "desc" }, skip: pagination.skip, take: pagination.take, include: { assignedTo: true, reportedBy: true } }),
    prisma.operationalIncident.count({ where })
  ]);
  return pageResult(items, total, pagination.page, pagination.pageSize);
}

export async function listSupportTickets(input?: PaginationInput & { status?: string; priority?: string; category?: string }) {
  const pagination = parsePagination(input);
  const where: Prisma.SupportTicketWhereInput = {
    ...(enumValue(Object.values(SupportTicketStatus), input?.status) ? { status: enumValue(Object.values(SupportTicketStatus), input?.status) } : {}),
    ...(enumValue(Object.values(SupportTicketPriority), input?.priority) ? { priority: enumValue(Object.values(SupportTicketPriority), input?.priority) } : {}),
    ...(input?.category ? { category: { contains: input.category, mode: "insensitive" } } : {})
  };
  const [items, total] = await Promise.all([
    prisma.supportTicket.findMany({ where, orderBy: { updatedAt: "desc" }, skip: pagination.skip, take: pagination.take, include: { user: true, organization: true, assignee: true } }),
    prisma.supportTicket.count({ where })
  ]);
  return pageResult(items, total, pagination.page, pagination.pageSize);
}
