import type { CommercialBlockReason, CommercialEntitlement } from "@/lib/commercial-access";

export type CheckoutReturnStatus = "success" | "cancelled" | "unknown";

export type CheckoutOnboardingState =
  | "CANCELLED"
  | "ACTIVE_INDIVIDUAL"
  | "ACTIVE_ORGANIZATION"
  | "AWAITING_WEBHOOK"
  | "PAYMENT_RECOVERY"
  | "ORGANIZATION_LICENSE_REQUIRED"
  | "ORGANIZATION_REQUIRED"
  | "NO_ACCESS";

export type CheckoutOnboardingView = {
  state: CheckoutOnboardingState;
  title: string;
  message: string;
  primaryCta: {
    href: string;
    label: string;
  };
  secondaryCta?: {
    href: string;
    label: string;
  };
  steps: string[];
};

export type StripeOperationalChecklistItem = {
  key: string;
  label: string;
  status: "configured" | "pending" | "manual";
  detail: string;
};

export function normalizeCheckoutReturnStatus(value?: string | null): CheckoutReturnStatus {
  if (value === "success") return "success";
  if (value === "cancelled" || value === "canceled" || value === "cancel") return "cancelled";
  return "unknown";
}

function isPaymentRecoveryReason(reason: CommercialBlockReason | null) {
  return reason === "PAYMENT_REQUIRED" || reason === "SUBSCRIPTION_INACTIVE";
}

export function resolveCheckoutOnboarding(input: {
  returnStatus: CheckoutReturnStatus;
  entitlement: CommercialEntitlement;
  hasOrganization: boolean;
}): CheckoutOnboardingView {
  if (input.returnStatus === "cancelled") {
    return {
      state: "CANCELLED",
      title: "Checkout cancelado",
      message: "Nenhuma assinatura foi ativada. Você pode voltar aos planos quando quiser continuar.",
      primaryCta: { href: "/checkout", label: "Voltar aos planos" },
      secondaryCta: { href: "/dashboard", label: "Ir ao dashboard" },
      steps: ["Escolha um plano", "Confirme os dados no checkout", "Aguarde a liberação automática pelo webhook"]
    };
  }

  if (input.entitlement.hasAccess && input.entitlement.accountType === "INDIVIDUAL") {
    return {
      state: "ACTIVE_INDIVIDUAL",
      title: "Acesso individual ativo",
      message: "Seu acesso à Folha PCR digital está liberado. A melhor próxima ação é abrir o dashboard e realizar o primeiro cálculo.",
      primaryCta: { href: "/dashboard", label: "Abrir dashboard" },
      secondaryCta: { href: "/billing", label: "Ver assinatura" },
      steps: ["Abra o dashboard", "Acesse a Folha PCR", "Faça o primeiro cálculo clínico"]
    };
  }

  if (input.entitlement.hasAccess && input.entitlement.accountType === "ORGANIZATION") {
    return {
      state: "ACTIVE_ORGANIZATION",
      title: "Acesso institucional ativo",
      message: "Sua licença institucional está ativa. Você pode usar a Folha PCR ou revisar a gestão da organização.",
      primaryCta: { href: "/dashboard", label: "Abrir dashboard" },
      secondaryCta: { href: "/organization", label: "Ver organização" },
      steps: ["Revise a organização", "Confirme membros e licenças", "Use a calculadora com o usuário licenciado"]
    };
  }

  if (input.entitlement.blockReason === "NO_ORGANIZATION_LICENSE" || input.entitlement.blockReason === "LICENSE_INACTIVE") {
    return {
      state: "ORGANIZATION_LICENSE_REQUIRED",
      title: "Licença institucional pendente",
      message: "A organização pode ter uma assinatura ou seats contratados, mas seu usuário ainda precisa de uma licença ativa atribuída.",
      primaryCta: { href: "/organization", label: "Abrir organização" },
      secondaryCta: { href: "/billing", label: "Ver billing" },
      steps: ["Abra a organização", "Atribua uma licença ao usuário", "Volte ao dashboard após a licença ficar ativa"]
    };
  }

  if (input.entitlement.blockReason === "NO_ORGANIZATION" || (!input.hasOrganization && input.entitlement.accountType === "ORGANIZATION")) {
    return {
      state: "ORGANIZATION_REQUIRED",
      title: "Organização necessária",
      message: "Para o fluxo institucional, primeiro crie ou acesse uma organização antes de distribuir licenças.",
      primaryCta: { href: "/organization", label: "Criar organização" },
      secondaryCta: { href: "/checkout", label: "Ver planos" },
      steps: ["Crie a organização", "Contrate seats institucionais", "Convide membros e atribua licenças"]
    };
  }

  if (isPaymentRecoveryReason(input.entitlement.blockReason)) {
    return {
      state: "PAYMENT_RECOVERY",
      title: "Confirmação de pagamento pendente",
      message: "O acesso ainda não foi liberado. Verifique a assinatura e regularize o pagamento pelo billing.",
      primaryCta: { href: "/billing", label: "Abrir billing" },
      secondaryCta: { href: "/checkout", label: "Ver planos" },
      steps: ["Abra o billing", "Confira o status da assinatura", "Use o portal para regularizar o pagamento"]
    };
  }

  if (input.returnStatus === "success") {
    return {
      state: "AWAITING_WEBHOOK",
      title: "Aguardando confirmação da assinatura",
      message: "O checkout retornou com sucesso, mas a liberação depende da confirmação do Stripe via webhook. Isso costuma levar poucos instantes.",
      primaryCta: { href: "/checkout/return?status=success", label: "Atualizar status" },
      secondaryCta: { href: "/billing", label: "Ver billing" },
      steps: ["Aguarde a confirmação do Stripe", "Atualize esta tela", "Acesse o dashboard quando o status ficar ativo"]
    };
  }

  return {
    state: "NO_ACCESS",
    title: "Acesso ainda não ativo",
    message: "Não encontramos uma assinatura ativa para este usuário. Escolha um plano ou revise o billing.",
    primaryCta: { href: "/checkout", label: "Ver planos" },
    secondaryCta: { href: "/billing", label: "Ver billing" },
    steps: ["Escolha um plano", "Conclua o checkout", "Aguarde a confirmação por webhook"]
  };
}

function envPresent(name: string) {
  return Boolean(process.env[name]?.trim());
}

export function getStripeOperationalChecklist(): StripeOperationalChecklistItem[] {
  const priceVars = [
    "STRIPE_PRICE_STARTER_MONTHLY",
    "STRIPE_PRICE_STARTER_SEMIANNUAL",
    "STRIPE_PRICE_STARTER_ANNUAL",
    "STRIPE_PRICE_STARTER_BIENNIAL",
    "STRIPE_PRICE_PROFESSIONAL_MONTHLY",
    "STRIPE_PRICE_PROFESSIONAL_SEMIANNUAL",
    "STRIPE_PRICE_PROFESSIONAL_ANNUAL",
    "STRIPE_PRICE_PROFESSIONAL_BIENNIAL",
    "STRIPE_PRICE_HOSPITAL_CUSTOM"
  ];

  return [
    {
      key: "stripe_env",
      label: "Variáveis Stripe configuradas",
      status: envPresent("STRIPE_SECRET_KEY") && envPresent("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY") ? "configured" : "pending",
      detail: "STRIPE_SECRET_KEY e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY devem estar presentes no ambiente."
    },
    {
      key: "stripe_prices",
      label: "Price IDs configurados",
      status: priceVars.some(envPresent) ? "configured" : "pending",
      detail: "Configure os price IDs de teste usados por PlanPrice ou pelos fallbacks STRIPE_PRICE_*."
    },
    {
      key: "stripe_webhook_secret",
      label: "Webhook secret configurado",
      status: envPresent("STRIPE_WEBHOOK_SECRET") ? "configured" : "pending",
      detail: "O endpoint /api/stripe/webhook precisa receber eventos assinados do Stripe."
    },
    {
      key: "individual_checkout",
      label: "Checkout individual",
      status: "manual",
      detail: "Executar uma compra teste individual e confirmar retorno em /checkout/return."
    },
    {
      key: "institutional_checkout",
      label: "Checkout institucional",
      status: "manual",
      detail: "Executar compra teste como OWNER/ADMIN de uma organização com seats válidos."
    },
    {
      key: "billing_portal",
      label: "Portal do cliente",
      status: "manual",
      detail: "Abrir /billing e validar criação da sessão do Stripe Billing Portal."
    },
    {
      key: "webhook_event",
      label: "Evento no webhook",
      status: "manual",
      detail: "Confirmar evento registrado em StripeWebhookEvent sem duplicidade."
    },
    {
      key: "subscription_sync",
      label: "Subscription sincronizada",
      status: "manual",
      detail: "Confirmar status, planPriceId, ciclo e seats em Subscription."
    },
    {
      key: "license_paywall",
      label: "License e paywall refletidos",
      status: "manual",
      detail: "Individual deve receber License ativa; institucional exige atribuição de licença."
    },
    {
      key: "payment_failure",
      label: "Falha de pagamento",
      status: "manual",
      detail: "Testar cartão de falha e confirmar UX apontando para /billing."
    }
  ];
}
