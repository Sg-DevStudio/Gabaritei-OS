'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

function disciplina(id) {
  return {
    id: id, nome: id === 'A' ? 'Administração' : 'Português', cor: '#2454D6',
    topicos: [{ id: id + '-1', nome: 'Assunto 1' }, { id: id + '-2', nome: 'Assunto 2' }]
  };
}

test('excluirDisciplina remove a matéria e todas as referências do plano ativo', () => {
  const disciplinas = [disciplina('A'), disciplina('B')];
  const plano = {
    ciclo: { blocos: [
      { id: 'c-a', disciplinaId: 'A', topicoId: 'A-1' },
      { id: 'c-b', disciplinaId: 'B', topicoId: 'B-1' }
    ] }
  };
  const cronogramas = { sustentavel: [{ inicio: '2026-07-20', blocos: [
    { topico: 'A-1', tipo: 'teoria' }, { topico: 'B-1', tipo: 'teoria' }
  ] }] };
  const entrada = { id: 'p1', plano: plano, disciplinas: disciplinas, cronogramas: cronogramas };
  const state = {
    planoAtivoId: 'p1', planos: [entrada], plano: plano,
    disciplinas: disciplinas, cronogramas: cronogramas,
    agenda: [
      { id: 'ag-a', planoId: 'p1', disciplinaId: 'A', topicoId: 'A-1' },
      { id: 'ag-b', planoId: 'p1', disciplinaId: 'B', topicoId: 'B-1' },
      { id: 'ag-outro', planoId: 'p2', disciplinaId: 'A', topicoId: 'A-1' }
    ],
    sessoes: [
      { id: 's-a', planoId: 'p1', topicoId: 'A-1' },
      { id: 's-b', planoId: 'p1', topicoId: 'B-1' },
      { id: 's-outro', planoId: 'p2', topicoId: 'A-1' }
    ],
    revisoes: [
      { id: 'r-a', planoId: 'p1', topicoId: 'A-2' },
      { id: 'r-b', planoId: 'p1', topicoId: 'B-2' }
    ],
    simulados: [
      { id: 'sim-misto', planoId: 'p1', acertos: [{ disciplinaId: 'A' }, { disciplinaId: 'B' }] },
      { id: 'sim-a', planoId: 'p1', acertos: [{ disciplinaId: 'A' }] },
      { id: 'sim-outro', planoId: 'p2', acertos: [{ disciplinaId: 'A' }] }
    ],
    flashcards: [
      { id: 'fc-a', planoId: 'p1', disciplinaId: 'A', cards: [] },
      { id: 'fc-b', planoId: 'p1', disciplinaId: 'B', cards: [] },
      { id: 'fc-outro', planoId: 'p2', disciplinaId: 'A', cards: [] }
    ],
    config: {
      metaAcertoDisc: { A: 80, B: 75 },
      regrasAgenda: [
        { id: 'ra', planoId: 'p1', de: 'A', para: 'B' },
        { id: 'rb', planoId: 'p1', de: 'B', para: 'A' },
        { id: 'rc', planoId: 'p1', de: 'B', para: 'B' }
      ]
    }
  };

  const resultado = D.excluirDisciplina(state, 'A');

  assert.equal(resultado.ok, true);
  assert.deepEqual(state.disciplinas.map((d) => d.id), ['B']);
  assert.deepEqual(entrada.disciplinas.map((d) => d.id), ['B']);
  assert.deepEqual(state.agenda.map((x) => x.id), ['ag-b', 'ag-outro']);
  assert.deepEqual(state.sessoes.map((x) => x.id), ['s-b', 's-outro']);
  assert.deepEqual(state.revisoes.map((x) => x.id), ['r-b']);
  assert.deepEqual(state.simulados.map((x) => x.id), ['sim-misto', 'sim-outro']);
  assert.deepEqual(state.simulados[0].acertos.map((x) => x.disciplinaId), ['B']);
  assert.deepEqual(state.flashcards.map((x) => x.id), ['fc-b', 'fc-outro']);
  assert.deepEqual(state.plano.ciclo.blocos.map((x) => x.id), ['c-b']);
  assert.deepEqual(state.cronogramas.sustentavel[0].blocos.map((x) => x.topico), ['B-1']);
  assert.deepEqual(state.config.regrasAgenda.map((x) => x.id), ['rc']);
  assert.equal(state.config.metaAcertoDisc.A, undefined);
  assert.deepEqual(resultado.idsRemovidos.sort(), ['fc-a', 'r-a', 's-a', 'sim-a']);
});

test('excluirDisciplina recusa ids inexistentes sem alterar o estado', () => {
  const state = { disciplinas: [disciplina('A')], agenda: [] };
  const resultado = D.excluirDisciplina(state, 'X');
  assert.equal(resultado.ok, false);
  assert.deepEqual(state.disciplinas.map((d) => d.id), ['A']);
});
