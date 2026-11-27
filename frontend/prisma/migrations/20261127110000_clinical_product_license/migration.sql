ALTER TABLE "License" ADD COLUMN "clinicalProduct" TEXT;
CREATE INDEX "License_clinicalProduct_userId_status_idx" ON "License"("clinicalProduct", "userId", "status");
