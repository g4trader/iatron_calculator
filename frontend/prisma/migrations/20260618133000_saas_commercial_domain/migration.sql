-- Model SaaS commercial domain: plans, prices, organizations, memberships, invites, seats and licenses.

CREATE TYPE "PlanAudience" AS ENUM ('INDIVIDUAL', 'INSTITUTIONAL');
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'SEMIANNUAL', 'ANNUAL', 'BIENNIAL', 'CUSTOM');
CREATE TYPE "SubscriptionOwnerType" AS ENUM ('USER', 'ORGANIZATION');
CREATE TYPE "SubscriptionStatus" AS ENUM ('INACTIVE', 'INCOMPLETE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID', 'PAUSED');
CREATE TYPE "LicenseStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'REVOKED', 'EXPIRED');
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

ALTER TABLE "Institution" RENAME TO "Organization";
ALTER TABLE "Organization" ADD COLUMN "slug" TEXT;
ALTER TABLE "Organization" ADD COLUMN "minimumSeats" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Organization" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

CREATE TABLE "PlanCatalog" (
    "id" TEXT NOT NULL,
    "code" "Plan" NOT NULL,
    "name" TEXT NOT NULL,
    "audience" "PlanAudience" NOT NULL,
    "description" TEXT,
    "minSeats" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanCatalog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlanPrice" (
    "id" TEXT NOT NULL,
    "planCatalogId" TEXT NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "amountCents" INTEGER,
    "intervalCount" INTEGER NOT NULL,
    "stripePriceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanPrice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizationMembership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "OrganizationMembership_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrganizationInvite" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "invitedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationInvite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "organizationId" TEXT,
    "userId" TEXT,
    "status" "LicenseStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PlanCatalog" ("id", "code", "name", "audience", "description", "minSeats")
VALUES
  ('plan_free', 'FREE', 'Free', 'INDIVIDUAL', 'Acesso sem assinatura ativa.', 1),
  ('plan_starter', 'STARTER', 'Starter', 'INDIVIDUAL', 'Plano individual essencial.', 1),
  ('plan_professional', 'PROFESSIONAL', 'Professional', 'INDIVIDUAL', 'Plano individual completo.', 1),
  ('plan_hospital', 'HOSPITAL', 'Hospital', 'INSTITUTIONAL', 'Plano institucional por assento.', 3)
ON CONFLICT DO NOTHING;

INSERT INTO "PlanPrice" ("id", "planCatalogId", "billingCycle", "intervalCount")
VALUES
  ('price_starter_monthly', 'plan_starter', 'MONTHLY', 1),
  ('price_starter_semiannual', 'plan_starter', 'SEMIANNUAL', 6),
  ('price_starter_annual', 'plan_starter', 'ANNUAL', 12),
  ('price_starter_biennial', 'plan_starter', 'BIENNIAL', 24),
  ('price_professional_monthly', 'plan_professional', 'MONTHLY', 1),
  ('price_professional_semiannual', 'plan_professional', 'SEMIANNUAL', 6),
  ('price_professional_annual', 'plan_professional', 'ANNUAL', 12),
  ('price_professional_biennial', 'plan_professional', 'BIENNIAL', 24),
  ('price_hospital_custom', 'plan_hospital', 'CUSTOM', 1)
ON CONFLICT DO NOTHING;

ALTER TABLE "Subscription" ADD COLUMN "ownerType" "SubscriptionOwnerType" NOT NULL DEFAULT 'USER';
ALTER TABLE "Subscription" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "planCatalogId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "planPriceId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE "Subscription" ADD COLUMN "seatsPurchased" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Subscription" ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "Subscription" ADD COLUMN "status_new" "SubscriptionStatus" NOT NULL DEFAULT 'INACTIVE';
UPDATE "Subscription"
SET "status_new" = CASE lower("status")
  WHEN 'active' THEN 'ACTIVE'::"SubscriptionStatus"
  WHEN 'trialing' THEN 'TRIALING'::"SubscriptionStatus"
  WHEN 'incomplete' THEN 'INCOMPLETE'::"SubscriptionStatus"
  WHEN 'past_due' THEN 'PAST_DUE'::"SubscriptionStatus"
  WHEN 'canceled' THEN 'CANCELED'::"SubscriptionStatus"
  WHEN 'cancelled' THEN 'CANCELED'::"SubscriptionStatus"
  WHEN 'unpaid' THEN 'UNPAID'::"SubscriptionStatus"
  WHEN 'paused' THEN 'PAUSED'::"SubscriptionStatus"
  ELSE 'INACTIVE'::"SubscriptionStatus"
END;
ALTER TABLE "Subscription" DROP COLUMN "status";
ALTER TABLE "Subscription" RENAME COLUMN "status_new" TO "status";

UPDATE "Subscription" SET "planCatalogId" = CASE "plan"
  WHEN 'FREE' THEN 'plan_free'
  WHEN 'STARTER' THEN 'plan_starter'
  WHEN 'PROFESSIONAL' THEN 'plan_professional'
  WHEN 'HOSPITAL' THEN 'plan_hospital'
END;

CREATE UNIQUE INDEX "PlanCatalog_code_key" ON "PlanCatalog"("code");
CREATE INDEX "PlanCatalog_audience_idx" ON "PlanCatalog"("audience");
CREATE INDEX "PlanCatalog_isActive_idx" ON "PlanCatalog"("isActive");
CREATE UNIQUE INDEX "PlanPrice_stripePriceId_key" ON "PlanPrice"("stripePriceId");
CREATE UNIQUE INDEX "PlanPrice_planCatalogId_billingCycle_key" ON "PlanPrice"("planCatalogId", "billingCycle");
CREATE INDEX "PlanPrice_billingCycle_idx" ON "PlanPrice"("billingCycle");
CREATE INDEX "PlanPrice_isActive_idx" ON "PlanPrice"("isActive");
CREATE INDEX "Subscription_organizationId_idx" ON "Subscription"("organizationId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_ownerType_idx" ON "Subscription"("ownerType");
CREATE INDEX "Subscription_billingCycle_idx" ON "Subscription"("billingCycle");
CREATE UNIQUE INDEX "OrganizationMembership_organizationId_userId_key" ON "OrganizationMembership"("organizationId", "userId");
CREATE INDEX "OrganizationMembership_userId_idx" ON "OrganizationMembership"("userId");
CREATE INDEX "OrganizationMembership_organizationId_role_idx" ON "OrganizationMembership"("organizationId", "role");
CREATE UNIQUE INDEX "OrganizationInvite_tokenHash_key" ON "OrganizationInvite"("tokenHash");
CREATE INDEX "OrganizationInvite_organizationId_idx" ON "OrganizationInvite"("organizationId");
CREATE INDEX "OrganizationInvite_email_idx" ON "OrganizationInvite"("email");
CREATE INDEX "OrganizationInvite_status_idx" ON "OrganizationInvite"("status");
CREATE INDEX "OrganizationInvite_expiresAt_idx" ON "OrganizationInvite"("expiresAt");
CREATE INDEX "License_subscriptionId_idx" ON "License"("subscriptionId");
CREATE INDEX "License_organizationId_idx" ON "License"("organizationId");
CREATE INDEX "License_userId_idx" ON "License"("userId");
CREATE INDEX "License_status_idx" ON "License"("status");

ALTER TABLE "PlanPrice" ADD CONSTRAINT "PlanPrice_planCatalogId_fkey" FOREIGN KEY ("planCatalogId") REFERENCES "PlanCatalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planCatalogId_fkey" FOREIGN KEY ("planCatalogId") REFERENCES "PlanCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planPriceId_fkey" FOREIGN KEY ("planPriceId") REFERENCES "PlanPrice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationMembership" ADD CONSTRAINT "OrganizationMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationInvite" ADD CONSTRAINT "OrganizationInvite_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationInvite" ADD CONSTRAINT "OrganizationInvite_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "License" ADD CONSTRAINT "License_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "License" ADD CONSTRAINT "License_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "License" ADD CONSTRAINT "License_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_owner_target_check" CHECK (
  ("ownerType" = 'USER' AND "userId" IS NOT NULL AND "organizationId" IS NULL)
  OR
  ("ownerType" = 'ORGANIZATION' AND "organizationId" IS NOT NULL AND "userId" IS NULL)
);
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organization_minimum_seats_check" CHECK (
  "ownerType" <> 'ORGANIZATION' OR "seatsPurchased" >= 3
);
