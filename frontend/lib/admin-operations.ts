import { ArchiveJobStatus, ArchiveRestoreStatus, BillingIssueStatus, ExportJobStatus, InviteStatus, JobRunStatus, LicenseStatus, OperationalEventStatus, OperationalIncidentSeverity, OperationalIncidentStatus, RetentionRunStatus, SecurityEventType, SubscriptionStatus, SupportTicketStatus, UserSessionStatus, WebhookFailureStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type OperationalStatus = "healthy" | "degraded" | "incident" | "unknown";

export type OperationalMetric = {
  id: string;
  label: string;
  value: string;
  status: OperationalStatus;
  precision: "precise" | "estimated" | "placeholder";
  note?: string;
};

export type IntegrationStatus = {
  id: string;
  label: string;
  status: OperationalStatus;
  detail: string;
  checkedAt: Date;
};

export type OperationalIncident = {
  id: string;
  severity: "info" | "warning" | "critical";
  origin: string;
  impact: string;
  status: "open" | "monitoring" | "resolved" | "unknown";
  createdAt: Date;
};

export type OperationalQueueItem = {
  id: string;
  label: string;
  value: string;
  status: OperationalStatus;
  note?: string;
};

export type OperationsDashboard = {
  summary: {
    status: OperationalStatus;
    label: string;
    detail: string;
  };
  metrics: OperationalMetric[];
  integrations: IntegrationStatus[];
  incidents: OperationalIncident[];
  queues: OperationalQueueItem[];
  securityEventsByType: Array<{ id: string; type: string; count: number }>;
  sessionsByStatus: Array<{ id: string; status: string; count: number }>;
  jobs: Array<{ id: string; name: string; lastRun: string; status: OperationalStatus; note: string }>;
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function isPresent(value?: string | null) {
  return Boolean(value && value.trim().length > 0);
}

function percentage(part: number, total: number) {
  if (total === 0) return "0,0%";
  return `${((part / total) * 100).toFixed(1).replace(".", ",")}%`;
}

export function summarizeOperationalStatus(input: {
  databaseConnected: boolean;
  criticalIncidents: number;
  warningIncidents: number;
  stripeConfigured: boolean;
  redisConfigured: boolean;
}) {
  if (!input.databaseConnected || input.criticalIncidents > 0) {
    return {
      status: "incident" as const,
      label: "incident",
      detail: !input.databaseConnected ? "Banco indisponível." : "Há eventos críticos recentes."
    };
  }

  if (input.warningIncidents > 0 || !input.stripeConfigured || !input.redisConfigured) {
    return {
      status: "degraded" as const,
      label: "degraded",
      detail: "Sistema funcional com pendências ou alertas operacionais."
    };
  }

  return {
    status: "healthy" as const,
    label: "healthy",
    detail: "Sem incidentes críticos recentes nas fontes monitoradas."
  };
}

export function buildOperationalMetrics(input: {
  loginRateLimited: number;
  sessionInvalid: number;
  checkoutErrorsKnown: number | null;
  webhookFailuresKnown: number | null;
  activeSessions: number;
  revokedSessions: number;
  expiredSessions: number;
  totalSecurityEvents: number;
}) {
  const loginFailureProxy = input.loginRateLimited + input.sessionInvalid;
  return [
    {
      id: "login_error_rate",
      label: "Erro de login",
      value: percentage(loginFailureProxy, Math.max(input.totalSecurityEvents, loginFailureProxy)),
      status: loginFailureProxy > 0 ? "degraded" as const : "healthy" as const,
      precision: "estimated" as const,
      note: "Estimado por SecurityEvent RATE_LIMITED + SESSION_INVALID. Login_failed ainda não é persistido."
    },
    {
      id: "checkout_error_rate",
      label: "Erro de checkout",
      value: input.checkoutErrorsKnown === null ? "N/D" : String(input.checkoutErrorsKnown),
      status: input.checkoutErrorsKnown === null ? "unknown" as const : input.checkoutErrorsKnown > 0 ? "degraded" as const : "healthy" as const,
      precision: input.checkoutErrorsKnown === null ? "placeholder" as const : "precise" as const,
      note: input.checkoutErrorsKnown === null ? "TODO: emitir CheckoutEvent FAILED nos pontos críticos de checkout." : "Fonte: CheckoutEvent FAILED/PENDING."
    },
    {
      id: "stripe_webhook_error_rate",
      label: "Erro webhooks Stripe",
      value: input.webhookFailuresKnown === null ? "N/D" : String(input.webhookFailuresKnown),
      status: input.webhookFailuresKnown && input.webhookFailuresKnown > 0 ? "degraded" as const : "healthy" as const,
      precision: input.webhookFailuresKnown === null ? "placeholder" as const : "precise" as const,
      note: "Fonte: WebhookFailure persistido; payload bruto não é salvo em claro."
    },
    {
      id: "active_sessions",
      label: "Sessões ativas",
      value: String(input.activeSessions),
      status: "healthy" as const,
      precision: "precise" as const
    },
    {
      id: "revoked_sessions",
      label: "Sessões revogadas",
      value: String(input.revokedSessions),
      status: input.revokedSessions > 0 ? "degraded" as const : "healthy" as const,
      precision: "precise" as const
    },
    {
      id: "expired_sessions",
      label: "Sessões expiradas",
      value: String(input.expiredSessions),
      status: "healthy" as const,
      precision: "precise" as const
    }
  ];
}

async function checkDatabase(): Promise<IntegrationStatus> {
  const checkedAt = new Date();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { id: "database", label: "Banco", status: "healthy", detail: "PostgreSQL conectado.", checkedAt };
  } catch {
    return { id: "database", label: "Banco", status: "incident", detail: "Falha na query SELECT 1.", checkedAt };
  }
}

async function checkBackendApi(): Promise<IntegrationStatus> {
  const checkedAt = new Date();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    return { id: "backend_api", label: "API backend", status: "unknown", detail: "NEXT_PUBLIC_API_URL não configurada.", checkedAt };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/health`, { cache: "no-store", signal: controller.signal });
    clearTimeout(timeout);
    return {
      id: "backend_api",
      label: "API backend",
      status: response.ok ? "healthy" : "degraded",
      detail: response.ok ? "Healthcheck respondeu com sucesso." : `Healthcheck retornou HTTP ${response.status}.`,
      checkedAt
    };
  } catch {
    return { id: "backend_api", label: "API backend", status: "degraded", detail: "Não foi possível consultar /health.", checkedAt };
  }
}

function checkStripe(): IntegrationStatus {
  const configured = isPresent(process.env.STRIPE_SECRET_KEY) && isPresent(process.env.STRIPE_WEBHOOK_SECRET);
  return {
    id: "stripe",
    label: "Stripe",
    status: configured ? "healthy" : "degraded",
    detail: configured ? "Chaves test/live e webhook secret presentes." : "Stripe incompleto: revisar STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET.",
    checkedAt: new Date()
  };
}

function checkRedis(): IntegrationStatus {
  const firestoreConfigured = process.env.RATE_LIMIT_PROVIDER?.trim().toLowerCase() === "firestore"
    && isPresent(process.env.GCP_PROJECT_ID)
    && isPresent(process.env.GCP_SERVICE_ACCOUNT_EMAIL)
    && isPresent(process.env.GCP_PRIVATE_KEY);
  const redisConfigured = isPresent(process.env.UPSTASH_REDIS_REST_URL) && isPresent(process.env.UPSTASH_REDIS_REST_TOKEN);
  const configured = firestoreConfigured || redisConfigured;
  const failClosed = process.env.NODE_ENV === "production" && process.env.RATE_LIMIT_ALLOW_MEMORY_FALLBACK !== "true";
  return {
    id: "redis",
    label: "Rate limit",
    status: configured ? "healthy" : failClosed ? "incident" : "degraded",
    detail: configured ? (firestoreConfigured ? "Firestore configurado." : "Upstash Redis configurado.") : failClosed ? "Produção sem store distribuído: rate limit falha fechado." : "Fallback local permitido fora de produção.",
    checkedAt: new Date()
  };
}

export async function getOperationsDashboard(): Promise<OperationsDashboard> {
    const now = new Date();
    const since = new Date(now.getTime() - ONE_DAY_MS);

    const [
      integrations,
      securityEventsByType,
      sessionsByStatus,
      warningEvents,
      totalSecurityEvents,
      pendingInvites,
      billingDesync,
      recentWebhookEvents,
      lastReconcile,
      recentIncidents,
      openOperationalIncidents,
      criticalOperationalIncidents,
      warningOperationalIncidents,
      webhookFailuresOpen,
      supportTicketsOpen,
      billingIssuesOpen,
      checkoutErrors,
      stuckExports,
      failedExports,
      completedExportsWithoutStorage,
      failedRetentionRuns,
      stuckArchives,
      failedArchives,
      stuckRestores,
      failedRestores,
      failedJobRuns,
      lastJobRuns
    ] = await Promise.all([
      Promise.all([checkDatabase(), Promise.resolve(checkStripe()), Promise.resolve(checkRedis()), checkBackendApi()]),
      prisma.securityEvent.groupBy({ by: ["type"], _count: { _all: true }, where: { createdAt: { gte: since } } }),
      prisma.userSession.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.securityEvent.groupBy({ by: ["severity"], _count: { _all: true }, where: { createdAt: { gte: since }, severity: { in: ["warning", "critical"] } } }),
      prisma.securityEvent.count({ where: { createdAt: { gte: since } } }),
      prisma.organizationInvite.count({ where: { status: InviteStatus.PENDING, expiresAt: { gt: now } } }),
      prisma.subscription.count({
        where: {
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
          licenses: { none: { status: LicenseStatus.ACTIVE } }
        }
      }),
      prisma.stripeWebhookEvent.findMany({ orderBy: { processedAt: "desc" }, take: 5 }),
      prisma.securityEvent.findFirst({ where: { type: SecurityEventType.BILLING_RECONCILED }, orderBy: { createdAt: "desc" } }),
      prisma.securityEvent.findMany({
        where: { severity: { in: ["warning", "critical"] }, createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
        take: 8
      }),
      prisma.operationalIncident.findMany({ where: { status: { in: [OperationalIncidentStatus.OPEN, OperationalIncidentStatus.MONITORING] } }, orderBy: { updatedAt: "desc" }, take: 8 }),
      prisma.operationalIncident.count({ where: { status: { in: [OperationalIncidentStatus.OPEN, OperationalIncidentStatus.MONITORING] }, severity: OperationalIncidentSeverity.CRITICAL } }),
      prisma.operationalIncident.count({ where: { status: { in: [OperationalIncidentStatus.OPEN, OperationalIncidentStatus.MONITORING] }, severity: OperationalIncidentSeverity.WARNING } }),
      prisma.webhookFailure.count({ where: { status: { in: [WebhookFailureStatus.OPEN, WebhookFailureStatus.RETRYING] } } }),
      prisma.supportTicket.count({ where: { status: { in: [SupportTicketStatus.OPEN, SupportTicketStatus.PENDING, SupportTicketStatus.ESCALATED] } } }),
      prisma.billingIssue.count({ where: { status: { in: [BillingIssueStatus.OPEN, BillingIssueStatus.INVESTIGATING] } } }),
      prisma.checkoutEvent.count({ where: { status: { in: [OperationalEventStatus.FAILED, OperationalEventStatus.PENDING] }, createdAt: { gte: since } } }),
      prisma.exportJob.count({ where: { status: { in: [ExportJobStatus.QUEUED, ExportJobStatus.RUNNING] }, createdAt: { lt: new Date(now.getTime() - 30 * 60 * 1000) } } }),
      prisma.exportJob.count({ where: { status: ExportJobStatus.FAILED, createdAt: { gte: since } } }),
      prisma.exportJob.count({ where: { status: ExportJobStatus.COMPLETED, storageProvider: null, createdAt: { gte: since } } }),
      prisma.retentionRun.count({ where: { status: RetentionRunStatus.FAILED, createdAt: { gte: since } } }),
      prisma.archiveJob.count({ where: { status: { in: [ArchiveJobStatus.QUEUED, ArchiveJobStatus.RUNNING] }, createdAt: { lt: new Date(now.getTime() - 30 * 60 * 1000) } } }),
      prisma.archiveJob.count({ where: { status: ArchiveJobStatus.FAILED, createdAt: { gte: since } } }),
      prisma.archiveRestoreJob.count({ where: { status: { in: [ArchiveRestoreStatus.REQUESTED, ArchiveRestoreStatus.RUNNING] }, createdAt: { lt: new Date(now.getTime() - 30 * 60 * 1000) } } }),
      prisma.archiveRestoreJob.count({ where: { status: { in: [ArchiveRestoreStatus.FAILED, ArchiveRestoreStatus.BLOCKED] }, createdAt: { gte: since } } }),
      prisma.jobRun.count({ where: { status: JobRunStatus.FAILURE, startedAt: { gte: since } } }),
      prisma.jobRun.findMany({ orderBy: { startedAt: "desc" }, take: 8 })
    ]);

    const activeSessions = sessionsByStatus.find((item) => item.status === UserSessionStatus.ACTIVE)?._count._all ?? 0;
    const revokedSessions = sessionsByStatus.find((item) => item.status === UserSessionStatus.REVOKED)?._count._all ?? 0;
    const expiredSessions = sessionsByStatus.find((item) => item.status === UserSessionStatus.EXPIRED)?._count._all ?? 0;
    const loginRateLimited = securityEventsByType.find((item) => item.type === SecurityEventType.RATE_LIMITED)?._count._all ?? 0;
    const sessionInvalid = securityEventsByType.find((item) => item.type === SecurityEventType.SESSION_INVALID)?._count._all ?? 0;
    const criticalIncidents = criticalOperationalIncidents + (warningEvents.find((item) => item.severity === "critical")?._count._all ?? 0);
    const warningIncidents = warningOperationalIncidents + (warningEvents.find((item) => item.severity === "warning")?._count._all ?? 0);
    const database = integrations.find((item) => item.id === "database");
    const stripe = integrations.find((item) => item.id === "stripe");
    const redis = integrations.find((item) => item.id === "redis");

    return {
      summary: summarizeOperationalStatus({
        databaseConnected: database?.status === "healthy",
        criticalIncidents,
        warningIncidents,
        stripeConfigured: stripe?.status === "healthy",
        redisConfigured: redis?.status === "healthy"
      }),
      metrics: buildOperationalMetrics({
        loginRateLimited,
        sessionInvalid,
        checkoutErrorsKnown: checkoutErrors,
        webhookFailuresKnown: webhookFailuresOpen,
        activeSessions,
        revokedSessions,
        expiredSessions,
        totalSecurityEvents
      }),
      integrations,
      incidents: [
        ...openOperationalIncidents.map((incident) => ({
          id: incident.id,
          severity: incident.severity === OperationalIncidentSeverity.CRITICAL ? "critical" as const : incident.severity === OperationalIncidentSeverity.WARNING ? "warning" as const : "info" as const,
          origin: incident.source,
          impact: incident.impactedArea,
          status: incident.status === OperationalIncidentStatus.RESOLVED ? "resolved" as const : incident.status === OperationalIncidentStatus.MONITORING ? "monitoring" as const : "open" as const,
          createdAt: incident.createdAt
        })),
        ...recentIncidents.map((event) => ({
        id: event.id,
        severity: event.severity as "info" | "warning" | "critical",
        origin: event.type,
        impact: event.severity === "critical" ? "alto" : "médio",
        status: "monitoring" as const,
        createdAt: event.createdAt
        }))
      ].slice(0, 8),
      queues: [
        { id: "failed_webhooks", label: "Webhooks falhos", value: String(webhookFailuresOpen), status: webhookFailuresOpen > 0 ? "degraded" : "healthy", note: "Fonte: WebhookFailure OPEN/RETRYING." },
        { id: "billing_desync", label: "Billing desincronizado", value: String(billingDesync + billingIssuesOpen), status: billingDesync + billingIssuesOpen > 0 ? "degraded" : "healthy", note: "Fonte: BillingIssue + assinaturas ativas/trial sem licença ativa." },
        { id: "pending_invites", label: "Convites pendentes", value: String(pendingInvites), status: pendingInvites > 0 ? "degraded" : "healthy" },
        { id: "support_tickets", label: "Tickets operacionais", value: String(supportTicketsOpen), status: supportTicketsOpen > 0 ? "degraded" : "healthy", note: "Fonte: SupportTicket aberto/pendente/escalado." },
        { id: "export_jobs", label: "Exportações travadas/falhas", value: String(stuckExports + failedExports), status: stuckExports + failedExports > 0 ? "degraded" : "healthy", note: "Fonte: ExportJob QUEUED/RUNNING > 30min ou FAILED em 24h." },
        { id: "export_storage", label: "Export sem storage privado", value: String(completedExportsWithoutStorage), status: completedExportsWithoutStorage > 0 ? "incident" : "healthy", note: "Fonte: ExportJob COMPLETED sem storageProvider em 24h." },
        { id: "retention_runs", label: "Retenção com falha", value: String(failedRetentionRuns), status: failedRetentionRuns > 0 ? "degraded" : "healthy", note: "Fonte: RetentionRun FAILED em 24h." },
        { id: "archive_jobs", label: "Archive travado/falho", value: String(stuckArchives + failedArchives), status: stuckArchives + failedArchives > 0 ? "degraded" : "healthy", note: "Fonte: ArchiveJob QUEUED/RUNNING > 30min ou FAILED em 24h." },
        { id: "archive_restores", label: "Restore travado/falho", value: String(stuckRestores + failedRestores), status: stuckRestores + failedRestores > 0 ? "incident" : "healthy", note: "Fonte: ArchiveRestoreJob REQUESTED/RUNNING > 30min ou FAILED/BLOCKED em 24h." }
      ],
      securityEventsByType: securityEventsByType.map((item) => ({ id: item.type, type: item.type, count: item._count._all })),
      sessionsByStatus: sessionsByStatus.map((item) => ({ id: item.status, status: item.status, count: item._count._all })),
      jobs: lastJobRuns.length > 0
        ? lastJobRuns.map((job) => ({
            id: job.id,
            name: job.jobName,
            lastRun: job.startedAt.toLocaleString("pt-BR"),
            status: job.status === JobRunStatus.SUCCESS ? "healthy" as const : job.status === JobRunStatus.FAILURE ? "incident" as const : "degraded" as const,
            note: `${job.status}${job.durationMs ? ` · ${job.durationMs}ms` : ""}${job.recordsProcessed !== null ? ` · ${job.recordsProcessed} registros` : ""}`
          }))
        : [
            {
              id: "billing_reconcile",
              name: "Billing reconcile",
              lastRun: lastReconcile?.createdAt.toLocaleString("pt-BR") ?? "N/D",
              status: failedJobRuns > 0 ? "incident" : lastReconcile ? "healthy" : "unknown",
              note: lastReconcile ? "Fonte legada: SecurityEvent.BILLING_RECONCILED. Novo modelo: JobRun." : "Sem JobRun persistido ainda."
            },
            {
              id: "stripe_webhook",
              name: "Stripe webhooks",
              lastRun: recentWebhookEvents[0]?.processedAt.toLocaleString("pt-BR") ?? "N/D",
              status: webhookFailuresOpen > 0 ? "degraded" : recentWebhookEvents.length > 0 ? "healthy" : "unknown",
              note: recentWebhookEvents.length > 0 ? "Último StripeWebhookEvent processado; falhas em WebhookFailure." : "Sem eventos recentes registrados."
            }
          ]
    };
}
