import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/authz";
import { createBillingCheckoutSession } from "@/lib/billing";
import { trackFunnelEvent } from "@/lib/funnel";
import { OrganizationAccessError } from "@/lib/organization-authz";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  ownerType: z.enum(["USER", "ORGANIZATION"]).default("USER"),
  planPriceId: z.string().min(1),
  organizationId: z.string().optional(),
  seats: z.number().int().min(1).optional()
});

export async function POST(request: Request) {
  const user = await requireAuth();
  const parsed = checkoutSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  try {
    const session = await createBillingCheckoutSession({
      user,
      ...parsed.data
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    await trackFunnelEvent({
      step: "checkout_failed",
      userId: user.id,
      source: "checkout_api",
      scope: parsed.data.planPriceId,
      metadata: {
        ownerType: parsed.data.ownerType,
        organizationId: parsed.data.organizationId ?? null,
        reason: error instanceof OrganizationAccessError ? error.code : "checkout_session_error"
      }
    }).catch(() => null);
    if (error instanceof OrganizationAccessError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "Não foi possível criar checkout." }, { status: 500 });
  }
}
