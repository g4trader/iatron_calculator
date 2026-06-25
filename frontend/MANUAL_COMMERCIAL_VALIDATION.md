# Validação manual do funil comercial Stripe test mode

Data: 2026-06-22

Esta validação alimenta os passos de produção descritos em `LIVE_MODE_RUNBOOK.md` e `GO_LIVE_CHECKLIST.md`.

## Ambiente usado

- App local: `http://127.0.0.1:3000`
- Banco: Supabase staging/E2E
- Prisma local: conexão direta Supabase `:5432` com `sslmode=require`
- Stripe: test mode
- Webhook: Stripe CLI forwarding para `localhost:3000/api/stripe/webhook`
- Navegador: Playwright + Chrome headless

Observação operacional: usar o pooler Supabase `:6543` para a app local causou erro Prisma de prepared statement (`prepared statement does not exist`). Para esta validação, `DATABASE_URL` e `DIRECT_URL` foram apontados para a conexão direta.

## Price IDs confirmados

Registros internos em `PlanPrice`:

- `price_professional_monthly` -> `price_1Tk9B82VzAAy18mjPoDGQuRO`
- `price_hospital_custom` -> `price_1Tk9B92VzAAy18mjrrmiAhIq`

O checkout individual consumiu `price_professional_monthly` e criou sessão Stripe real em test mode.

## Fluxo individual validado

Usuário: `e2e+no-access@iatron.test`

Resultado:

- Paywall inicial exibido.
- `/checkout` exibiu plano Professional.
- Checkout Stripe abriu em test mode.
- Pagamento com cartão de sucesso `4242 4242 4242 4242` retornou para `/checkout/return?status=success`.
- Webhook processou eventos Stripe com HTTP 200.
- `/dashboard` foi liberado após sincronização.
- `/billing` exibiu assinatura ativa.
- Stripe Billing Portal abriu corretamente.

Evidência no banco após checkout:

- `Subscription.status`: `ACTIVE`
- `Subscription.plan`: `PROFESSIONAL`
- `Subscription.billingCycle`: `MONTHLY`
- `License.status`: `ACTIVE`
- Eventos recebidos: `checkout.session.completed`, `customer.subscription.created`, `invoice.paid`, `invoice.payment_succeeded`, `payment_intent.succeeded`, entre outros.

## Falha de pagamento validada

Usuário: `e2e+past-due@iatron.test`

Resultado:

- Checkout Stripe abriu.
- Cartão de recusa `4000 0000 0000 0002` exibiu falha no Stripe.
- Webhook recebeu eventos de falha com HTTP 200.
- Usuário `PAST_DUE` continuou orientado para `/billing`.

Eventos confirmados:

- `charge.failed`
- `payment_intent.payment_failed`
- `customer.updated`

## Fluxo institucional validado

Usuários:

- `e2e+org-no-license@iatron.test`
- `e2e+org-licensed@iatron.test`

Resultado:

- Institucional sem `License.ACTIVE` permaneceu bloqueado.
- Institucional com `License.ACTIVE` acessou o dashboard.
- O plano Hospital aparece como `Sob consulta` e exibe `Falar com equipe`.
- Não há checkout institucional acionável pela UI atual porque `price_hospital_custom` usa `BillingCycle.CUSTOM` e é tratado como plano personalizado.

Limitação operacional:

- A assinatura institucional pode ser sincronizada pelo domínio/webhook, mas o fluxo comercial institucional completo não é executável pela UI atual enquanto Hospital estiver como `Sob consulta`.
- A atribuição de `License.ACTIVE` institucional depende de fluxo/admin/API existente, não de uma tela pública de checkout.

## Paywall

Estados validados:

- Individual sem acesso ativo -> bloqueado.
- Individual `ACTIVE` após checkout real -> liberado.
- Individual `PAST_DUE` -> bloqueado com orientação para `/billing`.
- Institucional sem licença -> bloqueado.
- Institucional com `License.ACTIVE` -> liberado.

## Evidências geradas

Screenshots da automação:

`frontend/test-results/manual-commercial-flow/`

Comando:

```bash
npm run test:manual-commercial
```

## Comandos usados

```bash
npx prisma validate
npm run e2e:seed
stripe listen --forward-to localhost:3000/api/stripe/webhook
npm run dev -- -H 127.0.0.1 -p 3000
npm run test:manual-commercial
npm run test:commercial
npm run build
```

As chaves e webhook secrets foram usados apenas por variáveis de ambiente e não devem ser gravados no repositório.

## Correções/ajustes aplicados

- Criada automação operacional `scripts/manual-commercial-flow.ts`.
- Adicionado script `npm run test:manual-commercial`.
- Automação passou a aguardar carregamento real da página Stripe, pois Checkout pode ficar alguns segundos em skeleton.
- Automação passou a aceitar estado inicial `PAYMENT_REQUIRED` quando uma sessão incompleta já tiver sido criada.

## Pendências

- Hospital foi mantido como venda assistida nesta etapa. Ver `INSTITUTIONAL_COMMERCIAL_DECISION.md`.
- Se no futuro houver checkout institucional self-service, criar um `PlanPrice` não custom para Hospital e validar o fluxo pela UI.
- Definir UI/admin operacional para atribuição de licenças institucionais.
- Executar fluxo manual equivalente em staging/Vercel antes de live mode.
