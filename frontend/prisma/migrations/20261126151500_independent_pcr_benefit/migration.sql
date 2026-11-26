ALTER TABLE "User" ADD COLUMN "folhaPcrBenefitUntil" TIMESTAMP(3);
UPDATE "User" u SET "folhaPcrBenefitUntil" = s.until
FROM (SELECT "userId", MAX("startedAt" + INTERVAL '12 months') AS until FROM mentory_subscriptions WHERE status = 'ACTIVE' AND "renewalTermsVersion" LIKE 'manual-commercial-%' GROUP BY "userId") s WHERE u.id = s."userId";
