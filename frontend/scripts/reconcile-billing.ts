import { loadOperationalEnv } from "./load-env.mjs";
import { reconcileBillingState } from "@/lib/billing-reconciliation";
import { prisma } from "@/lib/prisma";

loadOperationalEnv();

async function main() {
  if (process.env.IATRON_ENV === "production" && process.env.ALLOW_PRODUCTION_BILLING_RECONCILIATION !== "true") {
    throw new Error("Refusing to reconcile billing in production without ALLOW_PRODUCTION_BILLING_RECONCILIATION=true.");
  }

  const limit = Number(process.env.BILLING_RECONCILIATION_LIMIT ?? 100);
  const result = await reconcileBillingState(limit);
  console.log(JSON.stringify({ ok: true, ...result }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
