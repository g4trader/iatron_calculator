import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AdminAccessStatus, AdminPermissionGrantStatus, AdminUserRoleStatus, Role, type Prisma, type User } from "@prisma/client";
import { getCurrentUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export const ADMIN_PERMISSIONS = [
  "admin.dashboard.view",
  "admin.customers.view",
  "admin.customers.write",
  "admin.sales.view",
  "admin.operations.view",
  "admin.licenses.manage",
  "admin.contingency.manage",
  "admin.billing.manage",
  "admin.billing.reconcile",
  "admin.support.view",
  "admin.support.write",
  "admin.audit.view",
  "admin.audit.export",
  "admin.users.manage"
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];
export type AdminAuditOutcome = "success" | "failure" | "denied";
export type AdminRoleCode = "superadmin" | "ops" | "billing" | "support" | "auditor";
type ResolvedAdminRole = {
  code: string;
  name: string;
  source: "role" | "bootstrap";
  permissions: AdminPermission[];
};

export const ADMIN_ROLE_DEFINITIONS: Record<AdminRoleCode, { name: string; description: string; permissions: AdminPermission[] }> = {
  superadmin: {
    name: "Superadmin",
    description: "Governança total do backoffice. Uso restrito a fundadores/operadores principais.",
    permissions: [...ADMIN_PERMISSIONS]
  },
  ops: {
    name: "Operações",
    description: "Visibilidade operacional e ações de contingência controladas.",
    permissions: ["admin.dashboard.view", "admin.operations.view", "admin.contingency.manage", "admin.customers.view", "admin.audit.view"]
  },
  billing: {
    name: "Billing",
    description: "Operação financeira, reconcile e leitura comercial.",
    permissions: ["admin.dashboard.view", "admin.sales.view", "admin.billing.manage", "admin.billing.reconcile", "admin.customers.view", "admin.audit.view"]
  },
  support: {
    name: "Suporte",
    description: "Atendimento, customer success e notas operacionais.",
    permissions: ["admin.dashboard.view", "admin.customers.view", "admin.customers.write", "admin.support.view", "admin.support.write"]
  },
  auditor: {
    name: "Auditor",
    description: "Leitura de trilhas administrativas e dados operacionais sem mutação.",
    permissions: ["admin.dashboard.view", "admin.audit.view", "admin.audit.export", "admin.sales.view", "admin.operations.view"]
  }
};

export type AdminUser = User & {
  adminPermissions: AdminPermission[];
  adminRoles: Array<{ code: string; name: string; source: "role" | "bootstrap" }>;
  directAdminPermissions: AdminPermission[];
  roleAdminPermissions: AdminPermission[];
};

const ADMIN_PERMISSION_SET = new Set<string>(ADMIN_PERMISSIONS);

export function isAdminPermission(value: string): value is AdminPermission {
  return ADMIN_PERMISSION_SET.has(value);
}

export function getRoleAdminPermissions(role?: Role | null): AdminPermission[] {
  // Transitional bootstrap only: persistent admin roles are the authority for new admin access.
  if (role === Role.ADMIN) return [...ADMIN_PERMISSIONS];
  return [];
}

export async function getAdminRoles(userId: string, role?: Role | null) {
  const assignedRoles = await prisma.adminUserRole.findMany({
    where: { userId, status: AdminUserRoleStatus.ACTIVE, revokedAt: null },
    include: { role: { include: { permissions: true } } }
  });

  const roles: ResolvedAdminRole[] = assignedRoles.map((entry) => ({
    code: entry.role.code,
    name: entry.role.name,
    source: "role" as const,
    permissions: normalizeAdminPermissions(entry.role.permissions.map((permission) => permission.permission))
  }));

  if (role === Role.ADMIN && !roles.some((entry) => entry.code === "superadmin")) {
    roles.push({
      code: "superadmin",
      name: "Superadmin bootstrap",
      source: "bootstrap" as const,
      permissions: getRoleAdminPermissions(role)
    });
  }

  return roles;
}

export function normalizeAdminPermissions(permissions: string[]) {
  return Array.from(new Set(permissions.filter(isAdminPermission)));
}

export function hasAdminPermission(user: (Pick<User, "role"> & { adminPermissions?: AdminPermission[] }) | null | undefined, permission: AdminPermission) {
  if (!user) return false;
  if (user.adminPermissions) return user.adminPermissions.includes(permission);
  return getRoleAdminPermissions(user.role).includes(permission);
}

export async function getAdminCurrentUser(): Promise<AdminUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.adminStatus !== AdminAccessStatus.ACTIVE) return null;

  const [directGrants, roles] = await Promise.all([
    prisma.adminPermissionGrant.findMany({
    where: { userId: user.id, status: AdminPermissionGrantStatus.ACTIVE },
    select: { permission: true }
    }),
    getAdminRoles(user.id, user.role)
  ]);
  const rolePermissions = normalizeAdminPermissions(roles.flatMap((role) => role.permissions));
  const directPermissions = normalizeAdminPermissions(directGrants.map((grant) => grant.permission));
  const adminPermissions = normalizeAdminPermissions([
    ...rolePermissions,
    ...directPermissions
  ]);
  if (adminPermissions.length === 0) return null;

  return {
    ...user,
    adminPermissions,
    adminRoles: roles.map((role) => ({ code: role.code, name: role.name, source: role.source })),
    directAdminPermissions: directPermissions,
    roleAdminPermissions: rolePermissions
  };
}

export async function requireAdminPermission(permission: AdminPermission): Promise<AdminUser> {
  const user = await getAdminCurrentUser();
  if (!user) redirect("/login");

  if (!hasAdminPermission(user, permission)) {
    await recordAdminAuditEvent({
      actorUserId: user.id,
      action: "admin.permission.denied",
      resourceType: "admin_permission",
      resourceId: permission,
      outcome: "denied",
      metadata: { permission }
    });
    redirect("/dashboard");
  }

  return user;
}

export async function getRequestAuditContext() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip") || null;
  const userAgent = requestHeaders.get("user-agent");
  return { ipAddress, userAgent };
}

export async function recordAdminAuditEvent(input: {
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  organizationId?: string | null;
  targetUserId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  outcome?: AdminAuditOutcome;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const context = input.ipAddress || input.userAgent ? { ipAddress: input.ipAddress ?? null, userAgent: input.userAgent ?? null } : await getRequestAuditContext().catch(() => ({ ipAddress: null, userAgent: null }));

  return prisma.adminAuditEvent.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      organizationId: input.organizationId ?? null,
      targetUserId: input.targetUserId ?? null,
      metadata: input.metadata ?? undefined,
      outcome: input.outcome ?? "success",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    }
  });
}
