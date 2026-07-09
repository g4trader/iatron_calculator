import { NextResponse } from "next/server";
import { z } from "zod";
import { parseSkin, SKIN_COOKIE } from "@/lib/skin";

export const runtime = "nodejs";

const skinSchema = z.object({
  skin: z.enum(["dark", "light"])
});

export async function PATCH(request: Request) {
  const payload = skinSchema.parse(await request.json());
  const skin = parseSkin(payload.skin) ?? "dark";
  const response = NextResponse.json({ skin });
  response.cookies.set(SKIN_COOKIE, skin, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  return response;
}
