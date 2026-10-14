import "server-only";
import snapshot from "@/data/clinical-resources.json";
import type { ClinicalCatalog } from "@/lib/clinical-resources";

// Only invoked after the existing auth + entitlement policy has granted access.
// Never import the snapshot from a client component or expose it under /public.
export function getClinicalCatalog(kind: "medications" | "infusions"): ClinicalCatalog {
  const entries = snapshot[kind];
  if (snapshot.clinicalApprovals.length || entries.some(entry => entry.status !== "pending_review")) {
    throw new Error("Clinical resource snapshot requires external review; execution remains unavailable.");
  }
  return {
    sources: snapshot.clinicalSources.filter(source => source.id === kind),
    entries,
    issues: snapshot.validationIssues.filter(issue => issue.sourceId === kind),
  } as ClinicalCatalog;
}
