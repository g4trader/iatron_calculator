import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const calculationRequestSchema = z.object({
  pesoKg: z.number().positive(),
  idadeAnos: z.number().int().min(0),
  idadeMeses: z.number().int().min(0).max(11)
});

function backendBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080").replace(/\/$/, "");
}

export async function POST(request: Request) {
  const payload = calculationRequestSchema.safeParse(await request.json().catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "Dados inválidos para cálculo." }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${backendBaseUrl()}/calculate/pcr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload.data),
      signal: controller.signal,
      cache: "no-store"
    });

    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "Backend clínico indisponível no momento." }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
