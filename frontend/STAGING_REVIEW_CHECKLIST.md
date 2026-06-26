# Checklist de Revisão Manual do Staging

Objetivo: revisar o Iatron no navegador antes de qualquer passo de produção/live mode.

## URL Principal

Abra:

```text
https://frontend-two-lovat-72.vercel.app
```

Esta é a URL pública de staging revisável neste momento.

Status validado:

- Deploy Vercel: `Ready`
- `/api/health`: `ok=true`, `database=connected`, `auth=configured`
- Stripe: test mode
- Banco: staging/Supabase
- Live mode: não ativado
- Matriz comercial: somente `Professional anual R$249,00` e `Hospital sob consulta` podem aparecer na UI. Ver `COMMERCIAL_MVP_MATRIX.md`.
- Escopo funcional: o produto atual expõe somente `Folha PCR`. `Calculadora completa` não deve aparecer na UI principal.

## Contas de Teste

Senha padrão para todas:

```text
IatronE2E#2026
```

| Perfil | Email | O que esperar |
| --- | --- | --- |
| Sem acesso | `e2e+no-access@iatron.test` | Mostra paywall `Acesso à Folha PCR necessário` |
| Individual ativo | `e2e+active@iatron.test` | Entra no dashboard e mostra acesso à Folha PCR |
| Pagamento pendente | `e2e+past-due@iatron.test` | Mostra `Pagamento pendente` e orientação para billing |
| Institucional sem licença | `e2e+org-no-license@iatron.test` | Mostra `Licença institucional não atribuída` |
| Institucional licenciado | `e2e+org-licensed@iatron.test` | Entra no dashboard e mostra acesso à Folha PCR |

## Revisão Rápida

1. Abrir `https://frontend-two-lovat-72.vercel.app`.
2. Conferir landing page.
3. Clicar em `Começar agora` ou acessar `/login`.
4. Entrar com cada conta de teste acima.
5. Validar se o comportamento bate com a tabela.

## Pricing e Checkout Entry

1. Entrar com `e2e+no-access@iatron.test`.
2. Abrir:

```text
https://frontend-two-lovat-72.vercel.app/checkout
```

3. Conferir plano `Professional`.
4. Conferir que `Professional` mostra apenas assinatura anual por `R$ 249`.
5. Conferir botão `Assinar anual`.
6. Conferir que `Starter`, `6 meses`, `1 ano` e `2 anos` não aparecem como opção comercial.
7. Conferir plano `Hospital`.
8. Hospital deve mostrar:
   - `Sob consulta`
   - `Implantação assistida`
   - `Solicitar implantação institucional` ou caminho para organização

Observação: a aplicação usa `/checkout` como tela de pricing/entrada comercial logada.

## Checkout Stripe Test Mode

Use apenas se quiser testar pagamento em ambiente de teste.

1. Entrar com `e2e+no-access@iatron.test`.
2. Ir para `/checkout`.
3. Clicar em `Assinar anual`.
4. No Stripe Checkout, usar cartão de teste:

```text
4242 4242 4242 4242
```

Dados genéricos:

```text
Validade: 12/34
CVC: 123
Nome: Teste Iatron
```

5. Após pagamento, deve voltar para:

```text
/checkout/return?status=success
```

6. Aguardar alguns segundos.
7. Abrir `/dashboard`.
8. O dashboard deve liberar acesso.

Importante: ao concluir checkout com `e2e+no-access@iatron.test`, essa conta deixará de representar “sem acesso” até os fixtures serem recriados.

## Billing e Billing Portal

Para revisar `/billing`:

1. Use `e2e+active@iatron.test` para ver estado ativo interno.
2. Use `e2e+past-due@iatron.test` para ver recuperação/pagamento pendente.

Para abrir Stripe Billing Portal de verdade:

1. Faça checkout test mode com `e2e+no-access@iatron.test`.
2. Depois acesse:

```text
https://frontend-two-lovat-72.vercel.app/billing
```

3. Clique em `Gerenciar assinatura`.
4. Deve abrir o portal Stripe em test mode.

Observação: contas seedadas como `e2e+active@iatron.test` têm assinatura interna para testar acesso, mas podem não ter `stripeCustomerId`; o portal real depende de um checkout Stripe concluído.

## Falha de Pagamento

1. Entrar com conta sem acesso ou criar novo fluxo de checkout.
2. No Stripe Checkout, usar cartão:

```text
4000 0000 0000 0002
```

3. O Stripe deve exibir erro de cartão recusado.
4. A experiência de pagamento pendente pode ser revisada com:

```text
e2e+past-due@iatron.test
```

## Dashboard

Contas que devem liberar dashboard:

- `e2e+active@iatron.test`
- `e2e+org-licensed@iatron.test`
- `e2e+no-access@iatron.test` após checkout test mode bem-sucedido

Você deve ver:

- chamada `Folha PCR para plantão pediátrico`
- opção `Folha PCR`

Você não deve ver:

- opção `Calculadora completa`
- link para `/dashboard/completa`

## Paywall

Validar:

- `e2e+no-access@iatron.test`: `Acesso à Folha PCR necessário`
- `e2e+past-due@iatron.test`: `Pagamento pendente`
- `e2e+org-no-license@iatron.test`: `Licença institucional não atribuída`

## Comunicação Institucional

Validar no `/checkout`:

- Hospital é `Sob consulta`
- aparece `Implantação assistida`
- não há checkout institucional self-service
- CTA orienta solicitação/organização
- não aparece botão de contratação automática de licenças para Hospital

Validar no dashboard:

- institucional sem licença bloqueia
- institucional com licença libera

## O Que Ainda Não Existe

- Stripe live mode não está ativo.
- Domínio final `app.iatron.com.br` ainda não está em uso.
- Starter não está liberado comercialmente.
- Professional 6 meses, 1 ano e 2 anos não estão liberados comercialmente.
- Checkout institucional self-service não existe nesta etapa.
- Calculadora completa não faz parte da oferta atual e fica oculta da experiência principal.
- Gestão completa de licenças institucionais ainda é operação assistida/admin.
- OAuth Google/Meta não é necessário para esta revisão; use email/senha.

## Como Resetar Contas de Teste

Se algum teste de checkout alterar o estado das contas:

```bash
cd frontend
IATRON_ENV=e2e DATABASE_URL="postgresql://..." DIRECT_URL="postgresql://..." npm run e2e:seed
```

Este comando deve ser executado por quem tem acesso ao banco staging.

## Critério de Aprovação da Revisão

- Landing clara.
- Login funciona.
- Paywalls fazem sentido.
- Dashboard liberado para contas corretas.
- Dashboard focado em Folha PCR, sem opção de calculadora completa.
- `/checkout` apresenta Professional e Hospital corretamente.
- `/checkout` não apresenta Starter nem ciclos Professional não validados.
- Hospital parece venda assistida, não checkout automático.
- Checkout test mode individual funciona, se testado.
- Billing e portal fazem sentido após checkout.
- Calculadoras abrem para usuários com acesso.
