# Billing Administrativo

O módulo `/admin/billing` complementa a operação de assinaturas sem substituir a Stripe. A rota exige `admin.billing.manage`.

## Fontes de verdade

- `stripe`: invoices, refunds, customer dashboard, subscription dashboard e `cancel_at_period_end`.
- `local cache`: `Subscription`, `License` e `StripeWebhookEvent` persistidos no banco.
- `derived`: riscos e divergências calculados a partir da comparação local/Stripe.

## Ações permitidas

- Abrir links do Stripe Dashboard para customer/subscription.
- Reexecutar reconcile de uma assinatura buscando a assinatura atual diretamente na Stripe.
- Marcar assinatura ou webhook para análise manual.
- Solicitar reprocessamento de webhook quando aplicável.

Todas as ações server-side gravam `AdminAuditEvent`.

## Limites de segurança

O painel não altera status financeiro diretamente no banco. Mudanças financeiras críticas devem acontecer na Stripe e entrar no produto via webhook/reconcile.

O reprocessamento automático de webhook é bloqueado na implementação atual porque o payload raw do evento não é persistido. A ação registra auditoria e orienta análise manual. Para reprocessamento real, será necessário persistir payload verificado ou usar replay via Stripe CLI/dashboard.

## Riscos de receita

O painel sinaliza:

- `past_due`
- `cancel_at_period_end`
- falhas recentes de invoice
- assinatura órfã sem IDs Stripe completos
- divergência entre assinatura ativa/trial e licença local
- divergência de status local versus Stripe quando a API está configurada
