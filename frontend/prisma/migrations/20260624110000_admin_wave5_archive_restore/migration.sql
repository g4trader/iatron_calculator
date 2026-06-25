-- CreateEnum
CREATE TYPE "ArchiveRestoreStatus" AS ENUM ('REQUESTED', 'DRY_RUN', 'RUNNING', 'COMPLETED', 'FAILED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ArchiveRestoreEventType" AS ENUM ('REQUESTED', 'CHECKSUM_VERIFIED', 'DRY_RUN_COMPLETED', 'RESTORE_STARTED', 'RESTORE_COMPLETED', 'RESTORE_FAILED', 'RESTORE_BLOCKED');

-- CreateTable
CREATE TABLE "ArchiveRestoreJob" (
    "id" TEXT NOT NULL,
    "requestedByUserId" TEXT,
    "archiveObjectId" TEXT NOT NULL,
    "status" "ArchiveRestoreStatus" NOT NULL DEFAULT 'REQUESTED',
    "dryRun" BOOLEAN NOT NULL DEFAULT true,
    "force" BOOLEAN NOT NULL DEFAULT false,
    "rowCount" INTEGER,
    "restoredCount" INTEGER,
    "skippedCount" INTEGER,
    "checksumVerified" BOOLEAN NOT NULL DEFAULT false,
    "checksumActual" TEXT,
    "errorMessage" TEXT,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ArchiveRestoreJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveRestoreEvent" (
    "id" TEXT NOT NULL,
    "restoreJobId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "type" "ArchiveRestoreEventType" NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT 'success',
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchiveRestoreEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArchiveRestoreJob_requestedByUserId_createdAt_idx" ON "ArchiveRestoreJob"("requestedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ArchiveRestoreJob_archiveObjectId_createdAt_idx" ON "ArchiveRestoreJob"("archiveObjectId", "createdAt");

-- CreateIndex
CREATE INDEX "ArchiveRestoreJob_status_createdAt_idx" ON "ArchiveRestoreJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ArchiveRestoreJob_dryRun_createdAt_idx" ON "ArchiveRestoreJob"("dryRun", "createdAt");

-- CreateIndex
CREATE INDEX "ArchiveRestoreEvent_restoreJobId_createdAt_idx" ON "ArchiveRestoreEvent"("restoreJobId", "createdAt");

-- CreateIndex
CREATE INDEX "ArchiveRestoreEvent_actorUserId_createdAt_idx" ON "ArchiveRestoreEvent"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ArchiveRestoreEvent_type_createdAt_idx" ON "ArchiveRestoreEvent"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "ArchiveRestoreJob" ADD CONSTRAINT "ArchiveRestoreJob_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveRestoreJob" ADD CONSTRAINT "ArchiveRestoreJob_archiveObjectId_fkey" FOREIGN KEY ("archiveObjectId") REFERENCES "ArchiveObject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveRestoreEvent" ADD CONSTRAINT "ArchiveRestoreEvent_restoreJobId_fkey" FOREIGN KEY ("restoreJobId") REFERENCES "ArchiveRestoreJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveRestoreEvent" ADD CONSTRAINT "ArchiveRestoreEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
