import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY não configurada.");
  stripeClient ??= new Stripe(secretKey, {
    apiVersion: "2026-04-22.dahlia"
  });
  return stripeClient;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, property) {
    return getStripeClient()[property as keyof Stripe];
  }
});

export function getAppUrl() {
  return process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "http://localhost:3000";
}
