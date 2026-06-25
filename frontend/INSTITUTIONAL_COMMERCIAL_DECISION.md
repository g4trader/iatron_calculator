# Decisão comercial institucional

Data: 2026-06-22

Para ativação em produção, seguir `LIVE_MODE_RUNBOOK.md` e manter Hospital como venda assistida até nova decisão explícita.

## Estado atual

O funil individual do Iatron já foi validado em Stripe test mode com Supabase staging:

- Checkout individual real concluído.
- Webhooks recebidos com HTTP 200.
- `Subscription.ACTIVE` sincronizada.
- `License.ACTIVE` criada para usuário individual.
- Dashboard, billing e Stripe Billing Portal funcionando.

No domínio institucional, o produto já possui:

- `Organization`
- `OrganizationMembership`
- `Subscription` com `ownerType=ORGANIZATION`
- `License` vinculada a organização, assinatura e usuário
- Paywall que bloqueia membro institucional sem `License.ACTIVE`

O plano Hospital está modelado como:

- `PlanCatalog.code=HOSPITAL`
- `PlanCatalog.audience=INSTITUTIONAL`
- `PlanPrice.id=price_hospital_custom`
- `PlanPrice.billingCycle=CUSTOM`
- `PlanPrice.amountCents=null`
- `PlanPrice.stripePriceId=price_1Tk9B92VzAAy18mjrrmiAhIq` em staging/test mode

Como `CUSTOM`/`amountCents=null` é tratado como `Sob consulta`, a UI não inicia checkout institucional self-service.

## Caminho 1: manter Hospital como venda assistida

Impacto técnico:

- Baixo. Mantém a arquitetura atual e exige apenas clareza de UX/documentação.
- Preserva o domínio já validado de assinatura institucional + licenças.
- Não exige novos preços públicos nem alterações em webhook/billing.

Impacto comercial:

- Melhor para contratos hospitalares, que tendem a envolver negociação de seats, implantação, suporte e compliance.
- Evita publicar preço institucional antes da validação comercial.

Impacto operacional:

- Exige processo interno para criar/revisar organização, confirmar assinatura e atribuir licenças.
- Menor automação inicial, maior controle.

Impacto no billing/licenças:

- Billing institucional continua possível pelo domínio e Stripe, mas a liberação clínica depende de `License.ACTIVE`.
- A equipe precisa atribuir licenças depois da contratação.

Impacto em suporte:

- Aumenta contato humano no início.
- Reduz risco de hospitais comprarem seats errados ou ficarem bloqueados sem entender o modelo.

Impacto em implantação futura:

- Permite aprender o processo institucional antes de self-service.
- Mantém caminho aberto para adicionar preço self-service depois.

Riscos:

- Menor conversão automática.
- Processo manual precisa ser bem documentado para não atrasar ativações.

Esforço estimado:

- Baixo, 0,5 a 1 dia para UX/documentação operacional.

## Caminho 2: checkout institucional self-service

Impacto técnico:

- Médio. Exige preço institucional explícito não custom, CTA de compra, teste de seats, validação de organização e fluxo de licenças.
- O backend já suporta `ownerType=ORGANIZATION`, mas a operação pós-compra ainda precisa de uma UI/admin clara para atribuir licenças.

Impacto comercial:

- Aumenta conversão automática para pequenos times.
- Pode reduzir poder de negociação com hospitais maiores.

Impacto operacional:

- Exige regras claras de seats, comprador, nota/fatura, recuperação de pagamento e suporte a administradores.
- Exige testar upgrade/downgrade e alteração de seats com mais rigor.

Impacto no billing/licenças:

- Requer garantir que assinatura paga não libere acesso automaticamente sem licença atribuída.
- Requer experiência clara para distribuir licenças após compra.

Impacto em suporte:

- Pode aumentar tickets sobre compra sem liberação, seats e convite de membros.

Impacto em implantação futura:

- Bom para pequenos grupos, mas antecipa complexidade operacional antes de validar contratos institucionais reais.

Riscos:

- Hospitais comprarem fluxo errado.
- Usuários pagarem e ficarem bloqueados por falta de licença atribuída.
- Necessidade de suporte imediato para gestão de seats.

Esforço estimado:

- Médio, 2 a 5 dias para habilitar e validar bem o fluxo mínimo; mais se incluir gestão completa de licenças.

## Recomendação

Manter Hospital como venda assistida nesta etapa.

Justificativa:

- O fluxo individual já está pronto para conversão self-service.
- O institucional tem domínio suficiente para contratos assistidos, mas ainda falta maturidade operacional de licenças e seats para abrir compra automática com segurança.
- A separação assinatura/licença é correta para hospitais, mas precisa de comunicação explícita para evitar expectativa de liberação imediata após pagamento.
- A próxima validação em staging deployado deve consolidar individual self-service e institucional assistido antes de live mode.

## Decisão implementada

- Hospital permanece `Sob consulta`.
- CTA institucional agora comunica `Solicitar implantação institucional`.
- Paywall institucional explica que a liberação depende de implantação/atribuição de licença.
- Documentação operacional registra que checkout institucional self-service é decisão futura, não bug.

## Fluxo institucional assistido esperado

1. Responsável cria ou acessa uma organização.
2. Responsável solicita implantação institucional.
3. Time Iatron valida contrato, seats e responsável.
4. Assinatura institucional é criada/sincronizada.
5. Licenças são atribuídas aos usuários elegíveis.
6. Usuários com `License.ACTIVE` acessam o dashboard.
7. Usuários sem licença permanecem bloqueados com orientação clara.

## Critério para migrar para self-service

Reavaliar self-service institucional quando existirem:

- Preço público por licença ou por faixa.
- UI/admin para atribuir, revogar e acompanhar licenças.
- Fluxo testado de alteração de seats.
- Runbook de suporte para compradores institucionais.
- Validação de pelo menos alguns contratos assistidos.
