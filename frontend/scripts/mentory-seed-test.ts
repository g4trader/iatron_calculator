import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/password';
const db = new PrismaClient();
const url = new URL(process.env.DATABASE_URL || '');
if (process.env.IATRON_ENV !== 'e2e' || !['127.0.0.1', 'localhost'].includes(url.hostname) || !url.pathname.includes('redesign')) throw new Error('Fixtures permitidas somente no banco E2E local isolado.');
async function main() {
  for (const role of ['student-a', 'student-b', 'expired', 'editor', 'admin']) {
    const id = `mentory-test-${role}`;
    await db.user.upsert({ where: { id }, create: { id, email: `${id}@iatron.test`, name: `Demonstração · ${role}`, emailVerified: new Date(), passwordCredential: { create: { passwordHash: await hashPassword('IatronE2E#2026') } } }, update: {} });
    const grant = role === 'admin' ? 'mentory_admin' : role === 'editor' ? 'mentory_editor' : 'mentory_student';
    await db.mentoryRoleGrant.upsert({ where: { userId_role: { userId: id, role: grant } }, create: { userId: id, role: grant }, update: {} });
    if (grant === 'mentory_student') {
      await db.mentorySubscription.upsert({ where: { id }, create: { id, userId: id, startedAt: new Date('2026-10-01T12:00:00Z'), expiresAt: new Date(role === 'expired' ? '2026-10-02T12:00:00Z' : '2027-04-01T12:00:00Z'), renewalTermsVersion: 'DEMONSTRACAO-SEM-VALIDADE-COMERCIAL', status: 'ACTIVE' }, update: { expiresAt: new Date(role === 'expired' ? '2026-10-02T12:00:00Z' : '2027-04-01T12:00:00Z'), status: 'ACTIVE' } });
      await db.mentoryEnrollment.upsert({ where: { subscriptionId: id }, create: { userId: id, subscriptionId: id, status: 'ACTIVE' }, update: {} });
    }
  }
  for (let i = 1; i <= 3; i++) {
    const id = `mentory-demo-module-${i}`;
    await db.mentoryModule.upsert({ where: { id }, create: { id, title: ['Demonstração · Sua jornada de aprendizagem', 'Demonstração · Organização dos estudos', 'Demonstração · Revisão e continuidade'][i - 1], description: 'Conteúdo sintético para revisão da interface. Sem recomendações clínicas.', position: i - 1, status: 'PUBLISHED' }, update: {} });
    for (let j = 1; j <= 2; j++) {
      const lesson = `${id}-lesson-${j}`;
      await db.mentoryLesson.upsert({ where: { id: lesson }, create: { id: lesson, moduleId: id, title: `Demonstração · ${j === 1 ? 'Conheça o ambiente de estudos' : 'Organize sua próxima etapa'}`, description: 'Esta aula é uma fixture local para validar navegação e progresso. Não contém orientação clínica. O vídeo aguarda provedor homologado.', position: j - 1, duration: 720, status: 'PUBLISHED', reviewReference: 'FIXTURE-LOCAL-NAO-CLINICA' }, update: {} });
      await db.mentoryMaterial.upsert({ where: { id: `${lesson}-text` }, create: { id: `${lesson}-text`, lessonId: lesson, title: 'Demonstração · Guia do ambiente', type: 'TEXT', body: 'Material sintético de teste. Explore a lista de módulos, abra uma aula e registre seu progresso. Nenhum conteúdo clínico.' }, update: {} });
    }
  }
  console.log('Fixtures Mentory criadas exclusivamente no PostgreSQL E2E local.');
}
main().finally(() => db.$disconnect());
