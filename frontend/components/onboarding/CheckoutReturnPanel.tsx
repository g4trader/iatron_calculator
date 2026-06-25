import { ArrowRight, CheckCircle2, Clock3, CreditCard, ListChecks } from "lucide-react";
import { NeuralCard, PremiumButton } from "@/components/saas/SaaSChrome";
import type { CheckoutOnboardingView } from "@/lib/checkout-onboarding";

const iconByState = {
  CANCELLED: CreditCard,
  ACTIVE_INDIVIDUAL: CheckCircle2,
  ACTIVE_ORGANIZATION: CheckCircle2,
  AWAITING_WEBHOOK: Clock3,
  PAYMENT_RECOVERY: CreditCard,
  ORGANIZATION_LICENSE_REQUIRED: ListChecks,
  ORGANIZATION_REQUIRED: ListChecks,
  NO_ACCESS: Clock3
} as const;

export function CheckoutReturnPanel({ view }: { view: CheckoutOnboardingView }) {
  const Icon = iconByState[view.state];

  return (
    <NeuralCard className="p-6 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.72fr]">
        <div>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/20">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-6 text-sm font-semibold text-cyan-200">Retorno do checkout</p>
          <h1 className="mt-3 text-3xl font-black text-white sm:text-5xl">{view.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{view.message}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <PremiumButton href={view.primaryCta.href}>{view.primaryCta.label}</PremiumButton>
            {view.secondaryCta ? <PremiumButton href={view.secondaryCta.href} variant="secondary">{view.secondaryCta.label}</PremiumButton> : null}
          </div>
        </div>

        <div className="rounded-xl border border-cyan-300/10 bg-slate-950/70 p-5">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-cyan-200" aria-hidden="true" />
            <h2 className="font-black text-white">Próximos passos</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {view.steps.map((step, index) => (
              <div key={step} className="flex items-start gap-3 rounded-md border border-cyan-300/10 bg-white/[0.03] p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-300 text-xs font-black text-slate-950">{index + 1}</span>
                <p className="text-sm leading-6 text-slate-300">{step}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-500">
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            A confirmação final depende do webhook do Stripe.
          </div>
        </div>
      </div>
    </NeuralCard>
  );
}
