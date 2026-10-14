import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";
import { e2eUsers } from "./helpers/db";

const library = "/dashboard/biblioteca-medicamentos";
const infusion = "/dashboard/infusao-continua";

test("documentary routes and direct detail require a session without leaking source data", async ({ page }) => {
  for (const route of [library, `${library}/medications-002`, infusion]) {
    const response = await page.goto(route);
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    expect(await response!.text()).not.toContain("Gotas 500mg/ml");
  }
});

test("existing entitlement gate protects library, detail and infusions", async ({ page }) => {
  await login(page, e2eUsers.noAccess, library);
  for (const route of [library, `${library}/medications-002`, infusion]) {
    await page.goto(route);
    await expect(page.getByRole("main").getByText("Acesso comercial", { exact: true })).toBeVisible();
    await expect(page.locator(".cr-detail")).toHaveCount(0);
    expect(await page.content()).not.toContain("Gotas 500mg/ml");
  }
});

test("immediate search, accessible filters, result counts and empty state", async ({ page, isMobile }) => {
  await login(page, e2eUsers.active, library);
  await expect(page.getByRole("status")).toContainText("69 apresentações encontradas");
  await page.getByRole("searchbox", { name: "Buscar medicamento" }).fill("dipirona");
  await expect(page.locator(".cr-results .cr-result")).toHaveCount(3);
  if (isMobile) await page.getByRole("button", { name: "Filtros", exact: true }).click();
  const prefix = isMobile ? "mobile" : "desktop";
  await page.locator(`#${prefix}-category`).selectOption("ANALGÉSICOS E ANTITÉRMICOS");
  await page.locator(`#${prefix}-route`).selectOption("VO");
  if (isMobile) { await page.keyboard.press("Escape"); await expect(page.locator("dialog[open]")).toHaveCount(0); }
  await expect(page.locator(".cr-results .cr-result")).toHaveCount(2);
  await page.getByRole("searchbox").fill("solucao");
  await expect(page.locator(".cr-results .cr-result")).toHaveCount(1);
  await expect(page.locator(".cr-results")).toContainText("Solução 50mg/ml");
  await page.getByRole("searchbox").fill("zz-nonexistent");
  await expect(page.getByRole("heading", { name: "Nenhuma apresentação encontrada" })).toBeVisible();
  await page.locator(".cr-empty").getByRole("button").click();
  await expect(page.locator(".cr-results .cr-result")).toHaveCount(69);
});

test("each presentation opens an original, pending and traceable detail", async ({ page, isMobile }) => {
  await login(page, e2eUsers.active, library);
  await page.getByRole("searchbox").fill("dipirona");
  await expect(page.locator(".cr-results .cr-result")).toHaveCount(3);
  await page.locator('[data-entry-id="medications-002"]').click();
  if (!isMobile) await page.getByRole("link", { name: "Abrir ficha em página" }).click();
  await expect(page).toHaveURL(/medications-002$/);
  await expect(page.getByRole("heading", { name: "Dipirona", exact: true })).toBeVisible();
  await expect(page.locator(".cr-detail .cr-badge")).toHaveText("Pendente de validação");
  await expect(page.locator(".cr-fields")).toContainText("10-12mg/kg/dose");
  await expect(page.locator(".cr-fields")).toContainText("peso × 0,4 (ml)");
  await expect(page.locator(".cr-fields")).toContainText("Não informado na fonte");
  await expect(page.locator(".cr-issues")).toContainText("Aparente incompatibilidade dimensional");
  await page.getByText("Fonte e rastreabilidade · linha 2", { exact: true }).click();
  await expect(page.locator(".cr-provenance")).toContainText("54e81afad928e9944cb180e4ffa8b3165a1cf27a1ebd1b67e4c9abea7d484f3e");
  await page.getByRole("navigation", { name: "Apresentações deste medicamento" }).getByRole("link", { name: "Solução 50mg/ml" }).click();
  await expect(page).toHaveURL(/medications-003$/);
  await expect(page.getByRole("button", { name: /calcular|prescrever|copiar|exportar/i })).toHaveCount(0);
  await page.goto(`${library}/not-a-record`);
  // The parent loading boundary streams HTTP 200 before notFound() resolves.
  // Assert the user-visible not-found state and absence of clinical content.
  await expect(page.getByRole("heading", { name: "404", exact: true })).toBeVisible();
  await expect(page.locator(".cr-detail")).toHaveCount(0);
});

test("all six infusion choices remain blocked; DOM tampering cannot generate a result", async ({ page }) => {
  await login(page, e2eUsers.active, infusion);
  let calculationRequests = 0;
  page.on("request", req => { if (req.url().includes("/api/calculate")) calculationRequests++; });
  const select = page.getByLabel("Selecionar droga");
  await expect(select.locator("option")).toHaveCount(6);
  for (const value of await select.locator("option").evaluateAll(options => options.map(o => (o as HTMLOptionElement).value))) {
    await select.selectOption(value);
    await expect(page.getByRole("heading", { name: "Aguardando homologação clínica" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Calcular infusão — bloqueado" })).toBeDisabled();
    for (const input of await page.locator(".cr-locked input").all()) { await expect(input).toBeDisabled(); await expect(input).toHaveValue(""); }
  }
  await expect(page.locator(".cr-detail .cr-unit-alert")).toContainText("Não aplicar a fórmula de mcg/kg/min");
  await expect(page.getByLabel("Dose (mui/kg/min — unidade original)")).toBeDisabled();
  // The UI lock is not the calculation barrier: there is no action or execution path.
  await page.locator(".cr-locked fieldset").evaluate(el => el.removeAttribute("disabled"));
  await page.getByLabel("Peso (kg)", { exact: true }).fill("15");
  await page.getByRole("button", { name: "Calcular infusão — bloqueado" }).click();
  await expect(page.getByLabel("Taxa (ml/h)", { exact: true })).toHaveValue("");
  expect(calculationRequests).toBe(0);
  await expect(page.locator(".cr-locked output")).toHaveCount(0);
});

test("administrator can consult but cannot approve or enable clinical execution", async ({ page }) => {
  await login(page, e2eUsers.admin, infusion);
  await expect(page.getByRole("button", { name: "Calcular infusão — bloqueado" })).toBeDisabled();
  await expect(page.getByRole("button", { name: /aprovar|homologar|liberar/i })).toHaveCount(0);
});
