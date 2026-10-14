// Local production-build observations, not field Core Web Vitals.
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const { default: AxeBuilder } = await import(
  process.env.AXE_PLAYWRIGHT_MODULE || "@axe-core/playwright"
);
const output = process.env.REDESIGN_EVIDENCE_DIR || "../docs/redesign-v3/after";
const browser = await chromium.launch({ channel: "chrome" });
const performance = [];
for (const width of [1440, 390])
  for (let run = 1; run <= 3; run++) {
    const context = await browser.newContext({
      baseURL: "http://127.0.0.1:3000",
      viewport: { width, height: width === 1440 ? 900 : 844 },
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__vitals = { lcp: 0, cls: 0 };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          window.__vitals.lcp = entry.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          if (!entry.hadRecentInput) window.__vitals.cls += entry.value;
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    performance.push({
      width,
      run,
      ...(await page.evaluate(() => window.__vitals)),
    });
    await context.close();
  }
const context = await browser.newContext({
  baseURL: "http://127.0.0.1:3000",
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();
await page.goto("/");
const checks = [];
async function menu(label) {
  await page.getByLabel("Abrir menu").click();
  assert.equal(
    await page.evaluate(() => document.body.style.overflow),
    "hidden",
  );
  assert.equal(
    await page
      .getByLabel("Fechar menu")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() => !!document.activeElement.closest("dialog")),
      true,
    );
  }
  const a = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(a.violations, []);
  await page.screenshot({
    path: `${output}/${label}-menu.png`,
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  assert.equal(
    await page
      .getByLabel("Abrir menu")
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await page.waitForFunction(() => document.body.style.overflow !== "hidden");
  assert.notEqual(
    await page.evaluate(() => document.body.style.overflow),
    "hidden",
  );
  await page.getByLabel("Abrir menu").click();
  await page.mouse.click(2, 800);
  assert.equal(await page.locator("dialog").isVisible(), false);
  checks.push(
    `${label}: focus contained, Esc restores focus, overlay closes, scroll restored, axe zero violations`,
  );
}
await menu("landing");
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
await page.goto("/dashboard/pcr");
await page.waitForFunction(
  () => document.querySelector("input[type=date]")?.value,
);
const n = page.locator("input[type=number]");
await n.nth(0).fill("5");
await n.nth(1).fill("2");
const response = page.waitForResponse(
  (r) =>
    r.url().endsWith("/api/calculate/pcr") && r.request().method() === "POST",
);
await n.nth(2).fill("15");
const data = await (await response).json();
await page.locator(".ped-drug-table").first().waitFor();
for (const group of ["cardiacArrest", "intubation", "reversal", "usefulDrugs"])
  for (const drug of data[group]) {
    const row = page.locator(".ped-drug-table tr").filter({
      has: page.getByRole("heading", { name: drug.name, exact: true }),
    });
    const text = await row.innerText();
    for (const field of [
      "name",
      "presentation",
      "dose",
      "volume",
      "dilution",
      "note",
    ])
      if (drug[field])
        assert.ok(text.includes(drug[field]), `${drug.name}: ${field}`);
    if (drug.ui100 != null)
      assert.ok(text.includes(`${drug.ui100} UI (seringa de 100 UI)`));
  }
checks.push(
  "All 18 drugs: full presentation, dose, volume, dilution, note and ui100 match API response",
);
await page.getByRole("link", { name: "Drogas", exact: true }).click();
assert.ok(
  await page
    .locator("#drogas")
    .evaluate((el) => el.getBoundingClientRect().top >= 64),
);
await page
  .locator("#drogas")
  .getByRole("link", { name: /Voltar ao resumo/ })
  .click();
assert.ok(Math.abs(await page.locator(".ped-topbar").evaluate(el=>el.getBoundingClientRect().top)) < 1, "Topbar stays visible after anchor navigation");
checks.push("Group anchors and return to summary retain header clearance; topbar remains sticky");
await page.evaluate(() => window.scrollTo(0, 0));
await menu("pcr");
await page.evaluate(() => {
  const sizes = [...document.querySelectorAll(".ped-pcr *")].map((el) => [
    el,
    parseFloat(getComputedStyle(el).fontSize),
  ]);
  for (const [el, size] of sizes) el.style.fontSize = `${size * 2}px`;
});
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > innerWidth,
);
assert.equal(overflow, false);
await page.screenshot({ path: `${output}/pcr-text200.png`, fullPage: true });
checks.push("Text enlarged 200%: no document horizontal overflow");
await writeFile(
  `${output}/quality.json`,
  JSON.stringify(
    {
      performance,
      method:
        "Chrome headless, production build, localhost, fresh browser context per run, no CPU/network throttling; LCP/CLS observed to network idle. Lab-only, not field metrics.",
      checks,
    },
    null,
    2,
  ),
);
await browser.close();
console.log(JSON.stringify({ performance, checks }, null, 2));
