-- Commercial MVP pricing update:
-- Professional is now sold as an annual subscription for BRL 249.00.
-- Existing monthly subscriptions are not deleted; the monthly catalog price is deactivated
-- so new self-service checkout exposes only the validated annual offer.

UPDATE "PlanCatalog"
SET
  "name" = 'Professional',
  "description" = 'Assinatura anual individual da Folha PCR digital.',
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'plan_professional' OR "code" = 'PROFESSIONAL';

INSERT INTO "PlanPrice" (
  "id",
  "planCatalogId",
  "billingCycle",
  "currency",
  "amountCents",
  "intervalCount",
  "isActive",
  "createdAt",
  "updatedAt"
)
VALUES (
  'price_professional_annual',
  'plan_professional',
  'ANNUAL',
  'BRL',
  24900,
  12,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
  "planCatalogId" = EXCLUDED."planCatalogId",
  "billingCycle" = EXCLUDED."billingCycle",
  "currency" = EXCLUDED."currency",
  "amountCents" = EXCLUDED."amountCents",
  "intervalCount" = EXCLUDED."intervalCount",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "PlanPrice"
SET
  "isActive" = false,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'price_professional_monthly';
