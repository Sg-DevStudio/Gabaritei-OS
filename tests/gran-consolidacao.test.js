'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const c = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'data/trilha-vinculos-trf2.js'), 'utf8'), c);
const mapa = c.window.TrilhaVinculosTRF2;
test('cada tópico-base tem um acesso e filtros usam somente AOCP e FCC', () => {
  for (const [id, t] of Object.entries(mapa)) {
    assert(t.links.length<=1,id); if(!t.links.length){assert(t.pendencia,id);continue;}
    const l = t.links[0], u = new URL(l.url);
    if (l.code == null) continue;
    assert.equal(u.searchParams.get('banca'), '982,92', id);
    const assuntos = u.searchParams.get('assunto').split(',');
    assert.equal(new Set(assuntos).size, assuntos.length, id);
    assert.equal(u.searchParams.get('anulada'), '0');
    assert.equal(u.searchParams.get('desatualizada'), '0');
    assert.equal(u.searchParams.get('nivel'), '1');
    assert.equal(u.searchParams.get('anos').split(',').length, 10);
  }
});
test('união preserva os seis assuntos de organização do Estado e os três de regência/crase', () => {
  assert.equal(mapa['CON-05'].links[0].code, '405233,407596,407598,407614,421775,421782');
  assert.equal(mapa['POR-10'].links[0].code, '403657,409483,403682');
  assert.equal(mapa['POR-07'].links[0].code, '403651');
});
