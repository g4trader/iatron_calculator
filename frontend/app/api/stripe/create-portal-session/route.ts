import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/authz";
import { createBillingPortalSession } from "@/lib/billing";
import { OrganizationAccessError } from "@/lib/organization-authz";

export const runtime = "nodejs";

const portalSchema = z.object({
  ownerType: z.enum(["USER", "ORGANIZATION"]).default("USER"),
  organizationId: z.string().optional()
});

export async function POST(request: Request) {
  const user = await requireAuth();
  const parsed = portalSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  try {
    const portal = await createBillingPortalSession({ userId: user.id, ...parsed.data });
    return NextResponse.json({ url: portal.url });
  } catch (error) {
    if (error instanceof OrganizationAccessError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "Portal indisponível." }, { status: 500 });
  }
}
