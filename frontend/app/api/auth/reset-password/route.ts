import { NextResponse } from "next/server";
import { z } from "zod";
import { resetPassword } from "@/lib/account-auth";
import { enforceAuthRateLimit, rateLimitedResponse } from "@/lib/auth-request";

export const runtime = "nodejs";

const resetPasswordSchema = z.object({
  token: z.string().trim().min(20, "Token inválido."),
  password: z.string().min(10, "A senha deve ter pelo menos 10 caracteres.").max(128)
});

export async function POST(request: Request) {
  const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const rateLimit = await enforceAuthRateLimit(request, "resetPassword", parsed.data.token.slice(0, 12));
  if (!rateLimit.result.allowed) return rateLimitedResponse(rateLimit.result.retryAfter);

  const result = await resetPassword(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: "Senha redefinida. Você já pode entrar."
  });
}
