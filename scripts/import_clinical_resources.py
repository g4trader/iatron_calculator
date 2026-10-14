"""Read-only OOXML import. No Excel formulas or clinical expressions are evaluated.

Atomic, versioned documentary snapshot; never merges into existing clinical engines.
Python standard library only. Run from any directory with --check for drift detection.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import posixpath
import re
import tempfile
import unicodedata
from zipfile import ZipFile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
SPECS = {
    "medications": {"file": "Base-Conhecimento-Pediatria-Doses (1).xlsx", "hash": "54e81afad928e9944cb180e4ffa8b3165a1cf27a1ebd1b67e4c9abea7d484f3e", "sheet": "Fichas", "header": 1, "start": 2, "end": 70,
        "fields": ["category", "name", "presentation", "dose", "interval", "maximumDose", "route", "preparation", "mnemonic", "warnings", "reference"]},
    "infusions": {"file": "Drogas choque _ infusão contínua (1).xlsx", "hash": "f149f420ecbc461711a50c0717c70e082378cc356e00bd829c29b48263024839", "sheet": "Página1", "header": 3, "start": 4, "end": 9,
        "fields": ["name", "presentation", "dose", "formula", "dilution", "concentration", "mnemonic"]},
}


def normalize(value):
    return " ".join("".join(c for c in unicodedata.normalize("NFD", value) if unicodedata.category(c) != "Mn").lower().split())


def missing(value):
    return value is None or value.strip() in ("", "—", "–", "-")


def workbook(path):
    """Keep original cell text (including spaces/newlines) and formula/cache separately."""
    with ZipFile(path) as archive:
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            strings = ["".join(t.text or "" for t in item.findall(".//s:t", NS)) for item in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        relationships = {r.attrib["Id"]: r.attrib["Target"] for r in ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))}
        sheets = []
        for sheet in ET.fromstring(archive.read("xl/workbook.xml")).findall("s:sheets/s:sheet", NS):
            target = relationships[sheet.attrib[f"{{{REL}}}id"]]
            target = target.lstrip("/") if target.startswith("/") else posixpath.normpath("xl/" + target)
            xml = ET.fromstring(archive.read(target))
            rows = []
            for row in xml.findall("s:sheetData/s:row", NS):
                cells = {}
                for cell in row.findall("s:c", NS):
                    value = cell.find("s:v", NS)
                    value = value.text if value is not None else None
                    kind = cell.attrib.get("t", "n")
                    if kind == "s":
                        value = strings[int(value)] if value is not None else None
                    elif kind == "inlineStr":
                        value = "".join(t.text or "" for t in cell.findall("s:is//s:t", NS))
                    formula = cell.find("s:f", NS)
                    cells[cell.attrib["r"]] = {"text": value, "type": kind, "formula": formula.text if formula is not None else None}
                rows.append({"row": int(row.attrib["r"]), "cells": cells})
            sheets.append({"name": sheet.attrib["name"], "rows": rows,
                           "mergedCells": [c.attrib["ref"] for c in xml.findall("s:mergeCells/s:mergeCell", NS)]})
        return sheets


def build(docs, previous=None):
    previous = previous or {}
    now = datetime.now(timezone.utc).isoformat()
    result = {"schemaVersion": 1, "clinicalSources": [], "medications": [], "infusions": [], "validationIssues": [], "clinicalApprovals": [], "inventory": []}
    for source_id, spec in SPECS.items():
        path = docs / spec["file"]
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest != spec["hash"]:
            raise ValueError(f"SOURCE_HASH_CONFLICT: {path.name}. Original changed; existing catalog preserved. Review as a new source version, never overwrite automatically.")
        old = next((s for s in previous.get("clinicalSources", []) if s["id"] == source_id and s["sha256"] == digest), {})
        imported = old.get("importedAt", now)
        source = {"id": source_id, "file": f"docs/{path.name}", "sha256": digest, "version": f"xlsx-{digest[:12]}", "importedAt": imported, "status": "pending_review", "reviewers": [], "approvedAt": None}
        result["clinicalSources"].append(source)
        sheets = workbook(path)
        result["inventory"].append({"sourceId": source_id, "sheets": sheets})
        sheet = next(s for s in sheets if s["name"] == spec["sheet"])
        rows = {r["row"]: r["cells"] for r in sheet["rows"]}
        headers = {key: rows[spec["header"]][f"{chr(65 + i)}{spec['header']}"]["text"] for i, key in enumerate(spec["fields"])}
        source["columns"] = headers
        for row in range(spec["start"], spec["end"] + 1):
            raw = {field: rows[row].get(f"{chr(65 + i)}{row}", {}).get("text") for i, field in enumerate(spec["fields"])}
            if missing(raw["name"]):
                raise ValueError(f"Missing record identity: {path.name}/{spec['sheet']}/{row}")
            for cell in rows[row].values():
                if cell["formula"] is not None:
                    raise ValueError(f"Unexpected executable cell formula in clinical record: {path.name}/{row}")
            entry = {"id": f"{source_id}-{row:03d}", "sourceId": source_id, "sheet": spec["sheet"], "row": row, "sourceHash": digest, "version": source["version"], "status": "pending_review", "reviewers": [], "createdAt": imported, "updatedAt": imported, "approvedAt": None, "raw": raw,
                     "cells": {field: f"{chr(65 + i)}{row}" for i, field in enumerate(spec["fields"])},
                     "search": {key: normalize(value or "") for key, value in raw.items()}}
            result[source_id].append(entry)

            def issue(code, fields, message, severity="review"):
                result["validationIssues"].append({"id": f"{entry['id']}:{code}", "entryId": entry["id"], "sourceId": source_id, "file": source["file"], "sheet": entry["sheet"], "row": row, "cells": [entry["cells"][f] for f in fields], "code": code, "severity": severity, "message": message, "status": "open"})

            issue("HOMOLOGATION_REQUIRED", ["reference"] if source_id == "medications" else ["formula", "dilution"], "Homologação institucional não documentada. Referência bibliográfica não equivale a aprovação clínica.")
            absent = [k for k, v in raw.items() if missing(v)]
            if absent:
                issue("MISSING_SOURCE_FIELDS", absent, "Campos não informados ou com marcador de ausência na fonte: " + ", ".join(headers[k] for k in absent))
            if source_id == "medications" and row in (2, 3):
                issue("DIPYRONE_DIMENSION_REVIEW", ["presentation", "dose", "mnemonic"], "Conferir separadamente a relação entre apresentação, dose habitual e macete. Aparente incompatibilidade dimensional na linha 2; a linha 3 requer revisão própria. Nenhum valor foi corrigido.", "blocking")
            if source_id == "infusions":
                issue("FINAL_VOLUME_UNDEFINED", ["dilution", "concentration"], "A soma textual de volumes não define inequivocamente o volume final da mistura. Concentração declarada preservada, não recalculada.", "blocking")
                issue("TIME_BASIS_UNVERIFIED", ["formula", "mnemonic"], "Volume/24h e macete em ml/h não são intercambiáveis sem protocolo e concentração homologados.", "blocking")
                if row == 5:
                    issue("SOURCE_TYPO", ["presentation"], "Duplo sinal de igualdade na apresentação original: '1 mg/ml = = 1.000 mcg/ml'. Texto mantido.")
                if row == 9:
                    issue("VASOPRESSIN_UNITS", ["presentation", "dose", "formula", "concentration"], "Vasopressina usa ui/mui/mUI na fonte. Não aplicar fórmula de mcg/kg/min nem converter unidades silenciosamente.", "blocking")
    for row, code, message in [
        (3, "BIBLIOGRAPHY_NOT_APPROVAL", "A legenda menciona validação por referência padrão. Isso não documenta homologação institucional das 28 fichas relacionadas ao Ebook."),
        (4, "LEGEND_MNEMONIC_REVIEW", "A legenda repete o macete de dipirona gotas e um exemplo de volume. Conferir junto à ficha da linha 2; não executar nem usar o exemplo como caso homologado."),
        (8, "FORMULA_CACHE_ABSENT", "A fórmula COUNTA foi preservada como texto; não há valor em cache. A contagem 69 foi obtida contando registros, sem executar fórmulas Excel."),
    ]:
        result["validationIssues"].append({"id": f"medications:legend:{row}", "entryId": "medications-002" if row == 4 else None, "sourceId": "medications", "file": "docs/" + SPECS["medications"]["file"], "sheet": "Legenda", "row": row, "cells": [f"B{row}"], "code": code, "severity": "review", "message": message, "status": "open"})
    groups = {}
    for entry in result["medications"]:
        groups.setdefault((entry["search"]["name"], entry["search"]["presentation"]), []).append(entry)
    for group in groups.values():
        if len(group) < 2:
            continue
        for entry in group:
            result["validationIssues"].append({"id": f"{entry['id']}:SAME_PRESENTATION_CONTEXT", "entryId": entry["id"], "sourceId": "medications", "file": "docs/" + SPECS["medications"]["file"], "sheet": entry["sheet"], "row": entry["row"], "cells": [entry["cells"][f] for f in ("category", "name", "presentation", "route")], "code": "SAME_PRESENTATION_CONTEXT", "severity": "review", "message": "Mesmo nome/apresentação em mais de um contexto de categoria/via. Registros mantidos separados, sem fusão de doses ou indicação de equivalência.", "status": "open"})
    categories = {e["raw"]["category"] for e in result["medications"]}
    counts = {"medications": len(result["medications"]), "categories": len(categories), "infusions": len(result["infusions"]), "palsPending": sum(e["raw"]["reference"] == "Padrão PALS/SBP (validar)" for e in result["medications"])}
    if counts != {"medications": 69, "categories": 16, "infusions": 6, "palsPending": 41}:
        raise ValueError(f"SOURCE_COUNT_CONFLICT: {counts}")
    result["counts"] = counts
    if previous.get("clinicalApprovals") or any(e.get("status") != "pending_review" for kind in ("medications", "infusions") for e in previous.get(kind, [])):
        raise ValueError("APPROVAL_CONFLICT: import cannot overwrite reviewed records or approvals")
    return result


def run(docs, output, check=False):
    previous = json.loads(output.read_text()) if output.exists() else None
    result = build(docs, previous)
    serialized = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if check:
        if not output.exists() or output.read_text() != serialized:
            raise ValueError("GENERATED_DATA_DRIFT: run import and review the diff")
    elif not output.exists() or output.read_text() != serialized:
        output.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=output.parent, delete=False) as tmp:
            tmp.write(serialized)
        Path(tmp.name).replace(output)
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--docs-dir", type=Path, default=ROOT / "docs")
    parser.add_argument("--output", type=Path, default=ROOT / "frontend/data/clinical-resources.json")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        data = run(args.docs_dir, args.output, args.check)
        print(json.dumps({"status": "PASS", "counts": data["counts"], "issues": len(data["validationIssues"]), "approved": 0}, ensure_ascii=False))
    except (ValueError, KeyError, OSError) as error:
        print(json.dumps({"status": "BLOCKED", "conflict": str(error)}, ensure_ascii=False))
        raise SystemExit(1)
