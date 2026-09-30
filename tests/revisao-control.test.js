'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const { loadDomain } = require('./helpers/load-domain');
const { loadStore } = require('./helpers/load-store');
const D = loadDomain(), S = loadStore();
function state() {
  const s = S.estadoVazio();
  s.planos = [{ id: 'p1', plano: { concurso: 'Meu plano' }, disciplinas: [], cronogramas: {}, links: [] }];
  s.planoAtivoId = 'p1'; S.hidratar(s);
  s.revisoes = [{ id: 'preservada', planoId: 'p1', topicoId: 't', dataAgendada: '2026-09-30' }];
  return s;
}

test('controle é apresentado na mesma linha de Editar plano, Edital e Excluir', () => {
  const context = { state: state(), D, esc: String, planoAtivoEntry: () => ({}), atualizacaoEditalPendente: () => null,
    fotoPlanoAtivoHtml: () => '', modoRetaFinalControleHtml: () => '', modoAprofundamentoControleHtml: () => '' };
  vm.createContext(context);
  const start = source.indexOf('  function planoAtualHtml()');
  const end = source.indexOf('  // Controle do modo aprofundamento', start);
  vm.runInContext(source.slice(start, end), context);
  const html = context.planoAtualHtml();
  const actions = html.slice(html.indexOf('class="compact-actions plano-acoes-card"'));
  for (const id of ['pl-acao-editar', 'pl-acao-edital', 'pl-acao-revisoes', 'pl-acao-excluir']) assert(actions.includes('id="' + id + '"'));
  assert(html.includes('aria-pressed="true"'));
  assert(html.includes('Desativar sugestões de revisão'));
  context.state.plano.sugestoesRevisao = false;
  assert(context.planoAtualHtml().includes('aria-pressed="false"'));
  assert(context.planoAtualHtml().includes('Ativar sugestões de revisão'));
});

test('clicar no controle persiste a preferência, regenera agenda e preserva revisões', () => {
  let click, regenerated = 0, focused = 0;
  const s = state();
  const context = { state: s, D, raiz: { querySelector: () => ({ addEventListener: (_event, fn) => { click = fn; } }) },
    document: { getElementById: () => ({ focus: () => { focused++; } }) },
    regenerarAgendaFuturas: () => { regenerated++; }, salvar: () => S.salvar(s), render() {}, toast() {} };
  const start = source.indexOf("    const acaoRevisoes = raiz.querySelector('#pl-acao-revisoes');");
  const end = source.indexOf("    const acaoExcluir = raiz.querySelector", start);
  vm.runInNewContext(source.slice(start, end), context);
  click(); assert.equal(S.carregar().plano.sugestoesRevisao, false);
  assert.equal(s.revisoes.length, 1); assert.equal(regenerated, 1); assert.equal(focused, 1);
  click(); assert.equal(S.carregar().plano.sugestoesRevisao, true);
  assert.equal(s.revisoes.length, 1); assert.equal(regenerated, 2);
});

test('teoria concluída não agenda automaticamente quando sugestões estão suspensas', () => {
  const s = state(); s.plano.sugestoesRevisao = false;
  const context = { state: s, D };
  const start = source.indexOf('  function agendarRevisoesSeNecessario(');
  const end = source.indexOf('  // No máximo 35%', start);
  vm.runInNewContext(source.slice(start, end), context);
  assert.equal(context.agendarRevisoesSeNecessario('novo-topico'), false);
  assert.equal(s.revisoes.length, 1);
});
