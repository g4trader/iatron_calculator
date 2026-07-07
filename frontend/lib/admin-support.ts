import { Plan, SubscriptionStatus, SupportTicketStatus, type Prisma } from "@prisma/client";
import { recordAdminAuditEvent, type AdminUser } from "@/lib/admin-permissions";
import {
  getAdminCustomers,
  parseCustomerFilters,
  type CustomerRisk,
  type CustomerType
} from "@/lib/admin-customers";
import { prisma } from "@/lib/prisma";

export type SupportFilters = {
  risk?: CustomerRisk;
  plan?: Plan;
  accountType?: CustomerType;
  billingIssue?: boolean;
  lackOfUse?: boolean;
};

export type SupportNoteInput = {
  admin: AdminUser;
  customerId: string;
  customerType: CustomerType;
  supportNote?: string | null;
  riskReason?: string | null;
  actionTaken?: string | null;
  followUpDate?: string | null;
};

const billingIssueStatuses: SubscriptionStatus[] = [
  SubscriptionStatus.PAST_DUE,
  SubscriptionStatus.UNPAID,
  SubscriptionStatus.INCOMPLETE,
  SubscriptionStatus.CANCELED
];

export function parseSupportFilters(input?: Record<string, string | undefined>): SupportFilters {
  const customerFilters = parseCustomerFilters(input);
  const accountType = input?.accountType === "individual" || input?.accountType === "institutional" ? input.accountType : undefined;
  return {
    risk: customerFilters.risk,
    plan: customerFilters.plan,
    accountType,
    billingIssue: input?.billingIssue === "true" ? true : undefined,
    lackOfUse: input?.lackOfUse === "true" ? true : undefined
  };
}

export function hasBillingIssue(status: SubscriptionStatus) {
  return billingIssueStatuses.includes(status);
}

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function hasLackOfUse(lastActivityAt: Date | string | null, now = new Date()) {
  const activityDate = toDate(lastActivityAt);
  if (!activityDate) return true;
  return now.getTime() - activityDate.getTime() > 30 * 24 * 60 * 60 * 1000;
}

export function supportPriorityScore(input: {
  healthScore: number;
  risk: CustomerRisk;
  billingIssue: boolean;
  lackOfUse: boolean;
}) {
  const riskWeight = input.risk === "critical" ? 60 : input.risk === "at-risk" ? 40 : input.risk === "monitor" ? 20 : 0;
  const billingWeight = input.billingIssue ? 25 : 0;
  const usageWeight = input.lackOfUse ? 15 : 0;
  return Math.max(0, 100 - input.healthScore + riskWeight + billingWeight + usageWeight);
}

export async function getAdminSupportDashboard(filters: SupportFilters) {
  const customers = await getAdminCustomers({
    risk: filters.risk,
    plan: filters.plan
  });
  const now = new Date();
  const rows = customers
    .map((customer) => {
      const billingIssue = hasBillingIssue(customer.subscriptionStatus);
      const lackOfUse = hasLackOfUse(customer.lastActivityAt, now);
      return {
        ...customer,
        billingIssue,
        lackOfUse,
        priorityScore: supportPriorityScore({
          healthScore: customer.healthScore,
          risk: customer.risk,
          billingIssue,
          lackOfUse
        })
      };
    })
    .filter((customer) => !filters.accountType || customer.type === filters.accountType)
    .filter((customer) => filters.billingIssue ? customer.billingIssue : true)
    .filter((customer) => filters.lackOfUse ? customer.lackOfUse : true)
    .sort((a, b) => b.priorityScore - a.priorityScore || a.healthScore - b.healthScore)
    .slice(0, 80);

  const recentContacts = await prisma.supportTicket.findMany({
    where: { status: { in: [SupportTicketStatus.OPEN, SupportTicketStatus.PENDING, SupportTicketStatus.ESCALATED] } },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: true, organization: true, assignee: true }
  });
  const failedAccessEvents = await prisma.securityEvent.findMany({
    where: {
      OR: [
        { type: "SESSION_INVALID" },
        { type: "RATE_LIMITED" },
        { type: "LICENSE_ABUSE" }
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: true }
  });

  return {
    rows,
    recentContacts,
    failedAccessEvents,
    metrics: {
      atRisk: rows.filter((row) => row.risk === "at-risk" || row.risk === "critical").length,
      billingIssues: rows.filter((row) => row.billingIssue).length,
      lackOfUse: rows.filter((row) => row.lackOfUse).length,
      followUps: recentContacts.filter((event) => {
        const metadata = event.metadata as Prisma.JsonObject | null;
        return typeof metadata?.followUpDate === "string" || event.status === SupportTicketStatus.PENDING;
      }).length
    }
  };
}

export function validateSupportNoteInput(input: SupportNoteInput) {
  const supportNote = input.supportNote?.trim();
  const riskReason = input.riskReason?.trim();
  const actionTaken = input.actionTaken?.trim();
  const followUpDate = input.followUpDate?.trim();

  if (!supportNote || supportNote.length < 8) {
    throw new Error("Informe uma nota de suporte com pelo menos 8 caracteres.");
  }
  if (!riskReason || riskReason.length < 8) {
    throw new Error("Informe o motivo de risco com pelo menos 8 caracteres.");
  }
  if (!actionTaken || actionTaken.length < 8) {
    throw new Error("Informe a ação tomada com pelo menos 8 caracteres.");
  }

  const parsedFollowUp = followUpDate ? new Date(`${followUpDate}T12:00:00.000Z`) : null;
  if (followUpDate && Number.isNaN(parsedFollowUp?.getTime())) {
    throw new Error("Data de follow-up inválida.");
  }

  return { supportNote, riskReason, actionTaken, followUpDate: followUpDate || null };
}

export async function addSupportIntervention(input: SupportNoteInput) {
  const validated = validateSupportNoteInput(input);

  await recordAdminAuditEvent({
    actorUserId: input.admin.id,
    action: "admin.support.note_added",
    resourceType: input.customerType === "institutional" ? "organization" : "user",
    resourceId: input.customerId,
    targetUserId: input.customerType === "individual" ? input.customerId : null,
    organizationId: input.customerType === "institutional" ? input.customerId : null,
    outcome: "success",
    metadata: validated
  });
}
