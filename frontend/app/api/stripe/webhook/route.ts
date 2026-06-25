import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auditBillingEvent } from "@/lib/billing-audit";
import { recordStripeWebhookEvent, syncStripeSubscription } from "@/lib/billing";
import { trackFunnelEvent } from "@/lib/funnel";
import { recordWebhookFailure } from "@/lib/admin-operational-data";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook Stripe não configurado." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    await recordWebhookFailure({ provider: "stripe", eventType: "unknown", errorType: "invalid_signature", payload: body }).catch(() => null);
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  const recorded = await recordStripeWebhookEvent(event);
  if (recorded.duplicate) return NextResponse.json({ received: true, duplicate: true });

  try {
    await handleStripeEvent(event);
  } catch (error) {
    await recordWebhookFailure({
      provider: "stripe",
      eventType: event.type,
      errorType: error instanceof Error ? error.message.slice(0, 120) : "handler_error",
      payload: body,
      metadata: { stripeEventId: event.id }
    }).catch(() => null);
    throw error;
  }
  auditBillingEvent("stripe_webhook_processed", { stripeEventId: event.id, type: event.type });

  return NextResponse.json({ received: true });
}

async function handleStripeEvent(event: Stripe.Event) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await trackFunnelEvent({
      step: "checkout_completed",
      userId: typeof session.metadata?.userId === "string" ? session.metadata.userId : null,
      source: "stripe_webhook",
      scope: event.id,
      metadata: { stripeEventId: event.id, checkoutSessionId: session.id, subscriptionId: session.subscription?.toString() ?? null }
    }).catch(() => null);
    const subscriptionId = session.subscription?.toString();
    if (!subscriptionId) return;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price"] });
    await syncStripeSubscription(subscription, session.metadata ?? {});
    return;
  }

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await syncStripeSubscription(event.data.object as Stripe.Subscription);
    return;
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
    if (event.type === "invoice.payment_failed") {
      await trackFunnelEvent({
        step: "checkout_failed",
        source: "stripe_webhook",
        scope: event.id,
        metadata: { stripeEventId: event.id, invoiceId: invoice.id ?? null, reason: "invoice.payment_failed" }
      }).catch(() => null);
    }
    const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
    if (!subscriptionId) return;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price"] });
    await syncStripeSubscription(subscription);
  }
}
