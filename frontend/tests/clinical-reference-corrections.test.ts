import { test } from 'node:test';
import assert from 'node:assert/strict';
import corrections from '../data/clinical-reference-corrections.json';
import source from '../data/clinical-resources.json';
import { clinicalCapabilities } from '../lib/clinical-resources';
test('reference corrections retain source identity and do not silently approve a protocol', () => {
  assert.equal(corrections.length, 8);
  for(const c of corrections){
    const original=[...source.medications,...source.infusions].find(e=>e.id===c.entryId);
    assert.ok(original); assert.equal(c.sourceHash,original.sourceHash);
    assert.equal(c.status,'reference_checked_not_clinically_approved');
    for(const ref of c.references) assert.ok(['www.novalgina.com.br','outreach.cheo.on.ca'].includes(new URL(ref.url).hostname));
    assert.equal(clinicalCapabilities('approved').calculate,false);
  }
  assert.equal(source.medications[0].raw.mnemonic,'peso × 0,4 (ml)');
});
test('dimensional correction distinguishes drops, final volume and vasopressin units',()=>{
  assert.equal(500/20,25); assert.equal(20*25,500); assert.equal(10/500,0.02); assert.equal(10/50,0.2);
  assert.notEqual(20*12500/(20+170),20*12500/170);
  assert.equal(20*1000/250,80);
  assert.ok(corrections.find(c=>c.entryId==='infusions-009')!.notes.some(n=>n.includes('Não há conversão entre UI e mcg')));
  assert.ok(corrections.filter(c=>c.entryId.startsWith('infusions')).every(c=>c.displayCorrections.formula?.includes('não volume')));
});
