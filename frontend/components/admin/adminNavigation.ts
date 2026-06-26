import { Activity, Archive, BadgeCheck, BarChart3, Building2, ClipboardList, Download, Headphones, LayoutDashboard, Recycle, ShieldCheck, Siren, UserCog, Users } from "lucide-react";
import type { AdminPermission } from "@/lib/admin-permissions";

export type AdminNavigationItem = {
  href: string;
  label: string;
  permission: AdminPermission;
  description: string;
  Icon: typeof LayoutDashboard;
};

export type AdminNavigationGroup = {
  id: string;
  label: string;
  items: AdminNavigationItem[];
};

export const adminNavigationGroups: AdminNavigationGroup[] = [
  {
    id: "executive",
    label: "Negócio",
    items: [
      { href: "/admin", label: "Cockpit", permission: "admin.dashboard.view", description: "Receita, crescimento e riscos", Icon: LayoutDashboard },
      { href: "/admin/sales", label: "Vendas", permission: "admin.sales.view", description: "Funil comercial e assinaturas", Icon: BarChart3 },
      { href: "/admin/billing", label: "Billing", permission: "admin.billing.manage", description: "Cobrança e risco de receita", Icon: ClipboardList }
    ]
  },
  {
    id: "administration",
    label: "Administração",
    items: [
      { href: "/admin/customers", label: "Cadastros", permission: "admin.customers.view", description: "Clientes e organizações", Icon: Users },
      { href: "/admin/users", label: "Usuários", permission: "admin.users.manage", description: "Usuários e contas", Icon: Users },
      { href: "/admin/admin-users", label: "Administradores", permission: "admin.users.manage", description: "Permissões do backoffice", Icon: UserCog },
      { href: "/admin/licenses", label: "Licenças", permission: "admin.licenses.manage", description: "Acesso, licenças e assentos", Icon: BadgeCheck }
    ]
  },
  {
    id: "operations",
    label: "Operações",
    items: [
      { href: "/admin/operations", label: "Status", permission: "admin.operations.view", description: "Saúde operacional do SaaS", Icon: Activity },
      { href: "/admin/support", label: "Suporte", permission: "admin.support.view", description: "Atendimento e contas em risco", Icon: Headphones },
      { href: "/admin/contingency", label: "Contingência", permission: "admin.contingency.manage", description: "Ações excepcionais auditadas", Icon: Siren },
      { href: "/admin/system", label: "Sistema", permission: "admin.operations.view", description: "Diagnóstico técnico", Icon: Building2 }
    ]
  },
  {
    id: "governance",
    label: "Governança",
    items: [
      { href: "/admin/audit", label: "Auditoria", permission: "admin.audit.view", description: "Trilha administrativa", Icon: ShieldCheck },
      { href: "/admin/exports", label: "Exportações", permission: "admin.audit.export", description: "Exportações governadas", Icon: Download },
      { href: "/admin/archive", label: "Archive", permission: "admin.contingency.manage", description: "Histórico em storage privado", Icon: Archive },
      { href: "/admin/retention", label: "Retenção", permission: "admin.contingency.manage", description: "Cleanup e retenção auditada", Icon: Recycle }
    ]
  }
];

export const adminNavigation = adminNavigationGroups.flatMap((group) => group.items);
