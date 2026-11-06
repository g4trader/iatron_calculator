BEGIN;
-- CreateEnum
CREATE TYPE "MentoryRole" AS ENUM ('mentory_admin', 'mentory_editor', 'mentory_student');

-- CreateEnum
CREATE TYPE "MentoryContentStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "MentoryAccessStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELED');

-- CreateTable
CREATE TABLE "mentory_role_grants" (
    "userId" TEXT NOT NULL,
    "role" "MentoryRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentory_role_grants_pkey" PRIMARY KEY ("userId","role")
);

-- CreateTable
CREATE TABLE "mentory_modules" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "status" "MentoryContentStatus" NOT NULL DEFAULT 'DRAFT',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentory_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentory_lessons" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "videoAssetId" TEXT,
    "captionsAssetId" TEXT,
    "status" "MentoryContentStatus" NOT NULL DEFAULT 'DRAFT',
    "reviewReference" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentory_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentory_materials" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "storageKey" TEXT,
    "body" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "mentory_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentory_private_assets" (
    "id" TEXT NOT NULL,
    "content" BYTEA NOT NULL,
    "contentType" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mentory_private_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentory_enrollments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "status" "MentoryAccessStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "mentory_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentory_lesson_progress" (
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "lastPositionSeconds" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentory_lesson_progress_pkey" PRIMARY KEY ("userId","lessonId")
);

-- CreateTable
CREATE TABLE "mentory_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL DEFAULT 350000,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "renewalPriceCents" INTEGER NOT NULL DEFAULT 350000,
    "renewalTermsVersion" TEXT NOT NULL,
    "status" "MentoryAccessStatus" NOT NULL DEFAULT 'PENDING',
    "paymentProviderId" TEXT,

    CONSTRAINT "mentory_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentory_audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "mentory_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mentory_rate_buckets" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentory_rate_buckets_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "mentory_modules_status_position_idx" ON "mentory_modules"("status", "position");

-- CreateIndex
CREATE INDEX "mentory_lessons_moduleId_status_position_idx" ON "mentory_lessons"("moduleId", "status", "position");

-- CreateIndex
CREATE INDEX "mentory_materials_lessonId_position_idx" ON "mentory_materials"("lessonId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "mentory_enrollments_subscriptionId_key" ON "mentory_enrollments"("subscriptionId");

-- CreateIndex
CREATE INDEX "mentory_enrollments_userId_status_idx" ON "mentory_enrollments"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "mentory_enrollments_subscriptionId_userId_key" ON "mentory_enrollments"("subscriptionId", "userId");

-- CreateIndex
CREATE INDEX "mentory_lesson_progress_userId_updatedAt_idx" ON "mentory_lesson_progress"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "mentory_subscriptions_paymentProviderId_key" ON "mentory_subscriptions"("paymentProviderId");

-- CreateIndex
CREATE INDEX "mentory_subscriptions_userId_status_expiresAt_idx" ON "mentory_subscriptions"("userId", "status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "mentory_subscriptions_id_userId_key" ON "mentory_subscriptions"("id", "userId");

-- CreateIndex
CREATE INDEX "mentory_audit_logs_actorId_timestamp_idx" ON "mentory_audit_logs"("actorId", "timestamp");

-- CreateIndex
CREATE INDEX "mentory_audit_logs_entityId_timestamp_idx" ON "mentory_audit_logs"("entityId", "timestamp");

-- CreateIndex
CREATE INDEX "mentory_rate_buckets_resetAt_idx" ON "mentory_rate_buckets"("resetAt");

-- AddForeignKey
ALTER TABLE "mentory_role_grants" ADD CONSTRAINT "mentory_role_grants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentory_lessons" ADD CONSTRAINT "mentory_lessons_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "mentory_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentory_materials" ADD CONSTRAINT "mentory_materials_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "mentory_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentory_materials" ADD CONSTRAINT "mentory_materials_storageKey_fkey" FOREIGN KEY ("storageKey") REFERENCES "mentory_private_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentory_enrollments" ADD CONSTRAINT "mentory_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentory_enrollments" ADD CONSTRAINT "mentory_enrollments_subscriptionId_userId_fkey" FOREIGN KEY ("subscriptionId", "userId") REFERENCES "mentory_subscriptions"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentory_lesson_progress" ADD CONSTRAINT "mentory_lesson_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentory_lesson_progress" ADD CONSTRAINT "mentory_lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "mentory_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentory_subscriptions" ADD CONSTRAINT "mentory_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentory_audit_logs" ADD CONSTRAINT "mentory_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE "mentory_subscriptions" ADD CONSTRAINT "mentory_contract_valid" CHECK ("priceCents" >= 0 AND "renewalPriceCents" >= 0 AND "currency" = 'BRL' AND "expiresAt" > "startedAt" AND length("renewalTermsVersion") > 0);
ALTER TABLE "mentory_lessons" ADD CONSTRAINT "mentory_lesson_duration" CHECK ("duration" >= 0 AND "duration" <= 86400);
ALTER TABLE "mentory_lesson_progress" ADD CONSTRAINT "mentory_progress_nonnegative" CHECK ("lastPositionSeconds" >= 0);
ALTER TABLE "mentory_materials" ADD CONSTRAINT "mentory_material_type" CHECK ("type" IN ('TEXT', 'PDF', 'SLIDES'));
COMMIT;
