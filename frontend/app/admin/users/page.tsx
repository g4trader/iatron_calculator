import { AdminPageHeader, DataTable, StatusBadge } from "@/components/admin/AdminPrimitives";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export default async function AdminUsersPage() {
  await requireAdminPermission("admin.users.manage");
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      licenses: { orderBy: { updatedAt: "desc" }, take: 1 },
      subscriptions: { orderBy: { updatedAt: "desc" }, take: 1 }
    }
  });

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Usuários"
        title="Contas e permissões"
        description="Consulta inicial de usuários. Alterações de role/permissão devem ser implementadas como mutations auditadas."
      />
      <DataTable
        rows={users}
        columns={[
          { key: "name", header: "Nome", render: (user) => user.name ?? "Sem nome" },
          { key: "email", header: "Email", render: (user) => user.email ?? "-" },
          { key: "role", header: "Role", render: (user) => <StatusBadge status={user.role} /> },
          { key: "subscription", header: "Assinatura", render: (user) => user.subscriptions[0]?.status ? <StatusBadge status={user.subscriptions[0].status} /> : "-" },
          { key: "license", header: "Licença", render: (user) => user.licenses[0]?.status ? <StatusBadge status={user.licenses[0].status} /> : "-" },
          { key: "created", header: "Criado em", render: (user) => user.createdAt.toLocaleDateString("pt-BR") }
        ]}
      />
    </div>
  );
}
