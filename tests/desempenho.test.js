'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

test('desempenhoTopico: pct usa janela recente, contagens são vitalícias (bug F)', () => {
  const ses = [
    { topicoId: 't1', tipo: 'questoes', qFeitas: 10, qCertas: 3, data: '2026-01-01' },  // 30%
    { topicoId: 't1', tipo: 'questoes', qFeitas: 25, qCertas: 24, data: '2026-06-01' }, // 96%
  ];
  const dt = D.desempenhoTopico(ses, 't1');
  // totais vitalícios
  assert.equal(dt.feitas, 35);
  assert.equal(dt.certas, 27);
  // pct reflete recência (>=90), NÃO a média vitalícia (77)
  assert.ok(dt.pct >= 90, `esperado >=90, veio ${dt.pct}`);
  assert.notEqual(dt.pct, 77);
});

test('desempenhoTopico: poucas questões caem no cálculo direto', () => {
  const dt = D.desempenhoTopico([{ topicoId: 't2', tipo: 'questoes', qFeitas: 4, qCertas: 2, data: '2026-06-01' }], 't2');
  assert.equal(dt.pct, 50);
  assert.equal(dt.feitas, 4);
});

test('desempenhoTopico: sem questões → pct null', () => {
  assert.equal(D.desempenhoTopico([], 'tx').pct, null);
});

test('semaforo: verde/amarelo/vermelho contra a meta', () => {
  assert.equal(D.semaforo(80, 70), 'verde');
  assert.equal(D.semaforo(70, 70), 'verde');
  assert.equal(D.semaforo(65, 70), 'amarelo'); // dentro de meta-10
  assert.equal(D.semaforo(59, 70), 'vermelho');
  assert.equal(D.semaforo(null, 70), null);
});

test('sugerirReestudo: >50% de erro', () => {
  assert.equal(D.sugerirReestudo(10, 4), true);  // 60% de erro
  assert.equal(D.sugerirReestudo(10, 5), false); // 50% exato não dispara
  assert.equal(D.sugerirReestudo(0, 0), false);
});
