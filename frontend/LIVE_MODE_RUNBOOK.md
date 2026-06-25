# Runbook de Produção Stripe Live Mode

Objetivo: ativar o Iatron em produção real com Stripe live mode, domínio final, webhook público, rollback e monitoramento mínimo de billing.

Este documento não ativa live mode sozinho. Ele descreve a execução controlada para quando produto, domínio, suporte e operação estiverem prontos.

## Estado Atual Confirmado

Staging validado em test mode:

- URL staging atual: `https://frontend-two-lovat-72.vercel.app`
- Webhook test mode: `https://frontend-two-lovat-72.vercel.app/api/stripe/webhook`
- Webhook ID test mode: `we_1Tl5Jk2VzAAy18mjX3G61v13`
- Professional mensal test mode: `price_1Tk9B82VzAAy18mjPoDGQuRO`
- Hospital test mode assistido/custom: `price_1Tk9B92VzAAy18mjrrmiAhIq`
- Checkout individual real validado.
- Billing Portal validado.
- Falha de pagamento validada.
- Hospital permanece venda assistida.

Mapeamento atual no banco staging:

- `PlanPrice.id=price_professional_monthly` -> `stripePriceId=price_1Tk9B82VzAAy18mjPoDGQuRO`
- `PlanPrice.id=price_hospital_custom` -> `stripePriceId=price_1Tk9B92VzAAy18mjrrmiAhIq`

## Decisão Institucional

Hospital não terá checkout institucional self-service nesta ativação.

Modelo live:

- Professional: self-service, cartão, assinatura recorrente.
- Hospital: venda assistida, contrato comercial, implantação e atribuição de licenças.

O plano Hospital pode existir no Stripe live para cobrança assistida, mas a UI deve continuar mostrando `Sob consulta` e `Solicitar implantação institucional`.

## 1. Produtos Stripe Live

Criar no Stripe Dashboard em live mode, nunca em test mode.

### Professional

Produto:

- Nome: `Iatron Professional`
- Descrição: `Acesso individual às calculadoras clínicas premium do Iatron`
- Metadata recomendada:
  - `iatron_plan=PROFESSIONAL`
  - `audience=INDIVIDUAL`
  - `environment=production`

Preço:

- Recorrência: mensal
- Moeda: BRL
- Valor inicial recomendado: confirmar comercialmente antes de criar. Staging usa R$ 79,00.
- Billing scheme: per unit
- Lookup key recomendado: `iatron_professional_monthly_brl`
- Metadata:
  - `iatron_plan_price_id=price_professional_monthly`
  - `billing_cycle=MONTHLY`

### Hospital

Produto:

- Nome: `Iatron Hospital`
- Descrição: `Plano institucional assistido com gestão de licenças`
- Metadata recomendada:
  - `iatron_plan=HOSPITAL`
  - `audience=INSTITUTIONAL`
  - `sales_model=assisted`
  - `environment=production`

Preço:

- Se a cobrança institucional for feita pelo Stripe:
  - Criar preço recorrente mensal por licença ou por contrato, conforme proposta comercial.
  - Não habilitar checkout self-service enquanto o `PlanPrice` no app continuar `CUSTOM`.
- Lookup key recomendado, se houver preço mensal por licença: `iatron_hospital_monthly_brl`
- Metadata:
  - `iatron_plan_price_id=price_hospital_custom`
  - `billing_cycle=CUSTOM`
  - `sales_model=assisted`

## 2. Atualizar Price IDs Live

Há duas formas aceitas. Escolher uma e manter consistente.

### Opção A: Banco como fonte principal

Atualizar `PlanPrice.stripePriceId` no banco de produção:

```sql
update "PlanPrice"
set "stripePriceId" = 'price_LIVE_PROFESSIONAL_MONTHLY'
where id = 'price_professional_monthly';
```

Para Hospital assistido, somente preencher se o Stripe live será usado para cobrança institucional assistida:

```sql
update "PlanPrice"
set "stripePriceId" = 'price_LIVE_HOSPITAL'
where id = 'price_hospital_custom';
```

Validar:

```sql
select pp.id, pc.code, pc.audience, pp."billingCycle", pp."amountCents", pp."stripePriceId"
from "PlanPrice" pp
join "PlanCatalog" pc on pc.id = pp."planCatalogId"
order by pp.id;
```

### Opção B: Env como fallback

Configurar na Vercel:

```bash
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_LIVE_PROFESSIONAL_MONTHLY
STRIPE_PRICE_HOSPITAL_CUSTOM=price_LIVE_HOSPITAL
```

O backend resolve `planPrice.stripePriceId` primeiro e usa `STRIPE_PRICE_*` como fallback. Se ambos existirem, o banco ganha.

Recomendação: para produção, usar banco como fonte principal e manter envs como fallback controlado.

## 3. Envs Stripe Live em Produção

Configurar na Vercel Production:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_live_...
STRIPE_PRICE_HOSPITAL_CUSTOM=price_live_...
```

Regras:

- Nunca misturar `pk_test` com `sk_live`.
- Nunca misturar `sk_test` com webhook `whsec` live.
- Conferir no Stripe Dashboard se o modo no topo está `Live`.
- Não expor secrets em documentação, logs ou client.

## 4. Domínio Final

Domínio final definido:

```text
https://app.iatron.com.br
```

O estado DNS e as envs planejadas estão em `PRODUCTION_DOMAIN.md`.

Definir e validar domínio final antes do live mode.

Não atualizar `AUTH_URL`/`NEXTAUTH_URL` para `app.iatron.com.br` enquanto `dig +short app.iatron.com.br` não retornar um destino válido e a Vercel não mostrar SSL ativo.

```text
https://app.iatron.com.br
```

Na Vercel:

1. Adicionar domínio no projeto `frontend`.
2. Configurar DNS conforme Vercel.
3. Aguardar SSL ativo.
4. Validar HTTP 200 em `/`.
5. Validar `/api/health`.

Atualizar envs:

```bash
AUTH_URL=https://app.iatron.com.br
NEXTAUTH_URL=https://app.iatron.com.br
NEXT_PUBLIC_API_URL=https://iatron-calculator-api-609095880025.us-central1.run.app
```

O app monta redirects de checkout e portal a partir de `AUTH_URL`/`NEXTAUTH_URL`. Portanto, domínio errado causa redirect errado.

Validar:

- Login por email/senha.
- `/checkout`.
- Redirect do Stripe Checkout.
- Retorno `/checkout/return?status=success`.
- Billing Portal retorna para `/billing`.

## 5. Webhook Stripe Live

Endpoint final:

```text
https://app.iatron.com.br/api/stripe/webhook
```

Criar no Stripe Dashboard em live mode:

1. Developers -> Webhooks.
2. Add endpoint.
3. Endpoint URL: domínio final + `/api/stripe/webhook`.
4. Eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `payment_intent.payment_failed`
   - `billing_portal.session.created`
5. Copiar signing secret `whsec_...`.
6. Atualizar `STRIPE_WEBHOOK_SECRET` na Vercel Production.
7. Redeployar se necessário.

Validar webhook:

- Abrir Stripe Dashboard -> Webhooks -> endpoint live.
- Executar compra controlada live de baixo risco.
- Conferir status HTTP 200.
- Conferir `StripeWebhookEvent` no banco.
- Conferir `Subscription` sincronizada.
- Conferir `License.ACTIVE` para individual.

Query:

```sql
select "stripeEventId", type, "processedAt", "createdAt"
from "StripeWebhookEvent"
order by "createdAt" desc
limit 20;
```

## 6. Fluxo de Validação Live Controlada

Executar com conta interna antes de vender.

1. Criar usuário interno.
2. Acessar `/dashboard`.
3. Confirmar paywall.
4. Acessar `/checkout`.
5. Assinar Professional.
6. Pagar com cartão real controlado.
7. Confirmar retorno para domínio final.
8. Aguardar webhook.
9. Confirmar `/dashboard` liberado.
10. Confirmar `/billing`.
11. Abrir Billing Portal.
12. Cancelar ou reembolsar a assinatura de teste conforme política.
13. Conferir webhook de cancelamento/atualização.

Não executar live com cartão de paciente/cliente antes do aceite completo.

## 7. Hospital em Produção

Fluxo assistido:

1. Comercial aprova contrato.
2. Organização é criada/revisada.
3. Assinatura institucional é criada no Stripe live se aplicável.
4. `Subscription` institucional é sincronizada.
5. Licenças são atribuídas a usuários.
6. Usuário com `License.ACTIVE` acessa dashboard.
7. Usuário sem licença permanece bloqueado.

Antes de vender Hospital:

- Definir responsável operacional por ativação.
- Definir processo de atribuição/revogação de licenças.
- Definir suporte para administradores.
- Definir política de alteração de seats.

## 8. Rollback

### Rollback de Deploy Vercel

1. Abrir Vercel -> Project `frontend` -> Deployments.
2. Selecionar último deployment estável.
3. Promote to Production.
4. Validar `/`, `/login`, `/checkout`, `/api/health`.
5. Não alterar Stripe nem banco durante rollback, salvo se o incidente exigir.

Via CLI:

```bash
vercel rollback
```

Use CLI apenas se o operador souber exatamente qual deployment será promovido.

### Rollback de Price IDs

Se price ID live estiver errado:

1. Pausar CTA de checkout removendo/limpando price live ou voltando para price correto.
2. Não apagar produtos/preços usados por assinaturas existentes.
3. Criar novo price correto no Stripe; Stripe não permite editar valor de price existente.
4. Atualizar `PlanPrice.stripePriceId` ou env fallback.
5. Redeployar, se env mudou.
6. Validar checkout novamente.

### Rollback de Webhook

Se webhook falhar:

1. Verificar logs Vercel do endpoint `/api/stripe/webhook`.
2. Verificar `STRIPE_WEBHOOK_SECRET` live.
3. Verificar se endpoint está no domínio final correto.
4. Corrigir secret/env e redeployar.
5. No Stripe Dashboard, reenviar eventos falhados.
6. Conferir idempotência em `StripeWebhookEvent`.

Não criar múltiplos endpoints live apontando para versões diferentes sem necessidade; isso pode duplicar processamento.

### Rollback de Domínio

Se domínio final falhar:

1. Manter alias Vercel anterior ativo, se possível.
2. Reverter DNS para última configuração válida.
3. Atualizar `AUTH_URL` e `NEXTAUTH_URL` para domínio funcional.
4. Atualizar webhook Stripe para domínio funcional.
5. Validar redirects de checkout.

### Continuidade de Billing

- Assinaturas Stripe continuam existindo mesmo se o app estiver instável.
- Não excluir customers/subscriptions.
- Preservar `stripeCustomerId` e `stripeSubscriptionId`.
- Se eventos ficarem pendentes, corrigir webhook e reenviar pelo Stripe.
- Se usuário pagou e não liberou, verificar assinatura no Stripe e sincronizar/atribuir licença manualmente se necessário.

## 9. Monitoramento Mínimo de Billing

### Métricas

- Checkout sessions criadas.
- Checkout sessions concluídas.
- Taxa de `checkout.session.completed`.
- `invoice.payment_failed` por dia.
- Subscriptions `ACTIVE`, `TRIALING`, `PAST_DUE`, `CANCELED`, `UNPAID`.
- Licenças criadas por assinatura individual.
- Usuários pagos bloqueados indevidamente.
- Churn/cancelamentos.

### Alertas Recomendados

- Webhook com HTTP >= 400.
- Ausência de webhook após checkout concluído.
- `invoice.payment_failed` recorrente.
- `customer.subscription.created` sem `Subscription` interna.
- `Subscription.ACTIVE` sem `License.ACTIVE` para usuário individual.
- Erro em `/api/stripe/create-checkout-session`.
- Erro em `/api/stripe/create-portal-session`.

### Ferramentas

- Stripe Dashboard -> Events.
- Stripe Dashboard -> Webhooks.
- Vercel Logs.
- Banco: `StripeWebhookEvent`, `Subscription`, `License`.
- Futuro: Sentry/Logtail/Axiom ou equivalente.

### Investigação de Incidente

1. Identificar usuário e horário.
2. Localizar customer/subscription no Stripe.
3. Conferir eventos Stripe.
4. Conferir logs Vercel no mesmo horário.
5. Consultar `StripeWebhookEvent`.
6. Consultar `Subscription`.
7. Consultar `License`.
8. Corrigir env/config/dados.
9. Reenviar evento Stripe se necessário.
10. Registrar causa e ação preventiva.

## 10. Checklist Antes de Trocar para Live

- Domínio final ativo com SSL.
- `AUTH_URL` e `NEXTAUTH_URL` apontando para domínio final.
- Banco de produção escolhido e migrado.
- `DATABASE_URL` serverless configurada.
- Migrations aplicadas fora do build Vercel.
- Produtos Stripe live criados.
- Prices Stripe live criados.
- Price IDs live mapeados em `PlanPrice` ou envs.
- Webhook live criado no Stripe Dashboard.
- `STRIPE_WEBHOOK_SECRET` live configurado.
- Billing Portal live habilitado.
- Fluxo individual live testado com compra controlada.
- Webhook live respondeu 200.
- `Subscription` e `License` sincronizaram.
- Falha de pagamento compreendida.
- Hospital assistido documentado.
- Processo de licenças institucionais definido.
- Rollback de deploy definido.
- Rollback de price/webhook definido.
- Monitoramento mínimo ativo.
- Suporte sabe investigar billing.

## 11. Comandos Úteis

Listar envs Vercel sem valores:

```bash
vercel env ls production
```

Deploy:

```bash
vercel deploy --prod --yes
```

Healthcheck:

```bash
curl -sS https://app.iatron.com.br/api/health
```

Conferir price IDs:

```sql
select pp.id, pc.code, pc.audience, pp."billingCycle", pp."amountCents", pp."stripePriceId"
from "PlanPrice" pp
join "PlanCatalog" pc on pc.id = pp."planCatalogId"
order by pp.id;
```

Conferir assinatura/licença:

```sql
select u.email, s."ownerType", s.plan, s.status, s."billingCycle", s."stripeSubscriptionId", s."updatedAt"
from "Subscription" s
left join "User" u on u.id = s."userId"
order by s."updatedAt" desc
limit 20;
```

```sql
select u.email, o.slug, l.status, l."subscriptionId", l."assignedAt", l."updatedAt"
from "License" l
left join "User" u on u.id = l."userId"
left join "Organization" o on o.id = l."organizationId"
order by l."updatedAt" desc
limit 20;
```
