'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

test('agendarRevisoes gera a curva 1-3-7-14-30', () => {
  const revs = D.agendarRevisoes('t1', '2026-06-01');
  assert.deepEqual(revs.map((r) => r.tipo), ['24h', '3d', '7d', '14d', '30d']);
  assert.equal(revs[0].dataAgendada, '2026-06-02');
  assert.equal(revs[4].dataAgendada, '2026-07-01');
  assert.ok(revs.every((r) => r.dataConcluida === null && r.resultadoPct === null));
});

test('ajustePosRevisao: dominado exige amostra mínima (bug G)', () => {
  assert.equal(D.ajustePosRevisao({ tipo: '30d' }, 100, 1).dominar, false);
  assert.equal(D.ajustePosRevisao({ tipo: '30d' }, 100, 5).dominar, true);
  assert.equal(D.ajustePosRevisao({ tipo: '30d' }, 90, 4).dominar, false);
  // só a ponta da curva domina (30d ou manutenção), nunca 14d
  assert.equal(D.ajustePosRevisao({ tipo: '14d' }, 100, 20).dominar, false);
  // retrocompat: sem qFeitas mantém o critério antigo
  assert.equal(D.ajustePosRevisao({ tipo: '30d' }, 100).dominar, true);
});

test('ajustePosRevisao: faixas de reabertura/reforço', () => {
  const baixo = D.ajustePosRevisao({ tipo: '7d' }, 40, 10);
  assert.equal(baixo.reabrir, true);
  assert.equal(baixo.revisaoExtraDias, 2);
  const medio = D.ajustePosRevisao({ tipo: '7d' }, 60, 10);
  assert.equal(medio.reabrir, false); // <70 só reabre na 30d
  assert.equal(medio.revisaoExtraDias, 3);
  assert.equal(D.ajustePosRevisao({ tipo: '30d' }, 60, 10).reabrir, true);
});

test('ajustePosRevisao: manutenção pós-curva (bug C)', () => {
  // ≥70% na 30d agenda manutenção +30d sem reabrir
  const c1 = D.ajustePosRevisao({ tipo: '30d' }, 75, 10);
  assert.equal(c1.manutencaoDias, 30);
  assert.equal(c1.reabrir, false);
  // ≥85% domina E agenda manutenção
  const c2 = D.ajustePosRevisao({ tipo: '30d' }, 95, 10);
  assert.equal(c2.dominar, true);
  assert.equal(c2.manutencaoDias, 30);
  // manutenção concluída agenda a próxima (recorrência)
  assert.equal(D.ajustePosRevisao({ tipo: 'manutenção' }, 80, 10).manutencaoDias, 30);
  // manutenção <50% reabre e não reagenda
  const c4 = D.ajustePosRevisao({ tipo: 'manutenção' }, 40, 10);
  assert.equal(c4.reabrir, true);
  assert.equal(c4.manutencaoDias, null);
  // 14d nunca agenda manutenção
  assert.equal(D.ajustePosRevisao({ tipo: '14d' }, 90, 10).manutencaoDias, null);
});

test('revisaoManutencao monta tipo/data/id corretos', () => {
  const rm = D.revisaoManutencao('t1', '2026-06-19', 30);
  assert.equal(rm.tipo, 'manutenção');
  assert.equal(rm.dataAgendada, '2026-07-19');
  assert.match(rm.id, /-manut-/);
  assert.equal(rm.dataConcluida, null);
});

test('revisaoReabreTopico: só 30d com <70%', () => {
  assert.equal(D.revisaoReabreTopico({ tipo: '30d' }, 60), true);
  assert.equal(D.revisaoReabreTopico({ tipo: '30d' }, 70), false);
  assert.equal(D.revisaoReabreTopico({ tipo: '7d' }, 10), false);
});
