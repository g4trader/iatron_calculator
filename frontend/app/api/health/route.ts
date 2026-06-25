import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function isPresent(value?: string) {
  return Boolean(value && value.trim().length > 0);
}

export async function GET() {
  let database: "connected" | "disconnected" = "disconnected";

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "connected";
  } catch {
    database = "disconnected";
  }

  const googleConfigured = isPresent(process.env.GOOGLE_CLIENT_ID) && isPresent(process.env.GOOGLE_CLIENT_SECRET);
  const facebookConfigured = isPresent(process.env.FACEBOOK_CLIENT_ID) && isPresent(process.env.FACEBOOK_CLIENT_SECRET);

  return NextResponse.json({
    ok: database === "connected" && isPresent(process.env.AUTH_SECRET),
    database,
    auth: isPresent(process.env.AUTH_SECRET) ? "configured" : "not_configured",
    providers: {
      google: googleConfigured ? "configured" : "not_configured",
      facebook: facebookConfigured ? "configured" : "not_configured"
    },
    timestamp: new Date().toISOString()
  });
}

