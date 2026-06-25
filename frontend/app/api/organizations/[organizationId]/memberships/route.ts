import { NextResponse } from "next/server";
import { getAuthenticatedUserId, OrganizationAccessError } from "@/lib/organization-authz";
import { listOrganizationMemberships } from "@/lib/organizations";

export const runtime = "nodejs";

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
    const memberships = await listOrganizationMemberships(userId, organizationId);
    return NextResponse.json({ memberships });
  } catch (error) {
    return errorResponse(error);
  }
}
