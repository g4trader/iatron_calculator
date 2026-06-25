import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";
import { e2eUsers } from "./helpers/db";

test.describe("funil comercial SaaS", () => {
  test("usuário individual sem acesso vê paywall e chega ao pricing", async ({ page }) => {
    await login(page, e2eUsers.noAccess);

    await expect(page.getByRole("heading", { name: /acesso à folha pcr necessário/i })).toBeVisible();
    await page.getByRole("link", { name: /assinar agora/i }).click();

    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole("heading", { name: /escolha o acesso comercial do iatron/i })).toBeVisible();
    await expect(page.getByText(/planos individuais/i)).toBeVisible();
  });

  test("usuário individual ativo acessa Folha PCR", async ({ page }) => {
    await login(page, e2eUsers.active);

    await expect(page.getByRole("heading", { name: /folha pcr para plantão pediátrico/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Folha PCR", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Calculadora completa", exact: true })).toHaveCount(0);
  });

  test("retorno pós-checkout mostra estado transitório quando webhook ainda não refletiu", async ({ page }) => {
    await login(page, e2eUsers.noAccess, "/checkout/return?status=success");

    await expect(page.getByRole("heading", { name: /aguardando confirmação da assinatura/i })).toBeVisible();
    await expect(page.getByText(/depende da confirmação do stripe via webhook/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /atualizar status/i })).toBeVisible();
  });

  test("usuário com problema comercial é orientado para billing", async ({ page }) => {
    await login(page, e2eUsers.pastDue, "/billing");

    await expect(page.getByRole("heading", { name: /gestão de assinatura/i })).toBeVisible();
    await expect(page.getByText(/confirmação de pagamento pendente/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /gerenciar assinatura/i })).toBeVisible();
  });

  test("usuário institucional sem licença não obtém acesso premium", async ({ page }) => {
    await login(page, e2eUsers.orgNoLicense);

    await expect(page.getByRole("heading", { name: /licença institucional não atribuída/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /abrir organização/i })).toBeVisible();
  });

  test("usuário institucional licenciado obtém acesso à Folha PCR", async ({ page }) => {
    await login(page, e2eUsers.orgLicensed);

    await expect(page.getByRole("heading", { name: /folha pcr para plantão pediátrico/i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Folha PCR", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Calculadora completa", exact: true })).toHaveCount(0);
  });
});
