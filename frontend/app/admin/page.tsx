import { Plan, SubscriptionStatus } from "@prisma/client";
import { AdminModuleLink, AdminPageHeader, DataTable, FilterBar, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { adminNavigation } from "@/components/admin/AdminShell";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { getAdminReleaseReadinessItems, summarizeAdminReleaseReadiness } from "@/lib/admin-release-readiness";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export default async function AdminPage({ searchParams }: { searchParams?: Promise<{ plan?: string; status?: string }> }) {
  const admin = await requireAdminPermission("admin.dashboard.view");

  const params = await searchParams;
  const plan = params?.plan && Object.values(Plan).includes(params.plan as Plan) ? (params.plan as Plan) : undefined;
  const status = params?.status && Object.values(SubscriptionStatus).includes(params.status as SubscriptionStatus) ? (params.status as SubscriptionStatus) : undefined;
  const where = {
    ...(plan ? { plan } : {}),
    ...(status ? { status } : {})
  };

  const [totalUsers, activeSubscriptions, trials, canceled, users, subscriptions, auditEvents] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "TRIALING" } }),
    prisma.subscription.count({ where: { status: "CANCELED" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.subscription.findMany({ where, orderBy: { updatedAt: "desc" }, take: 8, include: { user: true, organization: true } }),
    prisma.adminAuditEvent.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { actor: true } })
  ]);
  const releaseItems = getAdminReleaseReadinessItems();
  const releaseSummary = summarizeAdminReleaseReadiness(releaseItems);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Administração"
        title="Painel administrativo"
        description="Base operacional do SaaS para acompanhar usuários, assinaturas, licenças, suporte e trilha de auditoria."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Usuários" value={totalUsers} hint="Total de contas criadas" />
        <KpiCard label="Ativas" value={activeSubscriptions} hint="Assinaturas com acesso ativo" />
        <KpiCard label="Trials" value={trials} hint="Acessos em período de teste" />
        <KpiCard label="Canceladas" value={canceled} hint="Assinaturas canceladas" />
      </div>

      <section className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-black text-white">Liberação controlada</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{releaseSummary.detail}</p>
          </div>
          <StatusBadge status={releaseSummary.label} />
        </div>
        <DataTable
          rows={releaseItems}
          columns={[
            { key: "label", header: "Item", render: (item) => item.label },
            { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
            { key: "detail", header: "Detalhe", render: (item) => item.detail },
            { key: "action", header: "Ação mínima", render: (item) => item.action ?? "-" }
          ]}
        />
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {adminNavigation
          .filter((item) => admin.adminPermissions.includes(item.permission))
          .filter((item) => item.href.startsWith("/admin"))
          .map((item) => (
            <AdminModuleLink key={item.href} href={item.href} title={item.label} description={item.description} permission={item.permission} />
          ))}
      </div>

      <FilterBar>
        <StatusBadge status={status ?? "todos"} />
        <StatusBadge status={plan ?? "todos os planos"} />
      </FilterBar>

      <DataTable
        rows={subscriptions}
        columns={[
          {
            key: "owner",
            header: "Titular",
            render: (subscription) => subscription.user?.email ?? subscription.organization?.name ?? "Sem titular"
          },
          { key: "plan", header: "Plano", render: (subscription) => subscription.plan },
          { key: "status", header: "Status", render: (subscription) => <StatusBadge status={subscription.status} /> },
          { key: "cycle", header: "Ciclo", render: (subscription) => subscription.billingCycle },
          { key: "updated", header: "Atualização", render: (subscription) => subscription.updatedAt.toLocaleDateString("pt-BR") }
        ]}
      />

      <DataTable
        rows={users}
        columns={[
          { key: "name", header: "Nome", render: (user) => user.name ?? "Sem nome" },
          { key: "email", header: "Email", render: (user) => user.email ?? "-" },
          { key: "role", header: "Role", render: (user) => <StatusBadge status={user.role} /> },
          { key: "created", header: "Criado em", render: (user) => user.createdAt.toLocaleDateString("pt-BR") }
        ]}
      />

      <DataTable
        rows={auditEvents}
        empty="Sem eventos administrativos recentes."
        columns={[
          { key: "action", header: "Ação", render: (event) => event.action },
          { key: "resource", header: "Recurso", render: (event) => event.resourceType },
          { key: "outcome", header: "Resultado", render: (event) => <StatusBadge status={event.outcome} /> },
          { key: "actor", header: "Ator", render: (event) => event.actor?.email ?? "sistema" },
          { key: "created", header: "Data", render: (event) => event.createdAt.toLocaleString("pt-BR") }
        ]}
      />
    </div>
  );
}
