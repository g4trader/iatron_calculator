import { mkdirSync } from "fs";
import { chromium, expect, type BrowserContext, type Frame, type Page } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const password = process.env.E2E_PASSWORD ?? "IatronE2E#2026";
const outputDir = "test-results/manual-commercial-flow";

const users = {
  individual: "e2e+no-access@iatron.test",
  active: "e2e+active@iatron.test",
  pastDue: "e2e+past-due@iatron.test",
  orgNoLicense: "e2e+org-no-license@iatron.test",
  orgLicensed: "e2e+org-licensed@iatron.test"
};

type StepResult = {
  name: string;
  ok: boolean;
  detail?: string;
  url?: string;
};

const results: StepResult[] = [];

function record(name: string, ok: boolean, detail?: string, url?: string) {
  results.push({ name, ok, detail, url });
  const marker = ok ? "OK" : "FAIL";
  console.log(`[${marker}] ${name}${detail ? ` - ${detail}` : ""}${url ? ` (${url})` : ""}`);
}

async function login(context: BrowserContext, page: Page, email: string, callbackUrl = "/dashboard") {
  const csrfResponse = await context.request.get(`${baseURL}/api/auth/csrf`);
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
  await context.request.post(`${baseURL}/api/auth/callback/credentials`, {
    form: {
      csrfToken,
      email,
      password,
      callbackUrl,
      redirect: "false"
    },
    maxRedirects: 0
  });
  await page.goto(`${baseURL}${callbackUrl}`, { waitUntil: "domcontentloaded" });
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `${outputDir}/${name}.png`, fullPage: true });
}

async function firstVisible(ctx: Page | Frame, selectors: string[]) {
  for (const selector of selectors) {
    const locator = ctx.locator(selector).first();
    if ((await locator.count()) > 0) {
      try {
        await locator.waitFor({ state: "visible", timeout: 1500 });
        return locator;
      } catch {
        // Continue searching in other selectors/frames.
      }
    }
  }
  return null;
}

async function fillStripeField(page: Page, selectors: string[], value: string, label: string) {
  const contexts: Array<Page | Frame> = [page, ...page.frames()];
  for (const context of contexts) {
    const locator = await firstVisible(context, selectors);
    if (locator) {
      await locator.fill(value);
      return;
    }
  }
  const inputDump = [];
  for (const context of [page, ...page.frames()] as Array<Page | Frame>) {
    const url = "url" in context ? context.url() : "";
    const inputs = await context.locator("input").evaluateAll((nodes) =>
      nodes.map((node) => {
        const input = node as HTMLInputElement;
        return {
          type: input.type,
          name: input.name,
          autocomplete: input.autocomplete,
          placeholder: input.placeholder,
          ariaLabel: input.getAttribute("aria-label"),
          visible: Boolean(input.offsetParent)
        };
      })
    ).catch(() => []);
    inputDump.push({ url, inputs });
  }
  console.log(`STRIPE_INPUT_DUMP_${label.toUpperCase().replaceAll(" ", "_")}=` + JSON.stringify(inputDump, null, 2));
  await page.screenshot({ path: `${outputDir}/stripe-field-missing-${label.replaceAll(" ", "-")}.png`, fullPage: true });
  throw new Error(`Stripe field not found: ${label}`);
}

async function fillOptionalStripeField(page: Page, selectors: string[], value: string) {
  const contexts: Array<Page | Frame> = [page, ...page.frames()];
  for (const context of contexts) {
    const locator = await firstVisible(context, selectors);
    if (locator) {
      await locator.fill(value);
      return true;
    }
  }
  return false;
}

async function submitStripeCheckout(page: Page, cardNumber: string) {
  if (!/checkout\.stripe\.com/.test(page.url())) {
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 });
  }
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const inputCount = await Promise.all(
      ([page, ...page.frames()] as Array<Page | Frame>).map((context) => context.locator("input").count().catch(() => 0))
    ).then((counts) => counts.reduce((sum, count) => sum + count, 0));
    if (inputCount > 0) break;
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: `${outputDir}/stripe-checkout-before-fill.png`, fullPage: true });
  await fillOptionalStripeField(page, ["input[type='email']", "input[name='email']"], "manual-flow@iatron.test");
  await fillStripeField(page, ["input[name='cardNumber']", "input[autocomplete='cc-number']", "input[placeholder*='1234']"], cardNumber, "card number");
  await fillStripeField(page, ["input[name='cardExpiry']", "input[autocomplete='cc-exp']", "input[placeholder*='MM']", "input[placeholder*='MM / YY']"], "1234", "expiry");
  await fillStripeField(page, ["input[name='cardCvc']", "input[autocomplete='cc-csc']", "input[placeholder*='CVC']", "input[placeholder*='CVV']"], "123", "cvc");

  const nameField = await firstVisible(page, ["input[name='billingName']", "input[autocomplete='cc-name']"]);
  if (nameField) await nameField.fill("Iatron Manual Flow");

  const postalField = await firstVisible(page, ["input[name='billingPostalCode']", "input[autocomplete='postal-code']"]);
  if (postalField) await postalField.fill("12345");

  const button = page.getByRole("button", { name: /assinar|pagar|subscribe|pay|confirmar|iniciar/i }).first();
  await button.click();
}

async function waitForDashboardAccess(page: Page) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.goto(`${baseURL}/dashboard`, { waitUntil: "domcontentloaded" });
    const hasDashboard = await page.getByRole("heading", { name: /qual fluxo clínico/i }).isVisible({ timeout: 2500 }).catch(() => false);
    if (hasDashboard) return true;
    await page.waitForTimeout(2500);
  }
  return false;
}

async function run() {
  mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  page.on("dialog", async (dialog) => {
    record("browser dialog", false, dialog.message(), page.url());
    await dialog.dismiss();
  });

  try {
    await login(context, page, users.individual);
    const initialPaywall =
      (await page.getByRole("heading", { name: /acesso premium necessário/i }).isVisible({ timeout: 4000 }).catch(() => false)) ||
      (await page.getByRole("heading", { name: /pagamento pendente/i }).isVisible({ timeout: 4000 }).catch(() => false));
    if (!initialPaywall) throw new Error("Expected individual user to be blocked by paywall before successful checkout.");
    record("individual sem acesso ativo mostra paywall", true, undefined, page.url());
    await screenshot(page, "01-individual-paywall");

    await page.goto(`${baseURL}/checkout`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /escolha o acesso comercial do iatron/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Professional" })).toBeVisible();
    await expect(page.getByRole("button", { name: /assinar professional/i })).toBeEnabled();
    record("pricing individual Professional mensal visível em /checkout", true, undefined, page.url());

    await page.waitForLoadState("networkidle");
    const individualCheckoutNavigation = page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 });
    await page.getByRole("button", { name: /assinar professional/i }).click();
    await individualCheckoutNavigation;
    await submitStripeCheckout(page, "4242424242424242");
    await page.waitForURL(/\/checkout\/return\?status=success/, { timeout: 60_000 });
    record("checkout individual sucesso retornou para produto", true, undefined, page.url());
    await screenshot(page, "02-checkout-return-success");

    const dashboardUnlocked = await waitForDashboardAccess(page);
    record("dashboard liberado após webhook individual", dashboardUnlocked, dashboardUnlocked ? "paywall removido" : "paywall ainda presente", page.url());
    await screenshot(page, "03-dashboard-after-individual-checkout");

    await page.goto(`${baseURL}/billing`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /gestão de assinatura/i })).toBeVisible();
    const statusText = await page.locator("body").innerText();
    record("billing individual abriu", /TRIALING|ACTIVE|trialing|active/i.test(statusText), "status visível no billing", page.url());
    await screenshot(page, "04-billing-individual");

    await page.getByRole("button", { name: /gerenciar assinatura/i }).click();
    await page.waitForURL(/billing\.stripe\.com|dashboard\.stripe\.com/, { timeout: 30_000 });
    record("billing portal abriu", true, undefined, page.url());
    await screenshot(page, "05-stripe-billing-portal");

    await context.clearCookies();
    await login(context, page, users.pastDue, "/checkout");
    await page.waitForLoadState("networkidle");
    const declineCheckoutNavigation = page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 });
    await page.getByRole("button", { name: /assinar professional/i }).click();
    await declineCheckoutNavigation;
    await submitStripeCheckout(page, "4000000000000002");
    await page.waitForFunction(() => !document.body.innerText.includes("Processing"), undefined, { timeout: 60_000 }).catch(() => undefined);
    const declined = await page.getByText(/declined|recusad|não foi possível|cartão|your card was declined/i).first().isVisible({ timeout: 45_000 }).catch(() => false);
    record("checkout com cartão recusado mostra falha no Stripe", declined, declined ? "decline detectado" : "mensagem de decline não detectada", page.url());
    await screenshot(page, "06-checkout-card-declined");

    await context.clearCookies();
    await login(context, page, users.pastDue, "/billing");
    await expect(page.getByRole("heading", { name: /gestão de assinatura/i })).toBeVisible();
    await expect(page.getByText(/confirmação de pagamento pendente/i)).toBeVisible();
    record("usuário past_due é orientado para billing", true, undefined, page.url());
    await screenshot(page, "07-past-due-billing");

    await context.clearCookies();
    await login(context, page, users.orgNoLicense);
    await expect(page.getByRole("heading", { name: /licença institucional não atribuída/i })).toBeVisible();
    record("institucional sem License permanece bloqueado", true, undefined, page.url());
    await screenshot(page, "08-org-no-license");

    await page.goto(`${baseURL}/checkout`, { waitUntil: "domcontentloaded" });
    const hasInstitutionalCheckout = await page.getByRole("button", { name: /contratar .* licenças/i }).isVisible({ timeout: 3000 }).catch(() => false);
    const pageText = await page.locator("body").innerText();
    const hasContact = /hospital/i.test(pageText) && /sob consulta/i.test(pageText) && /falar com equipe/i.test(pageText);
    record(
      "pricing institucional avaliado",
      true,
      hasInstitutionalCheckout ? "checkout institucional disponível" : hasContact ? "plano institucional está como sob consulta" : "CTA institucional não identificado",
      page.url()
    );
    await screenshot(page, "09-org-pricing");

    await context.clearCookies();
    await login(context, page, users.orgLicensed);
    await expect(page.getByRole("heading", { name: /qual fluxo clínico/i })).toBeVisible();
    record("institucional com License.ACTIVE acessa dashboard", true, undefined, page.url());
    await screenshot(page, "10-org-licensed-dashboard");
  } finally {
    await browser.close();
  }

  console.log("MANUAL_FLOW_SUMMARY=" + JSON.stringify(results, null, 2));
  const failed = results.filter((result) => !result.ok);
  if (failed.length > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
