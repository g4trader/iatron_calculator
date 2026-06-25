type OrganizationAuditEvent =
  | "organization_created"
  | "organization_invite_created"
  | "organization_invite_accepted"
  | "organization_license_assigned"
  | "organization_license_revoked"
  | "authorization_denied";

type AuditMetadata = Record<string, string | number | boolean | null | undefined>;

function sanitize(metadata: AuditMetadata = {}) {
  return Object.fromEntries(
    Object.entries(metadata).filter(([key, value]) => {
      if (value === undefined) return false;
      return !/token|secret|password/i.test(key);
    })
  );
}

export function auditOrganizationEvent(event: OrganizationAuditEvent, metadata: AuditMetadata = {}) {
  const payload = {
    scope: "organization",
    event,
    timestamp: new Date().toISOString(),
    ...sanitize(metadata)
  };

  if (event === "authorization_denied") {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
}
