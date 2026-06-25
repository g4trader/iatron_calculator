# Plano de Testes de Segurança e Operação

Este documento consolida a validação da política de sessão única, rotas protegidas, licença comercial, rate limiting, Stripe webhook e reconciliação.

## Cobertura Automatizada

### Sessão única

Coberto por:

- `tests/session-control.test.ts`
- `tests/security-contracts.test.ts`
- `e2e/security-session.spec.ts`

Cenários:

- sessão ativa atual é aceita;
- sessão revogada é recusada mesmo com JWT ainda presente;
- sessão substituída por login mais novo é recusada;
- idle timeout e absolute timeout são recusados;
- `lastSeenAt` só é atualizado após o intervalo de touch configurado;
- criação de sessão exclusiva usa transação com `pg_advisory_xact_lock`;
- login em browser context B invalida browser context A;
- logout em uma aba revoga sessão usada por outra aba.

### Rotas protegidas e bypass

Coberto por:

- `tests/security-contracts.test.ts`
- `e2e/security-session.spec.ts`
- `e2e/commercial-funnel.spec.ts`

Cenários:

- páginas privadas usam `requireAuth()` ou equivalente server-side;
- endpoints sensíveis não importam `auth()` diretamente;
- navegação global usa `getCurrentUser()` para evitar UI logada com sessão revogada;
- convite institucional exige sessão válida antes de aceitar;
- usuário comum é redirecionado ao tentar acessar `/admin`.

### Licença e acesso comercial

Coberto por:

- `tests/commercial-access.test.ts`
- `tests/organization-domain.test.ts`
- `e2e/commercial-funnel.spec.ts`
- `e2e/security-session.spec.ts`

Cenários:

- usuário sem licença ativa vê paywall;
- usuário individual ativo acessa Folha PCR;
- assinatura `past_due` bloqueia acesso premium e orienta para billing;
- organização sem licença atribuída bloqueia;
- organização com `License.ACTIVE` libera;
- membership/role institucional respeita permissões e assentos.

### Rate limiting e antifraude básico

Coberto por:

- `tests/auth-routes.test.ts`

Cenários:

- limite de login;
- limite de cadastro;
- limite de forgot password;
- limite de reset password;
- limite de verify email;
- limite de resend verification;
- resposta `429` com `Retry-After`;
- fail-closed em produção sem Redis distribuído;
- logger de auditoria não registra senha ou token.

### Stripe webhook e reconciliação

Coberto por:

- `tests/billing-domain.test.ts`
- `tests/security-contracts.test.ts`
- `scripts/stripe-webhook-smoke.ts`
- `scripts/reconcile-billing.ts`

Cenários:

- webhook usa raw body e `constructEvent`;
- evento é gravado antes de efeitos colaterais;
- replay por `event.id` vira no-op;
- corrida de unicidade no banco é tratada como duplicidade;
- sync de assinatura chama sync de licença;
- status ativos liberam licença e status não ativos bloqueiam.

## Comandos Locais

```bash
cd frontend
npm run e2e:check
npx prisma validate
npx prisma generate
npm run test:session
npm run test:security
npm run test:auth
npm run test:commercial
npm run test:organization
npm run test:billing
npm run build
```

## E2E Local ou Staging

Requer `DATABASE_URL` apontando para banco isolado ou staging seguro.

O Playwright carrega automaticamente, nesta ordem:

- `.env.e2e.local`
- `.env.local`

Não use `.env.production.local` para seed E2E.

Arquivo local recomendado:

```bash
# frontend/.env.e2e.local
IATRON_ENV=e2e
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
AUTH_SECRET="..."
AUTH_URL="http://127.0.0.1:3000"
NEXTAUTH_URL="http://127.0.0.1:3000"
PLAYWRIGHT_BASE_URL="http://127.0.0.1:3000"
E2E_PASSWORD="IatronE2E#2026"
NEXT_PUBLIC_API_URL="https://iatron-calculator-api-609095880025.us-central1.run.app"
```

```bash
cd frontend
npm run e2e:check
npm run e2e:seed
npm run test:e2e
```

Para testar uma URL já deployada:

```bash
cd frontend
PLAYWRIGHT_BASE_URL=https://sua-url-staging.vercel.app npm run e2e:check
PLAYWRIGHT_BASE_URL=https://sua-url-staging.vercel.app npm run test:e2e
```

## Roteiro Manual de Staging

Pré-requisitos:

- staging com migrations aplicadas;
- `AUTH_SECRET`, `AUTH_URL`, `NEXTAUTH_URL` configurados;
- `DATABASE_URL` apontando para banco de staging;
- Upstash Redis configurado;
- Stripe test mode configurado;
- webhook Stripe apontando para `/api/stripe/webhook`;
- fixtures E2E criadas com `IATRON_ENV=staging npm run e2e:seed`.

Contas padrão:

- `e2e+no-access@iatron.test`
- `e2e+active@iatron.test`
- `e2e+past-due@iatron.test`
- `e2e+org-no-license@iatron.test`
- `e2e+org-licensed@iatron.test`

Senha padrão:

- `IatronE2E#2026`, salvo se `E2E_PASSWORD` estiver diferente.

Passos:

1. Abrir navegador A e entrar com `e2e+active@iatron.test`.
2. Confirmar acesso à Folha PCR.
3. Abrir navegador B ou janela anônima e entrar com o mesmo usuário.
4. Voltar ao navegador A, acessar `/dashboard/pcr` e confirmar redirecionamento para `/login`.
5. No navegador B, clicar em `Sair`.
6. Em outra aba do mesmo navegador, tentar acessar `/dashboard/pcr` e confirmar redirecionamento para `/login`.
7. Entrar com `e2e+no-access@iatron.test` e confirmar paywall.
8. Entrar com `e2e+past-due@iatron.test`, abrir `/billing` e confirmar orientação de regularização.
9. Entrar com `e2e+org-no-license@iatron.test` e confirmar bloqueio por licença institucional não atribuída.
10. Entrar com `e2e+org-licensed@iatron.test` e confirmar acesso premium.
11. Entrar com usuário comum e acessar `/admin`; confirmar redirecionamento para `/dashboard`.

## Checklist Operacional de Staging

### Pré-requisitos

- Banco isolado de staging/E2E criado.
- Migrations aplicadas com `npm run prisma:deploy`.
- `.env.e2e.local`, Vercel Preview ou CI com envs corretas.
- `IATRON_ENV=staging` ou `IATRON_ENV=e2e`.
- `TEMP_LOGIN_ENABLED=false`.
- Redis Upstash configurado para validar rate limit distribuído.
- Stripe test mode configurado, sem `sk_live` ou `pk_live`.

### Envs obrigatórias

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_API_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RATE_LIMIT_ALLOW_MEMORY_FALLBACK=false`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_PROFESSIONAL_MONTHLY`

### Comandos

```bash
cd frontend
npm run e2e:check
npm run prisma:deploy
npm run e2e:seed
npm run test:e2e
npm run test:session
npm run test:auth
npm run test:security
npm run test:commercial
npm run test:billing
npm run build
```

### Sequência operacional verificável

1. Preparar `.env.e2e.local`.
   - Sucesso: `npm run e2e:check` mostra `OK` para envs obrigatórias.
   - Abortar se: qualquer item obrigatório estiver `MISSING_OR_PLACEHOLDER` ou `INVALID`.
2. Aplicar migrations.
   - Comando: `npm run prisma:deploy`.
   - Sucesso: Prisma conclui `migrate deploy` e `generate`.
   - Abortar se: houver drift, erro de conexão ou schema incompatível.
   - Produção: exige `ALLOW_PRODUCTION_MIGRATIONS=true`; staging/E2E não deve usar `IATRON_ENV=production`.
3. Criar fixtures.
   - Comando: `npm run e2e:seed`.
   - Sucesso: saída JSON com `ok: true` e usuários `e2e+...@iatron.test`.
   - Abortar se: `IATRON_ENV` for `production`, seed recusar ambiente ou banco não conectar.
4. Executar E2E.
   - Comando: `npm run test:e2e`.
   - Sucesso: desktop e mobile passam sem retry local.
   - Abortar se: sessão A continuar acessando depois do login B, admin abrir para usuário comum ou licença inativa liberar premium.
5. Executar testes rápidos e build.
   - Comandos: `npm run test:security`, `npm run test:auth`, `npm run test:commercial`, `npm run test:billing`, `npm run build`.
   - Sucesso: todos passam.
6. Validar Stripe webhook.
   - Sucesso: assinatura válida retorna `200`, inválida retorna `400`, replay não duplica efeitos.
7. Rodar reconciliação.
   - Comando: `npm run billing:reconcile`.
   - Sucesso: saída JSON com `ok: true` e divergência simulada corrigida.
8. Rodar limpeza apenas em staging quando necessário.
   - Comando: `npm run security:cleanup`.
   - Sucesso: saída JSON com contadores de exclusão esperados.

### Condições de rollback/abort

- Qualquer env apontando para produção durante E2E.
- Uso de chave Stripe `sk_live` ou `pk_live`.
- `TEMP_LOGIN_ENABLED=true` em staging público.
- E2E falhando em sessão única, licença ou admin.
- Webhook retornando `2xx` para assinatura inválida.
- Replay de webhook criando segunda licença, segunda subscription indevida ou duplicando `StripeWebhookEvent`.
- Reconciliação alterando registros fora dos fixtures/testes esperados.

### Critérios de aprovação

- E2E desktop e mobile passando.
- Sessão A perde acesso após login da sessão B.
- Logout invalida outra aba da mesma sessão.
- Usuário sem licença vê paywall.
- Usuário com licença ativa acessa Folha PCR.
- Institucional sem licença bloqueia.
- Institucional com licença acessa.
- Usuário comum não acessa admin.
- Webhook Stripe responde `200` para assinatura válida.
- Assinatura inválida responde `400`.
- Replay do mesmo evento não duplica efeitos.
- `billing:reconcile` corrige divergência simulada.

## Roteiro Stripe Webhook

Com Stripe CLI:

```bash
stripe listen --forward-to http://127.0.0.1:3000/api/stripe/webhook
```

Configurar `STRIPE_WEBHOOK_SECRET` com o secret exibido pela CLI.

Eventos mínimos:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
```

Smoke test assinado contra o endpoint configurado:

```bash
npm run stripe:webhook:smoke
```

Assinatura inválida:

```bash
curl -i -X POST "$AUTH_URL/api/stripe/webhook" \
  -H "content-type: application/json" \
  -H "stripe-signature: invalid" \
  --data '{"id":"evt_invalid_signature_check","object":"event","type":"customer.subscription.updated","data":{"object":{}}}'
```

Resultado esperado: HTTP `400`.

Replay:

- rodar `npm run stripe:webhook:smoke`;
- confirmar no JSON de saída que `duplicate` retornou `{ "received": true, "duplicate": true }`;
- conferir no banco que existe apenas um registro por `stripeEventId`.

Evidência mínima a guardar:

- saída do `stripe listen`;
- saída do `stripe trigger`;
- saída do `npm run stripe:webhook:smoke`;
- captura/consulta de `StripeWebhookEvent`;
- consulta de `Subscription`;
- consulta de `License`;
- resultado de `npm run billing:reconcile`.

Validar:

- endpoint responde `200` para assinatura válida;
- assinatura inválida responde `400`;
- replay do mesmo `event.id` não duplica `StripeWebhookEvent`;
- `Subscription` fica sincronizada;
- `License` reflete status ativo/inativo;
- `npm run billing:reconcile` corrige divergência simulada.

## Dependências Externas

- Redis real é obrigatório em produção para rate limiting distribuído.
- Stripe CLI ou dashboard Stripe é necessário para validar assinatura real e replay operacional.
- E2E com login real exige banco com seed e servidor Next acessível.

## Riscos Remanescentes

- Testes unitários não substituem validação manual multi-navegador em staging.
- O E2E não força corrida física de login simultâneo no mesmo milissegundo; o contrato de lock e o cenário A/B reduzem esse risco.
- Reconciliação real depende de credenciais Stripe test mode e IDs de preço coerentes.
- JWT revogado só é bloqueado em rotas que passam por `getCurrentUser()`/`requireAuth()` ou contrato equivalente.
