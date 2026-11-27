CREATE TABLE "clinical_review_events" (
"id" TEXT NOT NULL,
"recordId" TEXT NOT NULL,
"version" TEXT NOT NULL,
"state" TEXT NOT NULL CHECK ("state" IN ('pending_review','in_review','correction_required','approved','revoked')),
"reviewerId" TEXT NOT NULL,
"reference" TEXT NOT NULL,
"reason" TEXT NOT NULL,
"reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT "clinical_review_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "clinical_review_events_recordId_version_reviewedAt_idx" ON "clinical_review_events"("recordId","version","reviewedAt");
