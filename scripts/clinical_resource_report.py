"""Generate documentary audit evidence from the immutable import snapshot."""
from collections import Counter
import csv
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'frontend/data/clinical-resources.json').read_text())
out = ROOT / 'docs/clinical-resources'
out.mkdir(parents=True, exist_ok=True)
(out / 'validation-issues.json').write_text(json.dumps(data['validationIssues'], ensure_ascii=False, indent=2) + '\n')
with (out / 'validation-issues.csv').open('w') as stream:
    writer = csv.writer(stream)
    writer.writerow(['id', 'arquivo', 'aba', 'linha', 'celulas', 'codigo', 'severidade', 'pendencia', 'status'])
    for issue in data['validationIssues']:
        writer.writerow([issue['id'], issue['file'], issue['sheet'], issue['row'], '; '.join(issue['cells']), issue['code'], issue['severity'], issue['message'], issue['status']])
summary = []
for inventory in data['inventory']:
    for sheet in inventory['sheets']:
        cells = [(ref, cell) for row in sheet['rows'] for ref, cell in row['cells'].items()]
        summary.append({
            'source': inventory['sourceId'], 'sheet': sheet['name'], 'storedRows': len(sheet['rows']),
            'nonemptyRows': sum(any(cell['text'] is not None or cell['formula'] for cell in row['cells'].values()) for row in sheet['rows']),
            'storedCells': len(cells),
            'emptyCells': [ref for ref, cell in cells if cell['text'] is None and not cell['formula']],
            'absenceMarkers': [ref for ref, cell in cells if cell['text'] and cell['text'].strip() in ['—', '-', '–']],
            'formulas': [{'cell': ref, **cell} for ref, cell in cells if cell['formula']],
            'multilineCells': [ref for ref, cell in cells if '\n' in (cell['text'] or '')],
            'unitsObserved': sorted(set(token for _, cell in cells for token in re.findall(r'(?:mcg|mg|mUI|mui|ui|UI|ml|mL|g|kg|gota|gotas)(?:/(?:kg|dose|min|dia|h|ml|mL)){0,3}', cell['text'] or '')))
        })
(out / 'inventory-summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
lines = ['# Inconsistências e pendências por origem', '', 'Consulta documental: nenhuma correção clínica foi aplicada. Os 75 registros permanecem `pending_review`. Fonte bibliográfica não é homologação.', '', '## Fontes imutáveis', '']
for source in data['clinicalSources']:
    lines.append(f"- `{source['file']}` — SHA-256 `{source['sha256']}`; importado em `{source['importedAt']}`; versão `{source['version']}`.")
lines += ['', '## Inventário', '', '| Fonte / aba | Linhas armazenadas / não vazias | Células | Fórmulas | Vazias | Marcadores de ausência | Multiline |', '| --- | --- | --- | --- | --- | --- | --- |']
for sheet in summary:
    lines.append(f"| {sheet['source']} / {sheet['sheet']} | {sheet['storedRows']} / {sheet['nonemptyRows']} | {sheet['storedCells']} | {len(sheet['formulas'])} | {len(sheet['emptyCells'])} | {len(sheet['absenceMarkers'])} | {len(sheet['multilineCells'])} |")
lines += ['', 'O inventário completo de células, tipos e fórmulas está em `frontend/data/clinical-resources.json` (`inventory`). As 11 colunas de Fichas e as sete de Página1 estão mapeadas com seus cabeçalhos originais em `clinicalSources.columns`. A fórmula de contagem na legenda não foi executada; não há cache numérico. Fórmulas clínicas estão armazenadas como texto. Unidades observadas são listadas literalmente em `inventory-summary.json`; não foram convertidas.', '', '41 fichas indicam `Padrão PALS/SBP (validar)`. As outras 28 referem Ebook e também aguardam homologação. A legenda contém afirmações de referência validada e um exemplo de macete que não constituem autorização clínica.', '', 'Ceftriaxona 1g/pó aparece em Fichas 47 e 56, com vias EV/IM e IM em categorias distintas. As duas fichas mantêm IDs, dados e rótulos de navegação separados; não houve deduplicação clínica.', '', '## Resumo de pendências', '']
for code, count in Counter(issue['code'] for issue in data['validationIssues']).items():
    lines.append(f'- `{code}`: {count}.')
lines += ['', '## Lista rastreável', '', '| Arquivo / aba / linha | Células | Pendência |', '| --- | --- | --- |']
for issue in data['validationIssues']:
    lines.append(f"| {Path(issue['file']).name} / {issue['sheet']} / {issue['row']} | {', '.join(issue['cells'])} | **{issue['code']}**: {issue['message'].replace('|', '/')} |")
(out / 'INCONSISTENCIES.md').write_text('\n'.join(lines) + '\n')
print(f"PASS: {len(data['validationIssues'])} traceable issues; {len(summary)} sheets inventoried.")
