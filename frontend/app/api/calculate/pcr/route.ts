import { NextResponse } from "next/server";
import { z } from "zod";
import { calculatePcrLocally } from "@/lib/pcr-calculation-engine";

import { getCurrentUser } from "@/lib/authz";
import { requirePremiumAccess, CommercialAccessError } from "@/lib/commercial-access";

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
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({error:"Autenticação necessária."},{status:401});
  try { await requirePremiumAccess(user.id,"calculator_pcr"); } catch(error) { if(error instanceof CommercialAccessError) return NextResponse.json({error:"Licença clínica necessária."},{status:error.status}); throw error; }
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
    if (!response.ok) {
      return NextResponse.json(calculatePcrLocally(payload.data), {
        status: 200,
        headers: {
          "cache-control": "no-store",
          "x-pcr-calculation-source": "local-fallback"
        }
      });
    }

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") ?? "application/json",
        "cache-control": "no-store",
        "x-pcr-calculation-source": "backend"
      }
    });
  } catch {
    return NextResponse.json(calculatePcrLocally(payload.data), {
      status: 200,
      headers: {
        "cache-control": "no-store",
        "x-pcr-calculation-source": "local-fallback"
      }
    });
  } finally {
    clearTimeout(timeout);
  }
}
