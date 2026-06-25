CREATE TYPE "ExportJobType" AS ENUM ('AUDIT_EXPORT', 'CUSTOMERS_EXPORT', 'BILLING_EXPORT', 'SUPPORT_EXPORT', 'INCIDENTS_EXPORT', 'OPERATIONAL_EXPORT');
CREATE TYPE "ExportJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'EXPIRED');
CREATE TYPE "ExportJobFormat" AS ENUM ('CSV', 'JSON');
CREATE TYPE "RetentionRunStatus" AS ENUM ('DRY_RUN', 'COMPLETED', 'FAILED');

ALTER TABLE "FunnelEvent" ADD COLUMN "dedupeKey" TEXT;
CREATE UNIQUE INDEX "FunnelEvent_dedupeKey_key" ON "FunnelEvent"("dedupeKey");

CREATE TABLE "ExportJob" (
  "id" TEXT NOT NULL,
  "requestedByUserId" TEXT,
  "type" "ExportJobType" NOT NULL,
  "status" "ExportJobStatus" NOT NULL DEFAULT 'QUEUED',
  "format" "ExportJobFormat" NOT NULL,
  "filterPayload" JSONB,
  "filePath" TEXT,
  "storageKey" TEXT,
  "fileContent" TEXT,
  "rowCount" INTEGER,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "ExportJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RetentionRun" (
  "id" TEXT NOT NULL,
  "requestedByUserId" TEXT,
  "policy" TEXT NOT NULL,
  "status" "RetentionRunStatus" NOT NULL,
  "dryRun" BOOLEAN NOT NULL DEFAULT true,
  "cutoff" TIMESTAMP(3) NOT NULL,
  "result" JSONB,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  CONSTRAINT "RetentionRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExportJob_requestedByUserId_createdAt_idx" ON "ExportJob"("requestedByUserId", "createdAt");
CREATE INDEX "ExportJob_type_status_createdAt_idx" ON "ExportJob"("type", "status", "createdAt");
CREATE INDEX "ExportJob_status_createdAt_idx" ON "ExportJob"("status", "createdAt");
CREATE INDEX "ExportJob_expiresAt_idx" ON "ExportJob"("expiresAt");
CREATE INDEX "RetentionRun_requestedByUserId_createdAt_idx" ON "RetentionRun"("requestedByUserId", "createdAt");
CREATE INDEX "RetentionRun_policy_createdAt_idx" ON "RetentionRun"("policy", "createdAt");
CREATE INDEX "RetentionRun_status_createdAt_idx" ON "RetentionRun"("status", "createdAt");

ALTER TABLE "ExportJob" ADD CONSTRAINT "ExportJob_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RetentionRun" ADD CONSTRAINT "RetentionRun_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
