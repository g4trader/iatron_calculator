import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const base = 'http://127.0.0.1:3000';
const lesson = 'mentory-demo-module-1-lesson-1';
const email = (role: string) => `mentory-test-${role}@iatron.test`;
test.describe.configure({ mode: 'serial' });
test.afterAll(() => db.$disconnect());
test('Mentory: páginas privadas e edição exigem sessão real', async ({ page, request }) => {
  await page.goto('/mentory/admin'); await expect(page).toHaveURL(/mentory\/login/);
  expect((await request.post('/api/mentory/admin', { data: { action: 'module.save' } })).status()).toBe(401);
  expect((await request.get('/api/mentory/subscription')).status()).toBe(401);
  await page.goto('/mentory'); await expect(page.getByRole('heading', { level: 1 })).toContainText('Conhecimento');
});
test('Mentory: aluno não acessa admin, não publica, CSRF e progresso isolado', async ({ page }) => {
  await login(page, email('student-a'), '/mentory/aprender');
  const post = (path: string, data: unknown, origin = base) => page.request.post(`/api/mentory/${path}`, { data, headers: { origin } });
  await page.goto('/mentory/admin'); await expect(page).toHaveURL(/mentory\/aprender/);
  expect((await post('admin', { action: 'module.save', title: 'Ataque', description: '' })).status()).toBe(403);
  expect((await post(`lessons/${lesson}/progress`, { completed: true, lastPositionSeconds: 20 }, 'https://untrusted.example')).status()).toBe(403);
  expect((await post(`lessons/${lesson}/progress`, { userId: 'mentory-test-student-b', completed: true, lastPositionSeconds: 20 })).status()).toBe(400);
  expect((await post(`lessons/${lesson}/progress`, { completed: true, lastPositionSeconds: 20 })).status()).toBe(200);
  expect((await page.request.get('/api/mentory/progress?userId=mentory-test-student-b')).status()).toBe(403);
  expect((await page.request.get('/api/mentory/subscription?userId=mentory-test-student-b')).status()).toBe(403);
  const subscription = await (await page.request.get('/api/mentory/subscription')).json(); expect(subscription.userId).toBe('mentory-test-student-a');
  expect(await db.mentoryLessonProgress.findUnique({ where: { userId_lessonId: { userId: 'mentory-test-student-b', lessonId: lesson } } })).toBeNull();
  expect((await page.request.get(`/api/mentory/lessons/${lesson}/video?preview=1`)).status()).toBe(403);
  expect((await page.request.get(`/api/mentory/lessons/${lesson}/video`)).status()).toBe(423);
  expect((await post('checkout', {})).status()).toBe(423);
  await page.goto(`/mentory/aprender/${lesson}`); await expect(page.getByRole('button', { name: 'Marcar como não concluída' })).toBeVisible();
  await page.getByRole('button', { name: 'Marcar como não concluída' }).click(); await expect(page.getByText('Progresso salvo.')).toBeVisible();
  await page.reload(); await expect(page.getByRole('button', { name: 'Marcar como concluída', exact: true })).toBeVisible();
});
test('Mentory: conta PCR ADMIN não herda permissão Mentory', async ({ page }) => {
  await login(page, 'e2e+admin@iatron.test', '/mentory/admin'); await expect(page).toHaveURL(/mentory\/aprender/);
  expect((await page.request.post('/api/mentory/admin', { headers: { origin: base }, data: { action: 'role', userId: 'mentory-test-student-a', role: 'mentory_admin', grant: true } })).status()).toBe(403);
});
test('Mentory: expiração bloqueia vídeos, materiais e escrita sem apagar progresso', async ({ page }) => {
  await db.mentoryLessonProgress.upsert({ where: { userId_lessonId: { userId: 'mentory-test-expired', lessonId: lesson } }, create: { userId: 'mentory-test-expired', lessonId: lesson, lastPositionSeconds: 25 }, update: {} });
  await login(page, email('expired'), '/mentory/aprender');
  expect((await page.request.get(`/api/mentory/lessons/${lesson}/video`)).status()).toBe(403);
  expect((await page.request.get(`/api/mentory/materials/${lesson}-text`)).status()).toBe(403);
  expect((await page.request.post(`/api/mentory/lessons/${lesson}/progress`, { headers: { origin: base }, data: { completed: true, lastPositionSeconds: 25 } })).status()).toBe(403);
  expect((await (await page.request.get('/api/mentory/progress')).json())[0].lastPositionSeconds).toBe(25);
  await page.goto(`/mentory/aprender/${lesson}`); await expect(page.getByRole('heading', { name: 'Aula indisponível' })).toBeVisible();
});
test('Mentory: editor prepara conteúdo mas não publica, revisa, concede roles ou vê alunos', async ({ page }) => {
  await login(page, email('editor'), '/mentory/admin/conteudo');
  for (const data of [{ action: 'publication', kind: 'lesson', id: lesson, publish: true }, { action: 'review', id: lesson, reference: 'inválida' }, { action: 'role', userId: 'mentory-test-editor', role: 'mentory_admin', grant: true }]) {
    expect((await page.request.post('/api/mentory/admin', { headers: { origin: base }, data })).status()).toBe(403);
  }
  await page.goto('/mentory/admin/alunos'); await expect(page).toHaveURL(/mentory\/admin$/);
  await expect(page.getByText('mentory-test-student-a@iatron.test')).toHaveCount(0);
});
test('Mentory: CRUD, revisão, publicação, ordem completa e material privado', async ({ page, browser }) => {
  await login(page, email('admin'), '/mentory/admin/conteudo');
  const post = (data: unknown) => page.request.post('/api/mentory/admin', { headers: { origin: base }, data });
  const mod = await (await post({ action: 'module.save', title: 'Demonstração · Teste editorial', description: 'Fixture de integração' })).json(); expect(mod.id).toBeTruthy();
  const l = await (await post({ action: 'lesson.save', moduleId: mod.id, title: 'Demonstração · Aula', description: '<script>alert(1)</script>', duration: 100, videoAssetId: '', captionsAssetId: '' })).json(); expect(l.id).toBeTruthy();
  expect((await post({ action: 'publication', kind: 'lesson', id: l.id, publish: true })).status()).toBe(423);
  const upload = await page.request.post('/api/mentory/upload', { headers: { origin: base }, multipart: { file: { name: 'fixture.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n% Synthetic test only\n%%EOF') } } }); expect(upload.status()).toBe(200);
  const key = (await upload.json()).storageKey;
  const mat = await (await post({ action: 'material.save', lessonId: l.id, title: 'Demonstração · PDF', type: 'PDF', body: '', storageKey: key })).json();
  expect((await post({ action: 'review', id: l.id, reference: 'FIXTURE-LOCAL-NAO-CLINICA' })).status()).toBe(200);
  expect((await post({ action: 'publication', kind: 'lesson', id: l.id, publish: true })).status()).toBe(200);
  expect((await post({ action: 'publication', kind: 'module', id: mod.id, publish: true })).status()).toBe(200);
  const modules = await db.mentoryModule.findMany({ orderBy: [{ position: 'asc' }, { id: 'asc' }] }); const ids = modules.map(m => m.id).reverse();
  expect((await post({ action: 'reorder', kind: 'module', ids: ids.slice(1) })).status()).toBe(409);
  expect((await post({ action: 'reorder', kind: 'module', ids })).status()).toBe(200);
  expect((await db.mentoryModule.findMany({ orderBy: [{ position: 'asc' }, { id: 'asc' }] })).map(m => m.id)).toEqual(ids);
  const a = await browser.newPage(); const b = await browser.newPage();
  await login(a, email('student-a'), '/mentory/aprender'); await login(b, email('student-b'), '/mentory/aprender');
  const signed = await (await a.request.get(`/api/mentory/materials/${mat.id}`)).json(); expect(signed.url).toContain('signature=');
  expect((await a.request.get(signed.url)).status()).toBe(200);
  expect((await b.request.get(signed.url)).status()).toBe(403);
  expect((await a.request.get(signed.url.replace(/expires=\d+/, 'expires=1'))).status()).toBe(403);
  await db.mentorySubscription.update({ where: { id: 'mentory-test-student-a' }, data: { expiresAt: new Date('2026-10-02T12:00:00Z') } });
  expect((await a.request.get(signed.url)).status()).toBe(403);
  await db.mentorySubscription.update({ where: { id: 'mentory-test-student-a' }, data: { expiresAt: new Date('2027-04-01T12:00:00Z') } });
  await a.close(); await b.close();
  expect((await post({ action: 'material.save', id: mat.id, lessonId: l.id, title: 'Demonstração · PDF editado', type: 'PDF', body: '' })).status()).toBe(200);
  const invalidated = await db.mentoryLesson.findUniqueOrThrow({ where: { id: l.id } }); expect(invalidated.status).toBe('DRAFT'); expect(invalidated.reviewedAt).toBeNull();
  await page.goto(`/mentory/aprender/${l.id}?preview=1`); await expect(page.getByRole('main').getByText('<script>alert(1)</script>', { exact: true })).toBeVisible();
  expect((await post({ action: 'delete', kind: 'module', id: mod.id })).status()).toBe(200);
  expect(await db.mentoryLesson.findUnique({ where: { id: l.id } })).toBeNull();
  expect(await db.mentoryAuditLog.count({ where: { actorId: 'mentory-test-admin' } })).toBeGreaterThan(5);
});
