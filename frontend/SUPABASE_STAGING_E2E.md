# Supabase Staging/E2E Setup

Este guia prepara um ambiente cloud isolado para staging/E2E do Iatron. Não use o banco de produção para seed ou testes E2E.

## Arquitetura Recomendada

Use um projeto Supabase separado:

- Produção: `iatron-prod`
- Staging/E2E: `iatron-staging-e2e`

Motivo:

- isolamento forte entre produção e testes;
- menor risco de rodar seed E2E no banco errado;
- logs, conexões e backups separados;
- operação simples sem depender de banco local.

Branch persistente do Supabase também pode funcionar, mas o projeto separado é mais claro e seguro neste estágio.

## Provisioning no Supabase

1. Crie um novo projeto Supabase para staging/E2E.
2. Copie as connection strings em Project Settings > Database.
3. Use duas URLs:
   - `DATABASE_URL`: URL pooled/runtime para app serverless quando disponível.
   - `DIRECT_URL`: URL direta para Prisma migrations.
4. Garanta SSL, normalmente com `sslmode=require`.
5. Nunca use a connection string de produção neste ambiente.

Exemplo conceitual:

```bash
DATABASE_URL="postgresql://postgres.PROJECT:PASS@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres:PASS@db.PROJECT.supabase.co:5432/postgres?sslmode=require"
```

## Variáveis de Ambiente Staging/E2E

Configure localmente, no CI ou na Vercel Staging/Preview:

```bash
IATRON_ENV=staging
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
AUTH_URL=https://your-staging-domain.vercel.app
NEXTAUTH_URL=https://your-staging-domain.vercel.app
NEXT_PUBLIC_API_URL=https://iatron-calculator-api-609095880025.us-central1.run.app

PLAYWRIGHT_BASE_URL=https://your-staging-domain.vercel.app
E2E_PASSWORD=IatronE2E#2026

STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_SEMIANNUAL=price_...
STRIPE_PRICE_STARTER_ANNUAL=price_...
STRIPE_PRICE_STARTER_BIENNIAL=price_...
STRIPE_PRICE_PROFESSIONAL_ANNUAL=price_...
STRIPE_PRICE_PROFESSIONAL_SEMIANNUAL=price_...
STRIPE_PRICE_PROFESSIONAL_ANNUAL=price_...
STRIPE_PRICE_PROFESSIONAL_BIENNIAL=price_...
STRIPE_PRICE_HOSPITAL_CUSTOM=price_...
```

Para app local apontando para banco cloud:

```bash
IATRON_ENV=e2e
AUTH_URL=http://127.0.0.1:3000
NEXTAUTH_URL=http://127.0.0.1:3000
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000
```

Para Playwright local, prefira usar a URL direta do Supabase também em `DATABASE_URL`. O pooler pode retornar erro de prepared statement em processos Next.js locais de longa duração, por exemplo `prepared statement "s0" already exists`.

## Prisma Migrations Remotas

Sempre aplique mudanças via migrations versionadas:

```bash
cd frontend
IATRON_ENV=staging DATABASE_URL="..." DIRECT_URL="..." npm run prisma:deploy
```

Validação:

```bash
IATRON_ENV=staging DATABASE_URL="..." DIRECT_URL="..." npx prisma validate
```

Regras:

- Não editar tabelas manualmente no painel do Supabase.
- Não usar `prisma migrate reset` em staging compartilhado.
- Não rodar seed E2E em produção.
- Se houver drift, corrija criando migration no repositório e rode `migrate deploy`.

## Seed E2E no Banco Cloud

O seed exige `IATRON_ENV=staging`, `IATRON_ENV=e2e` ou `IATRON_ENV=local`.

```bash
cd frontend
IATRON_ENV=e2e DATABASE_URL="..." DIRECT_URL="..." npm run e2e:seed
```

O seed cria apenas fixtures com emails `e2e+...@iatron.test` e organizações `e2e-*`.

Usuários:

- `e2e+no-access@iatron.test`
- `e2e+active@iatron.test`
- `e2e+past-due@iatron.test`
- `e2e+org-no-license@iatron.test`
- `e2e+org-licensed@iatron.test`

Senha padrão:

```text
IatronE2E#2026
```

## Playwright Contra Cloud

### Opção A: app local com banco Supabase staging/E2E

Melhor para Stripe CLI local e debugging:

```bash
cd frontend
export IATRON_ENV=e2e
export DATABASE_URL="postgresql://postgres:PASS@db.PROJECT.supabase.co:5432/postgres?sslmode=require"
export DIRECT_URL="postgresql://postgres:PASS@db.PROJECT.supabase.co:5432/postgres?sslmode=require"
export AUTH_SECRET="..."
export AUTH_URL="http://127.0.0.1:3000"
export NEXTAUTH_URL="http://127.0.0.1:3000"
export PLAYWRIGHT_BASE_URL="http://127.0.0.1:3000"

npm run prisma:deploy
npm run e2e:seed
npm run test:e2e
```

### Opção B: deploy staging na Vercel com banco Supabase staging/E2E

Melhor para validar domínio público e variáveis Vercel:

```bash
cd frontend
export IATRON_ENV=staging
export DATABASE_URL="..."
export DIRECT_URL="..."
export PLAYWRIGHT_BASE_URL="https://your-staging-domain.vercel.app"

npm run e2e:seed
npm run test:e2e
```

Critério de aceite:

- 12 testes passando: 6 Chromium desktop e 6 mobile Chrome.

## Stripe Test Mode

Local forwarding:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Staging deployado:

```text
https://your-staging-domain.vercel.app/api/stripe/webhook
```

Eventos obrigatórios:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Valide no banco:

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

## Segurança Mínima

- Staging/E2E deve usar chaves Stripe test mode.
- `AUTH_SECRET` de staging deve ser diferente de produção.
- `DATABASE_URL` e `DIRECT_URL` devem ficar apenas em secret manager/Vercel env/CI.
- Não habilite `TEMP_LOGIN_ENABLED` em produção.
- Seed E2E possui trava por `IATRON_ENV`.
- Se possível, restrinja acesso ao projeto Supabase staging à equipe técnica.

## Ordem Operacional Recomendada

1. Criar projeto Supabase staging/E2E.
2. Configurar `DATABASE_URL` e `DIRECT_URL`.
3. Configurar envs Auth e backend.
4. Rodar `npm run prisma:deploy`.
5. Rodar `npm run e2e:seed`.
6. Rodar `npm run test:e2e`.
7. Configurar Stripe test mode.
8. Configurar webhook local ou staging.
9. Executar checkout teste.
10. Conferir `StripeWebhookEvent`, `Subscription`, `License` e paywall.
