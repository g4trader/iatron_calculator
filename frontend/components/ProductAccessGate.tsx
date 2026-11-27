import type { ReactNode } from "react";
import { CalculatorShell, type ProductNavKey } from "@/components/CalculatorShell";
import { CommercialBlock } from "@/components/paywall/CommercialBlock";
import { getAdminCurrentUser, hasAdminPermission } from "@/lib/admin-permissions";
import { requireAuth } from "@/lib/authz";
import { getClinicalProductEntitlement } from "@/lib/commercial-access";

type ProductAccessGateProps = {
  active: ProductNavKey;
  children: ReactNode;
};

export async function ProductAccessGate({ active, children }: ProductAccessGateProps) {
  const user = await requireAuth();
  const products = {prescription:"modelo-prescricao",doses:"doses-medicacoes",fluids:"soroterapia",intubation:"intubacao-rapida",pcr:"pcr"} as const;
  const entitlement = await getClinicalProductEntitlement(user.id, products[active]);

  if (!entitlement.hasAccess) {
    const admin = await getAdminCurrentUser();
    if (admin && hasAdminPermission(admin, "admin.dashboard.view")) return <>{children}</>;

    return (
      <CalculatorShell active={active}>
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <CommercialBlock entitlement={entitlement} />
        </div>
      </CalculatorShell>
    );
  }

  return <>{children}</>;
}
