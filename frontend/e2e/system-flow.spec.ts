import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";
import { e2ePassword, e2eUsers } from "./helpers/db";

test("login pelo formulário e cálculo PCR com validação de peso", async ({ page }) => {
  await page.goto("/login?callbackUrl=%2Fdashboard%2Fpcr");
  await page.getByLabel("Email", { exact: true }).fill(e2eUsers.active);
  await page.getByLabel("Senha", { exact: true }).fill(e2ePassword);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/pcr$/);
  await expect(page.getByRole("heading", { name: "Entubação e PCR", exact: true })).toBeVisible();

  // The date is populated by a client effect after the calculator hydrates.
  await expect(page.getByRole("textbox", { name: "Data", exact: true })).toHaveValue(/\d{4}-\d{2}-\d{2}/);
  await page.getByRole("spinbutton", { name: /^Anos/ }).fill("5");
  await page.getByRole("spinbutton", { name: /^Meses/ }).fill("2");
  const calculated = page.waitForResponse((response) =>
    response.url().endsWith("/api/calculate/pcr") && response.request().postDataJSON()?.pesoKg === 15
  );
  await page.getByRole("spinbutton", { name: /^Peso \(kg\)/ }).fill("15");
  const response = await calculated;
  expect(response.status()).toBe(200);
  const result = await response.json();
  expect(result.input.pesoKg).toBe(15);
  expect(result.shock.find((item: { id: string }) => item.id === "desfibrilacao-1")?.value).toBe("30");
  await expect(page.locator(".pcr-calculator-surface").getByText("30 J", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Resultados atualizados");

  await page.getByRole("spinbutton", { name: /^Peso \(kg\)/ }).fill("0");
  await expect(page.getByText("Informe um peso maior que 0.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Calcular e gerar resultados" })).toBeDisabled();
});

test("senha incorreta não cria sessão autenticada", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(e2eUsers.active);
  await page.getByLabel("Senha", { exact: true }).fill("senha-incorreta-e2e");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText(/email ou senha inválidos/i)).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
});

for (const route of ["/admin", "/admin/system", "/admin/operations", "/admin/exports", "/admin/archive", "/admin/retention"]) {
  test(`admin abre ${route} sem exceção de servidor`, async ({ page }) => {
    await login(page, e2eUsers.admin, route);
    const response = await page.reload();
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.getByText(/Application error|Internal Server Error/)).toHaveCount(0);
  });
}
