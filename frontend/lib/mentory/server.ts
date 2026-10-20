import 'server-only';
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { getCurrentUser } from '@/lib/authz';
import { prisma } from '@/lib/prisma';
import { activeAccess, MentoryError } from './domain';

export async function identity() {
  const user = await getCurrentUser();
  if (!user) throw new MentoryError(401, 'Entre para acessar a MENTOR.iatron.');
  const grants = await prisma.mentoryRoleGrant.findMany({ where: { userId: user.id } });
  const roles = grants.map(g => g.role);
  return { id: user.id, name: user.name, email: user.email, roles, admin: roles.includes('mentory_admin'), editor: roles.includes('mentory_admin') || roles.includes('mentory_editor'), student: roles.includes('mentory_student') };
}
export type Identity = Awaited<ReturnType<typeof identity>>;
export async function pageIdentity(admin = false) {
  let actor: Identity;
  try { actor = await identity(); } catch (error) { if (error instanceof MentoryError && error.status === 401) redirect('/mentory/login'); throw error; }
  if (admin && !actor.editor) redirect('/mentory/aprender?access=denied');
  return actor;
}
export async function subscriptionFor(userId: string) {
  return prisma.mentorySubscription.findFirst({ where: { userId }, orderBy: { expiresAt: 'desc' } });
}
export async function premium(actor: Identity) {
  if (!actor.student) throw new MentoryError(403, 'Sua conta ainda não possui matrícula MENTOR.iatron.');
  const enrollment = await prisma.mentoryEnrollment.findFirst({ where: { userId: actor.id, status: 'ACTIVE', subscription: { status: 'ACTIVE', startedAt: { lte: new Date() }, expiresAt: { gt: new Date() } } }, include: { subscription: true } });
  if (!enrollment || !activeAccess(enrollment.subscription)) throw new MentoryError(403, 'Acesso indisponível ou expirado. Consulte sua assinatura para renovar.');
}
export async function lessonFor(actor: Identity, id: string, preview = false) {
  if (preview) { if (!actor.editor) throw new MentoryError(403, 'Preview restrita à equipe MENTOR.iatron.'); }
  else await premium(actor);
  const lesson = await prisma.mentoryLesson.findFirst({ where: { id, ...(preview ? {} : { status: 'PUBLISHED', module: { status: 'PUBLISHED' } }) }, include: { module: true, materials: { orderBy: [{ position: 'asc' }, { id: 'asc' }] } } });
  if (!lesson) throw new MentoryError(404, 'Aula indisponível.');
  return lesson;
}
export async function studentData(actor: Identity) {
  const [modules, progress, hasAccess] = await Promise.all([
    prisma.mentoryModule.findMany({ where: { status: 'PUBLISHED' }, orderBy: [{ position: 'asc' }, { id: 'asc' }], select: { id: true, title: true, description: true, lessons: { where: { status: 'PUBLISHED' }, orderBy: [{ position: 'asc' }, { id: 'asc' }], select: { id: true, title: true, duration: true } } } }),
    prisma.mentoryLessonProgress.findMany({ where: { userId: actor.id }, select: { lessonId: true, completedAt: true, lastPositionSeconds: true, updatedAt: true }, orderBy: { updatedAt: 'desc' } }),
    premium(actor).then(() => true).catch(e => { if (!(e instanceof MentoryError)) throw e; return false; })
  ]);
  return { modules, progress, hasAccess };
}
export async function adminData(actor: Identity, filter: { query: string; status: string; page: number } = { query: '', status: '', page: 1 }, section = '') {
  const userFilter: Prisma.UserWhereInput = filter.query ? { OR: [{ name: { contains: filter.query, mode: 'insensitive' } }, { email: { contains: filter.query, mode: 'insensitive' } }] } : {};
  const statusFilter: Prisma.MentorySubscriptionWhereInput = filter.status === 'EXPIRED' ? { OR: [{ status: 'EXPIRED' }, { status: 'ACTIVE', expiresAt: { lte: new Date() } }] } : filter.status === 'ACTIVE' ? { status: 'ACTIVE', expiresAt: { gt: new Date() }, startedAt: { lte: new Date() } } : ['PENDING', 'CANCELED'].includes(filter.status) ? { status: filter.status as 'PENDING' | 'CANCELED' } : {};
  const studentWhere: Prisma.MentoryRoleGrantWhereInput = { role: 'mentory_student', user: { ...userFilter, ...(filter.status ? { mentoryEnrollments: { some: { subscription: statusFilter } } } : {}) } };
  const subscriptionWhere: Prisma.MentorySubscriptionWhereInput = { ...statusFilter, user: userFilter };
  const skip = (filter.page - 1) * 50;
  if (!actor.editor) throw new MentoryError(403, 'Permissão MENTOR.iatron necessária.');
  const [modules, students, subscriptions, audit, studentCount, subscriptionCount, moduleCount, publishedLessonCount] = await Promise.all([
    section === 'conteudo' ? prisma.mentoryModule.findMany({ orderBy: [{ position: 'asc' }, { id: 'asc' }], include: { lessons: { orderBy: [{ position: 'asc' }, { id: 'asc' }], include: { materials: { orderBy: [{ position: 'asc' }, { id: 'asc' }] } } } } }) : Promise.resolve([]),
    actor.admin && section === 'alunos' ? prisma.mentoryRoleGrant.findMany({ where: studentWhere, orderBy: { userId: 'asc' }, skip, select: { user: { select: { id: true, name: true, email: true, mentoryEnrollments: { select: { status: true, subscription: { select: { startedAt: true, expiresAt: true, status: true } } } } } } }, take: 50 }) : Promise.resolve([]),
    actor.admin && section === 'assinaturas' ? prisma.mentorySubscription.findMany({ where: subscriptionWhere, skip, orderBy: { expiresAt: 'desc' }, take: 50, include: { user: { select: { name: true, email: true } } } }) : Promise.resolve([]),
    actor.admin && !section ? prisma.mentoryAuditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 100, select: { id: true, action: true, entityId: true, timestamp: true } }) : Promise.resolve([]),
    actor.admin && (!section || section === 'alunos') ? prisma.mentoryRoleGrant.count({ where: studentWhere }) : Promise.resolve(0),
    actor.admin && section === 'assinaturas' ? prisma.mentorySubscription.count({ where: subscriptionWhere }) : Promise.resolve(0),
    !section ? prisma.mentoryModule.count() : Promise.resolve(0),
    !section ? prisma.mentoryLesson.count({ where: { status: 'PUBLISHED' } }) : Promise.resolve(0)
  ]);
  return { modules, students, subscriptions, audit, filter, studentCount, subscriptionCount, moduleCount, publishedLessonCount };
}
