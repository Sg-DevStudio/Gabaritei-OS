'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

function cenario(disciplinas) {
  return {
    planoAtivoId: 'p1', disciplinas: disciplinas || [
      { id: 'PRE', topicos: [{ id: 'PRE-1', status: 'em_curso' }, { id: 'PRE-2', status: 'pendente' }] },
      { id: 'POR', topicos: [{ id: 'POR-1', status: 'em_curso' }] }
    ], agenda: []
  };
}
function bloco(id, disciplinaId, topicoId, extra) {
  return Object.assign({ id, disciplinaId, topicoId, planoId: 'p1', data: '2026-09-14',
    ordem: 1, gerado: true, feito: false, obs: 'teoria', duracaoMin: 60 }, extra);
}
const opcoes = { data: '2026-09-14', depoisDaOrdem: 0 };

test('sessões sucessivas mantêm Português e retomam Previdenciário até concluir', () => {
  const st = cenario();
  st.agenda = [bloco('por', 'POR', 'POR-1'), bloco('pre', 'PRE', 'PRE-2', { data: '2026-09-16' }),
    bloco('pre-futuro', 'PRE', 'PRE-2', { data: '2026-09-18' })];
  const portugues = structuredClone(st.agenda[0]);
  D.continuarTopicoEmCursoNaAgenda(st, 'PRE-1', opcoes);
  assert.deepEqual(st.agenda[0], portugues);
  assert.equal(st.agenda[1].topicoId, 'PRE-1');
  assert.equal(st.agenda[2].topicoId, 'PRE-2');
  st.agenda[1].feito = true;
  D.continuarTopicoEmCursoNaAgenda(st, 'PRE-1', { data: '2026-09-16' });
  assert.equal(st.agenda[2].topicoId, 'PRE-1');
  st.disciplinas[0].topicos[0].status = 'teoria_concluida';
  st.agenda[2].feito = true;
  st.agenda.push(bloco('seguinte', 'PRE', 'PRE-2', { data: '2026-09-21' }));
  assert.equal(D.continuarTopicoEmCursoNaAgenda(st, 'PRE-1', opcoes).alterou, false);
  assert.equal(st.agenda[3].topicoId, 'PRE-2');
});

test('sem próximo bloco elegível da disciplina, não altera a agenda', () => {
  const st = cenario();
  st.agenda = [bloco('por', 'POR', 'POR-1'),
    bloco('manual', 'PRE', 'PRE-2', { gerado: false }),
    bloco('revisao', 'PRE', 'PRE-2', { obs: 'revisao' }),
    bloco('passado', 'PRE', 'PRE-2', { data: '2026-09-13' }),
    bloco('feito', 'PRE', 'PRE-2', { feito: true }),
    bloco('anterior', 'PRE', 'PRE-2', { ordem: 0 }),
    bloco('outro-plano', 'PRE', 'PRE-2', { planoId: 'p2' })];
  const antes = structuredClone(st);
  assert.equal(D.continuarTopicoEmCursoNaAgenda(st, 'PRE-1', opcoes).alterou, false);
  assert.deepEqual(st, antes);
});

test('retomada no mesmo dia preserva ordem, duração e a continuidade de cada disciplina', () => {
  const st = cenario();
  st.agenda = [bloco('por', 'POR', 'POR-2'), bloco('pre', 'PRE', 'PRE-2', { ordem: 2 })];
  D.continuarTopicoEmCursoNaAgenda(st, 'PRE-1', opcoes);
  D.continuarTopicoEmCursoNaAgenda(st, 'POR-1', opcoes);
  assert.deepEqual(st.agenda.map(b => [b.disciplinaId, b.topicoId, b.ordem, b.duracaoMin]),
    [['POR', 'POR-1', 1, 60], ['PRE', 'PRE-1', 2, 60]]);
});

test('modo exemplo: dados do TRF3 usam a mesma retomada sem trocar disciplinas', () => {
  const exemplo = structuredClone(require('../data/exemplo-trf3.json'));
  const st = cenario(exemplo.disciplinas);
  const portugues = st.disciplinas.find(d => d.id === 'POR');
  const direito = st.disciplinas.find(d => /constitucional/i.test(d.nome));
  assert.ok(direito, 'usa uma disciplina de Direito presente no exemplo');
  const atual = direito.topicos[0];
  atual.status = 'em_curso';
  st.agenda = [bloco('por', portugues.id, portugues.topicos[0].id),
    bloco('pre', direito.id, direito.topicos[1].id, { data: '2026-09-16' })];
  const antes = structuredClone(st.agenda[0]);
  D.continuarTopicoEmCursoNaAgenda(st, atual.id, opcoes);
  assert.deepEqual(st.agenda[0], antes);
  assert.equal(st.agenda[1].topicoId, atual.id);
  assert.equal(st.agenda[1].disciplinaId, direito.id);
});
