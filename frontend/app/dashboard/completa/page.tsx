import { redirect } from "next/navigation";
import { CalculatorApp } from "@/components/CalculatorApp";
import { CalculatorShell } from "@/components/CalculatorShell";
import { CommercialBlock } from "@/components/paywall/CommercialBlock";
import { getSubscriptionStatus, requireAuth } from "@/lib/authz";
import { getCommercialEntitlement } from "@/lib/commercial-access";
import { showCompleteCalculator } from "@/lib/features";
import { prisma } from "@/lib/prisma";

export default async function CompleteCalculatorPage() {
  if (!showCompleteCalculator) redirect("/dashboard/pcr");

  const user = await requireAuth();
  const entitlement = await getCommercialEntitlement(user.id);
  if (!entitlement.hasAccess) {
    return (
      <CalculatorShell active="pcr">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <CommercialBlock entitlement={entitlement} />
        </div>
      </CalculatorShell>
    );
  }
  const subscription = await getSubscriptionStatus(user.id);
  const history = await prisma.calculationHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8
  });

  return (
    <CalculatorApp
      subscription={{
        ...subscription,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
        trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null
      }}
      initialHistory={history.map((item) => ({
        id: item.id,
        patientWeight: item.patientWeight,
        ageYears: item.ageYears,
        ageMonths: item.ageMonths,
        createdAt: item.createdAt.toISOString()
      }))}
    />
  );
}
