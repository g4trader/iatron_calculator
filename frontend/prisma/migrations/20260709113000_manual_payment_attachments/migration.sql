-- CreateEnum
CREATE TYPE "ManualPaymentAttachmentStatus" AS ENUM ('PENDING_UPLOAD', 'UPLOADED', 'REJECTED');

-- AlterTable
ALTER TABLE "ManualPayment"
ADD COLUMN "reconciliationReference" TEXT,
ADD COLUMN "reconciliationNote" TEXT;

-- CreateTable
CREATE TABLE "ManualPaymentAttachment" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER,
    "checksum" TEXT,
    "status" "ManualPaymentAttachmentStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "createdByUserId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualPaymentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManualPaymentAttachment_paymentId_idx" ON "ManualPaymentAttachment"("paymentId");

-- CreateIndex
CREATE INDEX "ManualPaymentAttachment_status_idx" ON "ManualPaymentAttachment"("status");

-- CreateIndex
CREATE INDEX "ManualPaymentAttachment_storageProvider_idx" ON "ManualPaymentAttachment"("storageProvider");

-- CreateIndex
CREATE INDEX "ManualPaymentAttachment_storageKey_idx" ON "ManualPaymentAttachment"("storageKey");

-- CreateIndex
CREATE INDEX "ManualPaymentAttachment_createdByUserId_idx" ON "ManualPaymentAttachment"("createdByUserId");

-- AddForeignKey
ALTER TABLE "ManualPaymentAttachment" ADD CONSTRAINT "ManualPaymentAttachment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "ManualPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualPaymentAttachment" ADD CONSTRAINT "ManualPaymentAttachment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
