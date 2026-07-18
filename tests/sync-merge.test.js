'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadStore } = require('./helpers/load-store');
const S = loadStore();

function plano(id, criadoEm, nome, atualizadoEm) {
  return {
    id, criadoEm, atualizadoEm: atualizadoEm || '',
    plano: { concurso: nome }, disciplinas: [], cronogramas: {}, links: []
  };
}

function estadoCom(fn) {
  const st = S.estadoVazio();
  fn(st);
  return st;
}

test('mescla une sessões e simulados dos dois lados por id', () => {
  const a = estadoCom(function (st) { st.sessoes = [{ id: 's1' }]; st.simulados = [{ id: 'm1' }]; });
  const b = estadoCom(function (st) { st.sessoes = [{ id: 's2' }]; });
  const m = S.mesclarEstados(a, b);
  assert.deepEqual(m.sessoes.map(function (s) { return s.id; }).sort(), ['s1', 's2']);
  assert.equal(m.simulados.length, 1);
});

test('sessão com tombstone (removidos) não ressuscita de nenhum lado', () => {
  const a = estadoCom(function (st) { S.marcarRemovido(st, 's-apagada'); });
  const b = estadoCom(function (st) { st.sessoes = [{ id: 's-apagada' }, { id: 's-viva' }]; });
  const m = S.mesclarEstados(b, a); // pior caso: lado que ainda tem a sessão é a base
  assert.deepEqual(m.sessoes.map(function (s) { return s.id; }), ['s-viva']);
  assert.ok(m.config.removidos.indexOf('s-apagada') >= 0, 'tombstone propaga');
});

test('revisão com tombstone não reaparece de uma cópia desatualizada', () => {
  const atual = estadoCom(function (st) { S.marcarRemovido(st, 'rev-apagada'); });
  const velha = estadoCom(function (st) {
    st.revisoes = [{ id: 'rev-apagada', topicoId: 't1', dataAgendada: '2026-07-20' }];
  });
  const m = S.mesclarEstados(atual, velha);
  assert.equal(m.revisoes.length, 0);
});

test('lápide de plano (planosExcluidos) impede ressurreição por cópia velha', () => {
  const nuvem = estadoCom(function (st) {
    st.planos = [plano('pln-comb', '2026-06-20T00:00:00Z', 'Combinado')];
    st.planoAtivoId = 'pln-comb';
    st.config.planosExcluidos = { 'pln-velho': '2026-06-01T00:00:00Z' };
  });
  const velho = estadoCom(function (st) {
    st.planos = [plano('pln-velho', '2026-03-01T00:00:00Z', 'Antigo')];
    st.planoAtivoId = 'pln-velho';
    st.sessoes = [{ id: 'ses-old', planoId: 'pln-velho' }];
  });
  const m = S.mesclarEstados(velho, nuvem); // pior caso: cópia velha é a base
  assert.deepEqual(m.planos.map(function (p) { return p.id; }), ['pln-comb']);
  assert.equal(m.sessoes.length, 1, 'sessões do plano excluído ficam guardadas (órfãs)');
});

test('plano recriado (id novo, criadoEm após a lápide) não é bloqueado', () => {
  const a = estadoCom(function (st) {
    st.planos = [plano('pln-novo', '2026-07-01T00:00:00Z', 'Recriado')];
    st.planoAtivoId = 'pln-novo';
    st.config.planosExcluidos = { 'pln-velho': '2026-06-01T00:00:00Z' };
  });
  const b = estadoCom(function (st) { st.sessoes = [{ id: 's1' }]; });
  const m = S.mesclarEstados(a, b);
  assert.deepEqual(m.planos.map(function (p) { return p.id; }), ['pln-novo']);
});

test('risco 1: para o mesmo plano, vence a versão com atualizadoEm mais novo (mesmo sem ser a base)', () => {
  const editadoOntem = plano('pln-x', '2026-06-01T00:00:00Z', 'Versão velha', '2026-06-30T00:00:00Z');
  const editadoHoje = plano('pln-x', '2026-06-01T00:00:00Z', 'Versão nova', '2026-07-02T00:00:00Z');
  const base = estadoCom(function (st) { st.planos = [editadoOntem]; st.planoAtivoId = 'pln-x'; });
  const outro = estadoCom(function (st) { st.planos = [editadoHoje]; st.planoAtivoId = 'pln-x'; });
  const m = S.mesclarEstados(base, outro);
  assert.equal(m.planos[0].plano.concurso, 'Versão nova');
});

test('edições concorrentes preservam disciplinas e tópicos adicionados nos dois aparelhos', () => {
  const antigo = plano('pln-x', '2026-06-01T00:00:00Z', 'Plano', '2026-07-01T00:00:00Z');
  antigo.disciplinas = [{
    id: 'D1', nome: 'Direito',
    topicos: [{ id: 'T1', nome: 'Princípios' }]
  }];
  const recente = plano('pln-x', '2026-06-01T00:00:00Z', 'Plano atualizado', '2026-07-02T00:00:00Z');
  recente.disciplinas = [
    { id: 'D1', nome: 'Direito', topicos: [{ id: 'T2', nome: 'Atos administrativos' }] },
    { id: 'D2', nome: 'Português', topicos: [{ id: 'T3', nome: 'Crase' }] }
  ];
  const a = estadoCom(function (st) { st.planos = [antigo]; st.planoAtivoId = 'pln-x'; });
  const b = estadoCom(function (st) { st.planos = [recente]; st.planoAtivoId = 'pln-x'; });

  const m = S.mesclarEstados(a, b);
  assert.equal(m.planos[0].plano.concurso, 'Plano atualizado');
  assert.deepEqual(m.planos[0].disciplinas.map(function (d) { return d.id; }).sort(), ['D1', 'D2']);
  assert.deepEqual(
    m.planos[0].disciplinas.find(function (d) { return d.id === 'D1'; }).topicos.map(function (t) { return t.id; }).sort(),
    ['T1', 'T2']
  );
});

test('salvar informa falha de persistência ao estourar a quota', () => {
  const original = global.localStorage.setItem;
  const erroOriginal = console.error;
  global.localStorage.setItem = function () { throw new Error('QuotaExceededError'); };
  console.error = function () {};
  try {
    const resultado = S.salvar(estadoCom(function () {}));
    assert.equal(resultado.ok, false);
    assert.match(resultado.erro, /QuotaExceededError/);
  } finally {
    global.localStorage.setItem = original;
    console.error = erroOriginal;
  }
});

test('risco 3: salvar incrementa config.rev e a mescla mantém o maior', () => {
  const a = estadoCom(function (st) { st.sessoes = [{ id: 's1' }]; });
  S.salvar(a); S.salvar(a);
  const b = estadoCom(function (st) { st.sessoes = [{ id: 's2' }]; });
  S.salvar(b);
  assert.equal(a.config.rev, 2);
  const m = S.mesclarEstados(b, a);
  assert.equal(m.config.rev, 2, 'rev do resultado nunca anda para trás');
});

test('risco 4: progresso de bloco da agenda com mesmo id soma entre aparelhos', () => {
  const a = estadoCom(function (st) {
    st.agenda = [{ id: 'blc-1', feito: false, feitoMin: 10, gerado: true }, { id: 'blc-2', feito: false, feitoMin: 0, gerado: true }];
  });
  const b = estadoCom(function (st) {
    st.agenda = [{ id: 'blc-1', feito: true, feitoMin: 45, registroRapidoId: 'ses-9', gerado: true }, { id: 'blc-3', feito: true, feitoMin: 30, gerado: true }];
  });
  const m = S.mesclarEstados(a, b);
  const b1 = m.agenda.find(function (x) { return x.id === 'blc-1'; });
  assert.equal(b1.feito, true);
  assert.equal(b1.feitoMin, 45);
  assert.equal(b1.registroRapidoId, 'ses-9');
  // agenda continua sem união: bloco que só existe no outro lado não entra
  assert.equal(m.agenda.some(function (x) { return x.id === 'blc-3'; }), false);
});

test('bloco manual exclusivo de outro aparelho é preservado na mescla', () => {
  const a = estadoCom(function (st) { st.agenda = []; });
  const b = estadoCom(function (st) {
    st.agenda = [{ id: 'manual-1', planoId: 'p1', data: '2026-07-20', gerado: false, extra: true, duracaoMin: 45 }];
  });
  const m = S.mesclarEstados(a, b);
  assert.equal(m.agenda.length, 1);
  assert.equal(m.agenda[0].id, 'manual-1');
});

test('exclusões de disciplina, tópico e link geram lápides e não ressuscitam', () => {
  localStorage.removeItem('estudos.v1');
  const atual = estadoCom(function (st) {
    const p = plano('p1', '2026-07-01T00:00:00Z', 'Plano');
    p.disciplinas = [
      { id: 'D1', nome: 'Direito', topicos: [{ id: 'T1', nome: 'Antigo' }, { id: 'T2', nome: 'Atual' }] },
      { id: 'D2', nome: 'Português', topicos: [] }
    ];
    p.links = [{ id: 'L1', url: 'https://example.com' }];
    st.planos = [p];
    st.planoAtivoId = 'p1';
  });
  S.normalizar(atual);
  S.salvar(atual);
  const velha = S.normalizar(JSON.parse(JSON.stringify(S.paraPersistencia(atual))));

  atual.planos[0].disciplinas = [{
    id: 'D1', nome: 'Direito', topicos: [{ id: 'T2', nome: 'Atual' }]
  }];
  atual.planos[0].links = [];
  S.hidratar(atual);
  S.salvar(atual);

  const m = S.mesclarEstados(velha, atual);
  assert.deepEqual(m.planos[0].disciplinas.map(function (d) { return d.id; }), ['D1']);
  assert.deepEqual(m.planos[0].disciplinas[0].topicos.map(function (t) { return t.id; }), ['T2']);
  assert.equal(m.planos[0].links.length, 0);
});

test('exclusão de bloco manual não é desfeita por cópia antiga', () => {
  localStorage.removeItem('estudos.v1');
  const atual = estadoCom(function (st) {
    st.agenda = [{ id: 'manual-1', planoId: 'p1', data: '2026-07-20', gerado: false, duracaoMin: 30 }];
  });
  S.salvar(atual);
  const velha = S.normalizar(JSON.parse(JSON.stringify(S.paraPersistencia(atual))));
  atual.agenda = [];
  S.salvar(atual);
  assert.equal(S.mesclarEstados(velha, atual).agenda.length, 0);
});

test('registrar sessão em plano desatualizado não sobrescreve estrutura editada', () => {
  localStorage.removeItem('estudos.v1');
  const atual = estadoCom(function (st) {
    st.planos = [plano('p1', '2026-07-01T00:00:00Z', 'ANTIGO')];
    st.planoAtivoId = 'p1';
  });
  S.normalizar(atual);
  S.salvar(atual);
  const aparelhoAntigo = S.normalizar(JSON.parse(JSON.stringify(S.paraPersistencia(atual))));

  atual.planos[0].plano.concurso = 'EDITADO';
  S.salvar(atual);
  const carimboEstruturaNova = atual.planos[0].estruturaAtualizadaEm;

  const carimboEstruturaAntiga = aparelhoAntigo.planos[0].estruturaAtualizadaEm;
  aparelhoAntigo.sessoes.push({ id: 's-nova', planoId: 'p1', data: '2026-07-18' });
  S.salvar(aparelhoAntigo);
  assert.equal(aparelhoAntigo.planos[0].estruturaAtualizadaEm, carimboEstruturaAntiga);

  const m = S.mesclarEstados(aparelhoAntigo, atual);
  assert.equal(m.planos[0].plano.concurso, 'EDITADO');
  assert.equal(m.planos[0].estruturaAtualizadaEm, carimboEstruturaNova);
  assert.ok(m.sessoes.some(function (s) { return s.id === 's-nova'; }));
});

test('revisão concluída e repetição de flashcard não regridem no mesmo id', () => {
  const pendente = estadoCom(function (st) {
    st.revisoes = [{ id: 'r1', dataConcluida: null }];
    st.flashcards = [{
      id: 'deck-1', cards: [{ id: 'card-1', sr: { intervalo: 1, ultimaRevisao: '2026-07-10' } }]
    }];
  });
  const concluido = estadoCom(function (st) {
    st.revisoes = [{ id: 'r1', dataConcluida: '2026-07-18', resultadoPct: 90 }];
    st.flashcards = [{
      id: 'deck-1', cards: [{ id: 'card-1', sr: { intervalo: 10, ultimaRevisao: '2026-07-18' } }]
    }];
  });
  const m = S.mesclarEstados(pendente, concluido);
  assert.equal(m.revisoes[0].dataConcluida, '2026-07-18');
  assert.equal(m.flashcards[0].cards[0].sr.intervalo, 10);
});

test('estado de persistência remota não duplica os slots hidratados do plano ativo', () => {
  const st = estadoCom(function (s) {
    s.planos = [plano('p1', '2026-07-01T00:00:00Z', 'Plano')];
    s.planoAtivoId = 'p1';
  });
  S.normalizar(st);
  const limpo = S.paraPersistencia(st);
  assert.equal(Object.prototype.hasOwnProperty.call(limpo, 'plano'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(limpo, 'disciplinas'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(limpo, 'cronogramas'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(limpo, 'links'), false);
});

test('migração corrige acertos impossíveis de cache antigo', () => {
  const st = estadoCom(function (s) {
    s.sessoes = [{ id: 's1', qFeitas: 14, qCertas: 15 }];
    s.simulados = [{ id: 'm1', acertos: [{ disciplinaId: 'D1', total: 17, certas: 18 }] }];
  });
  S.normalizar(st);
  assert.equal(st.sessoes[0].qCertas, 14);
  assert.equal(st.simulados[0].acertos[0].certas, 17);
});

// ---- Regras de estudo recorrente (troca de disciplina por dia da semana) ----
const { loadDomain } = require('./helpers/load-domain');
const Dom = loadDomain();

function bloco(id, data, disc) { return { id: id, planoId: 'p1', data: data, disciplinaId: disc, topicoId: disc + '-01' }; }

test('aplicarRegrasAgenda troca a disciplina no dia da semana da regra', () => {
  // 2026-07-07 é uma terça-feira (diaSemana 1)
  const blocos = [bloco('b1', '2026-07-07', 'DADM'), bloco('b2', '2026-07-08', 'DADM')];
  const regras = [{ id: 'r1', planoId: 'p1', diaSemana: 1, de: 'DADM', para: 'LP', desde: null }];
  const n = Dom.aplicarRegrasAgenda(blocos, regras, '2026-07-06', 'p1');
  assert.equal(n, 1);
  assert.equal(blocos[0].disciplinaId, 'LP'); // terça trocou
  assert.equal(blocos[0].topicoId, null);      // tópico limpo
  assert.equal(blocos[1].disciplinaId, 'DADM'); // quarta intacta
});

test('regra com desde no futuro não afeta semanas anteriores', () => {
  const blocos = [bloco('b1', '2026-07-07', 'DADM')];
  const regras = [{ id: 'r1', planoId: 'p1', diaSemana: 1, de: 'DADM', para: 'LP', desde: '2026-07-20' }];
  const n = Dom.aplicarRegrasAgenda(blocos, regras, '2026-07-06', 'p1');
  assert.equal(n, 0);
  assert.equal(blocos[0].disciplinaId, 'DADM');
});

test('regra de outro plano não afeta o plano atual', () => {
  const blocos = [bloco('b1', '2026-07-07', 'DADM')];
  const regras = [{ id: 'r1', planoId: 'OUTRO', diaSemana: 1, de: 'DADM', para: 'LP', desde: null }];
  assert.equal(Dom.aplicarRegrasAgenda(blocos, regras, '2026-07-06', 'p1'), 0);
});

test('diaSemanaISO: segunda=0 ... domingo=6', () => {
  assert.equal(Dom.diaSemanaISO('2026-07-06'), 0); // segunda
  assert.equal(Dom.diaSemanaISO('2026-07-07'), 1); // terça
  assert.equal(Dom.diaSemanaISO('2026-07-12'), 6); // domingo
});

test('aplicarRegrasAgenda move o bloco para outro dia da semana (regra paraDia)', () => {
  // 2026-07-07 terça (1) → mover para quarta (2) = 2026-07-08
  const blocos = [bloco('b1', '2026-07-07', 'DADM')];
  const regras = [{ id: 'r1', planoId: 'p1', diaSemana: 1, de: 'DADM', paraDia: 2, desde: null }];
  const n = Dom.aplicarRegrasAgenda(blocos, regras, '2026-07-06', 'p1');
  assert.equal(n, 1);
  assert.equal(blocos[0].data, '2026-07-08');
  assert.equal(blocos[0].disciplinaId, 'DADM'); // move não troca disciplina
});

test('regra de mover não encadeia numa troca do dia de destino', () => {
  // move terça(1)→quarta(2) e troca na quarta(2): o bloco movido NÃO deve virar a troca
  const blocos = [bloco('b1', '2026-07-07', 'DADM')];
  const regras = [
    { id: 'r1', planoId: 'p1', diaSemana: 1, de: 'DADM', paraDia: 2, desde: null },
    { id: 'r2', planoId: 'p1', diaSemana: 2, de: 'DADM', para: 'LP', desde: null }
  ];
  Dom.aplicarRegrasAgenda(blocos, regras, '2026-07-06', 'p1');
  assert.equal(blocos[0].data, '2026-07-08');
  assert.equal(blocos[0].disciplinaId, 'DADM'); // continua DADM (não virou LP)
});
