'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

const HOJE = '2026-06-19';

function mkState(opts) {
  opts = opts || {};
  return {
    plano: {
      meta: { corte_pct: 70 },
      radar: opts.prazo ? { janela_prova: [opts.prazo, opts.prazo] } : null,
      ritmoAtivo: 'sustentavel',
      ritmos: { sustentavel: { semanas: 24 } },
    },
    disciplinas: [{ id: 'D1', topicos: [
      { id: 't-hot', incidencia_pct: 90, status: 'pendente' },
      { id: 't-cold', incidencia_pct: 10, status: 'pendente' },
      { id: 't-weak', incidencia_pct: 50, status: 'em_curso' },
      { id: 't-strong', incidencia_pct: 50, status: 'em_curso' },
      { id: 't-dom', incidencia_pct: 90, status: 'dominado' },
    ] }],
    sessoes: opts.sessoes || [],
    revisoes: [],
  };
}

test('urgência: maior incidência pesa mais', () => {
  const st = mkState();
  assert.ok(D.urgenciaTopico(st, 't-hot', HOJE) > D.urgenciaTopico(st, 't-cold', HOJE));
});

test('urgência: pior desempenho pesa mais (mesma incidência)', () => {
  const st = mkState({ sessoes: [
    { topicoId: 't-weak', tipo: 'questoes', qFeitas: 10, qCertas: 3, data: '2026-06-10' },
    { topicoId: 't-strong', tipo: 'questoes', qFeitas: 10, qCertas: 9, data: '2026-06-10' },
  ] });
  assert.ok(D.urgenciaTopico(st, 't-weak', HOJE) > D.urgenciaTopico(st, 't-strong', HOJE));
});

test('urgência: dominado afunda mesmo com incidência alta', () => {
  const st = mkState();
  assert.ok(D.urgenciaTopico(st, 't-dom', HOJE) < D.urgenciaTopico(st, 't-cold', HOJE));
});

test('urgência: reta final aumenta a urgência', () => {
  const longe = mkState();
  const reta = mkState({ prazo: '2026-07' });
  assert.ok(D.urgenciaTopico(reta, 't-hot', HOJE) > D.urgenciaTopico(longe, 't-hot', HOJE));
});

test('urgência: tópico inexistente → 0', () => {
  assert.equal(D.urgenciaTopico(mkState(), 'naoexiste', HOJE), 0);
});

test('filaHoje: reabertos saem ordenados por urgência', () => {
  const st = mkState();
  st.disciplinas[0].topicos.find((t) => t.id === 't-cold').reaberto = true;
  st.disciplinas[0].topicos.find((t) => t.id === 't-hot').reaberto = true;
  const reabertos = D.filaHoje(st, HOJE).filter((i) => i.categoria === 'reaberto');
  assert.equal(reabertos.length, 2);
  assert.equal(reabertos[0].topicoId, 't-hot');
});
