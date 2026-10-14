import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const out = process.env.MENTORY_REVIEW_DIR;
if (!out) throw new Error('MENTORY_REVIEW_DIR obrigatório');
const base = 'http://127.0.0.1:3000';
const { default: AxeBuilder } = await import(process.env.AXE_PLAYWRIGHT_MODULE || '/tmp/iatron-a11y/node_modules/@axe-core/playwright/dist/index.mjs');
await mkdir(path.join(out, 'screenshots'), { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' }); const results = [];
const groups = [{ role: null, routes: [['landing', '/mentory'], ['login', '/mentory/login']] }, { role: 'student-a', routes: [['dashboard', '/mentory/aprender'], ['modulos', '/mentory/modulos'], ['player', '/mentory/aprender/mentory-demo-module-1-lesson-1'], ['materiais', '/mentory/materiais'], ['assinatura', '/mentory/assinatura']] }, { role: 'admin', routes: [['admin-dashboard', '/mentory/admin'], ['admin-conteudo', '/mentory/admin/conteudo'], ['admin-alunos', '/mentory/admin/alunos'], ['admin-assinaturas', '/mentory/admin/assinaturas']] }];
for (const group of groups) {
  const context = await browser.newContext(); const page = await context.newPage();
  if (group.role) {
    const csrf = await (await context.request.get(`${base}/api/auth/csrf`)).json();
    await context.request.post(`${base}/api/auth/callback/credentials`, { form: { csrfToken: csrf.csrfToken, email: `mentory-test-${group.role}@iatron.test`, password: 'IatronE2E#2026', callbackUrl: '/mentory/aprender', redirect: 'false' } });
  }
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width < 680 ? 844 : 1000 });
    for (const [name, route] of group.routes) {
      await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 60000 }); await page.waitForFunction(() => document.querySelectorAll('h1').length === 1); await page.getByRole('heading', { level: 1 }).first().waitFor(); await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      await page.screenshot({ path: path.join(out, 'screenshots', `${name}-${width}.png`), fullPage: true });
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      const smallTargets = await page.locator('button:visible, .bottom-nav a:visible, .btn:visible').evaluateAll(nodes => nodes.filter(n => !n.disabled && n.getBoundingClientRect().height < 43).map(n => n.textContent?.trim()));
      results.push({ name, width, url: new URL(page.url()).pathname, overflow, smallTargets, violations: axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })) });
      console.log(name, width, 'overflow', overflow, 'axe', axe.violations.length);
    }
  }
  await context.close();
}
await browser.close(); await writeFile(path.join(out, 'visual-checks.json'), JSON.stringify(results, null, 2));
if (results.some(r => r.overflow || r.violations.length || r.smallTargets.length)) process.exitCode = 1;
