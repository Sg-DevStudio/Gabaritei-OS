'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

test('analisarErrosSimulados: agrega ponderado pelo nº de erros', () => {
  const sims = [
    { acertos: [
      { disciplinaId: 'D1', certas: 6, total: 10, tipoErro: 'conceitual' }, // 4 erros
      { disciplinaId: 'D2', certas: 8, total: 10, tipoErro: 'calculo' },     // 2 erros
      { disciplinaId: 'D3', certas: 5, total: 5, tipoErro: 'conceitual' },   // 0 erros → ignora
      { disciplinaId: 'D4', certas: 7, total: 10 },                          // 3 erros sem classificar
    ] },
    { acertos: [{ disciplinaId: 'D1', certas: 7, total: 10, tipoErro: 'conceitual' }] }, // +3
  ];
  const a = D.analisarErrosSimulados(sims);
  assert.equal(a.porTipo.conceitual, 7);
  assert.equal(a.porTipo.calculo, 2);
  assert.equal(a.porTipo.interpretacao, 0);
  assert.equal(a.porTipo.atencao, 0);
  assert.equal(a.dominante, 'conceitual');
  assert.equal(a.totalClassificado, 9);
  assert.equal(a.totalErros, 12); // 4 + 2 + 0 + 3 + 3
});

test('analisarErrosSimulados: tipoErro sem erro real (certas===total) não conta', () => {
  const a = D.analisarErrosSimulados([{ acertos: [{ disciplinaId: 'X', certas: 5, total: 5, tipoErro: 'atencao' }] }]);
  assert.equal(a.totalClassificado, 0);
  assert.equal(a.dominante, null);
});

test('analisarErrosSimulados: lista vazia', () => {
  const a = D.analisarErrosSimulados([]);
  assert.equal(a.dominante, null);
  assert.equal(a.totalErros, 0);
});

test('remediacaoErro: tipos válidos têm rótulo/ícone/dica; inválido → null', () => {
  const r = D.remediacaoErro('calculo');
  assert.equal(r.rotulo, 'Cálculo/aplicação');
  assert.ok(r.icone && r.dica);
  assert.equal(D.remediacaoErro('xyz'), null);
});

test('TIPOS_ERRO expõe os quatro tipos', () => {
  assert.deepEqual(D.TIPOS_ERRO, ['conceitual', 'calculo', 'interpretacao', 'atencao']);
});

test('ritmoSimulado: min/questão quando há duração; null sem duração', () => {
  const sim = { duracaoMin: 180, acertos: [{ disciplinaId: 'D1', certas: 30, total: 60 }, { disciplinaId: 'D2', certas: 20, total: 30 }] };
  assert.equal(D.ritmoSimulado(sim), 2); // 180 / 90 questões = 2.0 min/questão
  assert.equal(D.ritmoSimulado({ acertos: [{ total: 10 }] }), null); // sem duracaoMin
  assert.equal(D.ritmoSimulado({ duracaoMin: 60, acertos: [] }), null); // sem questões
});
