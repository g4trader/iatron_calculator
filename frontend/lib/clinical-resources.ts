/** Documentary data only. This module deliberately contains no dose/rate calculation. */
export type ClinicalStatus = "pending_review" | "approved" | "rejected";
export type ClinicalSource = {
  id: string; file: string; sha256: string; version: string; importedAt: string;
  status: ClinicalStatus; reviewers: string[]; approvedAt: string | null;
  columns: Record<string, string | undefined>;
};
export type ClinicalEntry = {
  id: string; sourceId: string; sheet: string; row: number; sourceHash: string;
  version: string; status: ClinicalStatus; reviewers: string[];
  createdAt: string; updatedAt: string; approvedAt: string | null;
  raw: Record<string, string | null | undefined>; search: Record<string, string | undefined>; cells: Record<string, string | undefined>;
};
export type ValidationIssue = {
  id: string; entryId: string | null; sourceId: string; file: string; sheet: string; row: number;
  cells: string[]; code: string; severity: string; message: string; status: string;
};
export type ClinicalCatalog = {
  sources: ClinicalSource[]; entries: ClinicalEntry[]; issues: ValidationIssue[];
};
export function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}
export function sourceText(value?: string | null) {
  return !value?.trim() || ["—", "–", "-"].includes(value.trim()) ? "Não informado na fonte" : value;
}
export function filterMedications(entries: ClinicalEntry[], query: string, category = "", route = "") {
  const words = normalizeSearch(query).split(" ").filter(Boolean);
  return entries.filter(entry => {
    const haystack = ["name", "category", "presentation", "route"].map(k => entry.search[k]).join(" ");
    return words.every(word => haystack.includes(word)) &&
      (!category || entry.raw.category === category) &&
      (!route || (entry.raw.route || "").split("/").map(s => s.trim()).includes(route));
  });
}
export function sameMedication(entries: ClinicalEntry[], entry: ClinicalEntry) {
  return entries.filter(item => item.search.name === entry.search.name);
}
/** No role, reference text or hand-edited approval flag enables execution in this release. */
export function clinicalCapabilities(_status: ClinicalStatus) {
  return { calculate: false, prescribe: false, exportRecommendation: false, approve: false } as const;
}
