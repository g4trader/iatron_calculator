// Explicit operational bootstrap. Never infers Mentory permission from PCR ADMIN.
import { PrismaClient, MentoryRole } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const [userId, role, reason, confirmation] = process.argv.slice(2);
  if (!userId || !Object.values(MentoryRole).includes(role as MentoryRole) || !reason || confirmation !== '--confirm-explicit-authorization') throw new Error('Uso: mentory-grant-role.ts USER_ID mentory_admin|mentory_editor|mentory_student REASON --confirm-explicit-authorization');
  await db.$transaction(async tx => {
    await tx.user.findUniqueOrThrow({ where: { id: userId } });
    await tx.mentoryRoleGrant.upsert({ where: { userId_role: { userId, role: role as MentoryRole } }, create: { userId, role: role as MentoryRole }, update: {} });
    await tx.mentoryAuditLog.create({ data: { action: 'role.bootstrap', entityId: userId, metadata: { role, reference: reason.slice(0, 200) } } });
  });
  console.log('Permissão Mentory registrada com auditoria.');
}
main().finally(() => db.$disconnect());
