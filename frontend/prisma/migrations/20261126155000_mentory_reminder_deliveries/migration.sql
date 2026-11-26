CREATE TABLE IF NOT EXISTS "mentory_reminder_deliveries" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "subscriptionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "mentory_reminder_subscription_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "mentory_subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "mentory_reminder_user_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "mentory_reminder_deliveries_subscriptionId_eventType_recipientEmail_key" ON "mentory_reminder_deliveries" ("subscriptionId", "eventType", "recipientEmail");
CREATE INDEX IF NOT EXISTS "mentory_reminder_deliveries_status_nextAttemptAt_idx" ON "mentory_reminder_deliveries" ("status", "nextAttemptAt");
