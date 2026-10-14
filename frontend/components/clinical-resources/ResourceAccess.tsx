import "server-only";
import { requireAuth } from "@/lib/authz";
import { getCommercialEntitlement } from "@/lib/commercial-access";
import { getAdminCurrentUser, hasAdminPermission } from "@/lib/admin-permissions";
import { CommercialBlock } from "@/components/paywall/CommercialBlock";
import { CalculatorShell, type ProductNavKey } from "@/components/CalculatorShell";

// Same policy as ProductAccessGate. Check before constructing any data-bearing client props.
export async function resourceAccess(active: ProductNavKey) {
  const user = await requireAuth();
  const entitlement = await getCommercialEntitlement(user.id);
  if (entitlement.hasAccess) return null;
  const admin = await getAdminCurrentUser();
  if (admin && hasAdminPermission(admin, "admin.dashboard.view")) return null;
  return <CalculatorShell active={active}><CommercialBlock entitlement={entitlement} /></CalculatorShell>;
}
