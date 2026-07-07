# iatron.PED Production Infrastructure

Este documento define o desenho operacional recomendado para produção e staging. Ele não ativa live mode sozinho; ele descreve a infra-alvo e os comandos seguros.

## Decisão Recomendada

Usar o ambiente Vercel atual como candidato de produção somente depois de corrigir os bloqueadores abaixo, porque ele já está ligado ao domínio final `ped.iatron.com.br` e já possui envs de produção configuradas.

Criar uma réplica explícita para staging em vez de usar o mesmo ambiente como staging permanente.

Motivo: o ambiente atual já mistura domínio final, Production env da Vercel, Stripe test mode/histórico de validação e dados de staging. Promover esse estado sem separar staging cria risco de operar teste e produção no mesmo plano.

## Ambientes

### Production

- Frontend: Vercel project atual `frontend`.
- Domínio: `https://ped.iatron.com.br`.
- Backend clínico: Cloud Run production, serviço recomendado `iatron-calculator-api`.
- Banco: PostgreSQL production dedicado.
- Storage: GCS bucket production privado.
- Rate limit: Firestore production ou Upstash production.
- Stripe: live mode apenas quando a revisão final aprovar.

### Staging

- Frontend: novo Vercel project recomendado `iatron-ped-staging`.
- Domínio recomendado: `https://staging-ped.iatron.com.br` ou subdomínio Vercel fixo.
- Backend clínico: Cloud Run staging recomendado `iatron-calculator-api-staging`.
- Banco: PostgreSQL staging dedicado.
- Storage: GCS bucket staging privado.
- Rate limit: Firestore staging collection separada ou projeto GCP separado.
- Stripe: test mode.

## Bloqueadores Atuais Antes de Produção

1. `/admin/operations` apresenta exceção server-side em sessão autenticada.
   - Suspeita principal: schema/migrations do banco remoto divergente das páginas admin atuais.
   - Ação: aplicar e verificar migrations com `DIRECT_URL` real.

2. Valores sensíveis da Vercel não estão disponíveis localmente via CLI.
   - `vercel env ls` confirma chaves, mas arquivos puxados localmente têm valores vazios.
   - Ação: rodar migrations por GitHub Actions com secrets de environment ou por máquina segura com connection strings reais.

3. Staging ainda não está isolado.
   - Ação: criar Vercel/GCP/Postgres/GCS separados para staging antes de iniciar produção ampla.

4. Cloud Run está em um único serviço.
   - Ação: criar serviço staging separado antes de deployments frequentes.

## Variáveis por Ambiente

### Obrigatórias para iniciar o app

- `IATRON_ENV`
- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_API_URL`

### Obrigatórias para admin seguro

- `RATE_LIMIT_PROVIDER=firestore` ou Upstash configurado
- `RATE_LIMIT_ALLOW_MEMORY_FALLBACK=false`
- `GCP_PROJECT_ID`
- `GCP_SERVICE_ACCOUNT_EMAIL`
- `GCP_PRIVATE_KEY`
- `FIRESTORE_DATABASE_ID`
- `RATE_LIMIT_FIRESTORE_COLLECTION`

### Obrigatórias para archive/export/restore

- `ARCHIVE_STORAGE_PROVIDER=gcs`
- `ARCHIVE_GCS_BUCKET`
- `ARCHIVE_GCS_PREFIX`
- `GCP_PROJECT_ID`
- `GCP_SERVICE_ACCOUNT_EMAIL`
- `GCP_PRIVATE_KEY`
- `ADMIN_EXPORT_ALLOW_INLINE_FALLBACK=false` ou ausente

### Obrigatórias para Stripe

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_PROFESSIONAL_ANNUAL`

## CI/CD

### Frontend CI

Workflow: `.github/workflows/frontend-ci.yml`

Executa em PR e push para `main`:

- `npm ci`
- `npx prisma validate`
- `npx prisma generate`
- suítes críticas de auth/session/security/commercial/billing/admin
- `npm run build`

### Migrations

Workflow: `.github/workflows/prisma-migrate-deploy.yml`

Manual, por environment GitHub:

- `staging`
- `production`

Produção exige confirmação literal:

```text
APPLY PRODUCTION MIGRATIONS
```

Secrets necessários em cada environment GitHub:

- `DATABASE_URL`
- `DIRECT_URL`

### Backend Cloud Run

Workflow: `.github/workflows/backend-cloud-run-deploy.yml`

Manual, com Workload Identity Federation.

Secrets necessários no environment GitHub:

- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_DEPLOY_SERVICE_ACCOUNT`

Variable necessária:

- `CORS_ORIGINS`

## Setup Staging

1. Criar banco staging dedicado.
2. Criar bucket GCS staging privado.
3. Criar Cloud Run staging:

```bash
gcloud run deploy iatron-calculator-api-staging \
  --source backend \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "CORS_ORIGINS=https://staging-ped.iatron.com.br"
```

4. Criar Vercel project staging e configurar envs staging.
5. Rodar migrations staging pelo workflow manual.
6. Criar/promover usuário ADMIN staging.
7. Validar:

```bash
ADMIN_READINESS_STRICT=true \
ADMIN_STAGING_BASE_URL=https://staging-ped.iatron.com.br \
npm run admin:readiness
```

## Setup Production

1. Corrigir `/admin/operations` em production candidate.
2. Aplicar migrations production pelo workflow manual.
3. Confirmar `/api/health`.
4. Confirmar login admin.
5. Confirmar `/admin`, `/admin/system`, `/admin/operations`, `/admin/exports`, `/admin/archive`, `/admin/retention`.
6. Confirmar storage GCS production.
7. Confirmar rate limit distribuído.
8. Confirmar Stripe live apenas no momento aprovado.
9. Executar readiness estrito contra `https://ped.iatron.com.br`.

## Critério de Produção Estável

- Build remoto Ready.
- Banco com migrations aplicadas.
- Admin sem exceção server-side.
- `/admin/system` sem env crítica missing.
- `/admin/operations` healthy/degraded controlado, nunca crash.
- Archive/export gravando em storage privado.
- Rate limiting distribuído ativo.
- Stripe live/test coerente com o ambiente.
- Rollback documentado.

## Rollback

Frontend:

- Reverter deployment na Vercel para último Ready.

Backend:

```bash
gcloud run services update-traffic iatron-calculator-api \
  --region us-central1 \
  --to-revisions REVISION_NAME=100
```

Banco:

- Não usar `migrate reset`.
- Para migrations aplicadas, rollback deve ser script SQL revisado ou restore de backup.

## Próxima Ação Operacional

Aplicar migrations com `DIRECT_URL` real e reproduzir `/admin/operations` autenticado. Sem isso, produção ampla está bloqueada.
