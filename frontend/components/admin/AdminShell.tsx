import Link from "next/link";
import { Activity, Archive, BadgeCheck, BarChart3, Building2, ClipboardList, Download, Headphones, LayoutDashboard, Recycle, ShieldCheck, Siren, Users } from "lucide-react";
import type { ReactNode } from "react";
import type { AdminPermission, AdminUser } from "@/lib/admin-permissions";
import { hasAdminPermission } from "@/lib/admin-permissions";

export const adminNavigation: Array<{
  href: string;
  label: string;
  permission: AdminPermission;
  description: string;
  Icon: typeof LayoutDashboard;
}> = [
  { href: "/admin", label: "Dashboard", permission: "admin.dashboard.view", description: "Visão geral operacional", Icon: LayoutDashboard },
  { href: "/admin/customers", label: "Clientes", permission: "admin.customers.view", description: "Clientes e organizações", Icon: Users },
  { href: "/admin/sales", label: "Vendas", permission: "admin.sales.view", description: "Funil comercial e assinaturas", Icon: BarChart3 },
  { href: "/admin/operations", label: "Operações", permission: "admin.operations.view", description: "Saúde operacional do SaaS", Icon: Activity },
  { href: "/admin/licenses", label: "Licenças", permission: "admin.licenses.manage", description: "Acesso e assentos", Icon: BadgeCheck },
  { href: "/admin/contingency", label: "Contingência", permission: "admin.contingency.manage", description: "Ações excepcionais auditadas", Icon: Siren },
  { href: "/admin/billing", label: "Billing", permission: "admin.billing.manage", description: "Portal e cobrança", Icon: ClipboardList },
  { href: "/admin/support", label: "Suporte", permission: "admin.support.view", description: "Atendimento e contas", Icon: Headphones },
  { href: "/admin/audit", label: "Auditoria", permission: "admin.audit.view", description: "Trilha administrativa", Icon: ShieldCheck },
  { href: "/admin/exports", label: "Exportações", permission: "admin.audit.export", description: "Jobs de exportação governados", Icon: Download },
  { href: "/admin/archive", label: "Archive", permission: "admin.contingency.manage", description: "Histórico em storage privado", Icon: Archive },
  { href: "/admin/retention", label: "Retenção", permission: "admin.contingency.manage", description: "Cleanup e retenção auditada", Icon: Recycle },
  { href: "/admin/admin-users", label: "Admins", permission: "admin.users.manage", description: "Administradores e permissões", Icon: Users },
  { href: "/admin/users", label: "Usuários", permission: "admin.users.manage", description: "Usuários e contas", Icon: Users },
  { href: "/admin/system", label: "Sistema", permission: "admin.operations.view", description: "Diagnóstico técnico", Icon: Building2 }
];

function environmentLabel() {
  return process.env.IATRON_ENV ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local";
}

export function AdminShell({ user, children, breadcrumb = "Admin" }: { user: AdminUser; children: ReactNode; breadcrumb?: string }) {
  const visibleNavigation = adminNavigation.filter((item) => hasAdminPermission(user, item.permission));
  const environment = environmentLabel();

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-cyan-300/10 bg-slate-950/90 lg:border-b-0 lg:border-r">
          <div className="flex h-16 items-center gap-3 px-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-300 text-slate-950">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-black text-white">Iatron Admin</p>
              <p className="text-xs font-semibold text-slate-500">SaaS operations</p>
            </div>
          </div>

          <nav className="grid gap-1 px-3 pb-4 lg:pb-0">
            {visibleNavigation.map(({ href, label, description, Icon }) => (
              <Link key={href} href={href} className="group rounded-lg px-3 py-3 transition hover:bg-cyan-300/10">
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                  <span className="font-bold text-slate-200 group-hover:text-white">{label}</span>
                </span>
                <span className="mt-1 block pl-7 text-xs leading-5 text-slate-500">{description}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-cyan-300/10 bg-slate-950/90 backdrop-blur">
            <div className="flex min-h-16 flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between lg:px-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{breadcrumb}</p>
                <p className="mt-1 text-sm font-semibold text-slate-300">Ambiente administrativo server-side</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-200">{environment}</span>
                <span className="rounded-full border border-slate-300/10 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">{user.email ?? user.name ?? "admin"}</span>
                <div className="hidden min-w-64 rounded-md border border-cyan-300/10 bg-slate-900/80 px-3 py-2 text-sm text-slate-500 md:block">Buscar no admin</div>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 lg:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
