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
