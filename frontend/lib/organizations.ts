import {
  BillingCycle,
  InviteStatus,
  LicenseOrigin,
  LicenseStatus,
  OrganizationRole,
  Plan,
  SubscriptionOwnerType,
  SubscriptionStatus
} from "@prisma/client";
import { addMinutes, createRawToken, hashToken } from "@/lib/token";
import { prisma } from "@/lib/prisma";
import { auditOrganizationEvent } from "@/lib/organization-audit";
import { isCommercialSubscriptionAllowed } from "@/lib/commercial-access";
import { ORGANIZATION_ADMIN_ROLES, OrganizationAccessError, canInviteOrganizationRole, hasAvailableSeat, requireOrganizationMembership, requireOrganizationRole } from "@/lib/organization-authz";
import { getOrganizationSeatSummary } from "@/lib/entitlements";

const INVITE_TTL_MINUTES = 60 * 24 * 7;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

async function uniqueSlug(name: string) {
  const base = slugify(name) || "organization";
  let slug = base;
  let suffix = 2;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function createOrganizationForUser(input: { userId: string; name: string; seatsPurchased?: number }) {
  const seatsPurchased = Math.max(input.seatsPurchased ?? 3, 3);
  const slug = await uniqueSlug(input.name);

  const organization = await prisma.$transaction(async (tx) => {
    const created = await tx.organization.create({
      data: {
        name: input.name.trim(),
        slug,
        minimumSeats: 3,
        plan: Plan.HOSPITAL
      }
    });

    await tx.organizationMembership.create({
      data: {
        organizationId: created.id,
        userId: input.userId,
        role: OrganizationRole.OWNER
      }
    });

    await tx.subscription.create({
      data: {
        ownerType: SubscriptionOwnerType.ORGANIZATION,
        organizationId: created.id,
        plan: Plan.HOSPITAL,
        planCatalogId: "plan_hospital",
        billingCycle: BillingCycle.CUSTOM,
        seatsPurchased,
        status: SubscriptionStatus.INACTIVE
      }
    });

    return created;
  });

  auditOrganizationEvent("organization_created", { organizationId: organization.id, userId: input.userId, seatsPurchased });
  return organization;
}

export async function getPrimaryOrganizationForUser(userId: string) {
  return prisma.organizationMembership.findFirst({
    where: { userId, removedAt: null },
    orderBy: { updatedAt: "desc" },
    include: { organization: true }
  });
}

export async function getOrganizationOverview(userId: string, organizationId: string) {
  const membership = await requireOrganizationMembership(userId, organizationId);
  const [memberships, invites, seats] = await Promise.all([
    prisma.organizationMembership.findMany({
      where: { organizationId, removedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    }),
    prisma.organizationInvite.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 20
    }),
    getOrganizationSeatSummary(organizationId)
  ]);

  return {
    organization: membership.organization,
    currentRole: membership.role,
    memberships,
    invites,
    seats
  };
}

export async function listOrganizationMemberships(userId: string, organizationId: string) {
  await requireOrganizationMembership(userId, organizationId);
  return prisma.organizationMembership.findMany({
    where: { organizationId, removedAt: null },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  });
}

export async function listOrganizationInvites(userId: string, organizationId: string) {
  await requireOrganizationRole(userId, organizationId, ORGANIZATION_ADMIN_ROLES);
  return prisma.organizationInvite.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    take: 50
  });
}

export async function createOrganizationInvite(input: {
  actorUserId: string;
  organizationId: string;
  email: string;
  role: OrganizationRole;
}) {
  const actorMembership = await requireOrganizationRole(input.actorUserId, input.organizationId, ORGANIZATION_ADMIN_ROLES);
  if (!canInviteOrganizationRole(actorMembership.role, input.role)) {
    throw new OrganizationAccessError("Convites não podem criar OWNER.", 400, "ROLE_NOT_ALLOWED");
  }

  const email = normalizeEmail(input.email);
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMembership = await prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: input.organizationId,
          userId: existingUser.id
        }
      }
    });
    if (existingMembership && !existingMembership.removedAt) {
      throw new OrganizationAccessError("Usuário já é membro desta organização.", 409, "ALREADY_MEMBER");
    }
  }

  const existingInvite = await prisma.organizationInvite.findFirst({
    where: {
      organizationId: input.organizationId,
      email,
      status: InviteStatus.PENDING,
      expiresAt: { gt: new Date() }
    }
  });
  if (existingInvite) {
    throw new OrganizationAccessError("Já existe convite pendente para este email.", 409, "INVITE_ALREADY_EXISTS");
  }

  const rawToken = createRawToken();
  const invite = await prisma.organizationInvite.create({
    data: {
      organizationId: input.organizationId,
      email,
      role: input.role,
      status: InviteStatus.PENDING,
      tokenHash: hashToken(rawToken),
      expiresAt: addMinutes(new Date(), INVITE_TTL_MINUTES),
      invitedByUserId: input.actorUserId
    }
  });

  auditOrganizationEvent("organization_invite_created", { organizationId: input.organizationId, invitedByUserId: input.actorUserId, role: input.role });
  return { invite, token: rawToken };
}

export async function acceptOrganizationInvite(input: { userId: string; token: string }) {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user?.email) throw new OrganizationAccessError("Usuário sem email válido.", 400, "USER_EMAIL_REQUIRED");

  const invite = await prisma.organizationInvite.findUnique({
    where: { tokenHash: hashToken(input.token) }
  });

  if (!invite) throw new OrganizationAccessError("Convite inválido.", 404, "INVITE_NOT_FOUND");
  if (invite.status === InviteStatus.ACCEPTED) throw new OrganizationAccessError("Convite já aceito.", 409, "INVITE_ALREADY_ACCEPTED");
  if (invite.status !== InviteStatus.PENDING) throw new OrganizationAccessError("Convite não está pendente.", 400, "INVITE_NOT_PENDING");
  if (invite.expiresAt < new Date()) throw new OrganizationAccessError("Convite expirado.", 400, "INVITE_EXPIRED");
  if (normalizeEmail(user.email) !== normalizeEmail(invite.email)) {
    auditOrganizationEvent("authorization_denied", { userId: input.userId, organizationId: invite.organizationId, reason: "invite_email_mismatch" });
    throw new OrganizationAccessError("Este convite pertence a outro email.", 403, "INVITE_EMAIL_MISMATCH");
  }

  await prisma.$transaction([
    prisma.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: invite.organizationId,
          userId: input.userId
        }
      },
      create: {
        organizationId: invite.organizationId,
        userId: input.userId,
        role: invite.role
      },
      update: {
        role: invite.role,
        removedAt: null
      }
    }),
    prisma.organizationInvite.update({
      where: { id: invite.id },
      data: {
        status: InviteStatus.ACCEPTED,
        acceptedAt: new Date()
      }
    })
  ]);

  auditOrganizationEvent("organization_invite_accepted", { organizationId: invite.organizationId, userId: input.userId });
  return { organizationId: invite.organizationId };
}

export async function assignOrganizationLicense(input: { actorUserId: string; organizationId: string; targetUserId: string }) {
  await requireOrganizationRole(input.actorUserId, input.organizationId, ORGANIZATION_ADMIN_ROLES);

  const targetMembership = await prisma.organizationMembership.findUnique({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: input.targetUserId
      }
    }
  });
  if (!targetMembership || targetMembership.removedAt) {
    throw new OrganizationAccessError("Usuário não é membro ativo desta organização.", 404, "MEMBER_NOT_FOUND");
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      organizationId: input.organizationId,
      ownerType: SubscriptionOwnerType.ORGANIZATION
    },
    orderBy: { updatedAt: "desc" }
  });
  if (!subscription) throw new OrganizationAccessError("Organização sem assinatura institucional.", 400, "SUBSCRIPTION_NOT_FOUND");
  if (!isCommercialSubscriptionAllowed(subscription.status)) {
    throw new OrganizationAccessError("Assinatura institucional sem acesso ativo.", 402, "SUBSCRIPTION_INACTIVE");
  }

  const existingLicense = await prisma.license.findFirst({
    where: {
      organizationId: input.organizationId,
      subscriptionId: subscription.id,
      userId: input.targetUserId,
      status: LicenseStatus.ACTIVE
    }
  });
  if (existingLicense) return existingLicense;

  const seats = await getOrganizationSeatSummary(input.organizationId);
  if (!hasAvailableSeat(seats.seatsPurchased, seats.seatsUsed)) {
    throw new OrganizationAccessError("Não há seats disponíveis.", 409, "NO_SEATS_AVAILABLE");
  }

  const license = await prisma.license.create({
    data: {
      organizationId: input.organizationId,
      subscriptionId: subscription.id,
      userId: input.targetUserId,
      status: LicenseStatus.ACTIVE,
      origin: LicenseOrigin.INSTITUTIONAL_GRANT,
      assignedAt: new Date()
    }
  });

  auditOrganizationEvent("organization_license_assigned", { organizationId: input.organizationId, userId: input.targetUserId, licenseId: license.id });
  return license;
}
