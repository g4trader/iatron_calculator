# Administradores e Permissões

O módulo `/admin/admin-users` gerencia acesso ao backoffice. A rota exige `admin.users.manage`.

## Modelo RBAC

- `Role.ADMIN`: bootstrap legado de superadmin para migração. Novos acessos devem usar `AdminRole`.
- `Role.USER`: não recebe permissões por role.
- `AdminRole`: role administrativa predefinida ou futura role custom.
- `AdminUserRole`: vínculo usuário-role.
- `AdminPermissionGrant`: grant direto opcional por string de permissão.

Permissões efetivas = permissões herdadas das roles + grants diretos ativos + bootstrap legado quando aplicável.

Roles predefinidas:

- `superadmin`
- `ops`
- `billing`
- `support`
- `auditor`

## Permissões críticas

As permissões abaixo exigem confirmação `CONFIRMAR` quando concedidas/revogadas ou quando uma role admin é removida:

- `admin.users.manage`
- `admin.billing.manage`
- `admin.billing.reconcile`
- `admin.licenses.manage`
- `admin.contingency.manage`
- `admin.audit.view`
- `admin.audit.export`

## Guardrails

- Toda alteração exige motivo com no mínimo 8 caracteres.
- Toda alteração crítica exige step-up com senha atual.
- Toda alteração grava `AdminAuditEvent`.
- Auto-remoção perigosa de `admin.users.manage` é bloqueada.
- Remover o último operador com `admin.users.manage` é bloqueado.
- Desativar admin suspende `adminStatus`, remove role ADMIN legada, revoga grants ativos e revoga roles ativas.
- Somente superadmin pode conceder/remover role `superadmin`.

## Revisão de acesso

Revisar periodicamente usuários com permissões críticas, especialmente grants diretos. Grants diretos devem ser usados para acesso pontual e preferencialmente revogados quando a operação terminar.
