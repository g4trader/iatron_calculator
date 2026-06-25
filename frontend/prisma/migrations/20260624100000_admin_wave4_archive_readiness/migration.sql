CREATE TYPE "ArchiveJobType" AS ENUM ('ADMIN_AUDIT', 'FUNNEL_EVENTS', 'WEBHOOK_FAILURES', 'JOB_RUNS', 'EXPORT_JOBS', 'RETENTION_RUNS');
CREATE TYPE "ArchiveJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');

CREATE TABLE "ArchiveJob" (
  "id" TEXT NOT NULL,
  "requestedByUserId" TEXT,
  "type" "ArchiveJobType" NOT NULL,
  "status" "ArchiveJobStatus" NOT NULL DEFAULT 'QUEUED',
  "dateFrom" TIMESTAMP(3),
  "dateTo" TIMESTAMP(3) NOT NULL,
  "filterPayload" JSONB,
  "rowCount" INTEGER,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  CONSTRAINT "ArchiveJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArchiveObject" (
  "id" TEXT NOT NULL,
  "archiveJobId" TEXT NOT NULL,
  "storageProvider" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "checksum" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "rowCount" INTEGER NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ArchiveObject_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ArchiveJob_requestedByUserId_createdAt_idx" ON "ArchiveJob"("requestedByUserId", "createdAt");
CREATE INDEX "ArchiveJob_type_status_createdAt_idx" ON "ArchiveJob"("type", "status", "createdAt");
CREATE INDEX "ArchiveJob_status_createdAt_idx" ON "ArchiveJob"("status", "createdAt");
CREATE INDEX "ArchiveJob_dateTo_idx" ON "ArchiveJob"("dateTo");
CREATE INDEX "ArchiveObject_archiveJobId_idx" ON "ArchiveObject"("archiveJobId");
CREATE INDEX "ArchiveObject_storageProvider_storageKey_idx" ON "ArchiveObject"("storageProvider", "storageKey");
CREATE INDEX "ArchiveObject_createdAt_idx" ON "ArchiveObject"("createdAt");

ALTER TABLE "ArchiveJob" ADD CONSTRAINT "ArchiveJob_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ArchiveObject" ADD CONSTRAINT "ArchiveObject_archiveJobId_fkey" FOREIGN KEY ("archiveJobId") REFERENCES "ArchiveJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
