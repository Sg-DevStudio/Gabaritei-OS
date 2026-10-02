'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'data/catalogo-editais.js'), 'utf8'), context);
const bases = JSON.parse(JSON.stringify(context.window.CATALOGO_EDITAIS_BASE));
const ifrj = bases.find(e => e.id === 'edital-ifrj-assistente-administracao-2022');

test('IFRJ público e exportável mantém estrutura e conteúdo do PDF retificado de 2022', () => {
  assert(ifrj);
  assert.deepEqual(ifrj, JSON.parse(fs.readFileSync(path.join(root, 'data/edital-ifrj-assistente-administracao.json'), 'utf8')));
  assert.equal(ifrj.banca, 'Instituto SELECON');
  assert.deepEqual(ifrj.disciplinas.map(d => d.questoes), [8, 7, 5, 30]);
  assert.deepEqual(ifrj.disciplinas.map(d => d.minimo_pontos), [3, 3, 2, 12]);
  assert.equal(ifrj.disciplinas.reduce((n, d) => n + d.topicos.length, 0), 51);
  const names = ifrj.disciplinas.flatMap(d => d.topicos.map(t => t.nome)).join('\n');
  for (const item of ['9.394/1996', '8.069/1990', '13.185/2015', '16/2011', '8.027/1990', '8.666/1993', '14.133/2021', 'matemática financeira', 'Governança']) assert(names.includes(item), item);
  assert(!names.includes('PCCTAE'));
  assert(!ifrj.fonte.includes('IFPA'));
  assert.match(ifrj.observacoes, /sem análise de incidência/);
  assert.equal(ifrj.metaDesempenho, true);
  assert.deepEqual(ifrj.janelaProva, { inicio: '', fim: '' });
  ifrj.disciplinas.forEach(d => {
    assert.equal(d.topicos.reduce((n, t) => n + t.incidencia_pct, 0), 100);
    assert.equal(d.peso, d.questoes);
    assert(d.topicos.every(t => t.status === 'pendente' && t.semana_sugerida > 0));
  });
  const validated = D.validarPlano({ versao: 1, plano: { concurso: ifrj.titulo, banca: ifrj.banca, meta: { corte_pct: ifrj.notaCorte } }, disciplinas: ifrj.disciplinas, cronograma: {} });
  assert.deepEqual(validated.erros, []);
  assert.equal(validated.ok, true);
  assert(fs.existsSync(path.join(root, ifrj.foto)));
  assert.match(ifrj.fotoAlt, /IFRJ/);
  assert.match(ifrj.fotoFonte, /^https:\/\/github.com\//);
  assert(fs.readFileSync(path.join(root, 'sw.js'), 'utf8').includes("'./" + ifrj.foto + "'"));
});

function extract(name, next) {
  return source.slice(source.indexOf('  function ' + name + '('), source.indexOf('  function ' + next + '('));
}

test('catálogo oferece IFRJ a uma conta vazia e sobrepõe apenas sua cópia pessoal', () => {
  const ctx = { catalogoEditaisBase: bases, catalogoGlobalEditais: [], state: { editais: [] }, ehItemCarreira: () => false, normalizarEditalCatalogo: e => e, carreirasDoCatalogo: () => [] };
  vm.runInNewContext(extract('editaisDoCatalogo', 'editaisDoCatalogoAdmin'), ctx);
  assert(ctx.editaisDoCatalogo().some(e => e.id === ifrj.id));
  ctx.state.editais.push({ ...ifrj, titulo: 'Meu IFRJ' });
  assert.equal(ctx.editaisDoCatalogo().find(e => e.id === ifrj.id).titulo, 'Meu IFRJ');
  assert.equal(ifrj.titulo, 'IFRJ — Assistente em Administração (base: Edital 2022)');
});

test('ciclo do IFRJ conserva a participação na prova ao dividir cotas em sessões curtas', () => {
  const state = { plano: {}, disciplinas: JSON.parse(JSON.stringify(ifrj.disciplinas)), sessoes: [] };
  const blocks = D.sugerirCiclo(state, { minutosSemana: 600, minBloco: 30, maxBloco: 75 });
  const minutes = id => blocks.filter(b => b.disciplinaId === id).reduce((n, b) => n + b.metaMin, 0);
  assert.deepEqual(state.disciplinas.map(d => minutes(d.id)), [95, 85, 60, 360]);
  assert.equal(blocks.reduce((n, b) => n + b.metaMin, 0), 600);
  assert(blocks.every(b => b.metaMin >= 30 && b.metaMin <= 75 && b.voltaInicio === 1));
  assert.equal(new Set(blocks.map(b => b.id)).size, blocks.length);
  assert(blocks.filter(b => b.disciplinaId === 'IFRJ-ESP').length > 1);
  const cycle = { volta: 1, blocos: blocks };
  blocks.forEach((b, i) => {
    const result = D.avancarCiclo(cycle, b.disciplinaId, b.metaMin);
    assert.equal(result.completouBloco, true);
    assert.equal(result.completouVolta, i === blocks.length - 1);
  });
  assert.equal(cycle.volta, 2);
});

test('ciclo respeita limites quando a cota não pode ser dividida entre mínimo e máximo', () => {
  const state = { plano: {}, disciplinas: [ifrj.disciplinas[0]], sessoes: [] };
  const blocks = D.sugerirCiclo(state, { minutosSemana: 80, minBloco: 60, maxBloco: 75 });
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].metaMin, 75);
});

test('cotas do IFRJ continuam adaptando o tempo ao desempenho e ao conteúdo estudado', () => {
  const state = { plano: {}, disciplinas: JSON.parse(JSON.stringify(ifrj.disciplinas)), sessoes: [] };
  function minutes(id) {
    return D.sugerirCiclo(state, { minutosSemana: 600, minBloco: 30, maxBloco: 75 })
      .filter(b => b.disciplinaId === id).reduce((n, b) => n + b.metaMin, 0);
  }
  const initialPortuguese = minutes('IFRJ-POR');
  state.sessoes.push({ topicoId: 'IFRJ-POR-01', tipo: 'questoes', qFeitas: 10, qCertas: 0, data: '2026-10-02' });
  assert(minutes('IFRJ-POR') > initialPortuguese);
  state.sessoes = [];
  const initialSpecific = minutes('IFRJ-ESP');
  state.disciplinas.find(d => d.id === 'IFRJ-ESP').topicos.forEach(t => { t.status = 'teoria_concluida'; });
  assert(minutes('IFRJ-ESP') < initialSpecific);
  assert(minutes('IFRJ-POR') > initialPortuguese);
});

test('aluno salva personalização do IFRJ com capa e crédito sem modificar o modelo público', () => {
  const edit = JSON.parse(JSON.stringify(ifrj));
  edit._globalId = ifrj.id;
  edit.disciplinas[0].topicos[0].nome = 'Meu tópico editado';
  let saved = 0, publications = 0;
  const ctx = { editorEdital: edit, catalogoEditaisBase: bases, usuarioAdmin: () => false,
    sincronizarEditorDoDom() {}, gerarIdsEdital() {}, normalizarListaCorte: x => x, D,
    state: { editais: [] }, salvar: () => saved++, publicarCatalogoAdmin: () => publications++,
    fecharModal() {}, render() {}, toast() {} };
  vm.runInNewContext(extract('salvarEditorEdital', 'abrirEditorCarreira'), ctx);
  ctx.salvarEditorEdital({ querySelector: () => ({}) });
  assert.equal(saved, 1);
  assert.equal(publications, 0);
  const personal = ctx.state.editais[0];
  assert.equal(personal.id, ifrj.id);
  assert.equal(personal.disciplinas[0].topicos[0].nome, 'Meu tópico editado');
  assert.notEqual(ifrj.disciplinas[0].topicos[0].nome, 'Meu tópico editado');
  for (const field of ['foto', 'fotoAlt', 'fotoCredito', 'fotoFonte']) assert.equal(personal[field], ifrj[field]);
});
