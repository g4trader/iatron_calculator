import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_missing", {
  apiVersion: "2026-04-22.dahlia"
});

export function getAppUrl() {
  return process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "http://localhost:3000";
}
