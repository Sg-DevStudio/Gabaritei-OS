'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

test('addDias soma e subtrai com virada de mês/ano', () => {
  assert.equal(D.addDias('2026-06-19', 1), '2026-06-20');
  assert.equal(D.addDias('2026-06-30', 1), '2026-07-01');
  assert.equal(D.addDias('2026-01-01', -1), '2025-12-31');
});

test('diffDias conta dias entre datas (B - A)', () => {
  assert.equal(D.diffDias('2026-06-10', '2026-06-19'), 9);
  assert.equal(D.diffDias('2026-06-19', '2026-06-10'), -9);
  assert.equal(D.diffDias('2026-06-19', '2026-06-19'), 0);
});

test('segundaDaSemana ancora na segunda e é idempotente', () => {
  // 2026-06-19 é uma sexta → segunda = 2026-06-15
  assert.equal(D.segundaDaSemana('2026-06-19'), '2026-06-15');
  // domingo recua 6 dias
  assert.equal(D.segundaDaSemana('2026-06-21'), '2026-06-15');
  // já segunda → não muda (idempotente)
  assert.equal(D.segundaDaSemana('2026-06-15'), '2026-06-15');
});

test('formatarDataBR e formatarMesBR', () => {
  assert.equal(D.formatarDataBR('2026-06-19'), '19/06/2026');
  assert.equal(D.formatarDataBR(''), '—');
  assert.equal(D.formatarMesBR('2026-06'), 'jun/2026');
});
