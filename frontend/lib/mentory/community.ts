import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { MentoryError } from './domain';
import type { Identity } from './server';
import { COMMUNITY_PRODUCT, COMMUNITY_SETTING, communityConfigSchema, communityDefaults, communitySettingsInput } from './community-validation';

export async function communitySettings() {
  const row = await prisma.appSetting.findUnique({ where: { key: COMMUNITY_SETTING } });
  return { config: row ? communityConfigSchema.parse(JSON.parse(row.value)) : { ...communityDefaults }, version: row?.updatedAt.toISOString() ?? null };
}
// A separate product entitlement boundary. The only enabled source today is
// an active Mentory enrollment; standalone sales must supply their own grant later.
export async function communityAccess(actor: Identity) {
  if (!actor.student) return null;
  const now = new Date();
  const enrollment = await prisma.mentoryEnrollment.findFirst({
    where: { userId: actor.id, status: 'ACTIVE', subscription: { status: 'ACTIVE', startedAt: { lte: now }, expiresAt: { gt: now } } },
    orderBy: { subscription: { expiresAt: 'desc' } },
    select: { subscription: { select: { expiresAt: true } } },
  });
  return enrollment ? { product: COMMUNITY_PRODUCT, source: 'MENTORY_BONUS' as const, expiresAt: enrollment.subscription.expiresAt } : null;
}
export async function saveCommunity(actor: Identity, body: unknown) {
  if (!actor.admin) throw new MentoryError(403, 'Somente administradores podem configurar a comunidade.');
  const parsed = communitySettingsInput.safeParse(body);
  if (!parsed.success) throw new MentoryError(400, parsed.error.issues[0]?.message || 'Configuração inválida.');
  const { config, version } = parsed.data;
  try {
    return await prisma.$transaction(async tx => {
      const data = { value: JSON.stringify(config), description: 'Comunidade WhatsApp Ped Expert Mentory', updatedByUserId: actor.id };
      if (version === null) {
        if (await tx.appSetting.findUnique({ where: { key: COMMUNITY_SETTING } })) throw new MentoryError(409, 'A configuração mudou. Atualize a página antes de salvar.');
        await tx.appSetting.create({ data: { key: COMMUNITY_SETTING, ...data } });
      } else {
        const result = await tx.appSetting.updateMany({ where: { key: COMMUNITY_SETTING, updatedAt: new Date(version) }, data });
        if (!result.count) throw new MentoryError(409, 'A configuração mudou. Atualize a página antes de salvar.');
      }
      await tx.mentoryAuditLog.create({ data: { actorId: actor.id, action: 'community.settings.updated', entityId: COMMUNITY_PRODUCT, metadata: { enabled: config.enabled } } });
      const row = await tx.appSetting.findUniqueOrThrow({ where: { key: COMMUNITY_SETTING } });
      return { config, version: row.updatedAt.toISOString() };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new MentoryError(409, 'A configuração mudou. Atualize a página antes de salvar.');
    throw error;
  }
}
export async function openCommunity(actor: Identity, body: unknown) {
  if (!body || typeof body !== 'object' || Object.keys(body).length !== 1 || (body as { accepted?: unknown }).accepted !== true) throw new MentoryError(400, 'Confirme as orientações para continuar.');
  const [grant, settings] = await Promise.all([communityAccess(actor), communitySettings()]);
  if (!grant) throw new MentoryError(403, 'O bônus da comunidade exige uma matrícula ativa na mentoria.');
  if (!settings.config.enabled || !settings.config.inviteUrl) throw new MentoryError(423, 'A entrada na comunidade está temporariamente indisponível.');
  await prisma.mentoryAuditLog.create({ data: { actorId: actor.id, action: 'community.invite.opened', entityId: COMMUNITY_PRODUCT, metadata: { source: grant.source, expiresAt: grant.expiresAt.toISOString() } } });
  return { url: settings.config.inviteUrl };
}
