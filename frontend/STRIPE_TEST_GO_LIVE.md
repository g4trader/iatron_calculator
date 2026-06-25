# Stripe Test Mode Go-Live Checklist

Use esta checklist antes de liberar billing em produção. Não registre secrets neste arquivo.

Para live mode real, usar `LIVE_MODE_RUNBOOK.md` e `GO_LIVE_CHECKLIST.md`.

Domínio final planejado: `https://app.iatron.com.br`. Antes de live mode, repetir esta validação em test mode no domínio final depois que o DNS estiver ativo.

Não criar/usar webhook test mode para `https://app.iatron.com.br/api/stripe/webhook` enquanto o host não resolver em DNS e não estiver com SSL ativo na Vercel.

## Ambiente

- [ ] `STRIPE_SECRET_KEY` configurada com chave de teste.
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` configurada com publishable key de teste.
- [ ] `STRIPE_WEBHOOK_SECRET` configurado a partir do endpoint real/Stripe CLI.
- [ ] `AUTH_URL` e `NEXTAUTH_URL` apontam para o domínio usado no checkout.
- [ ] `DATABASE_URL` aponta para o banco correto do ambiente.

## Price IDs

- [ ] `STRIPE_PRICE_STARTER_MONTHLY`
- [ ] `STRIPE_PRICE_STARTER_SEMIANNUAL`
- [ ] `STRIPE_PRICE_STARTER_ANNUAL`
- [ ] `STRIPE_PRICE_STARTER_BIENNIAL`
- [ ] `STRIPE_PRICE_PROFESSIONAL_MONTHLY`
- [ ] `STRIPE_PRICE_PROFESSIONAL_SEMIANNUAL`
- [ ] `STRIPE_PRICE_PROFESSIONAL_ANNUAL`
- [ ] `STRIPE_PRICE_PROFESSIONAL_BIENNIAL`
- [ ] `STRIPE_PRICE_HOSPITAL_CUSTOM`, se o institucional usar checkout em vez de contato.

## Webhook

- [ ] Endpoint configurado: `/api/stripe/webhook`.
- [ ] Eventos habilitados: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
- [ ] Evento recebido cria registro em `StripeWebhookEvent`.
- [ ] Reenvio do mesmo evento não duplica processamento.

## Fluxo Individual

- [ ] Usuário sem acesso vê paywall.
- [ ] Usuário abre `/checkout` e escolhe plano/ciclo individual.
- [ ] Stripe Checkout redireciona sucesso para `/checkout/return?status=success`.
- [ ] Antes do webhook, a tela mostra estado aguardando confirmação.
- [ ] Após webhook, `Subscription` fica `ACTIVE` ou `TRIALING`.
- [ ] `License` individual fica `ACTIVE`.
- [ ] Paywall libera `/dashboard`.

## Fluxo Institucional

- [ ] Usuário OWNER/ADMIN possui organização.
- [ ] Plano institucional informa mínimo de seats.
- [ ] Checkout institucional valida seats no servidor.
- [ ] Webhook atualiza `Subscription` da organização.
- [ ] Membership sozinho não libera dashboard premium.
- [ ] Após atribuir `License` ativa ao usuário, o paywall libera acesso.

## Billing Portal

- [ ] `/billing` abre Stripe Billing Portal.
- [ ] Portal retorna para `/billing`.
- [ ] Upgrade/downgrade/cancelamento atualizam `Subscription` via webhook.

## Falha de Pagamento

- [ ] Cartão de falha em modo teste gera `invoice.payment_failed`.
- [ ] `Subscription` reflete `PAST_DUE` ou status equivalente.
- [ ] `/dashboard` bloqueia acesso premium.
- [ ] `/billing` orienta regularização pelo portal.

## E2E Local

```bash
cd frontend
DATABASE_URL="postgresql://..." npm run e2e:seed
DATABASE_URL="postgresql://..." npm run test:e2e
```

Os E2E locais simulam estados comerciais no banco. Pagamentos reais de teste devem ser validados manualmente com Stripe Checkout/CLI.

## Smoke Test Local do Webhook

Quando o Stripe CLI ainda não estiver autenticado, use o smoke test local para validar endpoint, assinatura webhook, idempotência, `Subscription`, `License` e entitlement comercial com payloads Stripe assinados localmente.

Use banco staging/E2E, nunca produção:

```bash
cd frontend
export IATRON_ENV=e2e
export DATABASE_URL="postgresql://postgres:PASS@db.PROJECT.supabase.co:5432/postgres?sslmode=require"
export DIRECT_URL="$DATABASE_URL"
export AUTH_SECRET="..."
export AUTH_URL="http://127.0.0.1:3000"
export NEXTAUTH_URL="http://127.0.0.1:3000"
export NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
export STRIPE_SECRET_KEY="sk_test_missing"
export STRIPE_WEBHOOK_SECRET="whsec_local_smoke"

npm run dev -- -H 127.0.0.1 -p 3000
```

Em outro terminal:

```bash
cd frontend
export IATRON_ENV=e2e
export DATABASE_URL="postgresql://postgres:PASS@db.PROJECT.supabase.co:5432/postgres?sslmode=require"
export DIRECT_URL="$DATABASE_URL"
export AUTH_SECRET="..."
export AUTH_URL="http://127.0.0.1:3000"
export NEXTAUTH_URL="http://127.0.0.1:3000"
export NEXT_PUBLIC_API_URL="http://127.0.0.1:8000"
export STRIPE_SECRET_KEY="sk_test_missing"
export STRIPE_WEBHOOK_SECRET="whsec_local_smoke"

npm run stripe:webhook:smoke
```

Critérios esperados:

- `customer.subscription.created` individual cria/ativa `Subscription` e `License`.
- Reenvio do mesmo evento retorna `duplicate: true`.
- `customer.subscription.updated` com `past_due` bloqueia entitlement.
- `customer.subscription.deleted` marca assinatura como `CANCELED`.
- Assinatura institucional ativa sem `License.ACTIVE` continua bloqueada.
- Após atribuir `License.ACTIVE`, entitlement institucional libera acesso.

Este smoke test não substitui a validação real com Stripe CLI. Ele não cobre eventos que exigem chamada de volta à API Stripe, como `checkout.session.completed`, `invoice.paid` e `invoice.payment_failed`.
