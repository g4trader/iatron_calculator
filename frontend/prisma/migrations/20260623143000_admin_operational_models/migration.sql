CREATE TYPE "OperationalIncidentSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');
CREATE TYPE "OperationalIncidentStatus" AS ENUM ('OPEN', 'MONITORING', 'RESOLVED');
CREATE TYPE "SupportTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'PENDING', 'ESCALATED', 'RESOLVED', 'CLOSED');
CREATE TYPE "JobRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILURE', 'CANCELED');
CREATE TYPE "OperationalEventStatus" AS ENUM ('RECEIVED', 'STARTED', 'COMPLETED', 'FAILED', 'PENDING', 'RESOLVED', 'IGNORED');
CREATE TYPE "WebhookFailureStatus" AS ENUM ('OPEN', 'RETRYING', 'RESOLVED', 'IGNORED');
CREATE TYPE "BillingIssueStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'IGNORED');

CREATE TABLE "OperationalIncident" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" "OperationalIncidentSeverity" NOT NULL DEFAULT 'WARNING',
  "status" "OperationalIncidentStatus" NOT NULL DEFAULT 'OPEN',
  "source" TEXT NOT NULL,
  "impactedArea" TEXT NOT NULL,
  "reportedByUserId" TEXT,
  "assignedToUserId" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OperationalIncident_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OperationalIncidentComment" (
  "id" TEXT NOT NULL,
  "incidentId" TEXT NOT NULL,
  "authorUserId" TEXT,
  "body" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OperationalIncidentComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "organizationId" TEXT,
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "priority" "SupportTicketPriority" NOT NULL DEFAULT 'MEDIUM',
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
  "assigneeUserId" TEXT,
  "source" TEXT NOT NULL,
  "closedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupportTicketComment" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "authorUserId" TEXT,
  "body" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportTicketComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobRun" (
  "id" TEXT NOT NULL,
  "jobName" TEXT NOT NULL,
  "status" "JobRunStatus" NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "finishedAt" TIMESTAMP(3),
  "durationMs" INTEGER,
  "recordsProcessed" INTEGER,
  "errorMessage" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CheckoutEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "provider" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "status" "OperationalEventStatus" NOT NULL,
  "stripeEventId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CheckoutEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookFailure" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "errorType" TEXT NOT NULL,
  "status" "WebhookFailureStatus" NOT NULL DEFAULT 'OPEN',
  "retryCount" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "payloadHash" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WebhookFailure_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingIssue" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "organizationId" TEXT,
  "type" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "status" "BillingIssueStatus" NOT NULL DEFAULT 'OPEN',
  "source" TEXT NOT NULL,
  "resolvedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BillingIssue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FunnelEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "sessionId" TEXT,
  "step" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "campaign" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FunnelEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperationalIncident_status_severity_idx" ON "OperationalIncident"("status", "severity");
CREATE INDEX "OperationalIncident_source_createdAt_idx" ON "OperationalIncident"("source", "createdAt");
CREATE INDEX "OperationalIncident_impactedArea_createdAt_idx" ON "OperationalIncident"("impactedArea", "createdAt");
CREATE INDEX "OperationalIncident_startedAt_idx" ON "OperationalIncident"("startedAt");
CREATE INDEX "OperationalIncident_resolvedAt_idx" ON "OperationalIncident"("resolvedAt");
CREATE INDEX "OperationalIncidentComment_incidentId_createdAt_idx" ON "OperationalIncidentComment"("incidentId", "createdAt");
CREATE INDEX "OperationalIncidentComment_authorUserId_idx" ON "OperationalIncidentComment"("authorUserId");
CREATE INDEX "SupportTicket_status_priority_idx" ON "SupportTicket"("status", "priority");
CREATE INDEX "SupportTicket_userId_createdAt_idx" ON "SupportTicket"("userId", "createdAt");
CREATE INDEX "SupportTicket_organizationId_createdAt_idx" ON "SupportTicket"("organizationId", "createdAt");
CREATE INDEX "SupportTicket_assigneeUserId_status_idx" ON "SupportTicket"("assigneeUserId", "status");
CREATE INDEX "SupportTicket_category_idx" ON "SupportTicket"("category");
CREATE INDEX "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");
CREATE INDEX "SupportTicketComment_ticketId_createdAt_idx" ON "SupportTicketComment"("ticketId", "createdAt");
CREATE INDEX "SupportTicketComment_authorUserId_idx" ON "SupportTicketComment"("authorUserId");
CREATE INDEX "JobRun_jobName_startedAt_idx" ON "JobRun"("jobName", "startedAt");
CREATE INDEX "JobRun_status_startedAt_idx" ON "JobRun"("status", "startedAt");
CREATE INDEX "JobRun_createdAt_idx" ON "JobRun"("createdAt");
CREATE INDEX "CheckoutEvent_userId_createdAt_idx" ON "CheckoutEvent"("userId", "createdAt");
CREATE INDEX "CheckoutEvent_provider_eventType_createdAt_idx" ON "CheckoutEvent"("provider", "eventType", "createdAt");
CREATE INDEX "CheckoutEvent_status_createdAt_idx" ON "CheckoutEvent"("status", "createdAt");
CREATE INDEX "CheckoutEvent_stripeEventId_idx" ON "CheckoutEvent"("stripeEventId");
CREATE INDEX "WebhookFailure_provider_eventType_idx" ON "WebhookFailure"("provider", "eventType");
CREATE INDEX "WebhookFailure_status_updatedAt_idx" ON "WebhookFailure"("status", "updatedAt");
CREATE INDEX "WebhookFailure_payloadHash_idx" ON "WebhookFailure"("payloadHash");
CREATE INDEX "WebhookFailure_createdAt_idx" ON "WebhookFailure"("createdAt");
CREATE INDEX "BillingIssue_status_severity_idx" ON "BillingIssue"("status", "severity");
CREATE INDEX "BillingIssue_userId_createdAt_idx" ON "BillingIssue"("userId", "createdAt");
CREATE INDEX "BillingIssue_organizationId_createdAt_idx" ON "BillingIssue"("organizationId", "createdAt");
CREATE INDEX "BillingIssue_type_createdAt_idx" ON "BillingIssue"("type", "createdAt");
CREATE INDEX "BillingIssue_source_createdAt_idx" ON "BillingIssue"("source", "createdAt");
CREATE INDEX "FunnelEvent_step_createdAt_idx" ON "FunnelEvent"("step", "createdAt");
CREATE INDEX "FunnelEvent_userId_createdAt_idx" ON "FunnelEvent"("userId", "createdAt");
CREATE INDEX "FunnelEvent_sessionId_idx" ON "FunnelEvent"("sessionId");
CREATE INDEX "FunnelEvent_source_createdAt_idx" ON "FunnelEvent"("source", "createdAt");
CREATE INDEX "FunnelEvent_campaign_idx" ON "FunnelEvent"("campaign");

ALTER TABLE "OperationalIncident" ADD CONSTRAINT "OperationalIncident_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OperationalIncident" ADD CONSTRAINT "OperationalIncident_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OperationalIncidentComment" ADD CONSTRAINT "OperationalIncidentComment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "OperationalIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalIncidentComment" ADD CONSTRAINT "OperationalIncidentComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupportTicketComment" ADD CONSTRAINT "SupportTicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupportTicketComment" ADD CONSTRAINT "SupportTicketComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CheckoutEvent" ADD CONSTRAINT "CheckoutEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingIssue" ADD CONSTRAINT "BillingIssue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingIssue" ADD CONSTRAINT "BillingIssue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FunnelEvent" ADD CONSTRAINT "FunnelEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
