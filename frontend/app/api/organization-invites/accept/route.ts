import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserId, OrganizationAccessError } from "@/lib/organization-authz";
import { acceptOrganizationInvite } from "@/lib/organizations";

export const runtime = "nodejs";

const acceptInviteSchema = z.object({
  token: z.string().min(20, "Convite inválido.")
});

function errorResponse(error: unknown) {
  if (error instanceof OrganizationAccessError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
}

export async function POST(request: Request) {
  const parsed = acceptInviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  try {
    const userId = await getAuthenticatedUserId();
    const result = await acceptOrganizationInvite({ userId, token: parsed.data.token });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
