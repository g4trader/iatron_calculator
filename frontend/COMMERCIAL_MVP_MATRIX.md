# Matriz Comercial do MVP

Objetivo: nenhum plano, ciclo ou CTA pode aparecer como opção comercial se não estiver 100% implementado e validado ponta a ponta em staging.

Live mode não faz parte desta etapa.

## Decisão de MVP

O MVP comercial honesto neste momento é:

- Produto atual: `Folha PCR`.
- `Professional anual R$249,00`: self-service para acesso individual à Folha PCR, Stripe Checkout test mode, webhook, retorno, acesso, billing e portal validados.
- `Hospital/custom`: implantação assistida da Folha PCR, sem checkout self-service, com comunicação institucional e licenças controladas.
- `Calculadora completa`: fora da oferta atual, oculta da UI e preservada no código atrás de feature flag.

Tudo que estiver apenas modelado no banco, sem preço Stripe, sem valor aprovado ou sem validação ponta a ponta, fica oculto da UI comercial.

## Critério Obrigatório de Readiness Comercial

Um plano/ciclo só pode aparecer na UI quando todos os itens abaixo estiverem concluídos em staging:

- Valor comercial aprovado.
- `PlanPrice.amountCents` preenchido quando for self-service.
- `PlanPrice.stripePriceId` apontando para price Stripe test mode correto.
- Checkout abre para o ciclo correto.
- Redirect de sucesso e cancelamento validado.
- Webhook processa eventos com HTTP 200.
- `Subscription` sincroniza status, plano e ciclo.
- `License.ACTIVE` é criada/refletida quando aplicável.
- Dashboard libera ou bloqueia conforme estado.
- Billing mostra estado coerente.
- Stripe Billing Portal abre quando aplicável.
- Falha de pagamento tem comportamento conhecido e documentado.

## Matriz de Planos e Ciclos

| Plano/ciclo | Banco | Stripe test mode | UI final | Checkout | Webhook | Retorno | Billing portal | Licença | Status | Causa/Pendência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Starter mensal | Modelado em `PlanPrice`, sem valor | Sem price mapeado | Oculto | Não implementado | Genérico existe, mas não validado para Starter | Não validado | Não validado | Não validada | Não implementado | Sem decisão comercial, sem valor, sem Stripe price, sem validação |
| Starter 6 meses | Modelado em `PlanPrice`, sem valor | Sem price mapeado | Oculto | Não implementado | Genérico existe, mas não validado para Starter | Não validado | Não validado | Não validada | Não implementado | Sem decisão comercial, sem valor, sem Stripe price, sem validação |
| Starter 1 ano | Modelado em `PlanPrice`, sem valor | Sem price mapeado | Oculto | Não implementado | Genérico existe, mas não validado para Starter | Não validado | Não validado | Não validada | Não implementado | Sem decisão comercial, sem valor, sem Stripe price, sem validação |
| Starter 2 anos | Modelado em `PlanPrice`, sem valor | Sem price mapeado | Oculto | Não implementado | Genérico existe, mas não validado para Starter | Não validado | Não validado | Não validada | Não implementado | Sem decisão comercial, sem valor, sem Stripe price, sem validação |
| Professional mensal | Legado/desativado para novas vendas | Price antigo pode existir para assinaturas históricas | Oculto | Não liberado para novas vendas | Genérico existe | Não aplicável para novo checkout | Aplicável apenas a assinaturas existentes | Histórica | Legado | Substituído por assinatura anual |
| Professional 6 meses | Modelado em `PlanPrice`, sem valor | Sem price mapeado | Oculto | Não implementado | Genérico existe, mas não validado para o ciclo | Não validado | Não validado | Não validada | Parcialmente implementado e exposto indevidamente antes | Falta valor, Stripe price, checkout e validação ponta a ponta |
| Professional 1 ano | `amountCents=24900`, `billingCycle=ANNUAL` | `STRIPE_PRICE_PROFESSIONAL_ANNUAL` ou `stripePriceId` anual | Visível | Implementado | Genérico validável por webhook Stripe | Validável | Validável | Validável | Implementado | Oferta comercial atual: R$249,00/ano |
| Professional 2 anos | Modelado em `PlanPrice`, sem valor | Sem price mapeado | Oculto | Não implementado | Genérico existe, mas não validado para o ciclo | Não validado | Não validado | Não validada | Parcialmente implementado e exposto indevidamente antes | Falta valor, Stripe price, checkout e validação ponta a ponta |
| Hospital/custom institucional | `CUSTOM`, sob consulta | Price test mode existe para cobrança assistida, não para checkout self-service | Visível como venda assistida | Checkout self-service bloqueado por decisão comercial | Webhook suporta sincronização assistida | Não aplicável para self-service | Aplicável somente após customer/subscription assistidos | Licença institucional validada por estado | Bloqueado por decisão comercial para self-service | Exige operação assistida, criação/revisão de organização e atribuição de licenças |

## Inconsistências Corrigidas

- `Starter` aparecia na landing e podia aparecer como `Sob consulta`, apesar de não ter fluxo validado.
- `Professional` exibia ciclos de 6 meses, 1 ano e 2 anos quando esses ciclos estavam apenas modelados.
- A landing aplicava `/mês` também em `Hospital`, gerando leitura comercial ambígua.
- A UI permitia que `amountCents=null` fosse tratado como opção comercial individual, o que confundia modelagem futura com oferta real.

## Regra Implementada na UI

O `pricing view` agora expõe somente:

- Plano individual `Professional` com ciclo `ANNUAL`, valor `R$249,00` e `stripePriceId`/env Stripe anual.
- Plano institucional `Hospital` com ciclo `CUSTOM`, como venda assistida.

Linhas futuras permanecem no banco para evolução, mas não aparecem na UI até cumprirem o critério de readiness comercial.

## Escopo Funcional do MVP

Visível no produto:

- Landing, pricing, paywall e área autenticada comunicam Folha PCR.
- Dashboard exibe entrada para Folha PCR.
- Menu lateral autenticado exibe Início e Folha PCR.

Oculto do produto:

- Card `Calculadora completa`.
- Link `/dashboard/completa` na navegação.
- Oferta comercial de calculadora ampla ou suite de calculadoras.

A rota `/dashboard/completa` permanece no código, mas redireciona para `/dashboard/pcr` enquanto `NEXT_PUBLIC_SHOW_COMPLETE_CALCULATOR` não for `true`.

## Próximos Ciclos

Para liberar qualquer ciclo adicional:

1. Aprovar preço e condições comerciais.
2. Criar price no Stripe test mode.
3. Atualizar seed/migration/env/mapeamento do `PlanPrice`.
4. Validar checkout, retorno, webhook, billing, portal, falha e licença em staging.
5. Atualizar esta matriz.
6. Só então expor na UI.
