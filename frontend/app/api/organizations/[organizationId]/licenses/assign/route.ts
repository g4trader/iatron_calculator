import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserId, OrganizationAccessError } from "@/lib/organization-authz";
import { assignOrganizationLicense } from "@/lib/organizations";

export const runtime = "nodejs";

const assignLicenseSchema = z.object({
  userId: z.string().min(1, "Informe o usuário.")
});

function errorResponse(error: unknown) {
  if (error instanceof OrganizationAccessError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
}

export async function POST(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  const parsed = assignLicenseSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  try {
    const actorUserId = await getAuthenticatedUserId();
    const { organizationId } = await params;
    const license = await assignOrganizationLicense({ actorUserId, organizationId, targetUserId: parsed.data.userId });
    return NextResponse.json({ license });
  } catch (error) {
    return errorResponse(error);
  }
}
