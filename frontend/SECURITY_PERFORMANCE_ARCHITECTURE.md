# Segurança, Sessão e Performance do MVP

## Diagnóstico da Base Atual

- Frontend: Next.js App Router com Auth.js, Prisma e Stripe.
- Backend clínico: FastAPI stateless no Cloud Run, usado apenas como motor de cálculo.
- Banco: PostgreSQL via Prisma.
- Auth atual: Auth.js com `session.strategy = "jwt"` e Credentials provider.
- Middleware atual: protege rotas pela presença de cookie; a validação real ocorre em `auth()`/`requireAuth()`.
- Billing: Stripe Checkout, Billing Portal, webhook assinado e idempotente.

## Achados da Auditoria de Hardening

- Algumas rotas de organização usavam `auth()` diretamente por meio de `getAuthenticatedUserId()`. Isso bypassava a validação de `UserSession`. Corrigido para usar `requireAuth()`.
- A página de aceite de convite institucional usava `auth()` diretamente. Corrigido para usar `requireAuth()`.
- `/login` e `/register` usavam `auth()` diretamente para redirecionar usuário logado. Em sessão revogada, isso podia gerar loop `login -> dashboard -> login`. Corrigido para usar `getCurrentUser()`.
- OAuth opcional podia criar JWT sem `sessionId`, porque a sessão exclusiva estava no Credentials provider. Corrigido no callback `jwt`.
- Login simultâneo tinha risco de interleaving com duas sessões ativas temporárias. Corrigido com lock transacional PostgreSQL por usuário.
- `UserSession`, `SecurityEvent` e `CalculationHistory` podem crescer indefinidamente. Foi criado script operacional de cleanup com retenção configurável.
- Licença: `Subscription` e `License` já modelam acesso individual e institucional.

## Decisão Arquitetural

Foi escolhida a opção: **manter Auth.js com JWT + camada server-side complementar de sessão ativa**.

Motivos:

- O login principal usa Credentials provider, que é naturalmente mais compatível com JWT no Auth.js.
- Migração imediata para database sessions seria mais disruptiva.
- A camada `UserSession` entrega revogação imediata, sessão única e timeout sem trocar a stack.
- O JWT continua carregando apenas o identificador da sessão; a autorização real consulta o banco no servidor.

Trade-offs:

- Segurança: melhora substancialmente a revogação e sessão única, mas ainda depende de validação server-side em rotas sensíveis.
- Simplicidade: menor impacto que migrar Auth.js inteiro.
- Performance: adiciona uma leitura de sessão no banco por request autenticado server-side.
- Revogação: imediata para páginas/APIs que passam por `requireAuth()`.

## Modelo de Dados de Sessão

Novos modelos:

- `UserSession`
- `SecurityEvent`

Campos principais de `UserSession`:

- `userId`
- `sessionKeyHash`
- `status`
- `createdAt`
- `lastSeenAt`
- `expiresAt`
- `idleExpiresAt`
- `revokedAt`
- `revokeReason`
- `ipHash`
- `userAgentHash`
- `deviceFingerprintHash`
- `replacedBySessionId`

Política:

- Novo login cria uma sessão nova.
- Sessões ativas anteriores do mesmo usuário são revogadas.
- `requireAuth()` valida se a sessão do JWT ainda é a sessão ativa.
- Logout revoga a sessão atual.
- Reset de senha revoga todas as sessões do usuário.
- Idle timeout padrão: `SESSION_IDLE_TIMEOUT_MINUTES`, default 480 minutos.
- Absolute timeout padrão: `SESSION_ABSOLUTE_TIMEOUT_MINUTES`, default 20160 minutos.

## Fluxo de Autenticação e Autorização

1. Login por email/senha valida credenciais e email verificado.
2. `createExclusiveUserSession()` cria a sessão ativa e revoga anteriores.
3. JWT recebe `sessionId`.
4. Server-side `requireAuth()` chama `validateCurrentUserSession()`.
5. Acesso comercial chama `getCommercialEntitlement()`.
6. Recurso clínico é liberado somente se sessão e licença/assinatura estiverem válidas.

Rotas sensíveis que devem sempre passar por `requireAuth()`:

- dashboard e calculadoras.
- checkout e billing portal.
- profile.
- admin.
- APIs de organização/licenças.
- histórico de cálculo.

Exceções esperadas:

- rotas públicas de auth.
- healthcheck.
- webhook Stripe, protegido por assinatura Stripe.

## Política de Antifraude MVP

Eventos auditados:

- `SESSION_CREATED`
- `SESSION_REPLACED`
- `SESSION_REVOKED`
- `SESSION_EXPIRED`
- `SESSION_INVALID`
- `DEVICE_CHANGED`
- `MULTIPLE_IPS`
- `RATE_LIMITED`
- `BILLING_RECONCILED`

Heurísticas implementadas:

- Novo login substitui sessão anterior.
- Troca de user-agent em janela recente gera `DEVICE_CHANGED`.
- Três ou mais IPs distintos em 24h geram `MULTIPLE_IPS`.
- Rate limit excedido gera `RATE_LIMITED`.

Resposta adaptativa atual:

- Sessão antiga perde acesso imediatamente.
- Sessão expirada/revogada é redirecionada para login.
- Eventos suspeitos ficam auditados para operação e evolução.

Ainda não implementado:

- MFA/step-up auth.
- Geolocalização por IP.
- Fingerprint real de device no cliente.
- Bloqueio automático por score de risco.

## Rate Limiting

Rate limit usa Upstash Redis quando configurado:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Em produção, sem Redis e sem `RATE_LIMIT_ALLOW_MEMORY_FALLBACK=true`, o rate limit falha fechado para evitar depender de memória local serverless.

## Billing e Licença

Stripe segue como fonte financeira.

Banco local segue como fonte operacional de acesso:

- `Subscription`
- `License`

Foi adicionada reconciliação operacional:

```bash
npm run billing:reconcile
```

Em produção, exige:

```bash
ALLOW_PRODUCTION_BILLING_RECONCILIATION=true
```

O webhook Stripe continua idempotente por `StripeWebhookEvent.stripeEventId`. Eventos derivados como `invoice.paid` e `invoice.payment_failed` buscam a assinatura atual na API Stripe antes de sincronizar, reduzindo impacto de eventos fora de ordem.

## Observabilidade Mínima

Implementado:

- `x-request-id` no middleware.
- Logs JSON para auth, billing, commercial access, security e métricas.
- `SecurityEvent` persistido no banco.
- `/api/health` valida conexão com banco e auth configurado.

Recomendado antes de escala:

- Sentry ou equivalente.
- Log drain da Vercel.
- Alertas para webhook Stripe com erro.
- Dashboard de eventos `SecurityEvent`.

## Performance

Gargalos prováveis:

- Prisma + PostgreSQL em serverless sem pooler correto.
- Checagem de sessão e licença por request autenticado.
- Latência Vercel -> Cloud Run no cálculo clínico.
- Cold start do backend FastAPI.
- Crescimento de `CalculationHistory`.

Melhorias já preparadas:

- Índices em `UserSession`.
- Lock transacional por usuário apenas no login, não por request.
- `SESSION_TOUCH_INTERVAL_SECONDS` reduz escrita excessiva em `lastSeenAt`.
- `x-request-id` para correlação.
- Backend clínico permanece stateless.
- Pricing filtra MVP no servidor.
- Cleanup operacional para `UserSession`, `SecurityEvent` e `CalculationHistory`.

Recomendações:

- Usar pooler para `DATABASE_URL` no runtime Vercel.
- Usar `DIRECT_URL` apenas para migrations.
- Medir latência de `/dashboard`, `/dashboard/pcr`, `/api/stripe/webhook`, `/api/calculation-history`.
- Definir retenção/arquivamento para histórico.

## Plano de Load Test

Cenários:

1. Login concorrente com mesmo usuário para validar sessão única.
2. Login concorrente com usuários distintos.
3. Navegação autenticada para `/dashboard`.
4. Acesso repetido a `/dashboard/pcr`.
5. Uso repetido da calculadora PCR chamando backend FastAPI.
6. Validação de licença com usuários individual, past_due e institucional.
7. Picos de webhook Stripe.

Métricas:

- p50/p95/p99 por rota.
- taxa de erro por rota.
- tempo de validação de sessão.
- tempo de validação de licença.
- latência do backend clínico.
- conexões ativas no PostgreSQL.
- eventos de sessão substituída.

## Checklist Operacional de Produção

- [ ] Rodar `npx prisma migrate deploy`.
- [ ] Configurar Upstash Redis.
- [ ] Confirmar `RATE_LIMIT_ALLOW_MEMORY_FALLBACK` ausente ou `false`.
- [ ] Configurar `SESSION_IDLE_TIMEOUT_MINUTES`.
- [ ] Configurar `SESSION_ABSOLUTE_TIMEOUT_MINUTES`.
- [ ] Validar login duplo revogando sessão anterior.
- [ ] Validar logout revogando sessão atual.
- [ ] Validar reset de senha revogando sessões.
- [ ] Validar Stripe webhook.
- [ ] Rodar `npm run billing:reconcile` em staging.
- [ ] Monitorar `SecurityEvent`.
- [ ] Confirmar Cloud Run health.
- [ ] Confirmar Vercel `/api/health`.

## Checklist de Staging

- [ ] Rodar `npx prisma migrate deploy`.
- [ ] Rodar `npx prisma generate`.
- [ ] Configurar `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`.
- [ ] Confirmar `RATE_LIMIT_ALLOW_MEMORY_FALLBACK=false`.
- [ ] Configurar `SESSION_IDLE_TIMEOUT_MINUTES`.
- [ ] Configurar `SESSION_ABSOLUTE_TIMEOUT_MINUTES`.
- [ ] Fazer login em navegador A.
- [ ] Fazer segundo login do mesmo usuário em navegador B.
- [ ] Confirmar que navegador A perde acesso ao abrir `/dashboard`.
- [ ] Fazer logout no navegador B e confirmar perda de acesso.
- [ ] Redefinir senha e confirmar invalidação das sessões existentes.
- [ ] Testar usuário com sessão ativa e licença inativa.
- [ ] Confirmar webhook Stripe com evento repetido sem duplicar processamento.
- [ ] Rodar `npm run billing:reconcile` com `IATRON_ENV=staging`.
- [ ] Rodar `npm run security:cleanup` com `IATRON_ENV=staging`.

## Runbook: Falha de Login

1. Verificar `/api/health`.
2. Conferir Upstash Redis.
3. Conferir logs `scope=auth` e `scope=security`.
4. Procurar `RATE_LIMITED`.
5. Verificar se usuário está com `emailVerified`.
6. Verificar `UserSession` para sessões revogadas/expiradas.
7. Se Redis estiver indisponível em produção, login pode falhar fechado por segurança.

## Runbook: Falha de Webhook Stripe

1. Conferir `STRIPE_WEBHOOK_SECRET`.
2. Conferir assinatura no Stripe Dashboard.
3. Verificar `StripeWebhookEvent` por `stripeEventId`.
4. Reenviar evento pelo Stripe Dashboard.
5. Rodar `npm run billing:reconcile` se a assinatura existir no Stripe e não no banco.
6. Conferir `Subscription` e `License`.

## Runbook: Sessão Inválida em Massa

1. Verificar se `SESSION_IDLE_TIMEOUT_MINUTES` ou `SESSION_ABSOLUTE_TIMEOUT_MINUTES` foram alterados.
2. Conferir relógio/tempo do ambiente.
3. Consultar `SecurityEvent` por `SESSION_EXPIRED`, `SESSION_REVOKED`, `SESSION_INVALID`.
4. Confirmar se houve reset de senha em massa ou script administrativo.
5. Reverter env incorreta e orientar usuários a fazer login novamente.

## Riscos Residuais

- JWT ainda existe; a revogação forte depende de todas as rotas sensíveis usarem `requireAuth()`.
- Middleware continua sendo camada de UX/redirect, não autorização final.
- Não há MFA ou step-up auth.
- Device fingerprint real ainda não existe no cliente.
- Heurísticas de IP/user-agent são sinais fracos, não antifraude completo.
- Reconciliação de billing ainda deve ser agendada externamente.

## Próximos Passos

- MFA para ações sensíveis.
- Fingerprint real de device com consentimento e política adequada.
- Score de risco por contexto.
- Step-up auth para novo dispositivo ou múltiplos IPs.
- Dashboard admin para `SecurityEvent`.
- Job agendado para `billing:reconcile`.
- Job agendado para `security:cleanup`.
