# Admin Hardening Onda 1

Esta onda adiciona RBAC por roles administrativas e step-up por senha atual para ações críticas.

## Decisões

- `Role.ADMIN` fica como bootstrap/migração e aparece como `superadmin/bootstrap`.
- A origem principal de permissões passa a ser `AdminRole` + `AdminUserRole`.
- Grants diretos continuam existindo, mas devem ser exceção auditada.
- Como ainda não há MFA, o step-up usa senha atual. Sem senha válida, a ação é bloqueada.

## Roles

- `superadmin`: todas as permissões.
- `ops`: operações, contingência e leitura de auditoria/clientes.
- `billing`: billing, reconcile, vendas e leitura de clientes.
- `support`: suporte e clientes, incluindo escrita de notas.
- `auditor`: auditoria, exportação, vendas e operações em modo leitura.

## Ações com step-up

- Criar/estender/revogar/converter licenças.
- Conceder/remover role administrativa.
- Conceder/revogar permissão direta.
- Desativar admin.
- Reconcile e reprocessamento crítico de billing.
- Exportação de auditoria.
- Ações da central de contingência.

## Limites conhecidos

- Não há MFA real nesta etapa.
- Exportação de auditoria usa senha em formulário GET por simplicidade operacional; deve migrar para action/POST dedicada.
- Roles custom editáveis ainda não têm UI completa; as roles de sistema são sincronizadas pelo service.
- Testes ainda precisam de maior cobertura integrada com banco/staging.
