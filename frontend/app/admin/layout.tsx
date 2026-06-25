import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPermission } from "@/lib/admin-permissions";

export const runtime = "nodejs";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminPermission("admin.dashboard.view");
  return <AdminShell user={user}>{children}</AdminShell>;
}
