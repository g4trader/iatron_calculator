import { NextResponse } from "next/server";
import { z } from "zod";
import { resendVerificationEmail } from "@/lib/account-auth";
import { enforceAuthRateLimit, rateLimitedResponse } from "@/lib/auth-request";

export const runtime = "nodejs";

const resendVerificationSchema = z.object({
  email: z.string().trim().email("Informe um email válido.")
});

export async function POST(request: Request) {
  const parsed = resendVerificationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const rateLimit = await enforceAuthRateLimit(request, "resendVerification", parsed.data.email);
  if (!rateLimit.result.allowed) return rateLimitedResponse(rateLimit.result.retryAfter);

  try {
    await resendVerificationEmail(parsed.data.email);
  } catch {
    return NextResponse.json({ error: "Não foi possível enviar o email de verificação. Tente novamente mais tarde." }, { status: 503 });
  }
  return NextResponse.json({
    ok: true,
    message: "Se houver uma conta não verificada para este email, enviaremos um novo link."
  });
}
