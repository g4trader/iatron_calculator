type AuthAuditEvent =
  | "register_requested"
  | "email_verified"
  | "login_succeeded"
  | "login_failed"
  | "password_reset_requested"
  | "password_reset_completed"
  | "verification_resent"
  | "rate_limited";

type AuditMetadata = Record<string, string | number | boolean | null | undefined>;

function sanitize(metadata: AuditMetadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([key, value]) => {
      if (value === undefined) return false;
      return !/password|token|secret/i.test(key);
    })
  );
}

export function auditAuthEvent(event: AuthAuditEvent, metadata: AuditMetadata = {}) {
  const payload = {
    scope: "auth",
    event,
    timestamp: new Date().toISOString(),
    ...sanitize(metadata)
  };

  if (event === "login_failed" || event === "rate_limited") {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
}
