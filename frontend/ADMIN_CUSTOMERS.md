# Clientes e Organizações

O módulo `/admin/customers` oferece visão 360 de clientes individuais e institucionais para suporte, sucesso do cliente e operação comercial. A rota exige `admin.customers.view`.

## Health score inicial

Score de 0 a 100 com pesos configuráveis em `lib/admin-customers.ts`:

- Atividade: 25 pontos
- Recência: 20 pontos
- Uso de features-chave: 20 pontos
- Problemas de billing: 25 pontos
- Volume de suporte/sinais operacionais: 10 pontos

Faixas:

- 80-100: `healthy`
- 60-79: `monitor`
- 40-59: `at-risk`
- 0-39: `critical`

## Fontes usadas

- Última atividade: cálculo, sessão, evento de segurança ou atualização do cadastro.
- Uso de features-chave: volume recente de `CalculationHistory` para usuários e licenças ativas para organizações.
- Billing: assinaturas em `PAST_DUE`, `UNPAID`, `INCOMPLETE` ou `CANCELED` reduzem pontuação.
- Suporte: eventos de segurança não informativos entram como sinal operacional até existir módulo dedicado de tickets.

## Notas internas

Notas internas são registradas em `AdminAuditEvent` com `action = admin.customer.note_added`. Elas não devem conter tokens, senhas, dados clínicos sensíveis ou secrets.

## Limites conhecidos

O score é uma heurística operacional inicial. Analytics de produto, tickets reais, NPS, incidentes formais e eventos comerciais versionados devem substituir os proxies atuais em uma evolução futura.
