import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const FUNNEL_STEPS = [
  "landing_view",
  "pricing_view",
  "checkout_started",
  "checkout_completed",
  "checkout_failed",
  "account_created",
  "license_activated",
  "first_login",
  "first_use"
] as const;

export type FunnelStep = (typeof FUNNEL_STEPS)[number];

export function buildFunnelDedupeKey(input: { step: FunnelStep; userId?: string | null; sessionId?: string | null; scope?: string | null }) {
  const subject = input.userId ? `user:${input.userId}` : input.sessionId ? `session:${input.sessionId}` : null;
  if (!subject) return null;
  return `${input.step}:${subject}${input.scope ? `:${input.scope}` : ""}`;
}

export async function trackFunnelEvent(input: {
  step: FunnelStep;
  userId?: string | null;
  sessionId?: string | null;
  source?: string | null;
  campaign?: string | null;
  scope?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  const dedupeKey = buildFunnelDedupeKey(input);
  const data = {
    userId: input.userId?.trim() || null,
    sessionId: input.sessionId?.trim() || null,
    step: input.step,
    source: input.source?.trim() || "app",
    campaign: input.campaign?.trim() || null,
    dedupeKey,
    metadata: input.metadata
  };

  if (!dedupeKey) {
    return prisma.funnelEvent.create({ data });
  }

  return prisma.funnelEvent.upsert({
    where: { dedupeKey },
    create: data,
    update: {}
  });
}
