// Intermediate local preview, not performance evidence.
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const output = process.env.REDESIGN_EVIDENCE_DIR;
if (!output) throw new Error("Set REDESIGN_EVIDENCE_DIR");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({
  baseURL: "http://127.0.0.1:3000",
  viewport: { width: 390, height: 844 },
  locale: "pt-BR",
});
const page = await context.newPage();
page.setDefaultTimeout(60000);
const { csrfToken } = await (
  await context.request.get("/api/auth/csrf")
).json();
await context.request.post("/api/auth/callback/credentials", {
  form: {
    csrfToken,
    email: "e2e+active@iatron.test",
    password: "IatronE2E#2026",
    callbackUrl: "/dashboard/pcr",
  },
  maxRedirects: 0,
});
await page.goto("/dashboard/pcr", { waitUntil: "networkidle" });
await page.waitForFunction(
  () => document.querySelector("input[type=date]")?.value,
);
await page.screenshot({ path: `${output}/empty-390.png`, fullPage: true });
await page
  .getByPlaceholder("Nome completo")
  .fill("Paciente sintético — revisão visual");
await page.locator("input[type=date]").fill("2026-10-14");
const n = page.locator("input[type=number]");
await n.nth(0).fill("5");
await n.nth(1).fill("2");
await n.nth(2).fill("15");
await page.locator(".ped-drug-table").first().waitFor();
for (const width of [320, 390, 430, 1440]) {
  await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: `${output}/result-${width}.png`,
    fullPage: true,
  });
  for (const id of ["resumo", "entubacao"]) {
    await page
      .locator(`#${id}`)
      .evaluate((el) =>
        window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 80),
      );
    await page.screenshot({ path: `${output}/${id}-${width}.png` });
  }
}
await browser.close();
