import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import snapshot from "../data/clinical-resources.json";
import { clinicalCapabilities, filterMedications, normalizeSearch, sameMedication, sourceText, type ClinicalEntry } from "../lib/clinical-resources";

const entries = snapshot.medications as ClinicalEntry[];
describe("documentary clinical resources", () => {
  it("retains 69 presentations / 16 categories / six infusions, all pending", () => {
    assert.equal(entries.length, 69);
    assert.equal(new Set(entries.map(e => e.raw.category)).size, 16);
    assert.equal(snapshot.infusions.length, 6);
    assert.ok([...entries, ...snapshot.infusions].every(e => e.status === "pending_review"));
    assert.deepEqual(snapshot.clinicalApprovals, []);
  });
  it("finds names and accent-insensitive presentations without changing source text", () => {
    assert.equal(normalizeSearch(" SOLUÇÃO\nPediátrica "), "solucao pediatrica");
    const hits = filterMedications(entries, "dipirona solucao");
    assert.deepEqual(hits.map(e => e.id), ["medications-003"]);
    assert.equal(hits[0].raw.presentation, "Solução 50mg/ml");
    assert.equal(hits[0].raw.dose, "10-12mg/kg/dose");
  });
  it("combines category, route and words without merging presentations", () => {
    const hits = filterMedications(entries, "dipirona", "ANALGÉSICOS E ANTITÉRMICOS", "VO");
    assert.deepEqual(hits.map(e => e.id), ["medications-002", "medications-003"]);
    assert.deepEqual(filterMedications(entries, "dipirona", "", "EV").map(e => e.id), ["medications-004"]);
    assert.equal(sameMedication(entries, entries[0]).length, 3);
    assert.equal(filterMedications(entries, "not-a-medication").length, 0);
    assert.equal(filterMedications(entries, "").length, 69);
  });
  it("shows explicit absence but never reformats clinical text or multiline", () => {
    for (const input of [null, undefined, "", "—", "-", "  "]) assert.equal(sourceText(input), "Não informado na fonte");
    assert.equal(sourceText("20 ui/ml\n"), "20 ui/ml\n");
    assert.equal(sourceText("1 mg/ml = = 1.000 mcg/ml"), "1 mg/ml = = 1.000 mcg/ml");
  });
  it("keeps identical ceftriaxone presentations separate by source context", () => {
    const records = filterMedications(entries, "ceftriaxona 1g/po");
    assert.deepEqual(records.map(e => e.id), ["medications-047", "medications-056"]);
    assert.notEqual(records[0].raw.route, records[1].raw.route);
    assert.equal(snapshot.validationIssues.filter(i => i.code === "SAME_PRESENTATION_CONTEXT").length, 2);
  });
  it("cannot calculate, prescribe, export or approve even if a status is tampered", () => {
    for (const status of ["pending_review", "approved", "rejected"] as const) {
      assert.deepEqual(clinicalCapabilities(status), { calculate: false, prescribe: false, exportRecommendation: false, approve: false });
    }
  });
  it("guards every data-bearing route before loading catalogs", () => {
    for (const route of ["biblioteca-medicamentos/page.tsx", "biblioteca-medicamentos/[id]/page.tsx", "infusao-continua/page.tsx"]) {
      const code = fs.readFileSync(`app/dashboard/${route}`, "utf8");
      assert.match(code, /await resourceAccess\(/);
      assert.ok(code.indexOf("if (denied) return denied") < code.lastIndexOf("getClinicalCatalog("));
    }
    const gate = fs.readFileSync("components/clinical-resources/ResourceAccess.tsx", "utf8");
    for (const check of [/await requireAuth\(\)/, /await getCommercialEntitlement\(user.id\)/, /hasAdminPermission\(admin, "admin.dashboard.view"\)/]) assert.match(gate, check);
    assert.match(fs.readFileSync("lib/clinical-resources-server.ts", "utf8"), /import "server-only"/);
  });
});
