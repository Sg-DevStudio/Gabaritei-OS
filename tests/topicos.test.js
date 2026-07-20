'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

function estado() {
  return {
    disciplinas: [{
      id: 'POR',
      nome: 'Língua Portuguesa',
      topicos: [
        { id: 'POR-01', nome: 'Interpretação de texto', status: 'pendente' },
        { id: 'POR-02', nome: 'Crase', status: 'em_curso' }
      ]
    }],
    agenda: [{ id: 'agd-1', disciplinaId: 'POR', topicoId: 'POR-01' }],
    sessoes: [{ id: 'ses-1', topicoId: 'POR-01' }],
    revisoes: [{ id: 'rev-1', topicoId: 'POR-01' }]
  };
}

test('renomearTopico altera somente o nome e preserva todos os vínculos pelo id', () => {
  const st = estado();
  const resultado = D.renomearTopico(st, 'POR', 'POR-01', '  Interpretação e compreensão de texto  ');

  assert.equal(resultado.ok, true);
  assert.equal(resultado.alterou, true);
  assert.equal(st.disciplinas[0].topicos[0].id, 'POR-01');
  assert.equal(st.disciplinas[0].topicos[0].nome, 'Interpretação e compreensão de texto');
  assert.equal(st.agenda[0].topicoId, 'POR-01');
  assert.equal(st.sessoes[0].topicoId, 'POR-01');
  assert.equal(st.revisoes[0].topicoId, 'POR-01');
});

test('renomearTopico rejeita nome vazio, longo ou duplicado na disciplina', () => {
  const st = estado();

  assert.equal(D.renomearTopico(st, 'POR', 'POR-01', '   ').motivo, 'nome_vazio');
  assert.equal(D.renomearTopico(st, 'POR', 'POR-01', 'x'.repeat(121)).motivo, 'nome_muito_longo');
  assert.equal(D.renomearTopico(st, 'POR', 'POR-01', 'cráse').motivo, 'nome_duplicado');
  assert.equal(st.disciplinas[0].topicos[0].nome, 'Interpretação de texto');
});

test('renomearTopico informa referências inexistentes sem alterar o plano', () => {
  const st = estado();

  assert.equal(D.renomearTopico(st, 'XYZ', 'POR-01', 'Novo').motivo, 'disciplina_nao_encontrada');
  assert.equal(D.renomearTopico(st, 'POR', 'POR-99', 'Novo').motivo, 'topico_nao_encontrado');
  assert.equal(st.disciplinas[0].topicos[0].nome, 'Interpretação de texto');
});
