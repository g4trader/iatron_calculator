const required = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "NEXTAUTH_URL",
  "NEXT_PUBLIC_API_URL"
];

const optional = [
  "IATRON_ENV",
  "DIRECT_URL",
  "PLAYWRIGHT_BASE_URL",
  "E2E_PASSWORD",
  "TEMP_LOGIN_EMAIL",
  "TEMP_LOGIN_PASSWORD",
  "TEMP_LOGIN_USERS",
  "TEMP_LOGIN_ENABLED",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "FACEBOOK_CLIENT_ID",
  "FACEBOOK_CLIENT_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_PRICE_PROFESSIONAL_ANNUAL",
  "STRIPE_PRICE_HOSPITAL_CUSTOM"
];

function present(name) {
  return Boolean(process.env[name] && process.env[name].trim().length > 0);
}

function printGroup(title, names) {
  console.log(`\n${title}`);
  for (const name of names) {
    console.log(`${present(name) ? "OK     " : "MISSING"} ${name}`);
  }
}

console.log("Iatron production environment check");
printGroup("Required", required);
printGroup("Optional OAuth and Stripe", optional);

const missingRequired = required.filter((name) => !present(name));

if (missingRequired.length > 0) {
  console.error(`\nMissing required variables: ${missingRequired.join(", ")}`);
  process.exit(1);
}

console.log("\nAll required variables are configured.");
