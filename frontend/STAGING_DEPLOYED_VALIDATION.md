# Validação em staging deployado

Objetivo: repetir o funil comercial em um deploy real, usando Stripe test mode e banco staging, antes de ativar live mode.

Depois desta validação, usar `LIVE_MODE_RUNBOOK.md` e `GO_LIVE_CHECKLIST.md` para preparar produção real.

Domínio final planejado: `https://app.iatron.com.br`. Estado de DNS e envs finais em `PRODUCTION_DOMAIN.md`.

Para revisão humana do produto em staging, usar `STAGING_REVIEW_CHECKLIST.md`.

Matriz comercial de MVP: `COMMERCIAL_MVP_MATRIX.md`.

Escopo funcional do MVP: somente `Folha PCR` deve aparecer na experiência pública e autenticada. `Calculadora completa` fica fora da oferta atual.

## Resultado executado em 2026-06-22

URL validada:

```text
https://frontend-two-lovat-72.vercel.app
```

Deploy Vercel:

```text
https://frontend-gpfy81cp0-luciano-terres-projects.vercel.app
```

Status:

- Deploy Vercel `Ready`.
- `/` respondeu HTTP 200.
- `/api/health` retornou `ok=true`, `database=connected`, `auth=configured`.
- Fluxo individual real passou em staging deployado.
- Stripe Billing Portal abriu em test mode.
- Cartão recusado exibiu falha no Stripe.
- Webhook público gravou eventos no banco.
- Comunicação institucional assistida apareceu corretamente.

Eventos Stripe observados no banco:

- `checkout.session.completed`
- `customer.subscription.created`
- `invoice.paid`
- `billing_portal.session.created`
- `payment_intent.payment_failed`

Evidência de domínio:

- `e2e+no-access@iatron.test` sincronizou `Subscription.ACTIVE` com `stripeSubscriptionId`.
- `License.ACTIVE` foi criada para o usuário individual pago.
- `e2e+past-due@iatron.test` permaneceu `PAST_DUE`.
- `e2e+org-no-license@iatron.test` mostrou `Licença institucional não atribuída`.
- `e2e+org-licensed@iatron.test` acessou o dashboard.

Correção operacional aplicada:

- O build command da Vercel foi alterado para `npm run build`.
- `prisma migrate deploy` não roda mais dentro do build Vercel, porque a Vercel não alcançou o endpoint direto Supabase `:5432`.
- Migrations devem ser aplicadas como passo operacional separado, a partir de ambiente com acesso direto ao banco.
- Runtime Vercel usa `DATABASE_URL` via Supabase pooler com parâmetros Prisma/PgBouncer.

## Pré-requisitos

- Deploy Vercel de staging apontando para o mesmo commit validado localmente.
- Supabase/Neon staging isolado de produção.
- Migrations aplicadas.
- Stripe test mode com produtos/preços configurados.
- Webhook Stripe apontando para o deploy de staging.
- Login por email/senha funcional no staging.

## Variáveis de ambiente em staging

Obrigatórias:

```bash
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
AUTH_URL=https://SEU-STAGING.vercel.app
NEXTAUTH_URL=https://SEU-STAGING.vercel.app
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_HOSPITAL_CUSTOM=price_...
```

OAuth pode continuar ausente se login por email/senha estiver ativo:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
```

Não gravar secrets no repositório.

## Banco e Prisma

Aplicar migrations no banco staging:

```bash
cd frontend
npm run prisma:deploy
```

Para validações operacionais locais contra Supabase, preferir conexão direta `:5432` com `sslmode=require`.

Para runtime Vercel serverless, usar pooler Supabase com parâmetros Prisma/PgBouncer:

```text
postgresql://...pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1
```

Observação: a Vercel falhou ao executar `prisma migrate deploy` usando o endpoint direto `db...supabase.co:5432` com `P1001`. Por isso, migrations não devem rodar dentro do build Vercel neste staging.

## Webhook Stripe em staging

Endpoint esperado:

```text
https://frontend-two-lovat-72.vercel.app/api/stripe/webhook
```

Webhook test mode criado:

```text
we_1Tl5Jk2VzAAy18mjX3G61v13
```

Eventos mínimos:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `payment_intent.payment_failed`
- `billing_portal.session.created`

Depois de criar o endpoint no Stripe Dashboard, copiar o `whsec_...` para `STRIPE_WEBHOOK_SECRET` no ambiente de staging.

## Checklist Stripe test mode

- Produto Professional criado.
- Preço Professional mensal criado e ativo.
- `STRIPE_PRICE_PROFESSIONAL_MONTHLY` aponta para o preço test mode.
- Starter e ciclos Professional 6 meses/1 ano/2 anos não aparecem na UI enquanto não tiverem valor, price Stripe e validação ponta a ponta.
- Plano Hospital permanece como `Sob consulta`.
- `STRIPE_PRICE_HOSPITAL_CUSTOM` pode existir para sincronização assistida, mas não deve gerar checkout self-service enquanto `PlanPrice` for `CUSTOM`.
- Customer Portal habilitado no Stripe test mode.
- Webhook de staging recebendo eventos com HTTP 200.

## Diferenças entre local e deployado

Local:

- `AUTH_URL=http://127.0.0.1:3000`
- Webhook via `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Pode usar Playwright automatizado local.

Staging deployado:

- `AUTH_URL=https://frontend-two-lovat-72.vercel.app`
- Webhook criado no Stripe Dashboard.
- Redirects do Checkout e Portal usam URL pública.
- Teste deve ser feito no navegador real contra o deploy.

## Fluxo individual a repetir

1. Criar/login de usuário sem assinatura.
2. Acessar `/dashboard`.
3. Confirmar paywall.
4. Acessar `/checkout`.
5. Confirmar que apenas Professional mensal aparece como self-service.
6. Abrir Stripe Checkout.
7. Pagar com cartão test mode `4242 4242 4242 4242`.
8. Confirmar retorno para `/checkout/return?status=success`.
9. Aguardar webhook.
10. Acessar `/dashboard`.
11. Confirmar dashboard liberado.
12. Acessar `/billing`.
13. Confirmar assinatura ativa.
14. Abrir Billing Portal.
15. Confirmar portal abriu e retorna para `/billing`.

## Falha de pagamento

1. Abrir checkout com usuário de teste sem acesso ou estado pendente.
2. Usar cartão `4000 0000 0000 0002`.
3. Confirmar erro no Checkout Stripe.
4. Conferir eventos `charge.failed` e `payment_intent.payment_failed`.
5. Conferir UX de billing para usuário `PAST_DUE`/pagamento pendente.

## Institucional a observar

Hospital deve continuar como venda assistida:

- Card Hospital mostra `Sob consulta`.
- CTA institucional deve ser `Solicitar implantação institucional`.
- Não deve parecer checkout automático.
- Não deve aparecer `Contratar licenças` para Hospital enquanto o plano estiver `CUSTOM`.
- Membro institucional sem `License.ACTIVE` deve continuar bloqueado.
- Membro institucional com `License.ACTIVE` deve acessar dashboard.
- Billing deve explicar organização/licença quando aplicável.

## Evidência de banco esperada

Após checkout individual:

```sql
select u.email, s."ownerType", s.plan, s.status, s."billingCycle", s."stripeCustomerId", s."stripeSubscriptionId"
from "Subscription" s
left join "User" u on u.id = s."userId"
order by s."updatedAt" desc
limit 10;
```

```sql
select u.email, l.status, l."subscriptionId", l."assignedAt"
from "License" l
left join "User" u on u.id = l."userId"
order by l."updatedAt" desc
limit 10;
```

```sql
select "stripeEventId", type, "processedAt", "createdAt"
from "StripeWebhookEvent"
order by "createdAt" desc
limit 20;
```

## Critérios de aceite

- Landing e login carregam no staging.
- `/checkout` mostra Professional self-service e Hospital assistido.
- Dashboard e navegação autenticada mostram Folha PCR e não mostram Calculadora completa.
- Checkout individual retorna com sucesso.
- Webhook processa eventos com 200.
- `Subscription.ACTIVE` ou `TRIALING` sincroniza.
- `License.ACTIVE` é criada para individual.
- `/dashboard` libera após webhook.
- `/billing` mostra status.
- Billing Portal abre.
- Cartão recusado exibe falha.
- Institucional sem licença bloqueia.
- Institucional com licença libera.

## Não executar nesta etapa

- Live mode.
- Mudança em fórmulas clínicas.
- Checkout institucional self-service.
- Refatoração ampla de billing/licenças.
