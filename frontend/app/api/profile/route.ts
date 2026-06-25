import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const profileSchema = z.object({
  name: z.string().trim().max(120).optional().nullable(),
  clinicalName: z.string().trim().max(160).optional().nullable()
});

export async function PATCH(request: Request) {
  const user = await requireAuth();
  const payload = profileSchema.parse(await request.json());
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: payload.name || null,
      clinicalName: payload.clinicalName || null
    },
    select: { id: true, name: true, clinicalName: true }
  });
  return NextResponse.json({ user: updated });
}
