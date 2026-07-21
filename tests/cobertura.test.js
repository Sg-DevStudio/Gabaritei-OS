'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

// hoje fixo: 2026-06-24. Prova em 2026-07 → prazo 2026-07-01 → 7 dias.
const HOJE = '2026-06-24';
const JANELA = ['2026-07', '2026-07'];

function disc(id, nome, topicos) {
  return { id: id, nome: nome, cor: '#3B82F6', peso: 1, topicos: topicos };
}
function top(id, inc, status) {
  return { id: id, nome: 'Tópico ' + id, incidencia_pct: inc, status: status || 'pendente', horas_estimadas: 2 };
}

// ---- modo ciclo ----------------------------------------------------------

function stateCicloRisco(volta) {
  return {
    plano: { modoPlanejamento: 'ciclo', radar: { janela_prova: JANELA },
      ciclo: { volta: volta, blocos: [{ id: 'b1', disciplinaId: 'D0', topicoId: 'D0-1', metaMin: 60, feitoMin: 0, voltaInicio: 1 }] } },
    disciplinas: [disc('D0', 'Português', [top('D0-1', 50), top('D0-2', 30), top('D0-3', 10)])],
    cronogramas: {}, sessoes: [],
  };
}

test('alertaCobertura (ciclo): na reta final lista os tópicos de menor incidência fora do alcance', () => {
  // volta 10 → 9 voltas feitas, ~1 restante → pctRestante ≈ 10% (reta final)
  const a = D.alertaCobertura(stateCicloRisco(10), HOJE, { minutosSemana: 60 });
  assert.ok(a, 'deve alertar na reta final');
  assert.equal(a.modo, 'ciclo');
  assert.equal(a.voltasRestantes, 1);
  // 1 tópico cabe nessa volta (o de maior incidência); sobram 2 em risco
  assert.equal(a.topicos.length, 2);
  assert.deepEqual(a.topicos.map((t) => t.incidencia), [30, 10], 'ordenado por incidência desc');
  assert.equal(a.topicos[0].disciplina, 'Português');
});

test('alertaCobertura (ciclo): fora da reta final (muitas voltas restantes) não alerta', () => {
  // volta 1 → pctRestante = 100% mesmo com tópicos a descoberto
  assert.equal(D.alertaCobertura(stateCicloRisco(1), HOJE, { minutosSemana: 60 }), null);
});

test('alertaCobertura (ciclo): sem rotina (minutosSemana 0) não estima voltas → null', () => {
  assert.equal(D.alertaCobertura(stateCicloRisco(10), HOJE, { minutosSemana: 0 }), null);
});

test('alertaCobertura (ciclo): disciplina SEM bloco no ciclo entra inteira em risco', () => {
  const st = stateCicloRisco(10);
  st.disciplinas.push(disc('D9', 'Direito', [top('D9-1', 80)]));
  const a = D.alertaCobertura(st, HOJE, { minutosSemana: 60 });
  const ids = a.topicos.map((t) => t.id);
  assert.ok(ids.includes('D9-1'), 'tópico de disciplina sem bloco é coberto com capacidade 0');
});

test('alertaCobertura: sem janela_prova não há contra o que comparar → null', () => {
  const st = stateCicloRisco(10);
  st.plano.radar.janela_prova = ['', ''];
  assert.equal(D.alertaCobertura(st, HOJE, { minutosSemana: 60 }), null);
});

test('alertaCobertura: prova já passada → null', () => {
  const st = stateCicloRisco(10);
  st.plano.radar.janela_prova = ['2026-01', '2026-01'];
  assert.equal(D.alertaCobertura(st, HOJE, { minutosSemana: 60 }), null);
});

// ---- modo cronograma -----------------------------------------------------

function stateCronograma() {
  return {
    plano: { modoPlanejamento: 'cronograma', ritmoAtivo: 'sustentavel', radar: { janela_prova: JANELA } },
    disciplinas: [disc('D0', 'Português', [top('D0-1', 50), top('D0-2', 30, 'dominado'), top('D0-3', 70)])],
    cronogramas: {
      sustentavel: [
        { inicio: '2026-06-22', blocos: [{ topico: 'D0-1', tipo: 'teoria' }] },      // antes do prazo: ok
        { inicio: '2026-07-06', blocos: [{ topico: 'D0-3', tipo: 'teoria' }] },      // depois do prazo: em risco
        { inicio: '2026-07-13', blocos: [{ topico: 'D0-2', tipo: 'teoria' }, { topico: 'D0-3', tipo: 'questoes' }] },
      ],
    },
    sessoes: [],
  };
}

test('alertaCobertura (cronograma): lista a teoria agendada depois da prova', () => {
  const a = D.alertaCobertura(stateCronograma(), HOJE);
  assert.ok(a, 'plano estoura a data da prova');
  assert.equal(a.modo, 'cronograma');
  // D0-1 está antes do prazo (ok); D0-2 já dominado; D0-3(questoes) não conta.
  // Sobra só D0-3 (teoria) depois do prazo.
  assert.deepEqual(a.topicos.map((t) => t.id), ['D0-3']);
  assert.equal(a.topicos[0].incidencia, 70);
  assert.ok(a.semanasApos >= 1);
});

test('alertaCobertura (cronograma): tudo dentro do prazo → null', () => {
  const st = stateCronograma();
  st.cronogramas.sustentavel = [{ inicio: '2026-06-22', blocos: [{ topico: 'D0-1', tipo: 'teoria' }] }];
  assert.equal(D.alertaCobertura(st, HOJE), null);
});

// ---- adicionarTopicosAoCiclo --------------------------------------------

test('adicionarTopicosAoCiclo: adiciona na volta atual, ignora duplicatas', () => {
  const ciclo = { volta: 2, blocos: [{ id: 'b1', disciplinaId: 'D0', topicoId: 'D0-1', metaMin: 60, feitoMin: 0, voltaInicio: 1 }] };
  const n = D.adicionarTopicosAoCiclo(ciclo, [
    { id: 'D0-1', disciplinaId: 'D0', incidencia: 50 }, // duplicata → ignora
    { id: 'D0-2', disciplinaId: 'D0', incidencia: 30 },
    { id: 'D9-1', disciplinaId: 'D9', incidencia: 80 },
  ]);
  assert.equal(n, 2);
  assert.equal(ciclo.blocos.length, 3);
  const novo = ciclo.blocos.find((b) => b.topicoId === 'D0-2');
  assert.equal(novo.voltaInicio, 2, 'entra na volta atual');
  assert.equal(novo.metaMin, 30);
  assert.equal(novo.feitoMin, 0);
});

// ---- #1: espaçamento ponderado por recência ------------------------------
test('fatorEspacamento: bom recente após ruim antigo não fica preso no piso', () => {
  const revs = [
    { topicoId: 't', tipo: '7d', dataConcluida: '2026-01-01', resultadoPct: 40 },  // mult 0.6
    { topicoId: 't', tipo: '14d', dataConcluida: '2026-02-01', resultadoPct: 90 }, // mult 1.25 (recente)
  ];
  const f = D.fatorEspacamentoRevisao(revs, 't');
  // produto puro daria 0.6*1.25=0.75; com recência o recente bom puxa para cima
  assert.ok(f > 0.75, 'recência puxa acima do produto puro: ' + f);
});

test('fatorEspacamento: melhora recente > piora recente (mesma base)', () => {
  const base = [{ topicoId: 't', tipo: '7d', dataConcluida: '2026-01-01', resultadoPct: 90 }];
  const melhora = base.concat([{ topicoId: 't', tipo: '14d', dataConcluida: '2026-02-01', resultadoPct: 95 }]);
  const piora = base.concat([{ topicoId: 't', tipo: '14d', dataConcluida: '2026-02-01', resultadoPct: 40 }]);
  assert.ok(D.fatorEspacamentoRevisao(melhora, 't') > D.fatorEspacamentoRevisao(piora, 't'));
});

test('fatorEspacamento: respeita os limites [0.4, 2.2]', () => {
  const ruins = [];
  for (let i = 0; i < 8; i++) ruins.push({ topicoId: 't', tipo: '7d', dataConcluida: '2026-0' + (i + 1) + '-01', resultadoPct: 10 });
  assert.ok(D.fatorEspacamentoRevisao(ruins, 't') >= 0.4);
});

// ---- #2: revisão como item de tempo (fonte única no calendário) ----------
function stateRevisoes() {
  return {
    planoAtivoId: 'p1',
    disciplinas: [disc('D0', 'Português', [top('D0-1', 50), top('D0-2', 30)])],
    sessoes: [],
    revisoes: [
      { id: 'r1', planoId: 'p1', topicoId: 'D0-1', tipo: '24h', dataAgendada: '2026-06-25', dataConcluida: null },
      { id: 'r2', planoId: 'p1', topicoId: 'D0-2', tipo: '30d', dataAgendada: '2026-06-25', dataConcluida: null },
      { id: 'r3', planoId: 'p1', topicoId: 'D0-1', tipo: '7d', dataAgendada: '2026-06-26', dataConcluida: null },
      { id: 'r4', planoId: 'p1', topicoId: 'D0-1', tipo: '3d', dataAgendada: '2026-06-25', dataConcluida: '2026-06-25' }, // já feita
      { id: 'r5', planoId: 'p1', topicoId: 'ZZZ', tipo: '24h', dataAgendada: '2026-06-25', dataConcluida: null },       // tópico inexistente
    ],
  };
}

test('duracaoRevisaoMin: por tipo (10/15/20) e fallback', () => {
  assert.equal(D.duracaoRevisaoMin('24h'), 10);
  assert.equal(D.duracaoRevisaoMin('7d'), 15);
  assert.equal(D.duracaoRevisaoMin('30d'), 20);
  assert.equal(D.duracaoRevisaoMin('reforço'), 20);
  assert.equal(D.duracaoRevisaoMin('xpto'), 15);
});

test('revisoesPendentesNoDia: só pendentes, do dia e com tópico válido', () => {
  const st = stateRevisoes();
  const r = D.revisoesPendentesNoDia(st, '2026-06-25');
  // r1 e r2 entram; r4 (feita), r5 (tópico inexistente) e r3 (outro dia) saem
  assert.deepEqual(r.map((x) => x.id).sort(), ['r1', 'r2']);
});

test('minutosRevisaoNoDia: soma as durações do dia', () => {
  const st = stateRevisoes();
  assert.equal(D.minutosRevisaoNoDia(st, '2026-06-25'), 10 + 20); // 24h + 30d
  assert.equal(D.minutosRevisaoNoDia(st, '2026-06-26'), 15);       // 7d
  assert.equal(D.minutosRevisaoNoDia(st, '2026-06-27'), 0);
});

test('revisões concluídas trocam a estimativa pelo tempo real registrado', () => {
  const st = stateRevisoes();
  const feita = st.revisoes.find((r) => r.id === 'r4');
  st.sessoes.push({
    id: 's-rev-r4', planoId: 'p1', revisaoId: 'r4', topicoId: 'D0-1',
    tipo: 'revisao', data: '2026-06-25', duracaoMin: 47, obs: 'Revisão 3d'
  });

  assert.equal(D.duracaoRevisaoConcluidaMin(st, feita), 47);
  assert.equal(D.minutosRevisoesConcluidasNoDia(st, '2026-06-25'), 47);

  feita.duracaoConcluidaMin = 52;
  feita.sessaoId = 's-rev-r4';
  assert.equal(D.duracaoRevisaoConcluidaMin(st, feita), 52);
  assert.equal(D.minutosRevisoesConcluidasNoDia(st, '2026-06-25'), 52);
});

test('revisão concluída antiga usa a estimativa quando não há sessão recuperável', () => {
  const st = stateRevisoes();
  st.sessoes.push({
    id: 's-outro-topico', planoId: 'p1', topicoId: 'D0-2', tipo: 'revisao',
    data: '2026-06-25', duracaoMin: 99, obs: 'Revisão 3d'
  });
  assert.equal(D.minutosRevisoesConcluidasNoDia(st, '2026-06-25'), 15);
  assert.equal(D.minutosRevisoesConcluidasNoDia(st, '2026-06-26'), 0);
});
