# Admin Sales Metrics

O módulo `/admin/sales` agrega métricas comerciais server-side usando os dados atuais de `Subscription`, `PlanPrice`, `License`, `User`, `Organization` e `CalculationHistory`.

## Métricas precisas

- **MRR atual**: soma do valor mensal equivalente das assinaturas `ACTIVE` com `PlanPrice.amountCents`.
- **Clientes ativos**: contagem de assinaturas `ACTIVE`.
- **Novos clientes no período**: assinaturas criadas dentro do período filtrado.
- **Status de assinaturas**: contagem direta por `SubscriptionStatus`.
- **Primeiro uso**: usuários distintos com `CalculationHistory` no período.

## Métricas estimadas

- **ARR estimado**: `MRR atual * 12`.
- **Churn de clientes**: `canceled_in_period / (active_current + canceled_in_period)`.
- **Churn de receita**: `canceled_mrr_in_period / (current_mrr + canceled_mrr_in_period)`.
- **Receita por ciclo/tipo**: precisa para planos com `amountCents`; estimada/incompleta quando há contratos custom.

## Placeholders técnicos

- **Landing -> checkout**: requer eventos de analytics/pageview dedicados.
- **Upgrades/downgrades**: requer histórico de troca de plano/preço.
- **Vitalício**: o modelo atual não possui `BillingCycle` vitalício. `BIENNIAL` representa 2 anos.

## Filtros

- período: `7d`, `30d`, `90d`, `365d`;
- plano;
- tipo de cliente;
- status da assinatura.

## Performance

- As queries são server-side.
- O dashboard usa `unstable_cache` com `revalidate: 60`.
- A consulta de assinaturas limita a 500 registros para manter previsibilidade no MVP.
- Se o volume crescer, o próximo passo é materializar snapshots diários de métricas comerciais.
