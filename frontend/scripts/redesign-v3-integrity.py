"""Run from repository root after the local V3 visual review."""
from pathlib import Path
import hashlib, json, subprocess
root = Path('docs/redesign-v3')
hash_bytes = lambda data: hashlib.sha256(data).hexdigest()
before = json.loads((root / 'frozen-before.json').read_text())
files = {name: {'before': digest, 'after': hash_bytes(Path(name).read_bytes())} for name, digest in before.items()}
blocks = json.loads((root / 'frozen-blocks-before.json').read_text())
source = Path('frontend/components/PcrCalculatorApp.tsx').read_text()
markers = {
 'validation': ('function validate(', 'function PcrDrugGrid('),
 'print_and_formatters': ('function formatDate(', 'export function PcrCalculatorApp()'),
 'controller': ('export function PcrCalculatorApp()', '  return (\n    <CalculatorShell'),
}
for name, (start, end) in markers.items():
 blocks[name]['after'] = hash_bytes(source[source.index(start):source.index(end)].encode())
for name in ['components/MobileMenu.tsx','components/InputForm.tsx','components/CalculatorShell.tsx','components/design-system.tsx']:
 blocks[name]['after'] = hash_bytes(Path('frontend', name).read_bytes())
page = Path('frontend/app/page.tsx').read_text()
blocks['pricing_component']['after'] = hash_bytes(page[page.index('async function PricingCatalog()'):].encode())
blocks['portrait']['after'] = hash_bytes(Path('frontend/public/images/dr-aristoteles-pires.png').read_bytes())
paths = ['backend/app','frontend/lib','frontend/types','frontend/app/api','frontend/prisma','frontend/package.json','frontend/package-lock.json']
protected = hash_bytes(subprocess.check_output(['git','diff','--binary','--'] + paths))
protected_equal = protected == (root / 'protected-diff-before.sha256').read_text().strip()
response_equal = json.loads((root/'before/synthetic-result.json').read_text()) == json.loads((root/'after/synthetic-result.json').read_text())
pdf_equal = (root/'before/pdf-text.txt').read_bytes() == (root/'after/pdf-text.txt').read_bytes()
report = {'clinical_files': files, 'frozen_blocks': blocks, 'protected_diff_unchanged':protected_equal, 'complete_response_equal': response_equal, 'complete_pdf_text_equal':pdf_equal}
(root/'integrity.json').write_text(json.dumps(report, indent=2))
assert all(v['before'] == v['after'] for v in files.values())
assert all(v['before'] == v['after'] for v in blocks.values())
assert protected_equal and response_equal and pdf_equal
print('PASS: 19 clinical files, validation/controller/PDF, menu/form/shell, pricing, portrait, protected diff, full response and PDF text unchanged.')
