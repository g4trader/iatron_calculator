import { AdminAccessStatus, AdminPermissionGrantStatus, AdminUserRoleStatus, Role } from "@prisma/client";
import {
  ADMIN_PERMISSIONS,
  ADMIN_ROLE_DEFINITIONS,
  getRoleAdminPermissions,
  isAdminPermission,
  normalizeAdminPermissions,
  recordAdminAuditEvent,
  type AdminPermission,
  type AdminRoleCode,
  type AdminUser
} from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

export const CRITICAL_ADMIN_PERMISSIONS: AdminPermission[] = [
  "admin.users.manage",
  "admin.billing.manage",
  "admin.licenses.manage",
  "admin.contingency.manage",
  "admin.audit.view"
];

export type AdminAccessAction =
  | "grant_role"
  | "remove_role"
  | "grant_permission"
  | "revoke_permission"
  | "deactivate_admin";

export class AdminAccessError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

export function requireAdminAccessReason(reason?: string | null) {
  const normalized = reason?.trim();
  if (!normalized || normalized.length < 8) {
    throw new AdminAccessError("Informe um motivo com pelo menos 8 caracteres.", "REASON_REQUIRED");
  }
  return normalized;
}

export function requireCriticalConfirmation(permission: string | null | undefined, confirmation?: string | null) {
  if (!permission || !isAdminPermission(permission) || !CRITICAL_ADMIN_PERMISSIONS.includes(permission)) return;
  if ((confirmation ?? "").trim().toUpperCase() !== "CONFIRMAR") {
    throw new AdminAccessError("Permissão crítica exige confirmação: digite CONFIRMAR.", "CONFIRMATION_REQUIRED");
  }
}

export function effectivePermissionsForUser(input: { role: Role; grants: Array<{ permission: string; status: AdminPermissionGrantStatus; revokedAt?: Date | null }> }) {
  return normalizeAdminPermissions([
    ...getRoleAdminPermissions(input.role),
    ...input.grants
      .filter((grant) => grant.status === AdminPermissionGrantStatus.ACTIVE && !grant.revokedAt)
      .map((grant) => grant.permission)
  ]);
}

export async function ensureSystemAdminRoles() {
  for (const [code, definition] of Object.entries(ADMIN_ROLE_DEFINITIONS) as Array<[AdminRoleCode, typeof ADMIN_ROLE_DEFINITIONS[AdminRoleCode]]>) {
    const role = await prisma.adminRole.upsert({
      where: { code },
      create: { code, name: definition.name, description: definition.description, isSystem: true },
      update: { name: definition.name, description: definition.description, isSystem: true }
    });

    await prisma.adminRolePermission.deleteMany({
      where: {
        roleId: role.id,
        permission: { notIn: definition.permissions }
      }
    });

    for (const permission of definition.permissions) {
      await prisma.adminRolePermission.upsert({
        where: { roleId_permission: { roleId: role.id, permission } },
        create: { roleId: role.id, permission },
        update: {}
      });
    }
  }
}

export function isAdminRoleCode(value?: string | null): value is AdminRoleCode {
  return Boolean(value && value in ADMIN_ROLE_DEFINITIONS);
}

function assertCanManageRole(admin: AdminUser, roleCode: AdminRoleCode) {
  const isSuperadmin = admin.adminRoles.some((role) => role.code === "superadmin");
  if (roleCode === "superadmin" && !isSuperadmin) {
    throw new AdminAccessError("Somente superadmin pode conceder ou remover role superadmin.", "SUPERADMIN_REQUIRED");
  }
}

export async function countUsersManageOperators(excludingUserId?: string) {
  const [bootstrapAdmins, directGrantAdmins, roleAdmins] = await Promise.all([
    prisma.user.count({
      where: {
        role: Role.ADMIN,
        ...(excludingUserId ? { id: { not: excludingUserId } } : {})
      }
    }),
    prisma.adminPermissionGrant.count({
      where: {
        permission: "admin.users.manage",
        status: AdminPermissionGrantStatus.ACTIVE,
        revokedAt: null,
        ...(excludingUserId ? { userId: { not: excludingUserId } } : {})
      }
    })
    ,
    prisma.adminUserRole.count({
      where: {
        status: AdminUserRoleStatus.ACTIVE,
        revokedAt: null,
        role: { permissions: { some: { permission: "admin.users.manage" } } },
        ...(excludingUserId ? { userId: { not: excludingUserId } } : {})
      }
    })
  ]);

  return bootstrapAdmins + directGrantAdmins + roleAdmins;
}

async function assertCanReduceAdminAccess(input: { actorId: string; targetUserId: string; removingUsersManage: boolean }) {
  if (input.actorId === input.targetUserId && input.removingUsersManage) {
    throw new AdminAccessError("Auto-remoção perigosa bloqueada para admin.users.manage.", "SELF_REMOVAL_BLOCKED");
  }

  if (input.removingUsersManage) {
    const remainingOperators = await countUsersManageOperators(input.targetUserId);
    if (remainingOperators < 1) {
      throw new AdminAccessError("Operação bloqueada: o sistema ficaria sem administrador com admin.users.manage.", "LAST_ADMIN_BLOCKED");
    }
  }
}

export async function listAdminAccessUsers() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { role: Role.ADMIN },
        { adminUserRoles: { some: { status: AdminUserRoleStatus.ACTIVE, revokedAt: null } } },
        { adminPermissionGrants: { some: { status: AdminPermissionGrantStatus.ACTIVE, revokedAt: null } } }
      ]
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      adminPermissionGrants: { orderBy: { updatedAt: "desc" } },
      adminUserRoles: { orderBy: { updatedAt: "desc" }, include: { role: { include: { permissions: true } } } },
      userSessions: { orderBy: { lastSeenAt: "desc" }, take: 1 }
    }
  });

  return users.map((user) => {
    const rolePermissions = normalizeAdminPermissions([
      ...getRoleAdminPermissions(user.role),
      ...user.adminUserRoles
        .filter((entry) => entry.status === AdminUserRoleStatus.ACTIVE && !entry.revokedAt)
        .flatMap((entry) => entry.role.permissions.map((permission) => permission.permission))
    ]);
    const directPermissions = normalizeAdminPermissions(user.adminPermissionGrants
      .filter((grant) => grant.status === AdminPermissionGrantStatus.ACTIVE && !grant.revokedAt)
      .map((grant) => grant.permission));
    return {
      ...user,
      rolePermissions,
      directPermissions,
      effectivePermissions: normalizeAdminPermissions([...rolePermissions, ...directPermissions]),
      adminRoleCodes: [
        ...(user.role === Role.ADMIN ? ["superadmin/bootstrap"] : []),
        ...user.adminUserRoles
          .filter((entry) => entry.status === AdminUserRoleStatus.ACTIVE && !entry.revokedAt)
          .map((entry) => entry.role.code)
      ],
      accessStatus: user.adminStatus,
      lastActivityAt: user.userSessions[0]?.lastSeenAt ?? user.updatedAt
    };
  });
}

export async function grantAdminRole(input: { admin: AdminUser; targetUserId: string; roleCode?: string | null; reason?: string | null }) {
  const reason = requireAdminAccessReason(input.reason);
  const roleCode = input.roleCode ?? "superadmin";
  if (!isAdminRoleCode(roleCode)) throw new AdminAccessError("Role administrativa inválida.", "INVALID_ROLE");
  assertCanManageRole(input.admin, roleCode);
  await ensureSystemAdminRoles();
  const role = await prisma.adminRole.findUnique({ where: { code: roleCode } });
  if (!role) throw new AdminAccessError("Role administrativa não encontrada.", "ROLE_NOT_FOUND");

  const userRole = await prisma.adminUserRole.upsert({
    where: { userId_roleId: { userId: input.targetUserId, roleId: role.id } },
    create: { userId: input.targetUserId, roleId: role.id, status: AdminUserRoleStatus.ACTIVE, reason, grantedByUserId: input.admin.id },
    update: { status: AdminUserRoleStatus.ACTIVE, reason, grantedByUserId: input.admin.id, revokedByUserId: null, revokedAt: null }
  });
  await prisma.user.update({ where: { id: input.targetUserId }, data: { adminStatus: AdminAccessStatus.ACTIVE } });
  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.access.role_granted",
    resourceType: "admin_user_role",
    resourceId: userRole.id,
    targetUserId: input.targetUserId,
    outcome: "success",
    metadata: { reason, role: role.code }
  });
  return userRole;
}

export async function removeAdminRole(input: { admin: AdminUser; targetUserId: string; roleCode?: string | null; reason?: string | null; confirmation?: string | null }) {
  const reason = requireAdminAccessReason(input.reason);
  const roleCode = input.roleCode ?? "superadmin";
  if (!isAdminRoleCode(roleCode)) throw new AdminAccessError("Role administrativa inválida.", "INVALID_ROLE");
  assertCanManageRole(input.admin, roleCode);
  requireCriticalConfirmation("admin.users.manage", input.confirmation);
  await assertCanReduceAdminAccess({ actorId: input.admin.id, targetUserId: input.targetUserId, removingUsersManage: true });
  await ensureSystemAdminRoles();
  const role = await prisma.adminRole.findUnique({ where: { code: roleCode } });
  if (!role) throw new AdminAccessError("Role administrativa não encontrada.", "ROLE_NOT_FOUND");

  const userRole = await prisma.adminUserRole.update({
    where: { userId_roleId: { userId: input.targetUserId, roleId: role.id } },
    data: { status: AdminUserRoleStatus.REVOKED, reason, revokedByUserId: input.admin.id, revokedAt: new Date() }
  });
  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.access.role_removed",
    resourceType: "admin_user_role",
    resourceId: userRole.id,
    targetUserId: input.targetUserId,
    outcome: "success",
    metadata: { reason, role: role.code }
  });
  return userRole;
}

export async function grantAdminPermission(input: { admin: AdminUser; targetUserId: string; permission?: string | null; reason?: string | null; confirmation?: string | null }) {
  const reason = requireAdminAccessReason(input.reason);
  if (!input.permission || !isAdminPermission(input.permission)) {
    throw new AdminAccessError("Permissão administrativa inválida.", "INVALID_PERMISSION");
  }
  requireCriticalConfirmation(input.permission, input.confirmation);

  const grant = await prisma.adminPermissionGrant.upsert({
    where: { userId_permission: { userId: input.targetUserId, permission: input.permission } },
    create: {
      userId: input.targetUserId,
      permission: input.permission,
      status: AdminPermissionGrantStatus.ACTIVE,
      reason,
      grantedByUserId: input.admin.id
    },
    update: {
      status: AdminPermissionGrantStatus.ACTIVE,
      reason,
      grantedByUserId: input.admin.id,
      revokedByUserId: null,
      revokedAt: null
    }
  });

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.access.permission_granted",
    resourceType: "admin_permission_grant",
    resourceId: grant.id,
    targetUserId: input.targetUserId,
    outcome: "success",
    metadata: { reason, permission: input.permission }
  });

  return grant;
}

export async function revokeAdminPermission(input: { admin: AdminUser; targetUserId: string; permission?: string | null; reason?: string | null; confirmation?: string | null }) {
  const reason = requireAdminAccessReason(input.reason);
  if (!input.permission || !isAdminPermission(input.permission)) {
    throw new AdminAccessError("Permissão administrativa inválida.", "INVALID_PERMISSION");
  }
  requireCriticalConfirmation(input.permission, input.confirmation);
  await assertCanReduceAdminAccess({
    actorId: input.admin.id,
    targetUserId: input.targetUserId,
    removingUsersManage: input.permission === "admin.users.manage"
  });

  const grant = await prisma.adminPermissionGrant.update({
    where: { userId_permission: { userId: input.targetUserId, permission: input.permission } },
    data: {
      status: AdminPermissionGrantStatus.REVOKED,
      reason,
      revokedByUserId: input.admin.id,
      revokedAt: new Date()
    }
  });

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.access.permission_revoked",
    resourceType: "admin_permission_grant",
    resourceId: grant.id,
    targetUserId: input.targetUserId,
    outcome: "success",
    metadata: { reason, permission: input.permission }
  });

  return grant;
}

export async function deactivateAdminAccess(input: { admin: AdminUser; targetUserId: string; reason?: string | null; confirmation?: string | null }) {
  const reason = requireAdminAccessReason(input.reason);
  requireCriticalConfirmation("admin.users.manage", input.confirmation);
  await assertCanReduceAdminAccess({ actorId: input.admin.id, targetUserId: input.targetUserId, removingUsersManage: true });

  await prisma.$transaction([
    prisma.user.update({ where: { id: input.targetUserId }, data: { role: Role.USER, adminStatus: AdminAccessStatus.SUSPENDED } }),
    prisma.adminPermissionGrant.updateMany({
      where: { userId: input.targetUserId, status: AdminPermissionGrantStatus.ACTIVE },
      data: { status: AdminPermissionGrantStatus.REVOKED, reason, revokedByUserId: input.admin.id, revokedAt: new Date() }
    }),
    prisma.adminUserRole.updateMany({
      where: { userId: input.targetUserId, status: AdminUserRoleStatus.ACTIVE },
      data: { status: AdminUserRoleStatus.REVOKED, reason, revokedByUserId: input.admin.id, revokedAt: new Date() }
    })
  ]);

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.access.deactivated",
    resourceType: "user",
    resourceId: input.targetUserId,
    targetUserId: input.targetUserId,
    outcome: "success",
    metadata: { reason }
  });
}

export { ADMIN_PERMISSIONS };
