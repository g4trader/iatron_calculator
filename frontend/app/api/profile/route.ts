import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { parseSkin, SKIN_COOKIE, skinToPrisma } from "@/lib/skin";

export const runtime = "nodejs";

const profileSchema = z.object({
  name: z.string().trim().max(120).optional().nullable(),
  clinicalName: z.string().trim().max(160).optional().nullable(),
  skinPreference: z.enum(["dark", "light"]).optional().nullable()
});

export async function PATCH(request: Request) {
  const user = await requireAuth();
  const payload = profileSchema.parse(await request.json());
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: payload.name || null,
      clinicalName: payload.clinicalName || null,
      ...(payload.skinPreference ? { skinPreference: skinToPrisma(payload.skinPreference) } : {})
    },
    select: { id: true, name: true, clinicalName: true, skinPreference: true }
  });
  const response = NextResponse.json({ user: updated });
  const skin = parseSkin(payload.skinPreference);
  if (skin) {
    response.cookies.set(SKIN_COOKIE, skin, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
  }
  return response;
}
