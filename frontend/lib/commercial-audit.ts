type CommercialAuditEvent = "commercial_access_denied";

type CommercialAuditPayload = {
  userId?: string;
  feature?: string;
  reason?: string;
  accountType?: string;
  status?: string;
  organizationId?: string;
};

export function auditCommercialEvent(event: CommercialAuditEvent, payload: CommercialAuditPayload) {
  const entry = {
    event,
    scope: "commercial_access",
    timestamp: new Date().toISOString(),
    ...payload
  };

  if (event === "commercial_access_denied") {
    console.warn(JSON.stringify(entry));
  }
}
