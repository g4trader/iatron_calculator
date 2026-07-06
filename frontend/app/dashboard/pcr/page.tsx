import { PcrCalculatorApp } from "@/components/PcrCalculatorApp";
import { CalculatorShell } from "@/components/CalculatorShell";
import { CommercialBlock } from "@/components/paywall/CommercialBlock";
import { getAdminCurrentUser, hasAdminPermission } from "@/lib/admin-permissions";
import { requireAuth } from "@/lib/authz";
import { getCommercialEntitlement } from "@/lib/commercial-access";

export default async function PcrCalculatorPage() {
  const user = await requireAuth();
  const entitlement = await getCommercialEntitlement(user.id);
  if (!entitlement.hasAccess) {
    const admin = await getAdminCurrentUser();
    if (admin && hasAdminPermission(admin, "admin.dashboard.view")) return <PcrCalculatorApp />;

    return (
      <CalculatorShell active="pcr">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <CommercialBlock entitlement={entitlement} />
        </div>
      </CalculatorShell>
    );
  }
  return <PcrCalculatorApp />;
}
