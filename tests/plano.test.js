'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

function baseState() {
  return { plano: null, disciplinas: [], config: {}, sessoes: [], revisoes: [], simulados: [], agenda: [], flashcards: [] };
}

test('mesclarPlano normaliza gerado_em com timestamp para AAAA-MM-DD (bug D)', () => {
  const json = {
    versao: 1,
    plano: { concurso: 'x', banca: '', meta: { corte_pct: 70 }, radar: null, ritmos: { ativo: 'sustentavel' } },
    gerado_em: '2026-06-01T10:30:00Z',
    disciplinas: [],
    cronograma: {},
  };
  const imp = D.mesclarPlano(baseState(), json);
  assert.equal(imp.plano.gerado_em, '2026-06-01');
});

test('mesclarPlano: gerado_em ausente/null vira null', () => {
  const json = { versao: 1, plano: { concurso: 'x', meta: { corte_pct: 70 }, ritmos: { ativo: 'sustentavel' } }, disciplinas: [], cronograma: {} };
  const imp = D.mesclarPlano(baseState(), json);
  assert.equal(imp.plano.gerado_em, null);
});

test('burndownEdital não produz NaN com gerado_em normalizado', () => {
  const json = {
    versao: 1,
    plano: { concurso: 'x', meta: { corte_pct: 70 }, radar: null, ritmos: { ativo: 'sustentavel', sustentavel: { semanas: 24, meses: 6, h_semana: 20 } } },
    gerado_em: '2026-06-01T10:30:00Z',
    disciplinas: [],
    cronograma: {},
  };
  const imp = D.mesclarPlano(baseState(), json);
  const st = { plano: imp.plano, disciplinas: [], cronogramas: imp.cronogramas, sessoes: [], revisoes: [] };
  const bd = D.burndownEdital(st, '2026-06-19');
  assert.ok(bd, 'burndown deveria retornar objeto');
  assert.equal(Number.isNaN(bd.pctConcluido), false);
});

test('validarPlano: aceita plano mínimo válido e recusa inválido', () => {
  const ok = D.validarPlano({ versao: 1, plano: { concurso: 'C', meta: { corte_pct: 70 } }, disciplinas: [{ id: 'D1', nome: 'Disc', topicos: [{ id: 't1', nome: 'T', incidencia_pct: 10 }] }] });
  assert.equal(ok.ok, true);
  const bad = D.validarPlano({ versao: 2, disciplinas: [] });
  assert.equal(bad.ok, false);
  assert.ok(bad.erros.length > 0);
});
test('burndownEdital respeita bagagem na conclusao estimada', () => {
  const st = {
    plano: { gerado_em: '2026-06-01', ritmos: { ativo: 'sustentavel', sustentavel: { semanas: 12, meses: 3, h_semana: 9 } } },
    disciplinas: [{
      id: 'D1',
      topicos: [
        { id: 'novo', horas_estimadas: 10, status: 'pendente' },
        { id: 'bag', horas_estimadas: 10, status: 'pendente', bagagem: 'estudei' }
      ]
    }],
    sessoes: []
  };
  const bd = D.burndownEdital(st, '2026-06-01');

  assert.equal(D.totalHorasTeoria(st.disciplinas), 20);
  assert.equal(D.totalHorasTeoriaAjustada(st.disciplinas), 15);
  assert.equal(bd.restante, 27);
  assert.equal(bd.semanasParaConcluir, 3);
});
