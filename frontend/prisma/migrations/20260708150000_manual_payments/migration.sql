-- CreateEnum
CREATE TYPE "ManualPaymentMethod" AS ENUM ('PIX', 'BANK_TRANSFER', 'EXTERNAL_CHECKOUT_LINK', 'BOLETO', 'COURTESY', 'OTHER');

-- CreateEnum
CREATE TYPE "ManualPaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'RECONCILED');

-- CreateTable
CREATE TABLE "ManualPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organizationId" TEXT,
    "licenseId" TEXT,
    "method" "ManualPaymentMethod" NOT NULL,
    "status" "ManualPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "paidAt" TIMESTAMP(3) NOT NULL,
    "proofReference" TEXT,
    "externalReference" TEXT,
    "reason" TEXT NOT NULL,
    "internalNote" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "confirmedByUserId" TEXT,
    "reconciledByUserId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "reconciledAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManualPayment_userId_idx" ON "ManualPayment"("userId");

-- CreateIndex
CREATE INDEX "ManualPayment_organizationId_idx" ON "ManualPayment"("organizationId");

-- CreateIndex
CREATE INDEX "ManualPayment_licenseId_idx" ON "ManualPayment"("licenseId");

-- CreateIndex
CREATE INDEX "ManualPayment_status_idx" ON "ManualPayment"("status");

-- CreateIndex
CREATE INDEX "ManualPayment_method_idx" ON "ManualPayment"("method");

-- CreateIndex
CREATE INDEX "ManualPayment_paidAt_idx" ON "ManualPayment"("paidAt");

-- CreateIndex
CREATE INDEX "ManualPayment_createdAt_idx" ON "ManualPayment"("createdAt");

-- CreateIndex
CREATE INDEX "ManualPayment_createdByUserId_idx" ON "ManualPayment"("createdByUserId");

-- AddForeignKey
ALTER TABLE "ManualPayment" ADD CONSTRAINT "ManualPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualPayment" ADD CONSTRAINT "ManualPayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualPayment" ADD CONSTRAINT "ManualPayment_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualPayment" ADD CONSTRAINT "ManualPayment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualPayment" ADD CONSTRAINT "ManualPayment_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualPayment" ADD CONSTRAINT "ManualPayment_reconciledByUserId_fkey" FOREIGN KEY ("reconciledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
