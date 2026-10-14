import copy
import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest

from import_clinical_resources import ROOT, SPECS, build, normalize, run, workbook


class ClinicalImportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = build(ROOT / "docs")

    def test_counts_and_unique_stable_ids(self):
        self.assertEqual(self.data["counts"], {"medications": 69, "categories": 16, "infusions": 6, "palsPending": 41})
        for kind, spec in SPECS.items():
            entries = self.data[kind]
            self.assertEqual(len({e["id"] for e in entries}), len(entries))
            self.assertEqual([e["row"] for e in entries], list(range(spec["start"], spec["end"] + 1)))

    def test_idempotence_preserves_bytes_and_timestamps(self):
        with tempfile.TemporaryDirectory() as d:
            out = Path(d) / "snapshot.json"
            run(ROOT / "docs", out)
            before, mtime = out.read_bytes(), out.stat().st_mtime_ns
            run(ROOT / "docs", out)
            run(ROOT / "docs", out, check=True)
            self.assertEqual(out.read_bytes(), before)
            self.assertEqual(out.stat().st_mtime_ns, mtime)

    def test_every_clinical_cell_preserved_exactly(self):
        for kind, spec in SPECS.items():
            sheets = workbook(ROOT / "docs" / spec["file"])
            rows = {r["row"]: r["cells"] for s in sheets if s["name"] == spec["sheet"] for r in s["rows"]}
            for entry in self.data[kind]:
                for field, ref in entry["cells"].items():
                    self.assertEqual(entry["raw"][field], rows[entry["row"]].get(ref, {}).get("text"))

    def test_originals_and_supplied_duplicates_match(self):
        duplicates = {"medications": "BASE_DOSES_ORIGINAL.xlsx", "infusions": "INFUSAO_ORIGINAL.xlsx"}
        for key, spec in SPECS.items():
            for path in [ROOT / "docs" / spec["file"], ROOT / "iatron_clinical_resources" / duplicates[key]]:
                self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(), spec["hash"])

    def test_no_reference_or_role_is_imported_as_approval(self):
        self.assertEqual(self.data["clinicalApprovals"], [])
        for entry in self.data["medications"] + self.data["infusions"]:
            self.assertEqual(entry["status"], "pending_review")
            self.assertEqual(entry["reviewers"], [])
            self.assertIsNone(entry["approvedAt"])
        self.assertEqual(sum("Ebook" in e["raw"]["reference"] for e in self.data["medications"]), 28)

    def test_accents_multiline_absent_and_source_typo(self):
        self.assertEqual(normalize("  SOLUÇÃO\nPediátrica  "), "solucao pediatrica")
        self.assertEqual(self.data["infusions"][-1]["raw"]["name"], "Vasopressina\n\n")
        self.assertEqual(self.data["infusions"][-1]["raw"]["presentation"], "20 ui/ml\n")
        self.assertEqual(self.data["medications"][0]["raw"]["preparation"], "—")
        self.assertEqual(self.data["infusions"][1]["raw"]["presentation"], "1 mg/ml = = 1.000 mcg/ml")

    def test_formulas_in_inventory_not_executed(self):
        formula_cells = [(s["name"], ref, c) for inv in self.data["inventory"] for s in inv["sheets"] for r in s["rows"] for ref, c in r["cells"].items() if c["formula"]]
        self.assertEqual(len(formula_cells), 1)
        sheet, ref, cell = formula_cells[0]
        self.assertEqual((sheet, ref, cell["formula"]), ("Legenda", "B8", "COUNTA(Fichas!$C$2:$C$70)"))
        self.assertIsNone(cell["text"])

    def test_source_conflict_is_atomic(self):
        with tempfile.TemporaryDirectory() as d:
            folder = Path(d)
            for spec in SPECS.values():
                shutil.copyfile(ROOT / "docs" / spec["file"], folder / spec["file"])
            out = folder / "snapshot.json"
            run(folder, out)
            before = out.read_bytes()
            path = folder / SPECS["infusions"]["file"]
            path.write_bytes(path.read_bytes() + b"modified")
            with self.assertRaisesRegex(ValueError, "SOURCE_HASH_CONFLICT"):
                run(folder, out)
            self.assertEqual(out.read_bytes(), before)

    def test_import_never_overwrites_an_approval(self):
        previous = copy.deepcopy(self.data)
        previous["medications"][0]["status"] = "approved"
        with self.assertRaisesRegex(ValueError, "APPROVAL_CONFLICT"):
            build(ROOT / "docs", previous)

    def test_report_is_addressable_and_covers_known_conflicts(self):
        for issue in self.data["validationIssues"]:
            self.assertTrue(issue["file"].startswith("docs/"))
            self.assertTrue(issue["cells"])
            self.assertTrue(issue["row"])
        self.assertEqual(sum(i["code"] == "DIPYRONE_DIMENSION_REVIEW" for i in self.data["validationIssues"]), 2)
        self.assertEqual(sum(i["code"] == "VASOPRESSIN_UNITS" for i in self.data["validationIssues"]), 1)
        self.assertEqual(sum(i["code"] == "FINAL_VOLUME_UNDEFINED" for i in self.data["validationIssues"]), 6)

    def test_checked_in_snapshot_is_current(self):
        run(ROOT / "docs", ROOT / "frontend/data/clinical-resources.json", check=True)


if __name__ == "__main__":
    unittest.main(verbosity=2)
