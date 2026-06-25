# Domínio Final de Produção

Data: 2026-06-22

## Decisão

Domínio final escolhido:

```text
https://app.iatron.com.br
```

URL base da aplicação:

```text
https://app.iatron.com.br
```

Webhook de produção esperado:

```text
https://app.iatron.com.br/api/stripe/webhook
```

Redirects esperados do Stripe Checkout:

```text
https://app.iatron.com.br/checkout/return?status=success
https://app.iatron.com.br/checkout/return?status=cancelled
```

Billing Portal return URL:

```text
https://app.iatron.com.br/billing
```

## Estado Real na Vercel

O domínio `app.iatron.com.br` foi adicionado ao projeto Vercel `frontend`.

Comando executado:

```bash
vercel domains add app.iatron.com.br
```

Resultado:

- Domínio adicionado ao projeto.
- Domínio ainda não configurado corretamente em DNS.

Rechecagem em 2026-06-22:

```bash
dig +short NS iatron.com.br
```

Retorno:

```text
hermes.dns-parking.com.
artemis.dns-parking.com.
```

```bash
dig +short app.iatron.com.br
```

Retorno:

```text
# vazio
```

```bash
curl -I https://app.iatron.com.br
```

Retorno:

```text
curl: (6) Could not resolve host: app.iatron.com.br
```

Conclusão: DNS ainda não está ativo. As envs `AUTH_URL` e `NEXTAUTH_URL` não devem ser trocadas para `app.iatron.com.br` até a resolução DNS funcionar.

Evidência da Vercel:

```text
Set the following record on your DNS provider:
A app.iatron.com.br 76.76.21.21
```

Nameservers atuais detectados:

```text
artemis.dns-parking.com
hermes.dns-parking.com
```

Nameservers Vercel opcionais:

```text
ns1.vercel-dns.com
ns2.vercel-dns.com
```

## DNS Pendente

Opção recomendada:

Criar o registro DNS:

```text
Tipo: A
Nome/Host: app
Valor: 76.76.21.21
TTL: automático ou 300
```

Este registro deve ser criado no provedor DNS atual do domínio, que responde pelos nameservers:

```text
artemis.dns-parking.com
hermes.dns-parking.com
```

A Vercel CLI não consegue alterar esses nameservers externos diretamente.

Alternativa:

Trocar nameservers do domínio para:

```text
ns1.vercel-dns.com
ns2.vercel-dns.com
```

Não trocar nameservers se o domínio já tiver outros registros críticos sem migração planejada.

## Envs de Produção Planejadas

Aplicar somente depois que `app.iatron.com.br` resolver corretamente e estiver com SSL ativo na Vercel.

```bash
AUTH_URL=https://app.iatron.com.br
NEXTAUTH_URL=https://app.iatron.com.br
NEXT_PUBLIC_API_URL=https://iatron-calculator-api-609095880025.us-central1.run.app
```

Stripe deve permanecer em test mode até autorização explícita:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # endpoint test mode do domínio final, quando criado
```

Banco:

```bash
DATABASE_URL=postgresql://...pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://...db.supabase.co:5432/postgres?sslmode=require
```

## Por Que As Envs de Domínio Ainda Não Foram Trocadas

`app.iatron.com.br` ainda não resolve em DNS.

Trocar `AUTH_URL` e `NEXTAUTH_URL` agora faria o checkout e o Billing Portal gerarem redirects para um domínio indisponível, quebrando o fluxo individual já validado em staging.

Env atual deve permanecer apontando para o domínio staging validado até o DNS final estar ativo:

```text
https://frontend-two-lovat-72.vercel.app
```

Condição para aplicar as envs finais:

1. DNS `app.iatron.com.br` configurado.
2. `dig +short app.iatron.com.br` retorna Vercel.
3. Vercel mostra domínio válido/SSL ativo.
4. `curl -I https://app.iatron.com.br` retorna HTTP 200.
5. Webhook Stripe test mode do domínio final criado.
6. `STRIPE_WEBHOOK_SECRET` test mode do domínio final configurado.
7. Redeploy Vercel executado.

## Webhook Test Mode do Domínio Final

Criar depois que DNS estiver resolvendo:

```text
https://app.iatron.com.br/api/stripe/webhook
```

Eventos:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `payment_intent.payment_failed`
- `billing_portal.session.created`

Depois de criado:

1. Copiar `whsec_...` do endpoint test mode.
2. Atualizar `STRIPE_WEBHOOK_SECRET` na Vercel Production.
3. Fazer redeploy.
4. Repetir validação de staging com `PLAYWRIGHT_BASE_URL=https://app.iatron.com.br`.

## Checklist Para Aplicar Domínio Final

- [ ] DNS `A app.iatron.com.br 76.76.21.21` criado.
- [ ] `dig +short app.iatron.com.br` retorna IP da Vercel.
- [ ] Vercel marca domínio como configurado.
- [ ] SSL ativo.
- [ ] `AUTH_URL=https://app.iatron.com.br` configurado.
- [ ] `NEXTAUTH_URL=https://app.iatron.com.br` configurado.
- [ ] Webhook Stripe test mode do domínio final criado.
- [ ] `STRIPE_WEBHOOK_SECRET` test mode atualizado.
- [ ] Vercel redeployado.
- [ ] `/api/health` validado.
- [ ] Checkout test mode validado no domínio final.
- [ ] Billing Portal validado no domínio final.

## Relação Com Live Mode

Configurar domínio final não significa ativar live mode.

Após o domínio final estar validado com Stripe test mode, seguir:

- `LIVE_MODE_RUNBOOK.md`
- `GO_LIVE_CHECKLIST.md`

Somente trocar para `sk_live`, `pk_live` e webhook live com aprovação explícita.
