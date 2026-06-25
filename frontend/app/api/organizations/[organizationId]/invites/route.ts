import { NextResponse } from "next/server";
import { OrganizationRole } from "@prisma/client";
import { z } from "zod";
import { getAuthenticatedUserId, OrganizationAccessError } from "@/lib/organization-authz";
import { createOrganizationInvite, listOrganizationInvites } from "@/lib/organizations";

export const runtime = "nodejs";

const inviteSchema = z.object({
  email: z.string().trim().email("Informe um email válido."),
  role: z.enum([OrganizationRole.ADMIN, OrganizationRole.MEMBER]).default(OrganizationRole.MEMBER)
});

function errorResponse(error: unknown) {
  if (error instanceof OrganizationAccessError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
}

export async function GET(_request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const userId = await getAuthenticatedUserId();
    const { organizationId } = await params;
    const invites = await listOrganizationInvites(userId, organizationId);
    return NextResponse.json({ invites });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  try {
    const actorUserId = await getAuthenticatedUserId();
    const { organizationId } = await params;
    const result = await createOrganizationInvite({ actorUserId, organizationId, ...parsed.data });
    return NextResponse.json({
      invite: result.invite,
      acceptUrl: `/organization/invites/accept?token=${result.token}`
    }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
