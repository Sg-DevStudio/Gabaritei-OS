'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const { loadStore } = require('./helpers/load-store');
const D = loadDomain(), S = loadStore();
function fixture() {
  const state = S.estadoVazio();
  state.planos = ['p1', 'p2'].map(id => ({ id, plano: { concurso: id }, disciplinas: [{ id: 'd', topicos: [{ id: 't', nome: 'Tópico', status: 'teoria_concluida' }] }], cronogramas: {} }));
  state.planoAtivoId = 'p1'; S.hidratar(state);
  state.revisoes = [
    { id: 'auto', planoId: 'p1', topicoId: 't', tipo: '24h', dataAgendada: '2026-09-30', dataConcluida: null },
    { id: 'historico', planoId: 'p1', topicoId: 't', dataAgendada: '2026-09-29', dataConcluida: '2026-09-29', duracaoConcluidaMin: 20 },
    { id: 'outro', planoId: 'p2', topicoId: 't', tipo: '3d', dataAgendada: '2026-09-30', dataConcluida: null }
  ];
  state.agenda = [{ id: 'manual', planoId: 'p1', data: '2026-09-30', obs: 'revisao', gerado: false, duracaoMin: 30 }];
  return state;
}

test('planos existentes têm sugestões ativas por padrão', () => {
  const state = fixture();
  assert.equal(D.sugestoesRevisaoAtivas(state), true);
  assert.equal(D.minutosRevisaoNoDia(state, '2026-09-30'), 10);
});

test('desativar suspende fila e carga automáticas preservando histórico e blocos manuais', () => {
  const state = fixture();
  const original = JSON.stringify({ revisoes: state.revisoes, agenda: state.agenda });
  state.plano.sugestoesRevisao = false;
  assert.equal(D.minutosRevisaoNoDia(state, '2026-09-30'), 0);
  assert.equal(D.filaHoje(state, '2026-09-30').filter(item => item.categoria === 'revisao').length, 0);
  assert.equal(D.minutosRevisoesConcluidasNoDia(state, '2026-09-29'), 20);
  assert.equal(JSON.stringify({ revisoes: state.revisoes, agenda: state.agenda }), original);
});

test('preferência é persistida e isolada por plano; reativar restaura pendências', () => {
  const state = fixture(); state.plano.sugestoesRevisao = false;
  assert.equal(S.salvar(state).ok, true);
  const loaded = S.carregar();
  assert.equal(D.sugestoesRevisaoAtivas(loaded), false);
  S.ativarPlano(loaded, 'p2');
  assert.equal(D.sugestoesRevisaoAtivas(loaded), true);
  assert.equal(D.minutosRevisaoNoDia(loaded, '2026-09-30'), 15);
  S.ativarPlano(loaded, 'p1'); loaded.plano.sugestoesRevisao = true;
  assert.equal(D.minutosRevisaoNoDia(loaded, '2026-09-30'), 10);
});

test('revisões explicitamente manuais seguem visíveis com sugestões desativadas', () => {
  const state = fixture(); state.plano.sugestoesRevisao = false;
  state.revisoes.push({ id: 'manual', planoId: 'p1', topicoId: 't', tipo: '7d', origem: 'manual', dataAgendada: '2026-09-30' });
  assert.equal(D.minutosRevisaoNoDia(state, '2026-09-30'), 15);
});
