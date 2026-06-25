type BillingAuditEvent =
  | "checkout_session_created"
  | "billing_portal_created"
  | "stripe_webhook_processed"
  | "stripe_webhook_duplicate"
  | "subscription_synced"
  | "license_synced"
  | "billing_reconciled"
  | "billing_authorization_denied";

type AuditMetadata = Record<string, string | number | boolean | null | undefined>;

function sanitize(metadata: AuditMetadata = {}) {
  return Object.fromEntries(Object.entries(metadata).filter(([key, value]) => value !== undefined && !/secret|token/i.test(key)));
}

export function auditBillingEvent(event: BillingAuditEvent, metadata: AuditMetadata = {}) {
  const payload = {
    scope: "billing",
    event,
    timestamp: new Date().toISOString(),
    ...sanitize(metadata)
  };

  if (event === "billing_authorization_denied") {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
}
