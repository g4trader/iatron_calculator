# Iatron Go-Live Readiness Runbook

Este runbook consolida a validação de E2E, Stripe test mode e prontidão de produção. Não registre secrets neste arquivo.

## Status da Execução Atual

Data da última consolidação: 2026-06-19.

Validações executadas neste ambiente:

```bash
cd frontend
npm run e2e:seed
npm run test:e2e
npm run test:onboarding
npm run test:commercial
npm run test:pricing
DATABASE_URL='postgresql://user:pass@localhost:5432/iatron' npx prisma validate
DATABASE_URL='postgresql://user:pass@localhost:5432/iatron' npm run build
```

Resultado:

- `npm run e2e:seed`: bloqueado porque `DATABASE_URL` não está configurado no terminal atual.
- `npm run test:e2e`: bloqueado porque `DATABASE_URL` não está configurado. A primeira tentativa também foi bloqueada pelo sandbox ao iniciar porta local; com permissão elevada, o bloqueio real passou a ser `DATABASE_URL`.
- `npm run test:onboarding`: passou.
- `npm run test:commercial`: passou.
- `npm run test:pricing`: passou.
- `npx prisma validate`: passou com URL dummy apenas para validação de schema.
- `npm run build`: passou.

Para concluir o aceite E2E, execute os passos abaixo com um banco Postgres isolado. A configuração cloud recomendada está detalhada em [SUPABASE_STAGING_E2E.md](./SUPABASE_STAGING_E2E.md).

## Banco Isolado para E2E/Staging

Use um banco dedicado. Não use produção.

Opção recomendada para cloud:

- Supabase projeto separado `iatron-staging-e2e`.

Opções alternativas:

- Supabase branch persistente.
- Neon branch `iatron-e2e`.
- Postgres local via Docker apenas para debugging local.

Exemplo com Docker:

```bash
docker run --name iatron-e2e-postgres \
  -e POSTGRES_USER=iatron \
  -e POSTGRES_PASSWORD=iatron_e2e \
  -e POSTGRES_DB=iatron_e2e \
  -p 54329:5432 \
  -d postgres:16

export DATABASE_URL="postgresql://iatron:iatron_e2e@127.0.0.1:54329/iatron_e2e"
```

Exemplo Supabase staging/E2E:

```bash
export IATRON_ENV=e2e
export DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?sslmode=require"
export DIRECT_URL="postgresql://...db.supabase.co:5432/postgres?sslmode=require"
```

Nota para Vercel + Supabase: no staging deployado em 2026-06-22, a Vercel não alcançou o endpoint direto `db...supabase.co:5432` durante `prisma migrate deploy` (`P1001`). O build da Vercel deve compilar com `npm run build`; migrations devem ser aplicadas como passo operacional separado a partir de ambiente com acesso direto. Para runtime serverless, use `DATABASE_URL` via pooler com `pgbouncer=true&connection_limit=1`.

Preparação:

```bash
cd frontend
export IATRON_ENV="e2e"
export DATABASE_URL="postgresql://..."
export DIRECT_URL="postgresql://..."
export AUTH_SECRET="iatron-e2e-auth-secret-change-only-for-tests"
export AUTH_URL="http://127.0.0.1:3000"
export NEXTAUTH_URL="http://127.0.0.1:3000"
export PLAYWRIGHT_BASE_URL="http://127.0.0.1:3000"

npm run prisma:deploy
npm run e2e:seed
npm run test:e2e
```

Critério de aceite:

- 12 testes Playwright passando.
- 6 cenários em `chromium`.
- 6 cenários em `mobile-chrome`.

## Cenários E2E Esperados

- Usuário individual sem acesso vê paywall e chega ao pricing.
- Usuário individual ativo acessa dashboard premium.
- Retorno pós-checkout mostra estado aguardando webhook.
- Usuário com problema comercial é orientado para `/billing`.
- Usuário institucional sem licença não obtém acesso premium.
- Usuário institucional licenciado obtém acesso premium.

## Stripe CLI em Test Mode

Instalação:

```bash
brew install stripe/stripe-cli/stripe
stripe login
```

Se o CLI não estiver autenticado, `stripe listen` e `stripe trigger` falham com a mensagem de API keys não configuradas. Nesse caso, conclua o login pelo browser indicado pelo `stripe login` ou exporte uma chave restrita de teste:

```bash
export STRIPE_API_KEY="sk_test_..."
```

Forwarding local:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copie o secret exibido:

```bash
export STRIPE_WEBHOOK_SECRET="whsec_..."
```

Inicie o app:

```bash
cd frontend
export DATABASE_URL="postgresql://..."
export AUTH_SECRET="..."
export AUTH_URL="http://localhost:3000"
export NEXTAUTH_URL="http://localhost:3000"
export STRIPE_SECRET_KEY="sk_test_..."
export NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
export STRIPE_WEBHOOK_SECRET="whsec_..."
export STRIPE_PRICE_PROFESSIONAL_MONTHLY="price_..."

npm run dev
```

## Eventos Stripe a Validar

Eventos obrigatórios:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Validação via CLI:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
```

Observação: eventos disparados por `stripe trigger` podem não conter exatamente os metadados de checkout do produto. Para validar sincronização completa de `Subscription` e `License`, execute também um checkout real em test mode pela UI.

## Smoke Test de Webhook Sem CLI Autenticado

Existe um smoke test local para validar o endpoint real do webhook com assinatura Stripe gerada localmente:

```bash
cd frontend
IATRON_ENV=e2e \
DATABASE_URL="postgresql://postgres:PASS@db.PROJECT.supabase.co:5432/postgres?sslmode=require" \
DIRECT_URL="postgresql://postgres:PASS@db.PROJECT.supabase.co:5432/postgres?sslmode=require" \
AUTH_SECRET="..." \
AUTH_URL="http://127.0.0.1:3000" \
NEXTAUTH_URL="http://127.0.0.1:3000" \
NEXT_PUBLIC_API_URL="http://127.0.0.1:8000" \
STRIPE_SECRET_KEY="sk_test_missing" \
STRIPE_WEBHOOK_SECRET="whsec_local_smoke" \
npm run dev -- -H 127.0.0.1 -p 3000
```

Em outro terminal:

```bash
cd frontend
IATRON_ENV=e2e \
DATABASE_URL="postgresql://postgres:PASS@db.PROJECT.supabase.co:5432/postgres?sslmode=require" \
DIRECT_URL="postgresql://postgres:PASS@db.PROJECT.supabase.co:5432/postgres?sslmode=require" \
AUTH_SECRET="..." \
AUTH_URL="http://127.0.0.1:3000" \
NEXTAUTH_URL="http://127.0.0.1:3000" \
NEXT_PUBLIC_API_URL="http://127.0.0.1:8000" \
STRIPE_SECRET_KEY="sk_test_missing" \
STRIPE_WEBHOOK_SECRET="whsec_local_smoke" \
npm run stripe:webhook:smoke
```

Esse teste cobre `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, idempotência por `StripeWebhookEvent`, sincronização de `Subscription`, reflexo em `License` individual e comportamento de entitlement/paywall. Ele não substitui a validação real de `checkout.session.completed`, `invoice.paid` e `invoice.payment_failed`, porque esses eventos buscam a assinatura na API Stripe.

## Validação no Banco

Verifique sem expor secrets:

```sql
select "stripeEventId", type, "processedAt"
from "StripeWebhookEvent"
order by "processedAt" desc
limit 10;

select "ownerType", plan, status, "billingCycle", "seatsPurchased", "stripeSubscriptionId"
from "Subscription"
order by "updatedAt" desc
limit 10;

select "organizationId", "userId", status, "assignedAt", "revokedAt"
from "License"
order by "updatedAt" desc
limit 10;
```

Critérios:

- Webhook recebido aparece em `StripeWebhookEvent`.
- Reenvio do mesmo evento não duplica processamento.
- `Subscription` reflete status Stripe.
- Individual `ACTIVE` ou `TRIALING` cria `License.ACTIVE`.
- Institucional exige atribuição de `License.ACTIVE` para liberar usuário.

## Validação do Paywall

Individual ativo:

- Login com usuário ativo.
- Abrir `/dashboard`.
- Deve mostrar seleção de calculadoras.

Individual sem acesso:

- Login com usuário sem assinatura.
- Abrir `/dashboard`.
- Deve mostrar paywall e CTA para `/checkout`.

Pagamento falho:

- `Subscription.status=PAST_DUE` ou `UNPAID`.
- Abrir `/dashboard`.
- Deve bloquear acesso.
- Abrir `/billing`.
- Deve orientar recuperação.

Institucional:

- Membership sem licença não libera `/dashboard`.
- Membership com `License.ACTIVE` libera `/dashboard`.

## Checklist Go-Live Stripe Test Mode

- [ ] `STRIPE_SECRET_KEY` test configurada.
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` test configurada.
- [ ] `STRIPE_WEBHOOK_SECRET` do endpoint correto configurado.
- [ ] Price IDs test preenchidos no ambiente ou em `PlanPrice.stripePriceId`.
- [ ] `PlanPrice.amountCents` preenchido para preços públicos.
- [ ] Webhook endpoint `/api/stripe/webhook` configurado.
- [ ] Checkout individual testado.
- [ ] Checkout institucional testado.
- [ ] Customer portal testado.
- [ ] Redirect success para `/checkout/return?status=success`.
- [ ] Redirect cancel para `/checkout/return?status=cancelled`.
- [ ] Webhook recebendo eventos.
- [ ] Idempotência confirmada por `StripeWebhookEvent`.
- [ ] `Subscription` sincronizada.
- [ ] `License` refletida.
- [ ] Paywall respeitando estados.
- [ ] `invoice.payment_failed` tratado e UX aponta para `/billing`.
- [ ] Onboarding pós-checkout funcionando.
- [ ] 12 E2E Playwright passando em banco isolado.

## Checklist Prontidão Produção

Runbooks finais:

- `PRODUCTION_DOMAIN.md`: domínio final `https://app.iatron.com.br`, DNS pendente e envs planejadas.
- `LIVE_MODE_RUNBOOK.md`: ativação Stripe live mode, domínio final, webhook, rollback e monitoramento.
- `GO_LIVE_CHECKLIST.md`: checklist objetivo antes de vender.

- [ ] Produtos e preços reais criados no Stripe live mode.
- [ ] `PlanPrice.amountCents` reais preenchidos.
- [ ] `PlanPrice.stripePriceId` live preenchidos ou envs live configuradas.
- [ ] Webhook endpoint produção configurado no Stripe.
- [ ] `STRIPE_WEBHOOK_SECRET` produção configurado.
- [ ] Logs de webhook monitorados.
- [ ] Alertas para falha em webhook e eventos não processados.
- [ ] Plano de rollback documentado.
- [ ] Runbook de incidente de billing documentado.
- [ ] Backup do banco configurado e testado.
- [ ] Estratégia de restore testada.
- [ ] Termos de uso e política de privacidade revisados.
- [ ] Disclaimer clínico visível e revisado.
- [ ] Limites operacionais conhecidos documentados.
- [ ] E2E em staging passando antes do deploy.
- [ ] Validação manual Stripe live com compra controlada, se aplicável.

## Runbook de Incidente Billing

1. Verificar logs do endpoint `/api/stripe/webhook`.
2. Conferir evento no Stripe Dashboard.
3. Conferir `StripeWebhookEvent` pelo `stripeEventId`.
4. Conferir `Subscription` pelo `stripeSubscriptionId`.
5. Conferir `License` associada.
6. Reenviar evento pelo Stripe Dashboard se necessário.
7. Se o problema for price/env, pausar checkout e corrigir configuração.
8. Validar paywall com usuário afetado.

## Rollback

- Desabilitar temporariamente CTAs de checkout removendo price IDs do ambiente.
- Manter `/billing` e portal disponíveis para clientes existentes.
- Não apagar subscriptions/licenses.
- Corrigir webhook/configuração e reenviar eventos pendentes pelo Stripe.
