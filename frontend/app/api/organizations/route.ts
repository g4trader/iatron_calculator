import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserId, OrganizationAccessError } from "@/lib/organization-authz";
import { createOrganizationForUser, getPrimaryOrganizationForUser } from "@/lib/organizations";

export const runtime = "nodejs";

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da organização.").max(160),
  seatsPurchased: z.number().int().min(3).max(1000).optional()
});

function errorResponse(error: unknown) {
  if (error instanceof OrganizationAccessError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    const membership = await getPrimaryOrganizationForUser(userId);
    return NextResponse.json({ organization: membership?.organization ?? null, role: membership?.role ?? null });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const parsed = createOrganizationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  try {
    const userId = await getAuthenticatedUserId();
    const organization = await createOrganizationForUser({ userId, ...parsed.data });
    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
