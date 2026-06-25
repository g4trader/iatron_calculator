import { OrganizationRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/authz";
import { auditOrganizationEvent } from "@/lib/organization-audit";
import { prisma } from "@/lib/prisma";

export class OrganizationAccessError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 403, code = "FORBIDDEN") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const ORGANIZATION_ADMIN_ROLES = [OrganizationRole.OWNER, OrganizationRole.ADMIN] as const;

export function canManageOrganization(role?: OrganizationRole | null) {
  return role === OrganizationRole.OWNER || role === OrganizationRole.ADMIN;
}

export function canInviteOrganizationRole(actorRole: OrganizationRole, invitedRole: OrganizationRole) {
  if (!canManageOrganization(actorRole)) return false;
  return invitedRole === OrganizationRole.ADMIN || invitedRole === OrganizationRole.MEMBER;
}

export function hasAvailableSeat(seatsPurchased: number, seatsUsed: number) {
  return Math.max(seatsPurchased - seatsUsed, 0) > 0;
}

export async function getAuthenticatedUserId() {
  const user = await getCurrentUser();
  if (!user?.id) throw new OrganizationAccessError("Autenticação obrigatória.", 401, "UNAUTHENTICATED");
  return user.id;
}

export async function requireOrganizationMembership(userId: string, organizationId: string) {
  const membership = await prisma.organizationMembership.findFirst({
    where: {
      userId,
      organizationId,
      removedAt: null
    },
    include: {
      organization: true
    }
  });

  if (!membership) {
    auditOrganizationEvent("authorization_denied", { userId, organizationId, reason: "not_member" });
    throw new OrganizationAccessError("Organização não encontrada ou sem permissão.", 404, "ORGANIZATION_NOT_FOUND");
  }

  return membership;
}

export async function requireOrganizationRole(userId: string, organizationId: string, allowedRoles: readonly OrganizationRole[]) {
  const membership = await requireOrganizationMembership(userId, organizationId);
  if (!allowedRoles.includes(membership.role)) {
    auditOrganizationEvent("authorization_denied", { userId, organizationId, role: membership.role, reason: "role_denied" });
    throw new OrganizationAccessError("Você não tem permissão para executar esta ação.", 403, "ROLE_DENIED");
  }
  return membership;
}
