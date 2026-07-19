'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

function disciplina(id, nome, topicos) {
  return {
    id: id,
    nome: nome,
    topicos: topicos.map(function (t, i) {
      return { id: id + '-' + (i + 1), nome: t, incidencia_pct: 10 };
    })
  };
}

test('mapearAproveitamentoPlano reconhece nomes editoriais equivalentes', function () {
  const origem = {
    disciplinas: [
      disciplina('ADM-ANT', 'Noções de Direito Administrativo', [
        'Lei 8.112/1990 — provimento, vacância, posse e exercício',
        'Atos administrativos: requisitos, atributos e espécies'
      ])
    ]
  };
  const destino = {
    disciplinas: [
      disciplina('ADM-NOV', 'Direito Administrativo', [
        'Lei 8.112/1990 — provimento, vacância, posse, exercício e estabilidade',
        'Atos administrativos: requisitos, atributos, espécies e invalidação'
      ])
    ]
  };

  const mapa = D.mapearAproveitamentoPlano(origem, destino);

  assert.equal(mapa.resumo.disciplinasComuns, 1);
  assert.equal(mapa.resumo.topicosComuns, 2);
  assert.equal(mapa.disciplinas[0].origemId, 'ADM-ANT');
  assert.equal(mapa.disciplinas[0].destinoId, 'ADM-NOV');
});

test('mapearAproveitamentoPlano não mistura ramos processuais diferentes', function () {
  const origem = {
    disciplinas: [
      disciplina('PCI', 'Direito Processual Civil', ['Cumprimento de sentença e execução civil'])
    ]
  };
  const destino = {
    disciplinas: [
      disciplina('PPE', 'Direito Processual Penal', ['Prisão e medidas cautelares'])
    ]
  };

  const mapa = D.mapearAproveitamentoPlano(origem, destino);

  assert.equal(mapa.resumo.disciplinasComuns, 0);
  assert.equal(mapa.resumo.topicosComuns, 0);
});

test('mapearAproveitamentoPlano nunca reutiliza o mesmo tópico de destino', function () {
  const origem = {
    disciplinas: [
      disciplina('POR-A', 'Língua Portuguesa', [
        'Interpretação e compreensão de textos',
        'Compreensão e interpretação textual'
      ])
    ]
  };
  const destino = {
    disciplinas: [
      disciplina('POR-B', 'Português', ['Interpretação e compreensão de textos'])
    ]
  };

  const mapa = D.mapearAproveitamentoPlano(origem, destino);
  const destinos = mapa.topicos.map(function (t) { return t.destinoId; });

  assert.equal(destinos.length, 1);
  assert.equal(new Set(destinos).size, destinos.length);
});

test('mapearAproveitamentoPlano não confia em ids genéricos iguais com conteúdos diferentes', function () {
  const origem = {
    disciplinas: [disciplina('D1', 'Língua Portuguesa', ['Interpretação de textos'])]
  };
  const destino = {
    disciplinas: [disciplina('D1', 'Informática', ['Segurança da informação'])]
  };

  const mapa = D.mapearAproveitamentoPlano(origem, destino);

  assert.equal(mapa.resumo.disciplinasComuns, 0);
  assert.equal(mapa.resumo.topicosComuns, 0);
});
