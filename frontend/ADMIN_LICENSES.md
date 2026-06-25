# Licenças e Contingência

O módulo `/admin/licenses` centraliza ações manuais de licença para suporte e contingência. A rota exige a permissão `admin.licenses.manage`.

## Regras operacionais

- Toda ação administrativa exige motivo interno com no mínimo 8 caracteres.
- Toda mutation grava `AdminAuditEvent` com operador, recurso, usuário alvo, organização e metadata.
- Ações destrutivas exigem confirmação explícita:
  - suspensão: `SUSPENDER`
  - revogação: `REVOGAR`
- Licenças manuais recebem expiração por padrão. Presets disponíveis: 24h, 72h, 7 dias e 30 dias.
- Concessões manuais devem usar origem explícita: `manual_support`, `contingency`, `migration` ou `institutional_grant`.
- Licenças originadas de cobrança usam `billing`; grants institucionais usam `institutional_grant`.

## Histórico

O histórico exibido por licença vem de `AdminAuditEvent` com `resourceType = "license"` e `resourceId = license.id`.

## Critério de segurança

Não deve existir concessão manual silenciosa fora das server actions auditadas. Se uma nova mutation de licença for criada, ela deve reutilizar os helpers de `lib/admin-licenses.ts` ou gravar auditoria administrativa equivalente.
