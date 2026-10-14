import 'server-only';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { exactOrder, MentoryError } from './domain';
import { Identity } from './server';
const text = z.string().trim().min(1).max(200);
const id = z.string().min(1).max(100);
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('module.save'), id: id.optional(), title: text, description: z.string().max(5000) }),
  z.object({ action: z.literal('lesson.save'), id: id.optional(), moduleId: id, title: text, description: z.string().max(10000), duration: z.number().int().min(0).max(86400), videoAssetId: z.string().regex(/^[a-zA-Z0-9_-]*$/).max(200), captionsAssetId: z.string().regex(/^[a-zA-Z0-9_-]*$/).max(200) }),
  z.object({ action: z.literal('material.save'), id: id.optional(), lessonId: id, title: text, type: z.enum(['TEXT', 'PDF', 'SLIDES']), body: z.string().max(30000), storageKey: id.optional() }),
  z.object({ action: z.literal('delete'), kind: z.enum(['module', 'lesson', 'material']), id }),
  z.object({ action: z.literal('reorder'), kind: z.enum(['module', 'lesson', 'material']), parentId: id.optional(), ids: z.array(id).max(500) }),
  z.object({ action: z.literal('publication'), kind: z.enum(['module', 'lesson']), id, publish: z.boolean() }),
  z.object({ action: z.literal('review'), id, reference: text }),
  z.object({ action: z.literal('role'), userId: id, role: z.enum(['mentory_admin', 'mentory_editor', 'mentory_student']), grant: z.boolean() })
]);
export async function mutate(actor: Identity, input: unknown) {
  if (!actor.editor) throw new MentoryError(403, 'Permissão Mentory necessária.');
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new MentoryError(400, 'Dados inválidos. Verifique os campos.');
  const v = parsed.data;
  if (['review', 'publication', 'role'].includes(v.action) && !actor.admin) throw new MentoryError(403, 'Ação restrita ao administrador Mentory.');
  return prisma.$transaction(async tx => {
    // Serialize editorial writes, including complete-list reorder and review invalidation.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(72419831)`;
    let entityId = 'id' in v && v.id ? v.id : 'mentory';
    const invalidate = async (lessonId: string) => tx.mentoryLesson.update({ where: { id: lessonId }, data: { status: 'DRAFT', reviewedAt: null, reviewedBy: null, reviewReference: null } });
    if (v.action === 'module.save') {
      const data = { title: v.title, description: v.description, status: 'DRAFT' as const };
      const row = v.id ? await tx.mentoryModule.update({ where: { id: v.id }, data }) : await tx.mentoryModule.create({ data: { ...data, position: await tx.mentoryModule.count() } }); entityId = row.id;
    } else if (v.action === 'lesson.save') {
      const data = { moduleId: v.moduleId, title: v.title, description: v.description, duration: v.duration, videoAssetId: v.videoAssetId || null, captionsAssetId: v.captionsAssetId || null, status: 'DRAFT' as const, reviewedAt: null, reviewedBy: null, reviewReference: null };
      const row = v.id ? await tx.mentoryLesson.update({ where: { id: v.id }, data }) : await tx.mentoryLesson.create({ data: { ...data, position: await tx.mentoryLesson.count({ where: { moduleId: v.moduleId } }) } }); entityId = row.id;
    } else if (v.action === 'material.save') {
      const old = v.id ? await tx.mentoryMaterial.findUniqueOrThrow({ where: { id: v.id } }) : null;
      if (old && old.lessonId !== v.lessonId) throw new MentoryError(400, 'Não é permitido transferir materiais entre aulas.');
      const storageKey = v.storageKey || old?.storageKey || null;
      if (v.type !== 'TEXT' && !storageKey) throw new MentoryError(400, 'Envie o PDF antes de salvar.');
      const data = { lessonId: v.lessonId, title: v.title, type: v.type, body: v.type === 'TEXT' ? v.body : '', storageKey: v.type === 'TEXT' ? null : storageKey };
      const row = v.id ? await tx.mentoryMaterial.update({ where: { id: v.id }, data }) : await tx.mentoryMaterial.create({ data: { ...data, position: await tx.mentoryMaterial.count({ where: { lessonId: v.lessonId } }) } });
      await invalidate(v.lessonId); entityId = row.id;
    } else if (v.action === 'delete') {
      if (v.kind === 'module') await tx.mentoryModule.delete({ where: { id: v.id } });
      if (v.kind === 'lesson') await tx.mentoryLesson.delete({ where: { id: v.id } });
      if (v.kind === 'material') { const m = await tx.mentoryMaterial.delete({ where: { id: v.id } }); await invalidate(m.lessonId); }
    } else if (v.action === 'reorder') {
      if (v.kind !== 'module' && !v.parentId) throw new MentoryError(400, 'Selecione o grupo.');
      const current = v.kind === 'module' ? await tx.mentoryModule.findMany({ select: { id: true } }) : v.kind === 'lesson' ? await tx.mentoryLesson.findMany({ where: { moduleId: v.parentId }, select: { id: true } }) : await tx.mentoryMaterial.findMany({ where: { lessonId: v.parentId }, select: { id: true } });
      if (!exactOrder(v.ids, current.map(r => r.id))) throw new MentoryError(409, 'A lista mudou. Atualize antes de reordenar.');
      for (let position = 0; position < v.ids.length; position++) {
        const rowId = v.ids[position];
        if (v.kind === 'module') await tx.mentoryModule.update({ where: { id: rowId }, data: { position } });
        else if (v.kind === 'lesson') await tx.mentoryLesson.update({ where: { id: rowId }, data: { position } });
        else await tx.mentoryMaterial.update({ where: { id: rowId }, data: { position } });
      }
    } else if (v.action === 'review') {
      await tx.mentoryLesson.update({ where: { id: v.id }, data: { reviewReference: v.reference, reviewedBy: actor.id, reviewedAt: new Date(), status: 'DRAFT' } });
    } else if (v.action === 'publication') {
      if (v.publish && !process.env.MENTORY_PUBLICATION_APPROVAL?.trim()) throw new MentoryError(423, 'Publicação bloqueada até homologação clínica e autorização operacional.');
      if (v.kind === 'lesson') {
        const lesson = await tx.mentoryLesson.findUniqueOrThrow({ where: { id: v.id } });
        if (v.publish && (!lesson.reviewReference || !lesson.reviewedAt)) throw new MentoryError(423, 'Registre a revisão médica desta versão antes de publicar.');
        await tx.mentoryLesson.update({ where: { id: v.id }, data: { status: v.publish ? 'PUBLISHED' : 'DRAFT' } });
      } else {
        const lessons = await tx.mentoryLesson.findMany({ where: { moduleId: v.id } });
        if (v.publish && (!lessons.length || lessons.some(l => l.status !== 'PUBLISHED'))) throw new MentoryError(423, 'Publique as aulas revisadas antes do módulo.');
        await tx.mentoryModule.update({ where: { id: v.id }, data: { status: v.publish ? 'PUBLISHED' : 'DRAFT' } });
      }
    } else if (v.action === 'role') {
      if (v.userId === actor.id && !v.grant && v.role === 'mentory_admin') throw new MentoryError(409, 'Não remova sua própria permissão administrativa.');
      if (v.grant) await tx.mentoryRoleGrant.upsert({ where: { userId_role: { userId: v.userId, role: v.role } }, create: { userId: v.userId, role: v.role }, update: {} });
      else await tx.mentoryRoleGrant.deleteMany({ where: { userId: v.userId, role: v.role } }); entityId = v.userId;
    }
    await tx.mentoryAuditLog.create({ data: { actorId: actor.id, action: v.action, entityId, metadata: { kind: 'kind' in v ? v.kind : v.action, ...(v.action === 'role' ? { role: v.role, grant: v.grant } : {}), ...(v.action === 'publication' ? { publish: v.publish } : {}) } } });
    return { id: entityId };
  });
}
