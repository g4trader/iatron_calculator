import { LicenseStatus, Plan, SubscriptionStatus, type Prisma } from "@prisma/client";
import { recordAdminAuditEvent, type AdminUser } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

export type CustomerRisk = "healthy" | "monitor" | "at-risk" | "critical";
export type CustomerType = "individual" | "institutional";
export type CustomerActivityFilter = "active_7d" | "active_30d" | "inactive_30d";

export type CustomerFilters = {
  q?: string;
  status?: SubscriptionStatus;
  plan?: Plan;
  risk?: CustomerRisk;
  organization?: string;
  activity?: CustomerActivityFilter;
};

export const healthScoreWeights = {
  activity: 25,
  recency: 20,
  featureUsage: 20,
  billing: 25,
  support: 10
} as const;

export function getHealthRisk(score: number): CustomerRisk {
  if (score >= 80) return "healthy";
  if (score >= 60) return "monitor";
  if (score >= 40) return "at-risk";
  return "critical";
}

export function calculateHealthScore(input: {
  now?: Date;
  lastActivityAt?: Date | null;
  createdAt: Date;
  featureUseCount: number;
  billingProblemCount: number;
  supportSignalCount: number;
}) {
  const now = input.now ?? new Date();
  const lastActivityAt = input.lastActivityAt ?? input.createdAt;
  const daysSinceActivity = Math.floor((now.getTime() - lastActivityAt.getTime()) / (24 * 60 * 60 * 1000));
  const daysSinceCreation = Math.floor((now.getTime() - input.createdAt.getTime()) / (24 * 60 * 60 * 1000));

  const activity = daysSinceActivity <= 7 ? healthScoreWeights.activity : daysSinceActivity <= 30 ? Math.round(healthScoreWeights.activity * 0.6) : 0;
  const recency = daysSinceActivity <= 14 || daysSinceCreation <= 14 ? healthScoreWeights.recency : daysSinceActivity <= 45 ? Math.round(healthScoreWeights.recency * 0.5) : 0;
  const featureUsage = input.featureUseCount >= 5 ? healthScoreWeights.featureUsage : input.featureUseCount > 0 ? Math.round(healthScoreWeights.featureUsage * 0.6) : 0;
  const billing = input.billingProblemCount === 0 ? healthScoreWeights.billing : input.billingProblemCount === 1 ? Math.round(healthScoreWeights.billing * 0.4) : 0;
  const support = input.supportSignalCount === 0 ? healthScoreWeights.support : input.supportSignalCount <= 2 ? Math.round(healthScoreWeights.support * 0.5) : 0;

  return Math.max(0, Math.min(100, activity + recency + featureUsage + billing + support));
}

export function parseCustomerFilters(input?: Record<string, string | undefined>): CustomerFilters {
  const status = input?.status && Object.values(SubscriptionStatus).includes(input.status as SubscriptionStatus) ? (input.status as SubscriptionStatus) : undefined;
  const plan = input?.plan && Object.values(Plan).includes(input.plan as Plan) ? (input.plan as Plan) : undefined;
  const risk = input?.risk && ["healthy", "monitor", "at-risk", "critical"].includes(input.risk) ? (input.risk as CustomerRisk) : undefined;
  const activity = input?.activity && ["active_7d", "active_30d", "inactive_30d"].includes(input.activity) ? (input.activity as CustomerActivityFilter) : undefined;

  return {
    q: input?.q?.trim() || undefined,
    status,
    plan,
    risk,
    organization: input?.organization?.trim() || undefined,
    activity
  };
}

export function matchesActivityFilter(lastActivityAt: Date | null, activity?: CustomerActivityFilter, now = new Date()) {
  if (!activity) return true;
  if (!lastActivityAt) return activity === "inactive_30d";
  const days = Math.floor((now.getTime() - lastActivityAt.getTime()) / (24 * 60 * 60 * 1000));
  if (activity === "active_7d") return days <= 7;
  if (activity === "active_30d") return days <= 30;
  return days > 30;
}

type UserCustomer = Prisma.UserGetPayload<{
  include: {
    subscriptions: { include: { planPrice: true } };
    licenses: true;
    organizationMemberships: { include: { organization: true } };
    calculationHistory: true;
    userSessions: true;
    securityEvents: true;
  };
}>;

type OrganizationCustomer = Prisma.OrganizationGetPayload<{
  include: {
    subscriptions: { include: { planPrice: true } };
    licenses: true;
    memberships: { include: { user: true } };
  };
}>;

function latestDate(dates: Array<Date | null | undefined>) {
  const valid = dates.filter((date): date is Date => Boolean(date));
  if (valid.length === 0) return null;
  return new Date(Math.max(...valid.map((date) => date.getTime())));
}

function primarySubscription<T extends { status: SubscriptionStatus; updatedAt: Date }>(subscriptions: T[]) {
  return [...subscriptions].sort((a, b) => {
    const score = (value: SubscriptionStatus) => value === SubscriptionStatus.ACTIVE ? 4 : value === SubscriptionStatus.TRIALING ? 3 : value === SubscriptionStatus.PAST_DUE ? 2 : 1;
    return score(b.status) - score(a.status) || b.updatedAt.getTime() - a.updatedAt.getTime();
  })[0] ?? null;
}

function licenseSummary(licenses: Array<{ status: LicenseStatus; updatedAt: Date }>) {
  return [...licenses].sort((a, b) => {
    const score = (value: LicenseStatus) => value === LicenseStatus.ACTIVE ? 4 : value === LicenseStatus.PENDING ? 3 : value === LicenseStatus.INACTIVE ? 2 : 1;
    return score(b.status) - score(a.status) || b.updatedAt.getTime() - a.updatedAt.getTime();
  })[0] ?? null;
}

const billingProblemStatuses: SubscriptionStatus[] = [
  SubscriptionStatus.PAST_DUE,
  SubscriptionStatus.UNPAID,
  SubscriptionStatus.INCOMPLETE,
  SubscriptionStatus.CANCELED
];

function billingProblemCount(subscriptions: Array<{ status: SubscriptionStatus }>) {
  return subscriptions.filter((subscription) => billingProblemStatuses.includes(subscription.status)).length;
}

export function buildIndividualCustomerRow(user: UserCustomer, now = new Date()) {
  const subscription = primarySubscription(user.subscriptions);
  const license = licenseSummary(user.licenses);
  const lastActivityAt = latestDate([
    user.calculationHistory[0]?.createdAt,
    user.userSessions[0]?.lastSeenAt,
    user.securityEvents[0]?.createdAt,
    user.updatedAt
  ]);
  const score = calculateHealthScore({
    now,
    createdAt: user.createdAt,
    lastActivityAt,
    featureUseCount: user.calculationHistory.length,
    billingProblemCount: billingProblemCount(user.subscriptions),
    supportSignalCount: user.securityEvents.filter((event) => event.severity !== "info").length
  });

  return {
    id: user.id,
    type: "individual" as const,
    name: user.clinicalName ?? user.name ?? "Sem nome",
    email: user.email ?? "-",
    plan: subscription?.plan ?? Plan.FREE,
    subscriptionStatus: subscription?.status ?? SubscriptionStatus.INACTIVE,
    licenseStatus: license?.status ?? LicenseStatus.PENDING,
    lastActivityAt,
    healthScore: score,
    risk: getHealthRisk(score),
    organizationName: user.organizationMemberships[0]?.organization.name ?? null
  };
}

export function buildInstitutionalCustomerRow(organization: OrganizationCustomer, now = new Date()) {
  const subscription = primarySubscription(organization.subscriptions);
  const license = licenseSummary(organization.licenses);
  const lastActivityAt = latestDate([
    organization.licenses[0]?.updatedAt,
    organization.subscriptions[0]?.updatedAt,
    organization.memberships[0]?.updatedAt,
    organization.updatedAt
  ]);
  const activeLicenseCount = organization.licenses.filter((item) => item.status === LicenseStatus.ACTIVE).length;
  const score = calculateHealthScore({
    now,
    createdAt: organization.createdAt,
    lastActivityAt,
    featureUseCount: activeLicenseCount,
    billingProblemCount: billingProblemCount(organization.subscriptions),
    supportSignalCount: 0
  });

  return {
    id: organization.id,
    type: "institutional" as const,
    name: organization.name,
    email: `${organization.memberships.length} membros`,
    plan: subscription?.plan ?? organization.plan,
    subscriptionStatus: subscription?.status ?? SubscriptionStatus.INACTIVE,
    licenseStatus: license?.status ?? LicenseStatus.PENDING,
    lastActivityAt,
    healthScore: score,
    risk: getHealthRisk(score),
    organizationName: organization.name
  };
}

export async function getAdminCustomers(filters: CustomerFilters) {
  const userWhere: Prisma.UserWhereInput = {
    ...(filters.q ? { OR: [
      { email: { contains: filters.q, mode: "insensitive" } },
      { name: { contains: filters.q, mode: "insensitive" } },
      { clinicalName: { contains: filters.q, mode: "insensitive" } }
    ] } : {}),
    ...(filters.plan || filters.status ? { subscriptions: { some: { ...(filters.plan ? { plan: filters.plan } : {}), ...(filters.status ? { status: filters.status } : {}) } } } : {}),
    ...(filters.organization ? { organizationMemberships: { some: { organization: { name: { contains: filters.organization, mode: "insensitive" } } } } } : {})
  };
  const organizationWhere: Prisma.OrganizationWhereInput = {
    ...(filters.q ? { OR: [
      { name: { contains: filters.q, mode: "insensitive" } },
      { slug: { contains: filters.q, mode: "insensitive" } }
    ] } : {}),
    ...(filters.plan ? { plan: filters.plan } : {}),
    ...(filters.status ? { subscriptions: { some: { status: filters.status } } } : {}),
    ...(filters.organization ? { name: { contains: filters.organization, mode: "insensitive" } } : {})
  };

  const [users, organizations] = await Promise.all([
    prisma.user.findMany({
      where: userWhere,
      orderBy: { updatedAt: "desc" },
      take: 80,
      include: {
        subscriptions: { orderBy: { updatedAt: "desc" }, take: 3, include: { planPrice: true } },
        licenses: { orderBy: { updatedAt: "desc" }, take: 3 },
        organizationMemberships: { where: { removedAt: null }, take: 1, include: { organization: true } },
        calculationHistory: { orderBy: { createdAt: "desc" }, take: 10 },
        userSessions: { orderBy: { lastSeenAt: "desc" }, take: 3 },
        securityEvents: { orderBy: { createdAt: "desc" }, take: 10 }
      }
    }),
    prisma.organization.findMany({
      where: organizationWhere,
      orderBy: { updatedAt: "desc" },
      take: 40,
      include: {
        subscriptions: { orderBy: { updatedAt: "desc" }, take: 3, include: { planPrice: true } },
        licenses: { orderBy: { updatedAt: "desc" }, take: 10 },
        memberships: { where: { removedAt: null }, orderBy: { updatedAt: "desc" }, take: 10, include: { user: true } }
      }
    })
  ]);

  const now = new Date();
  return [...users.map((user) => buildIndividualCustomerRow(user, now)), ...organizations.map((organization) => buildInstitutionalCustomerRow(organization, now))]
    .filter((row) => !filters.risk || row.risk === filters.risk)
    .filter((row) => matchesActivityFilter(row.lastActivityAt, filters.activity, now))
    .sort((a, b) => b.healthScore - a.healthScore || (b.lastActivityAt?.getTime() ?? 0) - (a.lastActivityAt?.getTime() ?? 0));
}

export async function getAdminCustomerDetail(id: string) {
  const [user, organization] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        subscriptions: { orderBy: { updatedAt: "desc" }, include: { planPrice: true, licenses: true } },
        licenses: { orderBy: { updatedAt: "desc" }, include: { user: true, organization: true, subscription: true } },
        organizationMemberships: { where: { removedAt: null }, include: { organization: { include: { memberships: { where: { removedAt: null }, include: { user: true } } } } } },
        calculationHistory: { orderBy: { createdAt: "desc" }, take: 20 },
        userSessions: { orderBy: { lastSeenAt: "desc" }, take: 10 },
        securityEvents: { orderBy: { createdAt: "desc" }, take: 20 },
        targetedAdminAuditEvents: { where: { action: "admin.customer.note_added" }, orderBy: { createdAt: "desc" }, take: 20, include: { actor: true } }
      }
    }),
    prisma.organization.findUnique({
      where: { id },
      include: {
        memberships: { where: { removedAt: null }, orderBy: { createdAt: "asc" }, include: { user: true } },
        subscriptions: { orderBy: { updatedAt: "desc" }, include: { planPrice: true, licenses: true } },
        licenses: { orderBy: { updatedAt: "desc" }, include: { user: true, organization: true, subscription: true } }
      }
    })
  ]);

  if (user) {
    const row = buildIndividualCustomerRow({
      ...user,
      calculationHistory: user.calculationHistory,
      userSessions: user.userSessions,
      securityEvents: user.securityEvents
    }, new Date());
    return {
      kind: "user" as const,
      row,
      user,
      notes: user.targetedAdminAuditEvents
    };
  }

  if (organization) {
    const row = buildInstitutionalCustomerRow(organization, new Date());
    const notes = await prisma.adminAuditEvent.findMany({
      where: { action: "admin.customer.note_added", resourceType: "organization", resourceId: organization.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actor: true }
    });
    return {
      kind: "organization" as const,
      row,
      organization,
      notes
    };
  }

  return null;
}

export async function addCustomerInternalNote(input: {
  admin: AdminUser;
  customerId: string;
  customerType: CustomerType;
  note?: string | null;
}) {
  const note = input.note?.trim();
  if (!note || note.length < 8) {
    throw new Error("Informe uma nota interna com pelo menos 8 caracteres.");
  }

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.customer.note_added",
    resourceType: input.customerType === "institutional" ? "organization" : "user",
    resourceId: input.customerId,
    targetUserId: input.customerType === "individual" ? input.customerId : null,
    organizationId: input.customerType === "institutional" ? input.customerId : null,
    outcome: "success",
    metadata: { note }
  });
}
