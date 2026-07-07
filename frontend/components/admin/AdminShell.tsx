import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { AdminUser } from "@/lib/admin-permissions";
export { adminNavigation, adminNavigationGroups } from "@/components/admin/adminNavigation";

function environmentLabel() {
  return process.env.IATRON_ENV ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local";
}

export function AdminShell({ user, children, breadcrumb = "Admin" }: { user: AdminUser; children: ReactNode; breadcrumb?: string }) {
  const environment = environmentLabel();

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100">
      <div className="min-h-screen lg:flex">
        <AdminSidebar permissions={user.adminPermissions} userEmail={user.email ?? null} userName={user.name ?? null} />

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-cyan-300/10 bg-slate-950/90 backdrop-blur">
            <div className="flex min-h-16 flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between lg:px-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{breadcrumb}</p>
                <p className="mt-1 text-sm font-semibold text-slate-300">Ambiente administrativo server-side</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-200">{environment}</span>
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
