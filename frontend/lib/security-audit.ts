import { createHash } from "crypto";
import type { SecurityEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type SecurityMetadata = Record<string, string | number | boolean | null | undefined>;

export function hashSecurityValue(value?: string | null) {
  if (!value) return null;
  return createHash("sha256").update(value).digest("hex");
}

function sanitize(metadata: SecurityMetadata = {}) {
  return Object.fromEntries(Object.entries(metadata).filter(([key, value]) => value !== undefined && !/password|token|secret|key/i.test(key)));
}

export async function auditSecurityEvent(input: {
  userId?: string | null;
  type: SecurityEventType;
  severity?: "info" | "warning" | "critical";
  metadata?: SecurityMetadata;
  ip?: string | null;
  userAgent?: string | null;
}) {
  const payload = {
    scope: "security",
    event: input.type,
    severity: input.severity ?? "info",
    timestamp: new Date().toISOString(),
    userId: input.userId ?? undefined,
    ...sanitize(input.metadata)
  };

  if (input.severity === "critical" || input.severity === "warning") {
    console.warn(JSON.stringify(payload));
  } else {
    console.info(JSON.stringify(payload));
  }

  if (!process.env.DATABASE_URL) return;

  await prisma.securityEvent.create({
    data: {
      userId: input.userId ?? null,
      type: input.type,
      severity: input.severity ?? "info",
      metadata: sanitize(input.metadata),
      ipHash: hashSecurityValue(input.ip),
      userAgentHash: hashSecurityValue(input.userAgent)
    }
  }).catch(() => undefined);
}
