'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadDomain } = require('./helpers/load-domain');
const { loadStore } = require('./helpers/load-store');
const D = loadDomain(), S = loadStore();
const app = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
function state() {
  const st = S.estadoVazio();
  st.planos = ['atual', 'outro'].map(id => ({ id, plano: {
    concurso: id, meta: { corte_pct: 80 }, ritmos: { sustentavel: { h_semana: 17 } }
  }, disciplinas: [{ id: 'D-' + id, topicos: [{ id: 'T-' + id }] }], cronogramas: {}, links: [] }));
  st.planoAtivoId = 'atual';
  S.hidratar(st);
  return st;
}
const sessao = (id, planoId, data, extra = {}) => ({ id, planoId, data,
  topicoId: 'T-atual', duracaoMin: 60, qFeitas: 10, qCertas: 8, ...extra });
const simulado = (id, planoId, data, extra = {}) => ({ id, planoId, data,
  acertos: [{ disciplinaId: 'D-atual', total: 20, certas: 10 }], ...extra });

test('cards usam somente segunda a domingo do plano selecionado, incluindo simulados', () => {
  const st = state();
  st.sessoes = [sessao('segunda', 'atual', '2026-09-28'), sessao('domingo', 'atual', '2026-10-04'),
    sessao('antes', 'atual', '2026-09-27'), sessao('depois', 'atual', '2026-10-05'),
    sessao('outro', 'outro', '2026-10-02'), sessao('excluido', 'apagado', '2026-10-02')];
  st.simulados = [simulado('sim-atual', 'atual', '2026-10-02'), simulado('sim-outro', 'outro', '2026-10-02'),
    simulado('sim-antigo', 'atual', '2026-09-27'), simulado('sim-futuro', 'atual', '2026-10-05')];
  assert.deepEqual(D.metaSemanal(st, '2026-10-02'), { inicio: '2026-09-28', minutos: 120,
    qFeitas: 40, qCertas: 26, pctAcertos: 65, horasAlvo: 17, questoesAlvo: 100 });
  // A segunda-feira inicia outra semana, sem acumular a anterior.
  assert.equal(D.metaSemanal(st, '2026-10-05').qFeitas, 30);
  st.planoAtivoId = 'outro'; S.hidratar(st);
  assert.equal(D.metaSemanal(st, '2026-10-02').qFeitas, 30);
});

test('sem questões nesta semana não reaproveita percentual do histórico', () => {
  const st = state();
  st.sessoes = [sessao('antiga', 'atual', '2026-09-20'), sessao('teoria', 'atual', '2026-10-02', { qFeitas: 0, qCertas: 0 })];
  const meta = D.metaSemanal(st, '2026-10-02');
  assert.equal(meta.minutos, 60);
  assert.equal(meta.qFeitas, 0);
  assert.equal(meta.pctAcertos, null);
  const start = app.indexOf('    const metaPct = state.plano && state.plano.meta ? state.plano.meta.corte_pct : 70;', app.indexOf('  function telaHoje()'));
  const end = app.indexOf('    html += painelDisciplinasHojeHtml();', start);
  const ctx = { state: st, meta, html: '', mensagemCoach() { throw new Error('Não avaliar histórico sem questões da semana'); } };
  vm.runInNewContext(app.slice(start, end), ctx);
  assert(ctx.html.includes('Margem de acertos na semana'));
  assert(ctx.html.includes('>—</div>'));
  assert(ctx.html.includes('Registre questões ou um simulado nesta semana'));
});

test('legado sem planoId exige referências do plano atual sem ambiguidade', () => {
  const st = state();
  st.sessoes = [sessao('legado-valido', null, '2026-10-02'),
    sessao('orfao', null, '2026-10-02', { topicoId: 'T-apagado' })];
  st.simulados = [simulado('legado-sim', null, '2026-10-02'),
    simulado('sim-orfao', null, '2026-10-02', { acertos: [{ disciplinaId: 'D-apagado', total: 100, certas: 99 }] })];
  assert.equal(D.metaSemanal(st, '2026-10-02').qFeitas, 30);
  st.planos[1].disciplinas = st.disciplinas;
  assert.equal(D.metaSemanal(st, '2026-10-02').qFeitas, 0);
  st.config.planosExcluidos = { apagado: '2026-10-02T10:00:00Z' };
  st.planos[1].disciplinas = [];
  assert.equal(D.metaSemanal(st, '2026-10-02').qFeitas, 0);
});

test('excluir o último plano, recriar ou receber registros excluídos não contamina os cards', () => {
  const st = state();
  st.config.planosExcluidos = { apagado: '2026-10-02T10:00:00Z' };
  st.config.removidos = ['removida', 'sim-removido'];
  st.sessoes = [sessao('valida', 'atual', '2026-10-02'), sessao('removida', 'atual', '2026-10-02'),
    sessao('velha', 'apagado', '2026-10-02')];
  st.simulados = [simulado('sim-removido', 'atual', '2026-10-02')];
  assert.equal(D.metaSemanal(st, '2026-10-02').qFeitas, 10);
  st.planos = []; st.plano = null; st.planoAtivoId = null; st.disciplinas = [];
  const vazio = D.metaSemanal(st, '2026-10-02');
  assert.equal(vazio.minutos, 0); assert.equal(vazio.qFeitas, 0); assert.equal(vazio.pctAcertos, null);
  const novo = state();
  novo.sessoes = st.sessoes;
  novo.planos[0].id = 'novo'; novo.planoAtivoId = 'novo'; S.hidratar(novo);
  assert.equal(D.metaSemanal(novo, '2026-10-02').qFeitas, 0);
});

test('migração remove o modo antigo de todos os planos e preserva aprofundamento', () => {
  const st = state();
  st.planos.forEach(p => { p.plano.modoRetaFinal = true; p.plano.modoAprofundamento = true; });
  S.salvar(st);
  const migrated = S.carregar();
  assert(migrated.planos.every(p => p.plano.modoRetaFinal === undefined && p.plano.modoAprofundamento));
  assert.equal(migrated.plano.modoRetaFinal, undefined);
  assert(!app.includes('retaFinalInfo'));
  assert(!app.includes('pl-reta-ativar'));
});

test('ao mudar a data local a tela é atualizada uma vez, inclusive no retorno ao app', () => {
  const start = app.indexOf('  let ultimaDataRender = null;');
  const end = app.indexOf('  function render() {', start);
  let hoje = '2026-10-04', renders = 0;
  const ctx = { D: { hojeISO: () => hoje }, render() { renders++; vm.runInContext('ultimaDataRender = D.hojeISO()', ctx); } };
  vm.createContext(ctx); vm.runInContext(app.slice(start, end), ctx);
  ctx.atualizarDataDaTela(); ctx.atualizarDataDaTela();
  assert.equal(renders, 1);
  hoje = '2026-10-05'; ctx.atualizarDataDaTela();
  assert.equal(renders, 2);
  const visibility = app.slice(app.indexOf("document.addEventListener('visibilitychange'"), app.indexOf('  const recuperado = window.Timer.recuperar();'));
  assert(visibility.includes('atualizarDataDaTela();'));
});

test('a atualização diária dispara na meia-noite local e se reagenda', () => {
  const start = app.indexOf('  let ultimaDataRender = null;');
  const end = app.indexOf('  function render() {', start);
  const RealDate = Date;
  let agora = new RealDate(2026, 9, 4, 23, 59), callback, atraso, renders = 0;
  class Clock extends RealDate {
    constructor(...args) { super(...(args.length ? args : [agora.getTime()])); }
  }
  const ctx = { Date: Clock, document: { hidden: false }, D: { hojeISO: () => agora.getDate() === 4 ? '2026-10-04' : '2026-10-05' },
    setTimeout(fn, ms) { callback = fn; atraso = ms; }, render() { renders++; } };
  vm.createContext(ctx); vm.runInContext(app.slice(start, end), ctx);
  ctx.agendarAtualizacaoDiaria();
  assert.equal(atraso, 60000);
  agora = new RealDate(2026, 9, 5, 0, 0);
  callback();
  assert.equal(renders, 1);
  assert.equal(atraso, 24 * 60 * 60 * 1000);
});
