type MetricPayload = Record<string, string | number | boolean | null | undefined>;

export function createRequestId() {
  return crypto.randomUUID();
}

export function logMetric(event: string, payload: MetricPayload = {}) {
  const entry = {
    scope: "metrics",
    event,
    timestamp: new Date().toISOString(),
    ...Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
  };
  console.info(JSON.stringify(entry));
}
