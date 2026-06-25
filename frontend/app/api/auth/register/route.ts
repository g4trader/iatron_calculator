import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/lib/account-auth";
import { enforceAuthRateLimit, rateLimitedResponse } from "@/lib/auth-request";

export const runtime = "nodejs";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120).optional(),
  email: z.string().trim().email("Informe um email válido."),
  password: z.string().min(10, "A senha deve ter pelo menos 10 caracteres.").max(128)
});

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const rateLimit = await enforceAuthRateLimit(request, "register", parsed.data.email);
  if (!rateLimit.result.allowed) return rateLimitedResponse(rateLimit.result.retryAfter);

  const result = await registerUser(parsed.data);
  if (!result.ok && result.code === "EMAIL_IN_USE") {
    return NextResponse.json({ error: "Este email já possui acesso por senha." }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    message: "Cadastro criado. Verifique seu email para liberar o acesso."
  });
}
