import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requireAuth } from "@/lib/authz";
import { CommercialAccessError, requirePremiumAccess } from "@/lib/commercial-access";
import { trackFunnelEvent } from "@/lib/funnel";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const historySchema = z.object({
  patientWeight: z.number().positive(),
  ageYears: z.number().int().min(0),
  ageMonths: z.number().int().min(0).max(11),
  calculatedData: z.unknown()
});

export async function GET() {
  const user = await requireAuth();
  try {
    await requirePremiumAccess(user.id, "calculation_history");
  } catch (error) {
    if (error instanceof CommercialAccessError) {
      return NextResponse.json({ error: "Acesso premium necessário.", code: error.code }, { status: error.status });
    }
    throw error;
  }
  const history = await prisma.calculationHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8
  });
  return NextResponse.json({ history });
}

export async function POST(request: Request) {
  const user = await requireAuth();
  try {
    await requirePremiumAccess(user.id, "calculation_history");
  } catch (error) {
    if (error instanceof CommercialAccessError) {
      return NextResponse.json({ error: "Acesso premium necessário.", code: error.code }, { status: error.status });
    }
    throw error;
  }
  const payload = historySchema.parse(await request.json());
  const item = await prisma.calculationHistory.create({
    data: {
      userId: user.id,
      patientWeight: payload.patientWeight,
      ageYears: payload.ageYears,
      ageMonths: payload.ageMonths,
      calculatedData: payload.calculatedData as Prisma.InputJsonValue
    }
  });
  await trackFunnelEvent({ step: "first_use", userId: user.id, source: "calculation_history", scope: "first_saved_calculation" }).catch(() => null);
  return NextResponse.json({ item });
}

export async function DELETE() {
  const user = await requireAuth();
  try {
    await requirePremiumAccess(user.id, "calculation_history");
  } catch (error) {
    if (error instanceof CommercialAccessError) {
      return NextResponse.json({ error: "Acesso premium necessário.", code: error.code }, { status: error.status });
    }
    throw error;
  }
  await prisma.calculationHistory.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true });
}
