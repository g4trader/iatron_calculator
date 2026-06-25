import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { FUNNEL_STEPS, trackFunnelEvent } from "@/lib/funnel";

export const runtime = "nodejs";

const funnelSchema = z.object({
  step: z.enum(FUNNEL_STEPS),
  source: z.string().trim().max(80).optional(),
  campaign: z.string().trim().max(120).optional(),
  scope: z.string().trim().max(120).optional()
});

export async function POST(request: Request) {
  const parsed = funnelSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get("iatron_funnel_sid")?.value;
  const sessionId = existingSessionId ?? randomUUID();
  const session = await auth().catch(() => null);

  await trackFunnelEvent({
    step: parsed.data.step,
    userId: session?.user?.id,
    sessionId,
    source: parsed.data.source ?? "web",
    campaign: parsed.data.campaign,
    scope: parsed.data.scope
  }).catch(() => null);

  const response = NextResponse.json({ ok: true });
  if (!existingSessionId) {
    response.cookies.set("iatron_funnel_sid", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/"
    });
  }
  return response;
}
