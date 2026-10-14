import { chromium } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
if (process.env.IATRON_ENV !== 'e2e' || !process.env.DATABASE_URL?.includes('127.0.0.1')) throw new Error('Somente E2E local');
const out = process.env.MENTORY_REVIEW_DIR; const db = new PrismaClient(); const b = await chromium.launch({ channel: 'chrome' }); const evidence = {};
async function login(role) { const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const c = p.context(); const csrf = await (await c.request.get('http://127.0.0.1:3000/api/auth/csrf')).json(); await c.request.post('http://127.0.0.1:3000/api/auth/callback/credentials', { form: { csrfToken: csrf.csrfToken, email: `mentory-test-${role}@iatron.test`, password: 'IatronE2E#2026', callbackUrl: '/mentory/aprender', redirect: 'false' } }); return p; }
try {
 const admin = await login('admin');
 const gate = await admin.request.post('http://127.0.0.1:3000/api/mentory/admin', { headers: { origin: 'http://127.0.0.1:3000' }, data: { action: 'publication', kind: 'lesson', id: 'mentory-demo-module-1-lesson-1', publish: true } });
 assert.equal(gate.status(), 423); assert.match((await gate.json()).error, /autorização operacional/); evidence.publicationClosedByDefault = true;
 await admin.goto('http://127.0.0.1:3000/mentory/admin/conteudo'); await admin.waitForFunction(() => document.querySelectorAll('h1').length === 1);
 await admin.getByText('Novo módulo', { exact: true }).click(); await admin.screenshot({ path: path.join(out, 'screenshots/admin-form-390.png'), fullPage: true });
 await admin.keyboard.press('Tab'); evidence.keyboardFocus = await admin.evaluate(() => { const el = document.activeElement; return { tag: el.tagName, outline: getComputedStyle(el).outlineStyle }; }); assert.equal(evidence.keyboardFocus.outline, 'solid');
 let limited = false; for (let i = 0; i < 125; i++) { const r = await admin.request.get('http://127.0.0.1:3000/api/mentory/progress'); if (r.status() === 429) { limited = true; break; } } assert.ok(limited); evidence.rateLimitEnforced = true;
 const expired = await login('expired'); await expired.goto('http://127.0.0.1:3000/mentory/aprender/mentory-demo-module-1-lesson-1'); await expired.waitForFunction(() => document.querySelectorAll('h1').length === 1); await expired.screenshot({ path: path.join(out, 'screenshots/expired-access-390.png'), fullPage: true }); evidence.expiredState = await expired.getByRole('heading', { name: 'Aula indisponível' }).isVisible(); assert.ok(evidence.expiredState);
 const foreign = await db.mentorySubscription.create({ data: { userId: 'mentory-test-student-b', startedAt: new Date(), expiresAt: new Date(Date.now() + 86400000), renewalTermsVersion: 'FIXTURE-LOCAL', status: 'PENDING' } });
 try { await assert.rejects(db.mentoryEnrollment.create({ data: { userId: 'mentory-test-student-a', subscriptionId: foreign.id } }), e => e.code === 'P2003'); evidence.crossUserEnrollmentRejected = true; } finally { await db.mentorySubscription.delete({ where: { id: foreign.id } }); }
 const student = await login('student-b');
 const saved = await db.mentoryModule.findMany({ where: { id: { startsWith: 'mentory-demo-' } }, select: { id: true, status: true } });
 try {
  await db.mentoryModule.updateMany({ where: { id: { in: saved.map(r => r.id) } }, data: { status: 'DRAFT' } });
  await student.goto('http://127.0.0.1:3000/mentory/aprender'); await student.waitForFunction(() => document.querySelectorAll('h1').length === 1);
  assert.ok(await student.getByText('Uma nova jornada está sendo preparada.').isVisible());
  await student.screenshot({ path: path.join(out, 'screenshots/empty-dashboard-390.png'), fullPage: true }); evidence.emptyState = true;
 } finally { for (const row of saved) await db.mentoryModule.update({ where: { id: row.id }, data: { status: row.status } }); }
 await writeFile(path.join(out, 'gates-checks.json'), JSON.stringify(evidence, null, 2)); console.log(evidence);
} finally { await b.close(); await db.$disconnect(); }
