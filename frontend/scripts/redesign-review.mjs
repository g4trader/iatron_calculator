// Local-only visual regression review. Requires a disposable E2E database and seeded users.
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
if (!["127.0.0.1", "localhost"].includes(new URL(baseURL).hostname))
  throw new Error("Review must run locally with synthetic data.");
const output = path.resolve(
  process.env.REDESIGN_EVIDENCE_DIR || "../docs/redesign-evidence",
);
const baseline = process.argv.includes("--baseline");
await mkdir(output, { recursive: true });
console.log("Launching review browser");
const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({
  baseURL,
  viewport: { width: 1440, height: 1000 },
  locale: "pt-BR",
  timezoneId: "America/Sao_Paulo",
});
const page = await context.newPage();
page.setDefaultTimeout(60000);
page.setDefaultNavigationTimeout(120000);
console.log("Opening local landing");
const report = {
  phase: baseline ? "baseline" : "redesign",
  widths: [],
  checks: [],
  errors: [],
};
page.on("pageerror", (e) => report.errors.push(e.message));
async function capture(name) {
  console.log("Capturing", name);
  await page.screenshot({
    path: path.join(output, `${baseline ? "baseline-" : ""}${name}.png`),
    fullPage: true,
  });
}
async function noOverflow(label, width) {
  const overflow = await page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return (
          r.width > 0 &&
          s.position !== "fixed" &&
          s.visibility !== "hidden" &&
          (r.right > innerWidth + 1 || r.left < -1)
        );
      })
      .map((el) => ({
        tag: el.tagName,
        class: String(el.className).slice(0, 120),
      }))
      .slice(0, 10),
  );
  report.widths.push({ label, width, overflow });
  assert.equal(
    overflow.length,
    0,
    `${label} overflow at ${width}: ${JSON.stringify(overflow)}`,
  );
}
await page.goto("/", { waitUntil: "networkidle" });
await capture("landing-desktop");
await page.setViewportSize({ width: 390, height: 844 });
await capture("landing-mobile");
if (!baseline) {
  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow("landing", width);
  }
  assert.equal(await page.locator("h1").count(), 1);
  assert.equal(
    (await page.locator('a[href="#como-funciona"]').count()) > 0,
    true,
  );
  report.checks.push("Landing real anchors, single h1, all requested widths");
}
// Authenticate through the existing credentials provider; no auth bypass.
const csrf = await context.request.get("/api/auth/csrf");
const { csrfToken } = await csrf.json();
await context.request.post("/api/auth/callback/credentials", {
  form: {
    csrfToken,
    email: "e2e+active@iatron.test",
    password: process.env.E2E_PASSWORD || "IatronE2E#2026",
    callbackUrl: "/dashboard/pcr",
  },
  maxRedirects: 0,
});
await page.setViewportSize({ width: 1440, height: 1000 });
await page.goto("/dashboard/pcr", { waitUntil: "networkidle" });
await page.waitForFunction(
  () => document.querySelector("input[type=date]")?.value,
);
await capture("pcr-desktop");
await page.setViewportSize({ width: 390, height: 844 });
await capture("pcr-mobile");
await page
  .getByPlaceholder("Nome completo")
  .fill("Paciente sintético — revisão visual");
await page.locator("input[type=date]").fill("2026-10-14");
const numbers = page.locator("input[type=number]");
await numbers.nth(0).fill("5");
await numbers.nth(1).fill("2");
const responsePromise = page.waitForResponse(
  (r) =>
    r.url().endsWith("/api/calculate/pcr") && r.request().method() === "POST",
);
await numbers.nth(2).fill("15");
const response = await responsePromise;
const result = await response.json();
assert.equal(response.status(), 200);
assert.equal(result.shock[0].value, "30");
assert.equal(result.cardiacArrest[0].volume, "1,5 ml");
await page.locator(".pcr-calculator-surface").getByText("Epinefrina", { exact: true }).waitFor();
await capture("pcr-result-mobile");
await page.setViewportSize({ width: 1440, height: 1000 });
await capture("pcr-result-desktop");
await writeFile(
  path.join(output, `${baseline ? "baseline-" : ""}synthetic-result.json`),
  JSON.stringify(result, null, 2),
);
report.checks.push(
  `Synthetic 15 kg, 5 years, 2 months; source=${response.headers()["x-pcr-calculation-source"]}`,
);
if (!baseline) {
  for (const group of [
    "cardiacArrest",
    "intubation",
    "reversal",
    "usefulDrugs",
  ])
    for (const drug of result[group]) {
      assert.equal(
        await page
          .locator(".pcr-calculator-surface")
          .getByRole("heading", { name: drug.name, exact: true })
          .isVisible(),
        true,
      );
    }
  for (const warning of result.warnings)
    assert.equal(
      await page
        .locator(".pcr-calculator-surface")
        .getByText(warning, { exact: true })
        .isVisible(),
      true,
    );
  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow("pcr-result", width);
  }
  report.checks.push(
    "All medication groups and warnings visible; responsive results",
  );
  await page.setViewportSize({ width: 720, height: 500 });
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  await noOverflow("pcr-zoom200", 720);
  await capture("pcr-zoom200");
  await page.evaluate(() => {
    document.documentElement.style.zoom = "";
  });
}
await page.setViewportSize({ width: 1440, height: 1000 });
await page.pdf({
  path: path.join(output, `${baseline ? "baseline-" : ""}pcr-synthetic.pdf`),
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
});
if (!baseline) {
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.locator(".ped-sidebar").isVisible(), false);
  for (const warning of result.warnings)
    assert.equal(
      await page
        .locator(".print-report")
        .getByText(warning, { exact: true })
        .isVisible(),
      true,
    );
  await page.emulateMedia({ media: "screen" });
  await numbers.nth(2).fill("0");
  await page
    .getByText("Informe um peso maior que 0.", { exact: true })
    .waitFor();
  assert.equal(await numbers.nth(2).getAttribute("aria-invalid"), "true");
  assert.equal(
    await page
      .getByRole("button", { name: "Calcular e gerar resultados" })
      .isDisabled(),
    true,
  );
  await capture("pcr-validation");
  await page.route("**/api/calculate/pcr", (route) =>
    route.fulfill({ status: 500, body: "{}" }),
  );
  await numbers.nth(2).fill("15");
  await page.getByRole("alert").waitFor();
  await capture("pcr-error");
  await page.unroute("**/api/calculate/pcr");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Abrir menu").click();
  await capture("pcr-mobile-menu");
  await page.getByLabel("Abrir menu").press("Escape");
  assert.equal(
    await page.locator(".ped-mobile-menu").getAttribute("open"),
    null,
  );
  report.checks.push(
    "PDF warnings, invalid weight, error state and mobile keyboard menu",
  );
  for (const route of [
    "modelo-prescricao",
    "doses-medicacoes",
    "soroterapia",
    "intubacao-rapida",
  ]) {
    await page.goto(`/dashboard/${route}`, { waitUntil: "networkidle" });
    await noOverflow(route, 390);
    await capture(route + "-mobile");
  }
  // Anonymous access remains protected.
  const anon = await browser.newContext({ baseURL });
  const anonPage = await anon.newPage();
  await anonPage.goto("/dashboard/pcr");
  assert.match(anonPage.url(), /\/login/);
  await anon.close();
  report.checks.push(
    "Existing modules responsive; anonymous PCR redirects to login",
  );
}
await writeFile(
  path.join(output, `${baseline ? "baseline-" : ""}visual-review.json`),
  JSON.stringify(report, null, 2),
);
await browser.close();
console.log(JSON.stringify(report, null, 2));
