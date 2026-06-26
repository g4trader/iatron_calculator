import assert from "node:assert/strict";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import { loadOperationalEnv } from "./load-env.mjs";
import { getCommercialEntitlement } from "../lib/commercial-access";

loadOperationalEnv();

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_missing", {
  apiVersion: "2026-04-22.dahlia"
});

const appUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const professionalStripePriceId = process.env.STRIPE_SMOKE_PROFESSIONAL_PRICE_ID ?? "price_iatron_smoke_professional_annual";
const hospitalStripePriceId = process.env.STRIPE_SMOKE_HOSPITAL_PRICE_ID ?? "price_iatron_smoke_hospital_monthly";

const users = {
  individual: "stripe-smoke+individual@iatron.test",
  organization: "stripe-smoke+organization@iatron.test"
};

const ids = {
  individualCustomer: "cus_iatron_smoke_individual",
  individualSubscription: "sub_iatron_smoke_individual",
  organizationCustomer: "cus_iatron_smoke_organization",
  organizationSubscription: "sub_iatron_smoke_organization",
  organizationSlug: "stripe-smoke-organization"
};

function assertSafeEnvironment() {
  const environment = process.env.IATRON_ENV ?? "local";
  if (!["local", "e2e", "staging"].includes(environment)) {
    throw new Error(`Refusing to run Stripe smoke test with IATRON_ENV=${environment}.`);
  }
  if (process.env.NODE_ENV === "production" || environment === "production") {
    throw new Error("Refusing to run Stripe smoke test in production.");
  }
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is required for signed webhook smoke tests.");
  }
}

async function resetSmokeData() {
  await prisma.stripeWebhookEvent.deleteMany({ where: { stripeEventId: { startsWith: "evt_iatron_smoke_" } } });
  await prisma.user.deleteMany({ where: { email: { in: Object.values(users) } } });
  await prisma.organization.deleteMany({ where: { slug: ids.organizationSlug } });
  await prisma.subscription.deleteMany({
    where: {
      stripeSubscriptionId: {
        in: [ids.individualSubscription, ids.organizationSubscription]
      }
    }
  });
}

async function ensurePlans() {
  const professional = await prisma.planCatalog.upsert({
    where: { code: "PROFESSIONAL" },
    create: {
      id: "plan_professional",
      code: "PROFESSIONAL",
      name: "Professional",
      audience: "INDIVIDUAL",
      description: "Plano individual completo.",
      minSeats: 1
    },
    update: {
      name: "Professional",
      audience: "INDIVIDUAL",
      isActive: true,
      minSeats: 1
    }
  });

  const hospital = await prisma.planCatalog.upsert({
    where: { code: "HOSPITAL" },
    create: {
      id: "plan_hospital",
      code: "HOSPITAL",
      name: "Hospital",
      audience: "INSTITUTIONAL",
      description: "Plano institucional por assento.",
      minSeats: 3
    },
    update: {
      name: "Hospital",
      audience: "INSTITUTIONAL",
      isActive: true,
      minSeats: 3
    }
  });

  const professionalPrice = await prisma.planPrice.upsert({
    where: { id: "price_professional_annual" },
    create: {
      id: "price_professional_annual",
      planCatalogId: professional.id,
      billingCycle: "ANNUAL",
      intervalCount: 12,
      amountCents: 24900,
      currency: "BRL",
      stripePriceId: professionalStripePriceId
    },
    update: {
      planCatalogId: professional.id,
      billingCycle: "ANNUAL",
      intervalCount: 12,
      amountCents: 24900,
      currency: "BRL",
      stripePriceId: professionalStripePriceId,
      isActive: true
    }
  });

  const hospitalPrice = await prisma.planPrice.upsert({
    where: { id: "price_hospital_custom" },
    create: {
      id: "price_hospital_custom",
      planCatalogId: hospital.id,
      billingCycle: "CUSTOM",
      intervalCount: 1,
      amountCents: null,
      currency: "BRL",
      stripePriceId: hospitalStripePriceId
    },
    update: {
      planCatalogId: hospital.id,
      billingCycle: "CUSTOM",
      intervalCount: 1,
      amountCents: null,
      currency: "BRL",
      stripePriceId: hospitalStripePriceId,
      isActive: true
    }
  });

  return { professional, hospital, professionalPrice, hospitalPrice };
}

async function createFixtures() {
  const individual = await prisma.user.create({
    data: {
      email: users.individual,
      name: "Stripe Smoke Individual",
      emailVerified: new Date()
    }
  });

  const organizationUser = await prisma.user.create({
    data: {
      email: users.organization,
      name: "Stripe Smoke Organization",
      emailVerified: new Date()
    }
  });

  const organization = await prisma.organization.create({
    data: {
      name: "Stripe Smoke Organization",
      slug: ids.organizationSlug,
      minimumSeats: 3,
      plan: "HOSPITAL",
      memberships: {
        create: {
          userId: organizationUser.id,
          role: "OWNER"
        }
      }
    }
  });

  return { individual, organizationUser, organization };
}

function subscriptionPayload(input: {
  id: string;
  customer: string;
  status: Stripe.Subscription.Status;
  priceId: string;
  quantity: number;
  metadata: Record<string, string>;
}): Stripe.Subscription {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: input.id,
    object: "subscription",
    application: null,
    application_fee_percent: null,
    automatic_tax: { enabled: false, liability: null, disabled_reason: null },
    billing_cycle_anchor: now,
    billing_cycle_anchor_config: null,
    billing_thresholds: null,
    cancel_at: null,
    cancel_at_period_end: false,
    canceled_at: null,
    cancellation_details: { comment: null, feedback: null, reason: null },
    collection_method: "charge_automatically",
    created: now,
    currency: "brl",
    current_period_end: now + 30 * 24 * 60 * 60,
    current_period_start: now,
    customer: input.customer,
    days_until_due: null,
    default_payment_method: null,
    default_source: null,
    default_tax_rates: [],
    description: null,
    discounts: [],
    ended_at: null,
    invoice_settings: { issuer: { type: "self" }, account_tax_ids: null },
    items: {
      object: "list",
      data: [
        {
          id: `si_${input.id}`,
          object: "subscription_item",
          billing_thresholds: null,
          created: now,
          discounts: [],
          metadata: {},
          price: {
            id: input.priceId,
            object: "price",
            active: true,
            billing_scheme: "per_unit",
            created: now,
            currency: "brl",
            custom_unit_amount: null,
            livemode: false,
            lookup_key: null,
            metadata: {},
            nickname: null,
            product: "prod_iatron_smoke",
            recurring: { interval: "year", interval_count: 1, usage_type: "licensed", aggregate_usage: null, meter: null, trial_period_days: null },
            tax_behavior: "unspecified",
            tiers_mode: null,
            transform_quantity: null,
            type: "recurring",
            unit_amount: 24900,
            unit_amount_decimal: "24900"
          },
          quantity: input.quantity,
          subscription: input.id,
          tax_rates: []
        }
      ],
      has_more: false,
      total_count: 1,
      url: `/v1/subscription_items?subscription=${input.id}`
    },
    latest_invoice: null,
    livemode: false,
    metadata: input.metadata,
    next_pending_invoice_item_invoice: null,
    on_behalf_of: null,
    pause_collection: null,
    payment_settings: {
      payment_method_options: null,
      payment_method_types: null,
      save_default_payment_method: "off"
    },
    pending_invoice_item_interval: null,
    pending_setup_intent: null,
    pending_update: null,
    schedule: null,
    start_date: now,
    status: input.status,
    test_clock: null,
    transfer_data: null,
    trial_end: null,
    trial_settings: { end_behavior: { missing_payment_method: "create_invoice" } },
    trial_start: null
  } as unknown as Stripe.Subscription;
}

function eventPayload(id: string, type: Stripe.Event.Type, object: Stripe.Subscription): Stripe.Event {
  return {
    id,
    object: "event",
    api_version: "2026-04-22.dahlia",
    created: Math.floor(Date.now() / 1000),
    data: { object },
    livemode: false,
    pending_webhooks: 1,
    request: { id: null, idempotency_key: null },
    type
  } as Stripe.Event;
}

async function sendEvent(event: Stripe.Event) {
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret!
  });

  const response = await fetch(`${appUrl}/api/stripe/webhook`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": signature
    },
    body: payload
  });

  const body = await response.json().catch(() => ({}));
  assert.equal(response.status, 200, `Webhook ${event.type} returned ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function main() {
  assertSafeEnvironment();
  await resetSmokeData();
  const plans = await ensurePlans();
  const fixtures = await createFixtures();

  const individualMetadata = {
    ownerType: "USER",
    userId: fixtures.individual.id,
    planPriceId: plans.professionalPrice.id,
    seats: "1"
  };

  const organizationMetadata = {
    ownerType: "ORGANIZATION",
    userId: fixtures.organizationUser.id,
    organizationId: fixtures.organization.id,
    planPriceId: plans.hospitalPrice.id,
    seats: "3"
  };

  const individualActive = subscriptionPayload({
    id: ids.individualSubscription,
    customer: ids.individualCustomer,
    status: "active",
    priceId: professionalStripePriceId,
    quantity: 1,
    metadata: individualMetadata
  });
  const individualCreatedEvent = eventPayload("evt_iatron_smoke_individual_created", "customer.subscription.created", individualActive);
  const createdResponse = await sendEvent(individualCreatedEvent);
  const duplicateResponse = await sendEvent(individualCreatedEvent);

  const activeSubscription = await prisma.subscription.findUniqueOrThrow({
    where: { stripeSubscriptionId: ids.individualSubscription }
  });
  const activeLicense = await prisma.license.findFirstOrThrow({
    where: { subscriptionId: activeSubscription.id, userId: fixtures.individual.id }
  });
  const activeEntitlement = await getCommercialEntitlement(fixtures.individual.id);
  assert.equal(activeSubscription.status, "ACTIVE");
  assert.equal(activeLicense.status, "ACTIVE");
  assert.equal(activeEntitlement.hasAccess, true);

  const individualPastDue = subscriptionPayload({
    id: ids.individualSubscription,
    customer: ids.individualCustomer,
    status: "past_due",
    priceId: professionalStripePriceId,
    quantity: 1,
    metadata: individualMetadata
  });
  await sendEvent(eventPayload("evt_iatron_smoke_individual_past_due", "customer.subscription.updated", individualPastDue));
  const pastDueSubscription = await prisma.subscription.findUniqueOrThrow({
    where: { stripeSubscriptionId: ids.individualSubscription }
  });
  const pastDueEntitlement = await getCommercialEntitlement(fixtures.individual.id);
  assert.equal(pastDueSubscription.status, "PAST_DUE");
  assert.equal(pastDueEntitlement.hasAccess, false);
  assert.equal(pastDueEntitlement.blockReason, "PAYMENT_REQUIRED");

  const individualCanceled = subscriptionPayload({
    id: ids.individualSubscription,
    customer: ids.individualCustomer,
    status: "canceled",
    priceId: professionalStripePriceId,
    quantity: 1,
    metadata: individualMetadata
  });
  await sendEvent(eventPayload("evt_iatron_smoke_individual_deleted", "customer.subscription.deleted", individualCanceled));
  const canceledSubscription = await prisma.subscription.findUniqueOrThrow({
    where: { stripeSubscriptionId: ids.individualSubscription }
  });
  assert.equal(canceledSubscription.status, "CANCELED");

  const organizationActive = subscriptionPayload({
    id: ids.organizationSubscription,
    customer: ids.organizationCustomer,
    status: "active",
    priceId: hospitalStripePriceId,
    quantity: 3,
    metadata: organizationMetadata
  });
  await sendEvent(eventPayload("evt_iatron_smoke_organization_created", "customer.subscription.created", organizationActive));
  const organizationSubscription = await prisma.subscription.findUniqueOrThrow({
    where: { stripeSubscriptionId: ids.organizationSubscription }
  });
  const organizationBlocked = await getCommercialEntitlement(fixtures.organizationUser.id);
  assert.equal(organizationSubscription.status, "ACTIVE");
  assert.equal(organizationSubscription.seatsPurchased, 3);
  assert.equal(organizationBlocked.hasAccess, false);
  assert.equal(organizationBlocked.blockReason, "NO_ORGANIZATION_LICENSE");

  await prisma.license.create({
    data: {
      subscriptionId: organizationSubscription.id,
      organizationId: fixtures.organization.id,
      userId: fixtures.organizationUser.id,
      status: "ACTIVE",
      assignedAt: new Date()
    }
  });
  const organizationAllowed = await getCommercialEntitlement(fixtures.organizationUser.id);
  assert.equal(organizationAllowed.hasAccess, true);

  const webhookEvents = await prisma.stripeWebhookEvent.findMany({
    where: { stripeEventId: { startsWith: "evt_iatron_smoke_" } },
    orderBy: { processedAt: "asc" }
  });

  console.log(JSON.stringify({
    ok: true,
    endpoint: `${appUrl}/api/stripe/webhook`,
    events: {
      created: createdResponse,
      duplicate: duplicateResponse,
      processedCount: webhookEvents.length,
      types: webhookEvents.map((event) => event.type)
    },
    individual: {
      activeStatus: activeSubscription.status,
      activeLicense: activeLicense.status,
      pastDueStatus: pastDueSubscription.status,
      pastDueAccess: pastDueEntitlement.hasAccess,
      canceledStatus: canceledSubscription.status
    },
    organization: {
      status: organizationSubscription.status,
      seatsPurchased: organizationSubscription.seatsPurchased,
      withoutLicenseAccess: organizationBlocked.hasAccess,
      withoutLicenseReason: organizationBlocked.blockReason,
      withLicenseAccess: organizationAllowed.hasAccess
    }
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
