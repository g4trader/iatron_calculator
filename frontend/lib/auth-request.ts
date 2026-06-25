import { NextResponse } from "next/server";
import { auditAuthEvent } from "@/lib/audit";
import { AUTH_RATE_LIMIT_RULES, checkRateLimit } from "@/lib/rate-limit";
import { auditSecurityEvent } from "@/lib/security-audit";

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwardedFor ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export function rateLimitedResponse(retryAfter: number) {
  return NextResponse.json(
    { error: "Muitas tentativas. Aguarde antes de tentar novamente." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter)
      }
    }
  );
}

export async function enforceAuthRateLimit(
  request: Request,
  route: keyof typeof AUTH_RATE_LIMIT_RULES,
  identifier?: string
) {
  const ip = getClientIp(request);
  const result = await checkRateLimit(route, ip, identifier);
  if (!result.allowed) {
    auditAuthEvent("rate_limited", { route, ip, identifier: identifier ? "provided" : "anonymous" });
    await auditSecurityEvent({
      type: "RATE_LIMITED",
      severity: "warning",
      metadata: { route, identifier: identifier ? "provided" : "anonymous" },
      ip,
      userAgent: request.headers.get("user-agent")
    });
  }
  return { ip, result };
}
