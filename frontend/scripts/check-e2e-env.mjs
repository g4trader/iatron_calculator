import { loadOperationalEnv } from "./load-env.mjs";

loadOperationalEnv();

const required = [
  "IATRON_ENV",
  "DATABASE_URL",
  "DIRECT_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "NEXTAUTH_URL",
  "PLAYWRIGHT_BASE_URL",
  "NEXT_PUBLIC_API_URL"
];

const optionalStripe = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_PRICE_PROFESSIONAL_MONTHLY"
];

function isPlaceholder(value) {
  if (!value) return true;
  return /USER:PASSWORD@HOST|replace-with|sk_test_\.\.\.|pk_test_\.\.\.|whsec_\.\.\.|price_\.\.\./.test(value);
}

function assertSafeEnvironment() {
  const environment = process.env.IATRON_ENV;
  if (!["local", "e2e", "staging"].includes(environment ?? "")) {
    throw new Error(`IATRON_ENV deve ser local, e2e ou staging para E2E. Valor atual: ${environment ?? "missing"}.`);
  }

  if (process.env.NODE_ENV === "production" || environment === "production") {
    throw new Error("Execução E2E bloqueada em produção.");
  }
}

function validateUrl(name) {
  const value = process.env[name];
  if (!value || isPlaceholder(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

let failed = false;

try {
  assertSafeEnvironment();
} catch (error) {
  failed = true;
  console.error(`ENVIRONMENT=BLOCKED ${error instanceof Error ? error.message : "unknown"}`);
}

for (const key of required) {
  const value = process.env[key];
  const ok = Boolean(value) && !isPlaceholder(value);
  if (!ok) failed = true;
  console.log(`${key}=${ok ? "OK" : "MISSING_OR_PLACEHOLDER"}`);
}

for (const key of ["DATABASE_URL", "DIRECT_URL", "AUTH_URL", "NEXTAUTH_URL", "PLAYWRIGHT_BASE_URL", "NEXT_PUBLIC_API_URL"]) {
  const ok = validateUrl(key);
  if (!ok) failed = true;
  console.log(`${key}_FORMAT=${ok ? "OK" : "INVALID"}`);
}

for (const key of optionalStripe) {
  const value = process.env[key];
  console.log(`${key}=${value && !isPlaceholder(value) ? "OK" : "PENDING"}`);
}

if (failed) {
  console.error("E2E env check failed. Configure frontend/.env.e2e.local ou exporte as envs no shell.");
  process.exit(1);
}

console.log("E2E env check passed.");
