-- AlterTable
ALTER TABLE "ExportJob" ADD COLUMN "storageProvider" TEXT;
ALTER TABLE "ExportJob" ADD COLUMN "checksum" TEXT;
ALTER TABLE "ExportJob" ADD COLUMN "byteSize" INTEGER;

-- AlterTable
ALTER TABLE "ArchiveRestoreJob" ADD COLUMN "result" JSONB;

-- CreateIndex
CREATE INDEX "ExportJob_storageProvider_storageKey_idx" ON "ExportJob"("storageProvider", "storageKey");
