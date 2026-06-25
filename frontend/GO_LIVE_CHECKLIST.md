# Checklist de Aceite Antes de Vender

Use este checklist somente depois de concluir staging test mode. Não marque itens por suposição.

## Produto e Domínio

- [x] Domínio final definido: `https://app.iatron.com.br`.
- [x] Domínio adicionado ao projeto Vercel `frontend`.
- [ ] DNS `A app.iatron.com.br 76.76.21.21` configurado no provedor atual (`artemis.dns-parking.com` / `hermes.dns-parking.com`).
- [ ] `dig +short app.iatron.com.br` resolve para Vercel.
- [ ] Domínio final configurado/validado na Vercel.
- [ ] SSL ativo.
- [ ] `/` responde 200.
- [ ] `/login` responde 200.
- [ ] `/api/health` retorna `ok=true`.
- [ ] `AUTH_URL` aponta para o domínio final.
- [ ] `NEXTAUTH_URL` aponta para o domínio final.
- [ ] `NEXT_PUBLIC_API_URL` aponta para o backend correto.

## Banco e Migrations

- [ ] Banco de produção definido.
- [ ] Backup/restore compreendido.
- [ ] `DATABASE_URL` de runtime configurada para ambiente serverless.
- [ ] `DIRECT_URL` disponível para operação/migrations, quando aplicável.
- [ ] Migrations aplicadas fora do build Vercel.
- [ ] `npx prisma migrate status` conferido em ambiente com acesso ao banco.
- [ ] `PlanCatalog` e `PlanPrice` conferidos.

## Stripe Live Products e Prices

- [ ] `COMMERCIAL_MVP_MATRIX.md` revisado.
- [ ] Nenhum plano/ciclo sem validação ponta a ponta aparece na UI.
- [ ] Produto live `Iatron Professional` criado.
- [ ] Price live Professional mensal criado.
- [ ] Valor Professional aprovado comercialmente.
- [ ] Produto live `Iatron Hospital` criado, se cobrança assistida usar Stripe.
- [ ] Price live Hospital criado, se aplicável.
- [ ] Price IDs live registrados no banco ou nas envs.
- [ ] Nenhum price test mode usado em produção.
- [ ] Nenhuma chave `sk_test` ou `pk_test` usada em produção live.

## Envs Stripe Live

- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
- [ ] `STRIPE_SECRET_KEY=sk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET=whsec_...` do endpoint live.
- [ ] `STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_live_...`, se usado como fallback.
- [ ] `STRIPE_PRICE_HOSPITAL_CUSTOM=price_live_...`, se usado.
- [ ] Vercel redeployado após alterar envs.

## Webhook Live

- [ ] Endpoint live criado no Stripe Dashboard.
- [ ] URL: `https://DOMINIO_FINAL/api/stripe/webhook`.
- [ ] Eventos configurados:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.paid`
  - [ ] `invoice.payment_failed`
  - [ ] `payment_intent.payment_failed`
  - [ ] `billing_portal.session.created`
- [ ] Primeiro evento live recebeu HTTP 200.
- [ ] Evento aparece em `StripeWebhookEvent`.
- [ ] Reenvio de evento não duplica processamento.

## Fluxo Individual Live

- [ ] Usuário interno criado.
- [ ] Usuário sem assinatura vê paywall.
- [ ] `/checkout` mostra Professional.
- [ ] Checkout Stripe live abre.
- [ ] Pagamento controlado é concluído.
- [ ] Retorno vai para `/checkout/return?status=success`.
- [ ] `Subscription.ACTIVE` ou `TRIALING` criada.
- [ ] `License.ACTIVE` criada.
- [ ] `/dashboard` libera acesso.
- [ ] `/billing` mostra assinatura correta.
- [ ] Billing Portal abre.
- [ ] Cancelamento/rollback da compra controlada executado conforme política.

## Falha de Pagamento

- [ ] Operação sabe identificar `invoice.payment_failed`.
- [ ] Billing orienta recuperação.
- [ ] Portal permite atualizar meio de pagamento.
- [ ] Usuário `PAST_DUE` fica bloqueado.
- [ ] Recuperação de pagamento foi testada ou documentada.

## Institucional Assistido

- [ ] Hospital aparece como `Sob consulta`.
- [ ] CTA mostra `Solicitar implantação institucional`.
- [ ] Não existe CTA de checkout institucional automático.
- [ ] Processo comercial de Hospital definido.
- [ ] Responsável por criar/revisar organização definido.
- [ ] Processo de atribuição de `License.ACTIVE` definido.
- [ ] Usuário institucional sem licença bloqueia.
- [ ] Usuário institucional licenciado libera.
- [ ] Política de seats definida.

## Billing Portal

- [ ] Customer Portal habilitado em live mode.
- [ ] Portal abre para usuário com customer Stripe.
- [ ] Portal retorna para `/billing`.
- [ ] Opções de cancelamento/atualização revisadas.
- [ ] Textos e dados fiscais revisados.

## Monitoramento

- [ ] Stripe Dashboard monitorado no dia do lançamento.
- [ ] Vercel Logs monitorados no dia do lançamento.
- [ ] Alerta para webhook 4xx/5xx definido.
- [ ] Alerta para aumento de `invoice.payment_failed` definido.
- [ ] Rotina de consulta de `StripeWebhookEvent` definida.
- [ ] Rotina de auditoria de `Subscription`/`License` definida.

## Rollback

- [ ] Último deployment estável identificado.
- [ ] Operador sabe promover deployment anterior na Vercel.
- [ ] Estratégia para price ID incorreto definida.
- [ ] Estratégia para webhook secret incorreto definida.
- [ ] Estratégia para domínio final instável definida.
- [ ] Continuidade de billing compreendida.
- [ ] Processo de reenviar eventos Stripe definido.

## Suporte e Incidentes

- [ ] Runbook `LIVE_MODE_RUNBOOK.md` revisado pela operação.
- [ ] Responsável por incidentes de billing definido.
- [ ] Template de resposta para pagamento confirmado sem acesso definido.
- [ ] Template de resposta para pagamento recusado definido.
- [ ] Template de resposta para licença institucional pendente definido.

## Decisão Final

- [ ] Não há secrets reais em código/documentação.
- [ ] Build passa.
- [ ] Testes comerciais passam.
- [ ] Testes de billing passam.
- [ ] Staging test mode continua funcional.
- [ ] Aprovação explícita para ativar live mode registrada.
- [ ] `sk_live`, `pk_live` e `whsec` live inseridos somente após aprovação explícita.
