-- CreateEnum
CREATE TYPE "LicenseOrigin" AS ENUM ('BILLING', 'MANUAL_SUPPORT', 'CONTINGENCY', 'MIGRATION', 'INSTITUTIONAL_GRANT');

-- AlterTable
ALTER TABLE "License"
ADD COLUMN "licenseKey" TEXT,
ADD COLUMN "origin" "LicenseOrigin" NOT NULL DEFAULT 'BILLING',
ADD COLUMN "internalNote" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "License_licenseKey_key" ON "License"("licenseKey");

-- CreateIndex
CREATE INDEX "License_origin_idx" ON "License"("origin");

-- CreateIndex
CREATE INDEX "License_endsAt_idx" ON "License"("endsAt");
