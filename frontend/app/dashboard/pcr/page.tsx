import { PcrCalculatorApp } from "@/components/PcrCalculatorApp";
import { CalculatorShell } from "@/components/CalculatorShell";
import { CommercialBlock } from "@/components/paywall/CommercialBlock";
import { getAdminCurrentUser, hasAdminPermission } from "@/lib/admin-permissions";
import { requireAuth } from "@/lib/authz";
import { requirePremiumAccess, CommercialAccessError } from "@/lib/commercial-access";

export default async function PcrCalculatorPage() {
  const user = await requireAuth();
  const entitlement = await requirePremiumAccess(user.id, "calculator_pcr").catch(error => { if (error instanceof CommercialAccessError) return error.entitlement; throw error; });
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
