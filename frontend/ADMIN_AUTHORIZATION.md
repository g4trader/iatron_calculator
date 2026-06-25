# Admin Authorization Pattern

Esta fundação define o padrão server-side para a área administrativa do Iatron.

## Regras

- Toda rota em `/admin/*` deve executar guarda server-side.
- Não confiar em estado client-side para autorização.
- Usar permissões por string, não checagens soltas em componentes.
- Toda mutation administrativa deve registrar `AdminAuditEvent`.
- `Role.ADMIN` é a fonte inicial de superadmin enquanto ainda não existe uma tabela granular de permissões por usuário.

## Permissões

Definidas em `lib/admin-permissions.ts`:

- `admin.dashboard.view`
- `admin.customers.view`
- `admin.customers.write`
- `admin.sales.view`
- `admin.operations.view`
- `admin.licenses.manage`
- `admin.contingency.manage`
- `admin.billing.manage`
- `admin.billing.reconcile`
- `admin.support.view`
- `admin.support.write`
- `admin.audit.view`
- `admin.audit.export`
- `admin.users.manage`

## Roles predefinidas

O RBAC maduro usa roles administrativas persistidas em `AdminRole` e permissões em `AdminRolePermission`.

- `superadmin`: governança total.
- `ops`: operações, contingência e leitura operacional.
- `billing`: billing, reconcile, vendas e leitura de clientes.
- `support`: suporte, clientes e notas operacionais.
- `auditor`: leitura de auditoria e export controlado.

`Role.ADMIN` permanece apenas como bootstrap/migração e aparece como `superadmin/bootstrap`.

## Step-up

Ações críticas exigem senha atual via step-up:

- licenças manuais;
- mudanças de roles/permissões;
- desativação de admin;
- contingência;
- exportação de auditoria;
- reconcile/reprocessamento crítico de billing.

## Helpers

```ts
import {
  getAdminCurrentUser,
  hasAdminPermission,
  requireAdminPermission,
  recordAdminAuditEvent
} from "@/lib/admin-permissions";
```

Uso em page/server component:

```ts
await requireAdminPermission("admin.users.manage");
```

Uso em mutation administrativa:

```ts
const admin = await requireAdminPermission("admin.users.manage");

try {
  // executar mutation
  await recordAdminAuditEvent({
    actorUserId: admin.id,
    action: "admin.user.role_updated",
    resourceType: "user",
    resourceId: targetUserId,
    targetUserId,
    outcome: "success",
    metadata: { role: "ADMIN" }
  });
} catch (error) {
  await recordAdminAuditEvent({
    actorUserId: admin.id,
    action: "admin.user.role_updated",
    resourceType: "user",
    resourceId: targetUserId,
    targetUserId,
    outcome: "failure"
  });
  throw error;
}
```

## Audit Trail

Modelo: `AdminAuditEvent`.

Campos principais:

- `actorUserId`
- `action`
- `resourceType`
- `resourceId`
- `organizationId`
- `targetUserId`
- `metadata`
- `ipAddress`
- `userAgent`
- `outcome`
- `createdAt`

## Rotas iniciais

- `/admin`
- `/admin/sales`
- `/admin/operations`
- `/admin/licenses`
- `/admin/billing`
- `/admin/support`
- `/admin/audit`
- `/admin/users`
- `/admin/system`

## Testes

```bash
npm run test:admin
npm run test:security
```

`test:security` garante que rotas sensíveis não voltem a usar `auth()` diretamente.
