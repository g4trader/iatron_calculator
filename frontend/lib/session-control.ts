import { randomBytes } from "crypto";
import { SecurityEventType, UserSessionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auditSecurityEvent, hashSecurityValue } from "@/lib/security-audit";

const IDLE_TIMEOUT_MINUTES = Number(process.env.SESSION_IDLE_TIMEOUT_MINUTES ?? 60 * 8);
const ABSOLUTE_TIMEOUT_MINUTES = Number(process.env.SESSION_ABSOLUTE_TIMEOUT_MINUTES ?? 60 * 24 * 14);
const TOUCH_INTERVAL_SECONDS = Number(process.env.SESSION_TOUCH_INTERVAL_SECONDS ?? 60);

export type SessionContext = {
  ip?: string | null;
  userAgent?: string | null;
  deviceFingerprint?: string | null;
};

export class SessionControlError extends Error {
  code: "SESSION_MISSING" | "SESSION_REVOKED" | "SESSION_EXPIRED" | "SESSION_NOT_CURRENT";

  constructor(code: SessionControlError["code"]) {
    super("Sessão inválida.");
    this.code = code;
  }
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function createSessionKey() {
  return randomBytes(32).toString("base64url");
}

function hashSessionKey(sessionKey: string) {
  return hashSecurityValue(sessionKey) ?? sessionKey;
}

export function shouldTouchSession(lastSeenAt: Date, now = new Date()) {
  return now.getTime() - lastSeenAt.getTime() > TOUCH_INTERVAL_SECONDS * 1000;
}

export function getSessionInvalidReason(input: {
  status: UserSessionStatus | string;
  revokedAt?: Date | null;
  expiresAt: Date;
  idleExpiresAt: Date;
  newestActiveSessionId?: string | null;
  sessionId: string;
  now?: Date;
}): SessionControlError["code"] | null {
  const now = input.now ?? new Date();
  if (input.status !== UserSessionStatus.ACTIVE || input.revokedAt) return "SESSION_REVOKED";
  if (input.expiresAt <= now || input.idleExpiresAt <= now) return "SESSION_EXPIRED";
  if (input.newestActiveSessionId && input.newestActiveSessionId !== input.sessionId) return "SESSION_NOT_CURRENT";
  return null;
}

export async function createExclusiveUserSession(userId: string, context: SessionContext = {}) {
  const now = new Date();
  const sessionKey = createSessionKey();
  const sessionKeyHash = hashSessionKey(sessionKey);

  const { session, previousSessions, activePreviousSessions } = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

    const previousSessions = await tx.userSession.findMany({
      where: {
        userId,
        createdAt: { gt: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      },
      select: { id: true, ipHash: true, userAgentHash: true, status: true, revokedAt: true }
    });
    const activePreviousSessions = previousSessions.filter((previousSession) => previousSession.status === UserSessionStatus.ACTIVE && !previousSession.revokedAt);

    const session = await tx.userSession.create({
      data: {
        userId,
        sessionKeyHash,
        expiresAt: addMinutes(now, ABSOLUTE_TIMEOUT_MINUTES),
        idleExpiresAt: addMinutes(now, IDLE_TIMEOUT_MINUTES),
        ipHash: hashSecurityValue(context.ip),
        userAgentHash: hashSecurityValue(context.userAgent),
        deviceFingerprintHash: hashSecurityValue(context.deviceFingerprint)
      }
    });

    if (activePreviousSessions.length > 0) {
      await tx.userSession.updateMany({
        where: { id: { in: activePreviousSessions.map((item) => item.id) } },
        data: {
          status: UserSessionStatus.REVOKED,
          revokedAt: now,
          revokeReason: "replaced_by_new_login",
          replacedBySessionId: session.id
        }
      });
    }

    return { session, previousSessions, activePreviousSessions };
  });

  const currentIpHash = hashSecurityValue(context.ip);
  const currentUserAgentHash = hashSecurityValue(context.userAgent);
  const recentIpHashes = new Set(previousSessions.map((item) => item.ipHash).filter(Boolean));
  if (currentIpHash) recentIpHashes.add(currentIpHash);

  if (previousSessions.some((item) => item.userAgentHash && currentUserAgentHash && item.userAgentHash !== currentUserAgentHash)) {
    await auditSecurityEvent({
      userId,
      type: SecurityEventType.DEVICE_CHANGED,
      severity: "warning",
      metadata: { windowHours: 24 },
      ip: context.ip,
      userAgent: context.userAgent
    });
  }

  if (recentIpHashes.size >= 3) {
    await auditSecurityEvent({
      userId,
      type: SecurityEventType.MULTIPLE_IPS,
      severity: "warning",
      metadata: { distinctIpCount: recentIpHashes.size, windowHours: 24 },
      ip: context.ip,
      userAgent: context.userAgent
    });
  }

  if (activePreviousSessions.length > 0) {
    await auditSecurityEvent({
      userId,
      type: SecurityEventType.SESSION_REPLACED,
      severity: "warning",
      metadata: { replacedCount: activePreviousSessions.length },
      ip: context.ip,
      userAgent: context.userAgent
    });
  }

  await auditSecurityEvent({
    userId,
    type: SecurityEventType.SESSION_CREATED,
    metadata: { sessionId: session.id },
    ip: context.ip,
    userAgent: context.userAgent
  });

  return { sessionId: session.id, sessionKey };
}

export async function validateCurrentUserSession(userId: string, sessionId?: string | null, sessionKey?: string | null, context: SessionContext = {}) {
  if (!sessionId) throw new SessionControlError("SESSION_MISSING");
  const now = new Date();
  const session = await prisma.userSession.findUnique({ where: { id: sessionId } });

  if (!session || session.userId !== userId) {
    await auditSecurityEvent({ userId, type: SecurityEventType.SESSION_INVALID, severity: "warning", metadata: { reason: "not_found" }, ip: context.ip, userAgent: context.userAgent });
    throw new SessionControlError("SESSION_MISSING");
  }

  if (sessionKey && session.sessionKeyHash !== hashSessionKey(sessionKey)) {
    await auditSecurityEvent({ userId, type: SecurityEventType.SESSION_INVALID, severity: "critical", metadata: { sessionId, reason: "key_mismatch" }, ip: context.ip, userAgent: context.userAgent });
    throw new SessionControlError("SESSION_NOT_CURRENT");
  }

  const invalidReason = getSessionInvalidReason({
    status: session.status,
    revokedAt: session.revokedAt,
    expiresAt: session.expiresAt,
    idleExpiresAt: session.idleExpiresAt,
    sessionId: session.id,
    now
  });
  if (invalidReason === "SESSION_REVOKED") throw new SessionControlError("SESSION_REVOKED");
  if (invalidReason === "SESSION_EXPIRED") {
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        status: UserSessionStatus.EXPIRED,
        revokedAt: now,
        revokeReason: session.expiresAt <= now ? "absolute_timeout" : "idle_timeout"
      }
    });
    await auditSecurityEvent({ userId, type: SecurityEventType.SESSION_EXPIRED, severity: "warning", metadata: { sessionId }, ip: context.ip, userAgent: context.userAgent });
    throw new SessionControlError("SESSION_EXPIRED");
  }

  const newestActive = await prisma.userSession.findFirst({
    where: {
      userId,
      status: UserSessionStatus.ACTIVE,
      revokedAt: null,
      expiresAt: { gt: now },
      idleExpiresAt: { gt: now }
    },
    orderBy: { createdAt: "desc" },
    select: { id: true }
  });

  const currentReason = getSessionInvalidReason({
    status: session.status,
    revokedAt: session.revokedAt,
    expiresAt: session.expiresAt,
    idleExpiresAt: session.idleExpiresAt,
    newestActiveSessionId: newestActive?.id,
    sessionId: session.id,
    now
  });
  if (currentReason === "SESSION_NOT_CURRENT") throw new SessionControlError("SESSION_NOT_CURRENT");

  if (shouldTouchSession(session.lastSeenAt, now)) {
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        lastSeenAt: now,
        idleExpiresAt: addMinutes(now, IDLE_TIMEOUT_MINUTES)
      }
    });
  }

  return session;
}

export async function revokeUserSession(sessionId: string, reason = "logout") {
  const session = await prisma.userSession.update({
    where: { id: sessionId },
    data: {
      status: UserSessionStatus.REVOKED,
      revokedAt: new Date(),
      revokeReason: reason
    }
  }).catch(() => null);

  if (session) {
    await auditSecurityEvent({
      userId: session.userId,
      type: SecurityEventType.SESSION_REVOKED,
      metadata: { sessionId, reason }
    });
  }
}

export async function revokeAllUserSessions(userId: string, reason = "password_changed") {
  await prisma.userSession.updateMany({
    where: {
      userId,
      status: UserSessionStatus.ACTIVE,
      revokedAt: null
    },
    data: {
      status: UserSessionStatus.REVOKED,
      revokedAt: new Date(),
      revokeReason: reason
    }
  });
  await auditSecurityEvent({ userId, type: SecurityEventType.SESSION_REVOKED, severity: "warning", metadata: { reason, scope: "all" } });
}
