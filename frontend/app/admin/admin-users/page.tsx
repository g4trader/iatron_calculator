import { Role } from "@prisma/client";
import { AdminPageHeader, DataTable, EmptyState, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { ADMIN_PERMISSIONS, CRITICAL_ADMIN_PERMISSIONS, listAdminAccessUsers } from "@/lib/admin-admin-users";
import { ADMIN_ROLE_DEFINITIONS } from "@/lib/admin-permissions";
import {
  deactivateAdminAction,
  grantAdminPermissionAction,
  grantAdminRoleAction,
  removeAdminRoleAction,
  revokeAdminPermissionAction
} from "./actions";

export const runtime = "nodejs";

function reasonInput(placeholder = "Motivo obrigatório") {
  return (
    <input
      name="reason"
      required
      minLength={8}
      placeholder={placeholder}
      className="h-9 min-w-48 rounded-md border border-cyan-300/10 bg-slate-950 px-3 text-xs font-semibold text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-300/50"
    />
  );
}

function confirmationInput(placeholder = "CONFIRMAR se crítico") {
  return (
    <input
      name="confirmation"
      placeholder={placeholder}
      className="h-9 min-w-40 rounded-md border border-amber-300/20 bg-slate-950 px-3 text-xs font-bold text-amber-100 outline-none transition placeholder:text-slate-700 focus:border-amber-300/50"
    />
  );
}

function stepUpInput() {
  return (
    <input
      name="stepUpPassword"
      type="password"
      required
      placeholder="Senha atual para step-up"
      className="h-9 min-w-44 rounded-md border border-rose-300/20 bg-slate-950 px-3 text-xs font-bold text-rose-100 outline-none transition placeholder:text-slate-700 focus:border-rose-300/50"
    />
  );
}

function roleSelect(defaultValue = "support") {
  return (
    <select name="roleCode" defaultValue={defaultValue} className="h-9 rounded-md border border-cyan-300/10 bg-slate-950 px-2 text-xs font-bold text-slate-200 outline-none transition focus:border-cyan-300/50">
      {Object.entries(ADMIN_ROLE_DEFINITIONS).map(([code, role]) => (
        <option key={code} value={code}>{role.name}</option>
      ))}
    </select>
  );
}

function permissionSelect(defaultValue?: string) {
  return (
    <select name="permission" defaultValue={defaultValue ?? ""} className="h-9 rounded-md border border-cyan-300/10 bg-slate-950 px-2 text-xs font-bold text-slate-200 outline-none transition focus:border-cyan-300/50">
      <option value="">Permissão</option>
      {ADMIN_PERMISSIONS.map((permission) => (
        <option key={permission} value={permission}>{permission}</option>
      ))}
    </select>
  );
}

function accessForms(user: { id: string; role: Role; adminRoleCodes: string[]; adminPermissionGrants: Array<{ permission: string; status: string; revokedAt: Date | null }> }) {
  const activeDirectGrants = user.adminPermissionGrants.filter((grant) => grant.status === "ACTIVE" && !grant.revokedAt);

  return (
    <div className="grid min-w-[520px] gap-3">
      <form action={grantAdminRoleAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="targetUserId" value={user.id} />
        {roleSelect()}
        {reasonInput("Motivo para conceder role")}
        {stepUpInput()}
        <button type="submit" className="h-9 rounded-md bg-cyan-300 px-3 text-xs font-black text-slate-950 transition hover:bg-cyan-200">Conceder role</button>
      </form>

      {user.adminRoleCodes.filter((code) => !code.includes("/bootstrap")).map((code) => (
        <form key={code} action={removeAdminRoleAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="targetUserId" value={user.id} />
          <input type="hidden" name="roleCode" value={code} />
          <span className="grid h-9 place-items-center rounded-md border border-cyan-300/10 px-2 text-xs font-bold text-slate-400">{code}</span>
          {reasonInput("Motivo para remover role")}
          {confirmationInput("Digite CONFIRMAR")}
          {stepUpInput()}
          <button type="submit" className="h-9 rounded-md border border-rose-300/20 px-3 text-xs font-black text-rose-100 transition hover:bg-rose-300/10">Remover role</button>
        </form>
      ))}

      <form action={grantAdminPermissionAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="targetUserId" value={user.id} />
        {permissionSelect()}
        {reasonInput("Motivo do grant")}
        {confirmationInput()}
        {stepUpInput()}
        <button type="submit" className="h-9 rounded-md border border-cyan-300/20 px-3 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/10">Conceder permissão</button>
      </form>

      {activeDirectGrants.map((grant) => (
        <form key={grant.permission} action={revokeAdminPermissionAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="targetUserId" value={user.id} />
          <input type="hidden" name="permission" value={grant.permission} />
          <span className="grid h-9 place-items-center rounded-md border border-cyan-300/10 px-2 text-xs font-bold text-slate-400">{grant.permission}</span>
          {reasonInput("Motivo da revogação")}
          {confirmationInput()}
          {stepUpInput()}
          <button type="submit" className="h-9 rounded-md border border-amber-300/20 px-3 text-xs font-black text-amber-100 transition hover:bg-amber-300/10">Revogar</button>
        </form>
      ))}

      <form action={deactivateAdminAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="targetUserId" value={user.id} />
        {reasonInput("Motivo da desativação")}
        {confirmationInput("Digite CONFIRMAR")}
        {stepUpInput()}
        <button type="submit" className="h-9 rounded-md border border-rose-300/20 px-3 text-xs font-black text-rose-100 transition hover:bg-rose-300/10">Desativar admin</button>
      </form>
    </div>
  );
}

export default async function AdminUsersAccessPage({
  searchParams
}: {
  searchParams?: Promise<{ message?: string; error?: string }>;
}) {
  await requireAdminPermission("admin.users.manage");
  const params = await searchParams;
  const users = await listAdminAccessUsers();
  const superadmins = users.filter((user) => user.role === Role.ADMIN).length;
  const directGrantUsers = users.filter((user) => user.role !== Role.ADMIN && user.effectivePermissions.length > 0).length;
  const criticalGrantCount = users.reduce((total, user) => total + user.effectivePermissions.filter((permission) => CRITICAL_ADMIN_PERMISSIONS.includes(permission)).length, 0);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="RBAC"
        title="Administradores e Permissões"
        description="Gestão server-side de quem acessa o backoffice. Roles predefinidas são a origem principal; grants diretos são exceções auditadas."
      />

      {params?.message ? <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm font-bold text-emerald-100">{params.message}</div> : null}
      {params?.error ? <div className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm font-bold text-rose-100">{params.error}</div> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Admins ativos" value={users.length} hint="Role ADMIN ou grants ativos." />
        <KpiCard label="Superadmins" value={superadmins} hint="Usuários com Role.ADMIN." />
        <KpiCard label="Grants pontuais" value={directGrantUsers} hint="Usuários sem ADMIN mas com permissões." />
        <KpiCard label="Permissões críticas" value={criticalGrantCount} hint="Inclui role ADMIN e grants diretos." />
      </div>

      <DataTable
        rows={users}
        empty={<EmptyState title="Nenhum admin encontrado" description="Promova um usuário via script ou conceda grants pontuais." />}
        columns={[
          {
            key: "identity",
            header: "Administrador",
            render: (user) => (
              <div className="min-w-56">
                <p className="font-black text-white">{user.name ?? "Sem nome"}</p>
                <p className="mt-1 text-xs text-slate-500">{user.email ?? "-"}</p>
              </div>
            )
          },
          { key: "status", header: "Status", render: (user) => <StatusBadge status={user.accessStatus} /> },
          { key: "role", header: "Roles", render: (user) => <div className="flex min-w-40 flex-wrap gap-2">{user.adminRoleCodes.map((role) => <StatusBadge key={role} status={role} />)}</div> },
          { key: "rolePermissions", header: "Herdadas", render: (user) => <div className="flex min-w-64 flex-wrap gap-2">{user.rolePermissions.map((permission) => <StatusBadge key={permission} status={permission} />)}</div> },
          { key: "directPermissions", header: "Diretas", render: (user) => <div className="flex min-w-64 flex-wrap gap-2">{user.directPermissions.map((permission) => <StatusBadge key={permission} status={permission} />)}</div> },
          {
            key: "permissions",
            header: "Permissões efetivas",
            render: (user) => (
              <div className="flex min-w-72 flex-wrap gap-2">
                {user.effectivePermissions.map((permission) => <StatusBadge key={permission} status={permission} />)}
              </div>
            )
          },
          { key: "last", header: "Última atividade", render: (user) => user.lastActivityAt.toLocaleString("pt-BR") },
          { key: "actions", header: "Ações auditadas", render: (user) => accessForms(user) }
        ]}
      />

      <section className="rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
        <h2 className="text-xl font-black text-white">Revisão de acesso</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Revise periodicamente usuários com `admin.users.manage`, `admin.billing.manage`, `admin.licenses.manage`, `admin.contingency.manage` e `admin.audit.view`.
          Operações críticas exigem motivo, confirmação quando aplicável e step-up com senha atual. Auto-remoção perigosa e última remoção de operador com `admin.users.manage` são bloqueadas.
        </p>
      </section>
    </div>
  );
}
