export type ReleaseReadinessStatus = "ready" | "partial" | "blocked";

export type ReleaseReadinessItem = {
  id: string;
  label: string;
  status: ReleaseReadinessStatus;
  detail: string;
  action?: string;
};

function present(name: string) {
  return Boolean(process.env[name]?.trim());
}

export function getAdminReleaseReadinessItems(): ReleaseReadinessItem[] {
  const productionLike = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  const archiveProvider = process.env.ARCHIVE_STORAGE_PROVIDER?.trim().toLowerCase();
  const s3Configured = archiveProvider === "s3"
    && present("ARCHIVE_S3_ENDPOINT")
    && present("ARCHIVE_S3_BUCKET")
    && present("ARCHIVE_S3_ACCESS_KEY_ID")
    && present("ARCHIVE_S3_SECRET_ACCESS_KEY");
  const gcsConfigured = archiveProvider === "gcs"
    && present("GCP_PROJECT_ID")
    && present("GCP_SERVICE_ACCOUNT_EMAIL")
    && present("GCP_PRIVATE_KEY")
    && (present("ARCHIVE_GCS_BUCKET") || present("ARCHIVE_S3_BUCKET"));
  const archiveConfigured = s3Configured || gcsConfigured;
  const stripeConfigured = present("STRIPE_SECRET_KEY")
    && present("STRIPE_WEBHOOK_SECRET")
    && present("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  const redisConfigured = present("UPSTASH_REDIS_REST_URL") && present("UPSTASH_REDIS_REST_TOKEN");
  const firestoreConfigured = process.env.RATE_LIMIT_PROVIDER?.trim().toLowerCase() === "firestore"
    && present("GCP_PROJECT_ID")
    && present("GCP_SERVICE_ACCOUNT_EMAIL")
    && present("GCP_PRIVATE_KEY");
  const rateLimitConfigured = redisConfigured || firestoreConfigured;
  const stagingConfigured = present("ADMIN_STAGING_BASE_URL");
  const inlineFallback = present("ADMIN_EXPORT_ALLOW_INLINE_FALLBACK");

  return [
    {
      id: "archive_storage",
      label: "Storage privado archive/export",
      status: archiveConfigured ? "ready" : productionLike ? "blocked" : "partial",
      detail: archiveConfigured ? `${archiveProvider?.toUpperCase()} privado configurado.` : "Sem storage externo completo. Local fallback serve apenas para dev/test.",
      action: archiveConfigured ? undefined : "Configurar ARCHIVE_STORAGE_PROVIDER=gcs com GCP_* e ARCHIVE_GCS_BUCKET, ou provider=s3 com ARCHIVE_S3_*."
    },
    {
      id: "stripe_test_mode",
      label: "Stripe test mode",
      status: stripeConfigured ? "ready" : "partial",
      detail: stripeConfigured ? "Chaves Stripe e webhook secret presentes." : "Checkout/webhook real não validável sem STRIPE_*.",
      action: stripeConfigured ? undefined : "Configurar STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET e NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY."
    },
    {
      id: "rate_limit_redis",
      label: "Rate limiting distribuído",
      status: rateLimitConfigured ? "ready" : productionLike ? "blocked" : "partial",
      detail: rateLimitConfigured ? (firestoreConfigured ? "Firestore configurado." : "Upstash Redis configurado.") : "Sem store distribuído. Fallback local não é aceitável para produção ampla.",
      action: rateLimitConfigured ? undefined : "Configurar RATE_LIMIT_PROVIDER=firestore com GCP_* ou UPSTASH_REDIS_REST_URL/TOKEN."
    },
    {
      id: "staging_url",
      label: "Produção navegável",
      status: stagingConfigured ? "ready" : "partial",
      detail: stagingConfigured ? "URL administrativa configurada para smoke." : "Readiness não consegue provar rotas públicas/admin sem URL de produção.",
      action: stagingConfigured ? undefined : "Definir ADMIN_STAGING_BASE_URL no ambiente de validação."
    },
    {
      id: "inline_export_fallback",
      label: "Fallback inline de export",
      status: inlineFallback && productionLike ? "blocked" : inlineFallback ? "partial" : "ready",
      detail: inlineFallback ? "ADMIN_EXPORT_ALLOW_INLINE_FALLBACK está ativo. Use só para compatibilidade local/dev." : "Fallback inline desativado.",
      action: inlineFallback ? "Remover ADMIN_EXPORT_ALLOW_INLINE_FALLBACK antes de produção." : undefined
    }
  ];
}

export function summarizeAdminReleaseReadiness(items = getAdminReleaseReadinessItems()) {
  const blocked = items.filter((item) => item.status === "blocked").length;
  const partial = items.filter((item) => item.status === "partial").length;
  if (blocked > 0) return { status: "blocked" as const, label: "Bloqueado", detail: `${blocked} bloqueio(s) real(is) para produção ampla.` };
  if (partial > 0) return { status: "partial" as const, label: "Parcial", detail: `${partial} item(ns) dependem de infraestrutura externa ou validação de produção.` };
  return { status: "ready" as const, label: "Pronto para produção", detail: "Checklist técnico essencial configurado." };
}
