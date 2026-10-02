'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadDomain } = require('./helpers/load-domain');
const root = path.join(__dirname, '..');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'data/catalogo-editais.js'), 'utf8'), ctx);
const bases = JSON.parse(JSON.stringify(ctx.window.CATALOGO_EDITAIS_BASE));
const ifrj = bases.find(e => e.id === 'edital-ifrj-assistente-administracao-2022');
const cpii = JSON.parse(fs.readFileSync(path.join(root, 'data/edital-cpii-assistente-administracao.json')));

test('modelo CPII sai do catálogo e sua referência histórica preserva os pontos oficiais', () => {
  assert(!bases.some(e => e.id === cpii.id));
  assert(cpii);
  assert.match(cpii.banca, /Colégio Pedro II/);
  const blocks = cpii.estruturaProva.blocos;
  assert.equal(blocks.reduce((n, b) => n + b.questoes, 0), 75);
  assert.equal(blocks.reduce((n, b) => n + b.questoes * b.pontosPorQuestao, 0), 100);
  for (const block of blocks) {
    const disciplines = cpii.disciplinas.filter(d => d.blocoProva === block.id);
    assert.equal(disciplines.reduce((n, d) => n + d.peso, 0), block.questoes * block.pontosPorQuestao);
    if (block.id === 'ESP') assert(disciplines.every(d => d.tipoPeso === 'cota_estimada_no_bloco_especifico' && d.minimo_pontos === undefined));
  }
  assert.equal(cpii.estruturaProva.minimoPontos, 60);
  assert.equal(cpii.metaDesempenho, true);
  assert.equal(cpii.notas_corte_ultimo_nomeado, undefined);
  assert.deepEqual(cpii.janelaProva, { inicio: '', fim: '' });
  const D = loadDomain();
  const result = D.validarPlano({ versao: 1, plano: { concurso: cpii.titulo, banca: cpii.banca, meta: { corte_pct: cpii.notaCorte } }, disciplinas: cpii.disciplinas, cronograma: {} });
  assert.deepEqual(result.erros, []);
});

test('prioridades preservam cobertura e deixam amostras parciais explícitas', () => {
  for (const edital of [ifrj, cpii]) {
    const ids = edital.disciplinas.flatMap(d => d.topicos.map(t => t.id));
    assert.equal(new Set(ids).size, ids.length);
    for (const d of edital.disciplinas) {
      assert.equal(d.topicos.reduce((n, t) => n + t.incidencia_pct, 0), 100);
      assert(d.topicos.every(t => t.incidencia_pct > 0 && t.status === 'pendente'));
      if (d.referenciaIncidencia.tipo === 'amostra_historica_com_reserva') {
        const r = d.referenciaIncidencia;
        assert.equal(d.topicos.reduce((n, t) => n + t.questoes_referencia, 0), r.questoesMapeadas);
        assert(r.questoesMapeadas <= r.questoesNaAmostra);
        assert.equal(r.reservaCoberturaPct, 20);
      }
    }
  }
  const topic = (e, id) => e.disciplinas.flatMap(d => d.topicos).find(t => t.id === id);
  assert(topic(ifrj, 'IFRJ-ESP-15').incidencia_pct > topic(ifrj, 'IFRJ-ESP-01').incidencia_pct);
  assert.equal(topic(cpii, 'POR-08').prioridade, 1);
  assert(topic(cpii, 'POR-08').incidencia_pct > topic(cpii, 'POR-09').incidencia_pct);
});

test('referência IFRJ distingue classificação, mínimo eliminatório e meta de treino', () => {
  const r = ifrj.referenciaClassificacao;
  assert.equal(r.ultimoNomeado, null);
  assert.equal(r.minimoEliminatorioPct, 60);
  assert.deepEqual(r.posicoes.map(p => [p.posicao, p.pontos, p.pct]), [[1,49,98],[10,47,94],[25,46,92],[50,44,88],[100,43,86]]);
  assert(r.posicoes.every(p => p.pct === 100 * p.pontos / r.escalaPontos));
  assert.equal(ifrj.notaCorte, 94);
  assert.equal(ifrj.metaDesempenho, true);
  assert.equal(ifrj.cortes.negros, null);
  assert.equal(ifrj.cortes.pcd, null);
  assert.match(ifrj.observacoes, /último nomeado não foi confirmado/);
});
