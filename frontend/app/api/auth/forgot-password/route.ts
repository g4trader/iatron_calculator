import { NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/account-auth";
import { enforceAuthRateLimit, rateLimitedResponse } from "@/lib/auth-request";

export const runtime = "nodejs";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Informe um email válido.")
});

export async function POST(request: Request) {
  const parsed = forgotPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const rateLimit = await enforceAuthRateLimit(request, "forgotPassword", parsed.data.email);
  if (!rateLimit.result.allowed) return rateLimitedResponse(rateLimit.result.retryAfter);

  await requestPasswordReset(parsed.data.email);
  return NextResponse.json({
    ok: true,
    message: "Se o email estiver cadastrado, enviaremos um link para redefinir a senha."
  });
}
