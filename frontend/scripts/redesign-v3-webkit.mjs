import { webkit, devices } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
if (!["127.0.0.1", "localhost"].includes(new URL(baseURL).hostname))
  throw new Error("Local synthetic review only");
const output = path.resolve(
  process.env.REDESIGN_EVIDENCE_DIR || "../docs/redesign-v3/after",
);
await mkdir(output, { recursive: true });
const browser = await webkit.launch();
const context = await browser.newContext({
  ...devices["iPhone 13"],
  baseURL,
  locale: "pt-BR",
});
const page = await context.newPage();
await page.goto("/", { waitUntil: "networkidle" });
await page.evaluate(async () => {
  await Promise.all(
    [...document.images].map(async (img) => {
      img.loading = "eager";
      await img.decode();
    }),
  );
});
await page.screenshot({
  path: path.join(output, "landing-webkit-mobile.png"),
  fullPage: true,
});
const { csrfToken } = await (
  await context.request.get("/api/auth/csrf")
).json();
await context.request.post("/api/auth/callback/credentials", {
  form: {
    csrfToken,
    email: "e2e+active@iatron.test",
    password: process.env.E2E_PASSWORD || "IatronE2E#2026",
    callbackUrl: "/dashboard/pcr",
  },
  maxRedirects: 0,
});
await page.goto("/dashboard/pcr");
await page.waitForFunction(
  () => document.querySelector("input[type=date]")?.value,
);
await page
  .getByPlaceholder("Nome completo")
  .fill("Paciente sintético — revisão WebKit");
await page.locator("input[type=date]").fill("2026-10-14");
const n = page.locator("input[type=number]");
await n.nth(0).fill("5");
await n.nth(1).fill("2");
await n.nth(2).fill("15");
await page
  .locator(".pcr-calculator-surface")
  .getByText("Epinefrina", { exact: true })
  .waitFor();
const widths = [];
for (const width of [320, 390, 430]) {
  await page.setViewportSize({ width, height: 844 });
  const overflow = await page.evaluate(
    () =>
      [...document.querySelectorAll(".ped-pcr *")].filter(
        (el) => el.getBoundingClientRect().right > innerWidth + 1,
      ).length,
  );
  assert.equal(overflow, 0);
  widths.push(width);
}
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({
  path: path.join(output, "pcr-result-webkit-mobile.png"),
  fullPage: true,
});
await page.getByLabel("Abrir menu").click();
await page.evaluate(() => {
  window.__printCalls = 0;
  window.print = () => {
    window.__printCalls++;
  };
});
await page
  .getByRole("button", { name: "Exportar PDF" })
  .filter({ visible: true })
  .click();
assert.equal(await page.evaluate(() => window.__printCalls), 1);
await page.emulateMedia({ media: "print" });
assert.equal(await page.locator(".ped-topbar").isVisible(), false);
assert.equal(
  await page
    .locator(".print-report")
    .getByText("Epinefrina", { exact: true })
    .isVisible(),
  true,
);
assert.equal(await page.locator(".print-report-alert").count(), 2);
await writeFile(
  path.join(output, "webkit-review.json"),
  JSON.stringify(
    {
      browser: "WebKit, iPhone 13 emulation",
      widths,
      calculation: true,
      exportInvokesWindowPrint: true,
      printContainsResultsAndWarnings: true,
      limitation: "No physical iOS device or system print dialog tested.",
    },
    null,
    2,
  ),
);
await browser.close();
console.log("WebKit review passed");
