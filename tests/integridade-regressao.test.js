'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadDomain } = require('./helpers/load-domain');
const { loadStore } = require('./helpers/load-store');
const D = loadDomain();
const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const copy = value => JSON.parse(JSON.stringify(value));

function state(S) {
  const st = S.estadoVazio();
  st.planos = [{ id: 'p', plano: { concurso: 'Teste', sugestoesRevisao: false, meta: { corte_pct: 70 },
    ciclo: { volta: 1, blocos: [
      { id: 'b1', disciplinaId: 'd', metaMin: 30, feitoMin: 0 },
      { id: 'b2', disciplinaId: 'd', metaMin: 30, feitoMin: 0 },
      { id: 'b3', disciplinaId: 'e', metaMin: 30, feitoMin: 0 }
    ] } }, disciplinas: [{ id: 'd', nome: 'Disciplina', topicos: [
    { id: 't1', nome: 'Um', status: 'pendente' }, { id: 't2', nome: 'Dois', status: 'pendente' }
  ] }], cronogramas: {}, links: [] }];
  st.planoAtivoId = 'p';
  return S.normalizar(st);
}

function aparelhos() {
  const S = loadStore(), inicial = state(S);
  S.salvar(inicial);
  const bruto = localStorage.getItem('estudos.v1');
  const a = S.normalizar(JSON.parse(bruto)), b = S.normalizar(JSON.parse(bruto));
  return { S, a, b, salvar(st) { localStorage.setItem('estudos.v1', bruto); S.salvar(st); } };
}

test('sincronização mantém tópicos concluídos independentemente nos dois aparelhos', () => {
  const { S, a, b, salvar } = aparelhos();
  a.disciplinas[0].topicos[0].status = 'teoria_concluida';
  b.disciplinas[0].topicos[1].status = 'teoria_concluida';
  a.sessoes.push({ id: 'a', planoId: 'p', data: '2026-10-02', topicoId: 't1', duracaoMin: 30 });
  b.sessoes.push({ id: 'b', planoId: 'p', data: '2026-10-02', topicoId: 't2', duracaoMin: 30 });
  salvar(a); salvar(b);
  for (const m of [S.mesclarEstados(a, b), S.mesclarEstados(b, a)]) {
    assert.deepEqual(m.disciplinas[0].topicos.map(t => t.status), ['teoria_concluida', 'teoria_concluida']);
    assert.equal(m.sessoes.length, 2);
    assert.equal(D.metaSemanal(m, '2026-10-02').minutos, 60);
  }
});

test('renomear tópico e concluir sua teoria em aparelhos diferentes preserva ambos', () => {
  const { S, a, b, salvar } = aparelhos();
  a.disciplinas[0].topicos[0].nome = 'Nome novo';
  b.disciplinas[0].topicos[0].status = 'teoria_concluida';
  salvar(a); salvar(b);
  const m = S.mesclarEstados(a, b);
  assert.equal(m.disciplinas[0].topicos[0].nome, 'Nome novo');
  assert.equal(m.disciplinas[0].topicos[0].status, 'teoria_concluida');
});

test('reabrir tópico depois de observar a conclusão é preservado na próxima mescla', () => {
  const { S, a, b, salvar } = aparelhos();
  a.disciplinas[0].topicos[0].status = 'dominado'; salvar(a);
  const concluido = copy(a);
  const observado = S.normalizar(S.mesclarEstados(a, b));
  localStorage.setItem('estudos.v1', JSON.stringify(S.paraPersistencia(observado)));
  observado.disciplinas[0].topicos[0].status = 'em_curso';
  observado.disciplinas[0].topicos[0].reaberto = true;
  S.salvar(observado);
  assert.equal(S.mesclarEstados(concluido, observado).disciplinas[0].topicos[0].status, 'em_curso');
});

test('progresso em blocos distintos do ciclo permanece após sincronizar e recarregar', () => {
  const { S, a, b, salvar } = aparelhos();
  a.plano.ciclo.blocos[0].feitoMin = 30; b.plano.ciclo.blocos[1].feitoMin = 30;
  salvar(a); salvar(b);
  const m = S.mesclarEstados(a, b);
  S.salvar(m, { marcarAlterado: false });
  assert.deepEqual(S.carregar().plano.ciclo.blocos.map(b => b.feitoMin), [30, 30, 0]);
  assert.equal(S.mesclarEstados(m, b).plano.ciclo.volta, 1);
});

test('mescla fecha uma volta completada entre aparelhos sem ressuscitar blocos anteriores', () => {
  const { S, a, b, salvar } = aparelhos();
  a.plano.ciclo.blocos[0].feitoMin = 30;
  b.plano.ciclo.blocos[1].feitoMin = 30; b.plano.ciclo.blocos[2].feitoMin = 30;
  salvar(a); salvar(b);
  const m = S.mesclarEstados(a, b);
  assert.equal(m.plano.ciclo.volta, 2);
  assert(m.plano.ciclo.blocos.every(b => b.feitoMin === 0));
  const novamente = S.mesclarEstados(m, b);
  assert.equal(novamente.plano.ciclo.volta, 2);
  assert(novamente.plano.ciclo.blocos.every(b => b.feitoMin === 0));
  const novaVolta = S.normalizar(copy(novamente));
  localStorage.setItem('estudos.v1', JSON.stringify(S.paraPersistencia(novaVolta)));
  novaVolta.plano.ciclo.blocos[0].feitoMin = 10; S.salvar(novaVolta);
  const combinado = S.mesclarEstados(novaVolta, novamente);
  assert.equal(combinado.plano.ciclo.blocos[0].feitoMin, 10, 'créditos da volta anterior não reaparecem');
});

test('minutos parciais no mesmo bloco somam uma vez e respeitam reinício explícito', () => {
  const { S, a, b, salvar } = aparelhos();
  a.plano.ciclo.blocos[0].feitoMin = 10; b.plano.ciclo.blocos[0].feitoMin = 15;
  salvar(a); salvar(b);
  const m = S.mesclarEstados(a, b);
  assert.equal(m.plano.ciclo.blocos[0].feitoMin, 25);
  assert.equal(S.mesclarEstados(m, a).plano.ciclo.blocos[0].feitoMin, 25);
  const reset = S.normalizar(copy(m));
  localStorage.setItem('estudos.v1', JSON.stringify(S.paraPersistencia(reset)));
  reset.plano.ciclo.blocos[0].feitoMin = 0;
  S.salvar(reset);
  assert.equal(S.mesclarEstados(m, reset).plano.ciclo.blocos[0].feitoMin, 0);
});

test('migração do ciclo preserva a rampa de entrada e os relógios dos blocos', () => {
  const S = loadStore(), st = state(S);
  st.plano.ciclo.blocos[2].voltaInicio = 4;
  S.salvar(st);
  const salvo = S.carregar().plano.ciclo.blocos[2];
  assert.equal(salvo.voltaInicio, 4);
  assert(salvo.camposAtualizados.voltaInicio);
});

test('sessão longa credita todos os blocos elegíveis da mesma disciplina', () => {
  const ciclo = state(loadStore()).plano.ciclo;
  D.avancarCiclo(ciclo, 'd', 60);
  assert.deepEqual(ciclo.blocos.map(b => b.feitoMin), [30, 30, 0]);
});

test('saldo atravessa a volta, sem adiantar disciplinas fora da rampa', () => {
  const ciclo = { volta: 1, blocos: [
    { id: 'b', disciplinaId: 'd', metaMin: 30, feitoMin: 0 },
    { id: 'futura', disciplinaId: 'e', metaMin: 30, feitoMin: 0, voltaInicio: 3 }
  ] };
  assert.equal(D.avancarCiclo(ciclo, 'e', 60).creditou, false);
  const r = D.avancarCiclo(ciclo, 'd', 75);
  assert.equal(r.completouVolta, true);
  assert.equal(ciclo.volta, 3);
  assert.deepEqual(ciclo.blocos.map(b => b.feitoMin), [15, 0]);
});

test('cards, série semanal e conquistas contam os mesmos simulados', () => {
  const S = loadStore(), st = state(S);
  st.simulados = [{ id: 'sim', planoId: 'p', data: '2026-10-02', duracaoMin: 60,
    acertos: [{ disciplinaId: 'd', total: 100, certas: 80 }] }];
  const meta = D.metaSemanal(st, '2026-10-02'), serie = D.serieSemanal(st, '2026-10-02', 1)[0];
  assert.equal(meta.qFeitas, serie.qFeitas); assert.equal(meta.pctAcertos, serie.pct);
  assert.equal(meta.minutos, serie.horas * 60);
  assert(D.conquistas(st).lista.find(c => c.id === 'q100').ganha);
  assert.equal(D.streak(D.atividadesDoPlano(st), '2026-10-02').atual, 1);
});

test('nenhuma métrica herda registros do último plano excluído', () => {
  const S = loadStore(), st = state(S);
  st.sessoes = [{ id: 's', planoId: 'p', data: '2026-10-02', duracaoMin: 60, qFeitas: 10, qCertas: 8 }];
  st.simulados = [{ id: 'sim', planoId: 'p', data: '2026-10-02', acertos: [{ disciplinaId: 'd', total: 20, certas: 16 }] }];
  st.planos = []; st.planoAtivoId = null; S.hidratar(st);
  assert.equal(D.metaSemanal(st, '2026-10-02').qFeitas, 0);
  assert.equal(D.serieSemanal(st, '2026-10-02', 1)[0].qFeitas, 0);
  assert.equal(D.conquistas(st).lista.find(c => c.id === 'sim').ganha, false);
});

test('backup inválido é rejeitado antes de substituir os dados locais', () => {
  const S = loadStore(), original = state(S); S.salvar(original);
  const antes = localStorage.getItem('estudos.v1');
  for (const mudar of [
    st => { st.sessoes = [null]; },
    st => { st.sessoes = [{ id: 's', data: '2026-10-02', duracaoMin: -60 }]; },
    st => { st.sessoes = [{ id: 's', data: '2026-02-30' }]; },
    st => { st.sessoes = [{ id: 's', data: '2026-10-02', qFeitas: 2, qCertas: 3 }]; },
    st => { st.sessoes = [{ id: 's', data: '2026-10-02' }, { id: 's', data: '2026-10-02' }]; },
    st => { st.simulados = [{ id: 'sim', data: '2026-10-02', acertos: [null] }]; }
  ]) {
    const st = copy(original); mudar(st);
    assert.equal(S.importarBackup(JSON.stringify(st)).ok, false);
    assert.equal(localStorage.getItem('estudos.v1'), antes);
  }
});

test('backup v1 válido migra e guarda histórico órfão sem atribuí-lo ao plano ativo', () => {
  const S = loadStore(), st = state(S);
  const legado = { versao: 1, plano: st.plano, disciplinas: st.disciplinas, sessoes: [
    { id: 's', data: '2026-10-02', topicoId: 't1', duracaoMin: 30, qFeitas: 10, qCertas: 8 }
  ] };
  const resultado = S.importarBackup(JSON.stringify(legado), { persistir: false });
  assert.equal(resultado.ok, true);
  assert.equal(D.metaSemanal(resultado.state, '2026-10-02').qFeitas, 10);
});

test('restauração explícita vence relógios novos e preserva uma cópia dos dados anteriores', () => {
  const { S, a, salvar } = aparelhos(), backup = copy(a);
  a.disciplinas[0].topicos[0].status = 'dominado'; salvar(a);
  a.disciplinas[0].topicos[0].status = 'em_curso'; S.salvar(a);
  a.plano.ciclo.volta = 3; S.salvar(a);
  assert(S.guardarCopiaRecuperacao(a).ok);
  const atual = copy(a);
  S.prepararRestauracao(backup, atual);
  const m = S.mesclarEstados(backup, atual);
  assert.equal(m.disciplinas[0].topicos[0].status, 'pendente');
  assert.equal(m.plano.ciclo.volta, 1, 'restauração explícita também restaura a volta antiga');
  assert.equal(JSON.parse(S.lerCopiaRecuperacao()).planos[0].disciplinas[0].topicos[0].status, 'em_curso');
  S.limparLocal(); assert.equal(S.lerCopiaRecuperacao(), null);
});

test('estado corrompido é preservado para recuperação antes de novos salvamentos', () => {
  const S = loadStore(), bruto = '{json incompleto';
  localStorage.setItem('estudos.v1', bruto);
  const antes = console.error; console.error = () => {};
  try { const st = S.carregar(); S.salvar(st); assert.equal(S.lerCopiaRecuperacao(), bruto); }
  finally { console.error = antes; }
});

test('simulados e flashcards sem planos ainda são dados para backup e sincronização', () => {
  const S = loadStore(), st = S.estadoVazio();
  assert.equal(S.temDados(st), false);
  st.simulados = [{ id: 'sim', data: '2026-10-02', acertos: [] }]; assert.equal(S.temDados(st), true);
  st.simulados = []; st.flashcards = [{ id: 'deck', cards: [] }]; assert.equal(S.temDados(st), true);
});

function revisaoAberta() {
  const S = loadStore(), st = state(S); let submit;
  st.revisoes = [{ id: 'r', planoId: 'p', topicoId: 't1', tipo: '3d', dataAgendada: '2026-10-02' }];
  const nodes = { '#rev-feitas': { value: '10' }, '#rev-certas': { value: '8' }, '#rev-dur': { value: '15' } };
  const modal = { querySelector(key) { return nodes[key] || (nodes[key] = { classList: { remove() {} },
    addEventListener(event, fn) { if (event === 'submit') submit = fn; } }); } };
  const ctx = { state: st, D, window: { Store: S }, esc: String, nomeTopicoCompleto: () => 'Um',
    abrirModal: () => modal, salvar() {}, fecharModal() {}, render() {}, toast() {} };
  vm.createContext(ctx);
  vm.runInContext(app.slice(app.indexOf('  function abrirConcluirRevisao('), app.indexOf('  let revisoesAba =')), ctx);
  ctx.abrirConcluirRevisao('r');
  return { ctx, nodes, enviar() { submit({ preventDefault() {} }); } };
}

test('concluir revisão depois de sync atualiza a revisão corrente exatamente uma vez', () => {
  const h = revisaoAberta(); h.ctx.state = copy(h.ctx.state);
  h.enviar(); h.enviar();
  assert(h.ctx.state.revisoes[0].dataConcluida);
  assert.equal(h.ctx.state.sessoes.length, 1);
  assert.equal(h.ctx.state.revisoes[0].sessaoId, h.ctx.state.sessoes[0].id);
});

test('revisão removida, plano trocado ou duração inválida não cria sessão fantasma', () => {
  for (const mudar of [
    h => { h.ctx.state.revisoes = []; },
    h => { h.ctx.state.planoAtivoId = 'outro'; },
    h => { h.nodes['#rev-dur'].value = '-1'; }
  ]) {
    const h = revisaoAberta(); mudar(h); h.enviar();
    assert.equal(h.ctx.state.sessoes.length, 0); assert(h.nodes['#rev-erro'].textContent);
  }
});

test('timer com armazenamento cheio continua contando, pausa e finaliza sem exceção', () => {
  let agora = 0, tick, avisos = 0;
  const ctx = { window: {}, Date: { now: () => agora },
    localStorage: { setItem() { throw Error('QuotaExceededError'); }, removeItem() { throw Error('bloqueado'); } },
    setInterval(fn) { tick = fn; return 1; }, clearInterval() {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/timer.js'), 'utf8'), ctx);
  const T = ctx.window.Timer; T.aoErroPersistencia(() => avisos++);
  T.iniciar('t1', 'cronometro'); agora = 60000; tick();
  assert.equal(T.estado().estudoMin, 1); assert.equal(T.estado().persistenciaOk, false);
  assert.equal(T.pausar().rodando, false); T.retomar();
  assert.equal(T.finalizar().estudoMin, 1); assert.equal(avisos, 1);
});

test('PWA usa cache em erro 503, mas não mascara respostas 404', async () => {
  const handlers = {}; let status = 503;
  const ctx = { URL, Response, self: { location: { origin: 'https://teste.local' }, addEventListener: (k, fn) => { handlers[k] = fn; } },
    importScripts() { throw Error('opcional'); }, console: { warn() {} },
    fetch: async () => new Response('', { status }), caches: { match: async () => new Response('cache') } };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), ctx);
  async function buscar() { let resposta; handlers.fetch({ request: { method: 'GET', url: 'https://teste.local/index.html' }, respondWith(p) { resposta = p; } }); return resposta; }
  assert.equal(await (await buscar()).text(), 'cache');
  status = 404; assert.equal((await buscar()).status, 404);
});

test('atualização do PWA espera um estado seguro e recarrega apenas uma vez', () => {
  let controller, timer, reloads = 0, seguro = false;
  const ctx = { navigator: { serviceWorker: { controller: {}, addEventListener(_k, fn) { controller = fn; }, register: async () => {} } },
    window: { addEventListener(_k, fn) { fn(); }, location: { reload() { reloads++; } }, GabariteiAtualizacaoSegura: () => seguro },
    setInterval(fn) { timer = fn; } };
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  vm.runInNewContext(html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>')), ctx);
  controller(); timer(); assert.equal(reloads, 0);
  seguro = true; timer(); timer(); assert.equal(reloads, 1);
});
