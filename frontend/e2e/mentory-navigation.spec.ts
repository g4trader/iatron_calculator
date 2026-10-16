import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test('Navegação mantém a tela e responde imediatamente enquanto a próxima rota demora', async ({ page }, info) => {
  await login(page, 'mentory-test-student-b@iatron.test', '/mentory/aprender');
  await page.evaluate(() => { (window as unknown as { navigationMarker: string }).navigationMarker = 'preserved'; });
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/mentory/modulos?**', async route => { await gate; await route.continue(); });
  try {
    const nav = page.locator('nav:visible').filter({ has: page.getByRole('link', { name: /^(Meus módulos|Módulos)$/ }) });
    const target = nav.getByRole('link', { name: /^(Meus módulos|Módulos)$/ });
    await target.click();
    await expect(target).toHaveAttribute('aria-busy', 'true', { timeout: 1000 });
    await expect(page.getByRole('status').filter({ hasText: 'Abrindo página' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Vamos continuar');
    await page.screenshot({ path: info.outputPath('navigation-pending.png'), fullPage: true });
  } finally { release(); }
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Meus módulos');
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { navigationMarker: string }).navigationMarker)).toBe('preserved');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Vamos continuar');
});

test('Gestão conserva contadores, conteúdo e filtros com consultas por seção', async ({ page }) => {
  await login(page, 'mentory-test-admin@iatron.test', '/mentory/admin');
  const count = page.locator('.stat:visible').filter({ hasText: 'Módulos cadastrados' }).locator('strong');
  await expect(count).toHaveCount(1);
  await expect(count).not.toHaveText('0');
  await page.getByRole('link', { name: 'Gerenciar conteúdo' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gestão de conteúdo');
  await expect(page.getByText('Nenhum módulo cadastrado.')).toHaveCount(0);
  await page.goto('/mentory/admin/alunos');
  await expect(page.getByRole('main').getByText('mentory-test-student-b@iatron.test', { exact: true })).toBeVisible();
  await page.getByLabel('Buscar por nome ou email').fill('no-matching-student');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page.getByRole('main').getByText('Página 1 · 0 resultados')).toBeVisible();
  await page.goto('/mentory/admin/assinaturas');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Assinaturas');
  await expect(page.getByText('Nenhuma assinatura registrada.')).toHaveCount(0);
});
