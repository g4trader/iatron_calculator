import { type AdminAuditEvent, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditExportFormat = "csv" | "json";

export type AuditFilters = {
  actor?: string;
  action?: string;
  resourceType?: string;
  outcome?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
};

const sensitiveKeyPattern = /secret|token|password|authorization|signature|cookie|session|hash|raw|payload/i;

const actionDescriptions: Record<string, string> = {
  "admin.permission.denied": "Permissão administrativa negada",
  "admin.step_up.validated": "Step-up administrativo validado",
  "admin.step_up.denied": "Step-up administrativo negado",
  "admin.step_up.blocked": "Ação crítica bloqueada por falta de step-up",
  "admin.access.role_granted": "Role administrativa concedida",
  "admin.access.role_removed": "Role administrativa removida",
  "admin.access.permission_granted": "Permissão administrativa concedida",
  "admin.access.permission_revoked": "Permissão administrativa revogada",
  "admin.access.deactivated": "Administrador desativado",
  "admin.license.create_manual": "Licença manual criada",
  "admin.license.extend": "Validade da licença estendida",
  "admin.license.suspend": "Licença suspensa",
  "admin.license.revoke": "Licença revogada",
  "admin.license.reactivate": "Licença reativada",
  "admin.license.convert_regular": "Licença convertida em regular",
  "admin.customer.note_added": "Nota interna do cliente registrada",
  "admin.support.note_added": "Intervenção de suporte registrada",
  "admin.billing.reconcile_executed": "Reconcile de billing executado",
  "admin.billing.manual_review_marked": "Caso de billing marcado para análise manual",
  "admin.billing.webhook_reprocess_requested": "Reprocessamento de webhook solicitado",
  "admin.contingency.emergency_license_generated": "Licença emergencial de contingência gerada",
  "admin.contingency.reconcile_reprocessed": "Reconcile reprocessado por contingência",
  "admin.contingency.activation_resent": "Ativação reenviada por contingência",
  "admin.contingency.sessions_invalidated": "Sessões invalidadas por contingência",
  "admin.contingency.entitlement_refreshed": "Entitlement recalculado por contingência",
  "admin.contingency.incident_registered": "Incidente operacional registrado"
};

export function describeAuditAction(action: string) {
  return actionDescriptions[action] ?? action.replace(/^admin\./, "").replaceAll("_", " ").replaceAll(".", " · ");
}

export function sanitizeAuditMetadata(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(sanitizeAuditMetadata);
  if (typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
      key,
      sensitiveKeyPattern.test(key) ? "[redacted]" : sanitizeAuditMetadata(entryValue)
    ])
  );
}

export function parseAuditFilters(input?: Record<string, string | undefined>): AuditFilters {
  const page = Math.max(Number(input?.page ?? 1) || 1, 1);
  const pageSize = Math.min(Math.max(Number(input?.pageSize ?? 25) || 25, 10), 100);

  return {
    actor: input?.actor?.trim() || undefined,
    action: input?.action?.trim() || undefined,
    resourceType: input?.resourceType?.trim() || undefined,
    outcome: input?.outcome?.trim() || undefined,
    dateFrom: input?.dateFrom || undefined,
    dateTo: input?.dateTo || undefined,
    page,
    pageSize
  };
}

export function buildAuditWhere(filters: AuditFilters): Prisma.AdminAuditEventWhereInput {
  const createdAt: Prisma.DateTimeFilter = {};
  if (filters.dateFrom) createdAt.gte = new Date(`${filters.dateFrom}T00:00:00.000Z`);
  if (filters.dateTo) createdAt.lte = new Date(`${filters.dateTo}T23:59:59.999Z`);

  return {
    ...(filters.action ? { action: { contains: filters.action, mode: "insensitive" } } : {}),
    ...(filters.resourceType ? { resourceType: { contains: filters.resourceType, mode: "insensitive" } } : {}),
    ...(filters.outcome ? { outcome: filters.outcome } : {}),
    ...(Object.keys(createdAt).length > 0 ? { createdAt } : {}),
    ...(filters.actor
      ? {
          OR: [
            { actorUserId: filters.actor },
            { actor: { is: { email: { contains: filters.actor, mode: "insensitive" } } } },
            { actor: { is: { name: { contains: filters.actor, mode: "insensitive" } } } }
          ]
        }
      : {})
  };
}

export async function getAdminAuditDashboard(filters: AuditFilters) {
  const where = buildAuditWhere(filters);
  const [events, total, outcomes, resourceTypes, actions] = await Promise.all([
    prisma.adminAuditEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: { actor: true, targetUser: true }
    }),
    prisma.adminAuditEvent.count({ where }),
    prisma.adminAuditEvent.groupBy({ by: ["outcome"], _count: { _all: true }, orderBy: { outcome: "asc" } }),
    prisma.adminAuditEvent.groupBy({ by: ["resourceType"], _count: { _all: true }, orderBy: { resourceType: "asc" } }),
    prisma.adminAuditEvent.groupBy({ by: ["action"], _count: { _all: true }, orderBy: { action: "asc" }, take: 100 })
  ]);

  return {
    events,
    total,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    outcomes,
    resourceTypes,
    actions
  };
}

export async function getAdminAuditEvent(id: string) {
  return prisma.adminAuditEvent.findUnique({
    where: { id },
    include: { actor: true, targetUser: true }
  });
}

function flattenEvent(event: AdminAuditEvent & { actor?: { email?: string | null; name?: string | null } | null; targetUser?: { email?: string | null; name?: string | null } | null }) {
  return {
    id: event.id,
    actor: event.actor?.email ?? event.actor?.name ?? event.actorUserId ?? "sistema",
    action: event.action,
    description: describeAuditAction(event.action),
    resourceType: event.resourceType,
    resourceId: event.resourceId ?? "",
    organizationId: event.organizationId ?? "",
    targetUser: event.targetUser?.email ?? event.targetUser?.name ?? event.targetUserId ?? "",
    outcome: event.outcome,
    ipAddress: event.ipAddress ?? "",
    userAgent: event.userAgent ?? "",
    createdAt: event.createdAt.toISOString(),
    metadata: JSON.stringify(sanitizeAuditMetadata(event.metadata))
  };
}

function csvEscape(value: unknown) {
  const stringValue = String(value ?? "");
  return `"${stringValue.replaceAll('"', '""')}"`;
}

export function serializeAuditEvents(events: Array<AdminAuditEvent & { actor?: { email?: string | null; name?: string | null } | null; targetUser?: { email?: string | null; name?: string | null } | null }>, format: AuditExportFormat) {
  const rows = events.map(flattenEvent);
  if (format === "json") return JSON.stringify(rows, null, 2);

  const headers = ["id", "actor", "action", "description", "resourceType", "resourceId", "organizationId", "targetUser", "outcome", "ipAddress", "userAgent", "createdAt", "metadata"];
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header as keyof typeof row])).join(","))
  ].join("\n");
}
