import { expect, test } from "@playwright/test";
import { login } from "./helpers/auth";
import { e2eUsers } from "./helpers/db";

test.describe("segurança de sessão e rotas protegidas", () => {
  test("login em sessão B invalida a sessão A para o mesmo usuário", async ({ browser }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      await login(pageA, e2eUsers.active, "/dashboard/pcr");
      await expect(pageA.getByRole("heading", { name: /folha pcr para plantão pediátrico/i })).toBeVisible();

      await login(pageB, e2eUsers.active, "/dashboard/pcr");
      await expect(pageB.getByRole("heading", { name: /folha pcr para plantão pediátrico/i })).toBeVisible();

      await pageA.goto("/dashboard/pcr");
      await expect(pageA).toHaveURL(/\/login$/);
      await expect(pageA.getByRole("heading", { name: /acesse sua plataforma clínica/i })).toBeVisible();
    } finally {
      await contextA.close();
      await contextB.close();
    }
  });

  test("logout em uma aba revoga a sessão usada por outra aba", async ({ browser }) => {
    const context = await browser.newContext();
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    try {
      await login(pageA, e2eUsers.active, "/dashboard/pcr");
      await pageB.goto("/dashboard/pcr");
      await expect(pageB.getByRole("heading", { name: /folha pcr para plantão pediátrico/i })).toBeVisible();

      await pageA.getByRole("button", { name: "Sair" }).click();
      await expect(pageA).toHaveURL(/\/$/);

      await pageB.goto("/dashboard/pcr");
      await expect(pageB).toHaveURL(/\/login$/);
      await expect(pageB.getByRole("heading", { name: /acesse sua plataforma clínica/i })).toBeVisible();
    } finally {
      await context.close();
    }
  });

  test("usuário autenticado sem licença continua bloqueado de recurso premium", async ({ page }) => {
    await login(page, e2eUsers.noAccess, "/dashboard/pcr");

    await expect(page.getByRole("heading", { name: /acesso à folha pcr necessário/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /assinar agora/i })).toBeVisible();
  });

  test("usuário comum não acessa admin", async ({ page }) => {
    await login(page, e2eUsers.active, "/admin");

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { name: /folha pcr para plantão pediátrico/i })).toBeVisible();
  });
});
