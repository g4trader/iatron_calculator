import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailToken } from "@/lib/account-auth";
import { enforceAuthRateLimit, rateLimitedResponse } from "@/lib/auth-request";

export const runtime = "nodejs";

const verifyEmailSchema = z.object({
  token: z.string().trim().min(20, "Token inválido.")
});

export async function POST(request: Request) {
  const parsed = verifyEmailSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const rateLimit = await enforceAuthRateLimit(request, "verifyEmail", parsed.data.token.slice(0, 12));
  if (!rateLimit.result.allowed) return rateLimitedResponse(rateLimit.result.retryAfter);

  const result = await verifyEmailToken(parsed.data.token);
  if (!result.ok) {
    return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
