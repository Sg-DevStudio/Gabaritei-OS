'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

test('agendarRevisoes gera a curva 1-3-7-14-30', () => {
  const revs = D.agendarRevisoes('t1', '2026-06-01');
  assert.deepEqual(revs.map((r) => r.tipo), ['24h', '3d', '7d', '14d', '30d']);
  assert.equal(revs[0].dataAgendada, '2026-06-02');
  assert.equal(revs[4].dataAgendada, '2026-07-01');
  assert.ok(revs.every((r) => r.dataConcluida === null && r.resultadoPct === null));
});

test('ajustePosRevisao: dominado exige amostra mínima (bug G)', () => {
  assert.equal(D.ajustePosRevisao({ tipo: '30d' }, 100, 1).dominar, false);
  assert.equal(D.ajustePosRevisao({ tipo: '30d' }, 100, 5).dominar, true);
  assert.equal(D.ajustePosRevisao({ tipo: '30d' }, 90, 4).dominar, false);
  // só a ponta da curva domina (30d ou manutenção), nunca 14d
  assert.equal(D.ajustePosRevisao({ tipo: '14d' }, 100, 20).dominar, false);
  // retrocompat: sem qFeitas mantém o critério antigo
  assert.equal(D.ajustePosRevisao({ tipo: '30d' }, 100).dominar, true);
});

test('ajustePosRevisao: faixas de reabertura/reforço', () => {
  const baixo = D.ajustePosRevisao({ tipo: '7d' }, 40, 10);
  assert.equal(baixo.reabrir, true);
  assert.equal(baixo.revisaoExtraDias, 2);
  const medio = D.ajustePosRevisao({ tipo: '7d' }, 60, 10);
  assert.equal(medio.reabrir, false); // <70 só reabre na 30d
  assert.equal(medio.revisaoExtraDias, 3);
  assert.equal(D.ajustePosRevisao({ tipo: '30d' }, 60, 10).reabrir, true);
});

test('ajustePosRevisao: manutenção pós-curva (bug C)', () => {
  // ≥70% na 30d agenda manutenção +30d sem reabrir
  const c1 = D.ajustePosRevisao({ tipo: '30d' }, 75, 10);
  assert.equal(c1.manutencaoDias, 30);
  assert.equal(c1.reabrir, false);
  // ≥85% domina E agenda manutenção
  const c2 = D.ajustePosRevisao({ tipo: '30d' }, 95, 10);
  assert.equal(c2.dominar, true);
  assert.equal(c2.manutencaoDias, 30);
  // manutenção concluída agenda a próxima (recorrência)
  assert.equal(D.ajustePosRevisao({ tipo: 'manutenção' }, 80, 10).manutencaoDias, 30);
  // manutenção <50% reabre e não reagenda
  const c4 = D.ajustePosRevisao({ tipo: 'manutenção' }, 40, 10);
  assert.equal(c4.reabrir, true);
  assert.equal(c4.manutencaoDias, null);
  // 14d nunca agenda manutenção
  assert.equal(D.ajustePosRevisao({ tipo: '14d' }, 90, 10).manutencaoDias, null);
});

test('revisaoManutencao monta tipo/data/id corretos', () => {
  const rm = D.revisaoManutencao('t1', '2026-06-19', 30);
  assert.equal(rm.tipo, 'manutenção');
  assert.equal(rm.dataAgendada, '2026-07-19');
  assert.match(rm.id, /-manut-/);
  assert.equal(rm.dataConcluida, null);
});

test('revisaoReabreTopico: só 30d com <70%', () => {
  assert.equal(D.revisaoReabreTopico({ tipo: '30d' }, 60), true);
  assert.equal(D.revisaoReabreTopico({ tipo: '30d' }, 70), false);
  assert.equal(D.revisaoReabreTopico({ tipo: '7d' }, 10), false);
});

// ---------- Ponderação por incidência (erro × incidência) ----------
const revFeita = (topicoId, tipo, data, pct) =>
  ({ topicoId, tipo, dataConcluida: data, resultadoPct: pct });

test('moduladorIncidencia: rampa 0,5..1 (≥50% efeito cheio)', () => {
  assert.equal(D.moduladorIncidencia(50), 1);
  assert.equal(D.moduladorIncidencia(90), 1);   // satura
  assert.equal(D.moduladorIncidencia(0), 0.5);  // piso
  assert.equal(D.moduladorIncidencia(25), 0.75); // meio termo linear
  assert.equal(D.moduladorIncidencia(null), 1);  // sem dado → cheio (retrocompat)
});

test('espaçamento: erro alto aproxima menos quando a incidência é baixa', () => {
  const revs = [revFeita('t1', '7d', '2026-06-01', 40)]; // foi mal
  const altaInc = D.fatorEspacamentoRevisao(revs, 't1', null, 90);
  const baixaInc = D.fatorEspacamentoRevisao(revs, 't1', null, 5);
  const semInc = D.fatorEspacamentoRevisao(revs, 't1', null);
  assert.ok(altaInc < 1, 'erro alto encurta (fator < 1)');
  assert.ok(baixaInc < 1, 'baixa incidência ainda encurta, não inverte');
  assert.ok(baixaInc > altaInc, 'baixa incidência encurta MENOS que alta');
  assert.equal(semInc, altaInc, 'sem param == efeito cheio (inc≥50)');
});

test('espaçamento: acerto alto espaça menos quando a incidência é baixa', () => {
  const revs = [revFeita('t1', '7d', '2026-06-01', 95)]; // foi bem
  const altaInc = D.fatorEspacamentoRevisao(revs, 't1', null, 90);
  const baixaInc = D.fatorEspacamentoRevisao(revs, 't1', null, 5);
  assert.ok(altaInc > 1, 'acerto alto espaça (fator > 1)');
  assert.ok(baixaInc > 1 && baixaInc < altaInc, 'baixa incidência espaça MENOS, sem inverter');
});

test('espaçamento: caso médio (incidência ~25%, erro ~60%) fica entre os extremos', () => {
  const revs = [revFeita('t1', '7d', '2026-06-01', 60)]; // vacilando
  const alta = D.fatorEspacamentoRevisao(revs, 't1', null, 90);
  const media = D.fatorEspacamentoRevisao(revs, 't1', null, 25);
  const baixa = D.fatorEspacamentoRevisao(revs, 't1', null, 0);
  assert.ok(alta < media && media < baixa, 'interpolação monotônica, sem salto');
  assert.ok(baixa < 1, 'ainda aproxima');
});

test('reforço: baixa incidência adia o reforço (sem cancelar)', () => {
  // <50% → base 2 dias; k=1 (inc≥50) mantém 2, k=0,5 (inc 0) dobra p/ 4
  assert.equal(D.ajustePosRevisao({ tipo: '7d' }, 40, 10, 90).revisaoExtraDias, 2);
  assert.equal(D.ajustePosRevisao({ tipo: '7d' }, 40, 10, 0).revisaoExtraDias, 4);
  // <70% → base 3 dias; inc 0 → 6
  assert.equal(D.ajustePosRevisao({ tipo: '7d' }, 60, 10, 90).revisaoExtraDias, 3);
  assert.equal(D.ajustePosRevisao({ tipo: '7d' }, 60, 10, 0).revisaoExtraDias, 6);
  // retrocompat: sem incidência == efeito cheio
  assert.equal(D.ajustePosRevisao({ tipo: '7d' }, 40, 10).revisaoExtraDias, 2);
});

test('agendarRevisoes: pular24h gera curva retroativa 3-7-14-30 (sem 24h)', () => {
  const completa = D.agendarRevisoes('t1', '2026-06-20');
  assert.deepEqual(completa.map(r => r.tipo), ['24h', '3d', '7d', '14d', '30d']);
  const retro = D.agendarRevisoes('t1', '2026-06-20', { pular24h: true });
  assert.deepEqual(retro.map(r => r.tipo), ['3d', '7d', '14d', '30d']);
  assert.equal(retro[0].dataAgendada, '2026-06-23'); // base + 3 dias
});

test('agendarRevisoes: esquema personalizado usa os dias informados, ordenados', () => {
  const revs = D.agendarRevisoes('t1', '2026-06-01', { intervalos: [7, 1, 30, 15, 60] });
  assert.deepEqual(revs.map(r => r.tipo), ['1d', '7d', '15d', '30d', '60d']);
  assert.equal(revs[0].dataAgendada, '2026-06-02'); // +1
  assert.equal(revs[4].dataAgendada, '2026-07-31'); // +60
  // o último ponto fecha a curva (herda dominar/manutenção do 30d padrão)
  assert.equal(revs[4].pontaCurva, true);
  assert.ok(!revs[0].pontaCurva);
});

test('esquema personalizado: última etapa domina/mantém como a ponta da curva', () => {
  const ponta = D.agendarRevisoes('t1', '2026-06-01', { intervalos: [1, 60] })[1];
  assert.equal(D.ajustePosRevisao(ponta, 90, 10).dominar, true);
  assert.equal(D.ajustePosRevisao(ponta, 75, 10).manutencaoDias, 30);
  assert.equal(D.revisaoReabreTopico(ponta, 60), true);
});

test('validarEsquemaRevisao: bloqueia absurdos e normaliza', () => {
  // menos de 2 pontos válidos
  assert.equal(D.validarEsquemaRevisao([7]).ok, false);
  assert.equal(D.validarEsquemaRevisao(['abc', -3, 0]).ok, false);
  // valores irreais (> ~3 anos)
  const irreal = D.validarEsquemaRevisao([1, 5000]);
  assert.equal(irreal.ok, false);
  assert.match(irreal.erros[0], /irrea/i);
  // pontos demais (>8)
  assert.equal(D.validarEsquemaRevisao([1, 2, 3, 4, 5, 6, 7, 8, 9]).ok, false);
  // válido: normaliza (trunca, remove duplicatas, ordena)
  const ok = D.validarEsquemaRevisao([30, 7, 7, 1.9]);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.dias, [1, 7, 30]);
});

test('validarEsquemaRevisao: avisa espaçamentos curtos/longos sem bloquear', () => {
  // 1ª revisão muito tarde + salto grande
  const tarde = D.validarEsquemaRevisao([15, 90]);
  assert.equal(tarde.ok, true);
  assert.ok(tarde.avisos.some(function (a) { return /1ª revisão/.test(a); }));
  assert.ok(tarde.avisos.some(function (a) { return /Salto grande/.test(a); }));
  // revisões coladas
  const coladas = D.validarEsquemaRevisao([1, 2, 30]);
  assert.ok(coladas.avisos.some(function (a) { return /muito próximas/.test(a); }));
  // última além da prova
  const posProva = D.validarEsquemaRevisao([1, 7, 60], { diasAteProva: 20 });
  assert.ok(posProva.avisos.some(function (a) { return /depois da sua prova/.test(a); }));
  // esquema saudável: sem avisos
  assert.deepEqual(D.validarEsquemaRevisao([1, 3, 7, 14, 30]).avisos, []);
});

test('intervalosRevisaoConfig: null no padrão, lista ordenada no custom', () => {
  assert.equal(D.intervalosRevisaoConfig({ config: {} }), null);
  assert.equal(D.intervalosRevisaoConfig({ config: { revisaoEsquema: { modo: 'padrao' } } }), null);
  assert.deepEqual(
    D.intervalosRevisaoConfig({ config: { revisaoEsquema: { modo: 'custom', dias: [30, 1, 7] } } }),
    [1, 7, 30]
  );
});

test('prontidaoProva inclui tópicos ainda não estudados no denominador', () => {
  const state = {
    planoAtivoId: 'p1',
    plano: { radar: { janela_prova: ['2026-09', '2026-09'] } },
    disciplinas: [{
      id: 'D1',
      topicos: [
        { id: 't-revisao', status: 'teoria_concluida' },
        { id: 't-pendente', status: 'pendente' }
      ]
    }],
    revisoes: [{
      id: 'r1', planoId: 'p1', topicoId: 't-revisao',
      dataAgendada: '2026-08-10', dataConcluida: null
    }]
  };

  const resultado = D.prontidaoProva(state, '2026-07-18');
  assert.equal(resultado.totalTopicos, 2);
  assert.equal(resultado.prontos, 1);
  assert.equal(resultado.emRisco, 1);
  assert.equal(resultado.semRevisao, 1);
  assert.equal(resultado.pct, 50);
});

test('prontidaoProva considera pronto tópico dominado sem revisão pendente', () => {
  const state = {
    planoAtivoId: 'p1',
    plano: { radar: { janela_prova: ['2026-09', '2026-09'] } },
    disciplinas: [{ id: 'D1', topicos: [{ id: 't1', status: 'dominado' }] }],
    revisoes: []
  };

  const resultado = D.prontidaoProva(state, '2026-07-18');
  assert.equal(resultado.totalTopicos, 1);
  assert.equal(resultado.prontos, 1);
  assert.equal(resultado.emRisco, 0);
  assert.equal(resultado.pct, 100);
});
