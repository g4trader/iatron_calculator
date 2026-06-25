import { CheckCircle2, CircleAlert } from "lucide-react";
import { AdminPageHeader, DataTable, KpiCard, StatusBadge } from "@/components/admin/AdminPrimitives";
import { getStripeOperationalChecklist } from "@/lib/checkout-onboarding";
import { requireAdminPermission } from "@/lib/admin-permissions";
import { getAdminReleaseReadinessItems, summarizeAdminReleaseReadiness } from "@/lib/admin-release-readiness";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function present(name: string) {
  return Boolean(process.env[name] && process.env[name]?.trim());
}

export default async function SystemPage() {
  await requireAdminPermission("admin.operations.view");

  let database = "disconnected";
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "connected";
  } catch {
    database = "disconnected";
  }

  const checks = [
    ["DATABASE_URL", present("DATABASE_URL")],
    ["AUTH_SECRET", present("AUTH_SECRET")],
    ["AUTH_URL", present("AUTH_URL")],
    ["NEXTAUTH_URL", present("NEXTAUTH_URL")],
    ["NEXT_PUBLIC_API_URL", present("NEXT_PUBLIC_API_URL")],
    ["RESEND_API_KEY", present("RESEND_API_KEY")],
    ["EMAIL_FROM", present("EMAIL_FROM")],
    ["UPSTASH_REDIS_REST_URL", present("UPSTASH_REDIS_REST_URL")],
    ["UPSTASH_REDIS_REST_TOKEN", present("UPSTASH_REDIS_REST_TOKEN")],
    ["GOOGLE_CLIENT_ID", present("GOOGLE_CLIENT_ID")],
    ["GOOGLE_CLIENT_SECRET", present("GOOGLE_CLIENT_SECRET")],
    ["FACEBOOK_CLIENT_ID", present("FACEBOOK_CLIENT_ID")],
    ["FACEBOOK_CLIENT_SECRET", present("FACEBOOK_CLIENT_SECRET")],
    ["ARCHIVE_STORAGE_PROVIDER", present("ARCHIVE_STORAGE_PROVIDER")],
    ["ARCHIVE_S3_ENDPOINT", present("ARCHIVE_S3_ENDPOINT")],
    ["ARCHIVE_S3_BUCKET", present("ARCHIVE_S3_BUCKET")],
    ["ARCHIVE_S3_ACCESS_KEY_ID", present("ARCHIVE_S3_ACCESS_KEY_ID")],
    ["ARCHIVE_S3_SECRET_ACCESS_KEY", present("ARCHIVE_S3_SECRET_ACCESS_KEY")],
    ["ADMIN_STAGING_BASE_URL", present("ADMIN_STAGING_BASE_URL")]
  ].map(([id, ok]) => ({ id: String(id), name: String(id), ok: Boolean(ok) }));

  const stripeChecks = [
    ["STRIPE_SECRET_KEY", present("STRIPE_SECRET_KEY")],
    ["STRIPE_WEBHOOK_SECRET", present("STRIPE_WEBHOOK_SECRET")],
    ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", present("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")],
    ["STRIPE_PRICE_PROFESSIONAL_MONTHLY", present("STRIPE_PRICE_PROFESSIONAL_MONTHLY")]
  ].map(([id, ok]) => ({ id: String(id), name: String(id), ok: Boolean(ok) }));
  const stripeOperationalChecklist = getStripeOperationalChecklist().map((item) => ({ id: item.key, ...item }));
  const releaseItems = getAdminReleaseReadinessItems();
  const releaseSummary = summarizeAdminReleaseReadiness(releaseItems);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Diagnóstico interno"
        title="Sistema"
        description="Valores booleanos apenas. Nenhum secret é exibido."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Banco" value={database} />
        <KpiCard label="Ambiente" value={process.env.IATRON_ENV ?? process.env.NODE_ENV} />
        <KpiCard label="Stripe" value={stripeChecks.every((item) => item.ok) ? "configured" : "pending"} />
      </div>

      <section className="grid gap-4 rounded-xl border border-cyan-300/10 bg-slate-950/75 p-5">
        <div>
          <h2 className="text-xl font-black text-white">Readiness de liberação</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{releaseSummary.detail}</p>
        </div>
        <DataTable
          rows={releaseItems}
          columns={[
            { key: "label", header: "Item", render: (item) => item.label },
            { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
            { key: "detail", header: "Detalhe", render: (item) => item.detail },
            { key: "action", header: "Ação", render: (item) => item.action ?? "-" }
          ]}
        />
      </section>

      <DataTable
        rows={checks}
        columns={[
          { key: "name", header: "Variável", render: (item) => item.name },
          {
            key: "status",
            header: "Status",
            render: (item) => item.ok
              ? <span className="text-cyan-200"><CheckCircle2 className="h-5 w-5" aria-hidden="true" /></span>
              : <span className="text-amber-200"><CircleAlert className="h-5 w-5" aria-hidden="true" /></span>
          }
        ]}
      />

      <DataTable
        rows={stripeChecks}
        columns={[
          { key: "name", header: "Stripe", render: (item) => item.name },
          { key: "status", header: "Status", render: (item) => <StatusBadge status={item.ok ? "configured" : "pending"} /> }
        ]}
      />

      <DataTable
        rows={stripeOperationalChecklist}
        columns={[
          { key: "label", header: "Checklist", render: (item) => item.label },
          { key: "status", header: "Status", render: (item) => <StatusBadge status={item.status} /> },
          { key: "detail", header: "Detalhe", render: (item) => item.detail }
        ]}
      />
    </div>
  );
}
