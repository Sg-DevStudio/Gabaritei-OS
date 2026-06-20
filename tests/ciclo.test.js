'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

function stateCiclo(nDiscs) {
  const disciplinas = [];
  for (let i = 0; i < nDiscs; i++) {
    disciplinas.push({
      id: 'D' + i, nome: 'Disciplina ' + i, peso: 1,
      topicos: [{ id: 'D' + i + '-t1', nome: 'Tópico 1', incidencia_pct: 50, status: 'pendente', horas_estimadas: 2 }],
    });
  }
  return { plano: { meta: { corte_pct: 70 }, ordemAtaque: 'incidencia' }, disciplinas, sessoes: [] };
}

test('sugerirCiclo: um bloco por disciplina (fora ORF), metaMin dentro de [min,max]', () => {
  const st = stateCiclo(3);
  st.disciplinas.push({ id: 'ORF', nome: 'Órfãos', topicos: [] }); // deve ser ignorada
  const blocos = D.sugerirCiclo(st, { minutosSemana: 600, minBloco: 30, maxBloco: 75 });
  assert.equal(blocos.length, 3, 'ORF não entra no ciclo');
  blocos.forEach((b) => {
    assert.ok(b.metaMin >= 30 && b.metaMin <= 75, 'metaMin dentro da faixa: ' + b.metaMin);
    assert.equal(b.feitoMin, 0);
    assert.ok(b.disciplinaId && b.id);
  });
});

test('sugerirCiclo: rampa de entrada escalona disciplinas (voltaInicio cresce)', () => {
  const blocos = D.sugerirCiclo(stateCiclo(10), { minutosSemana: 1200 });
  const voltas = blocos.map((b) => b.voltaInicio || 1);
  assert.ok(Math.max.apply(null, voltas) > 1, 'com 10 disciplinas algumas entram em voltas posteriores');
  // com <=4 disciplinas não escalona
  const poucas = D.sugerirCiclo(stateCiclo(4), { minutosSemana: 600 });
  assert.ok(poucas.every((b) => (b.voltaInicio || 1) === 1));
});

test('avancarCiclo: credita minutos, fecha bloco e avança a volta ao completar', () => {
  const ciclo = {
    volta: 1,
    blocos: [
      { id: 'b1', disciplinaId: 'D0', metaMin: 30, feitoMin: 0, voltaInicio: 1 },
      { id: 'b2', disciplinaId: 'D1', metaMin: 30, feitoMin: 0, voltaInicio: 1 },
    ],
  };
  const r1 = D.avancarCiclo(ciclo, 'D0', 30);
  assert.equal(r1.creditou, true);
  assert.equal(r1.completouBloco, true);
  assert.equal(r1.completouVolta, false);

  const r2 = D.avancarCiclo(ciclo, 'D1', 30);
  assert.equal(r2.completouVolta, true);
  assert.equal(ciclo.volta, 2);
  // ao fechar a volta, os blocos zeram para recomeçar
  assert.ok(ciclo.blocos.every((b) => b.feitoMin === 0));
});

test('avancarCiclo: estudar disciplina fora do ciclo não credita', () => {
  const ciclo = { volta: 1, blocos: [{ id: 'b1', disciplinaId: 'D0', metaMin: 30, feitoMin: 0, voltaInicio: 1 }] };
  const r = D.avancarCiclo(ciclo, 'INEXISTENTE', 30);
  assert.equal(r.creditou, false);
  assert.equal(ciclo.blocos[0].feitoMin, 0);
});

test('sugerirCiclo: tópico com bagagem ("já estudei") fica atrás do inédito', () => {
  const st = {
    plano: { meta: { corte_pct: 70 }, ordemAtaque: 'incidencia' },
    disciplinas: [{
      id: 'D0', nome: 'D', peso: 1, topicos: [
        { id: 'bag', nome: 'Já estudei', incidencia_pct: 90, status: 'pendente', horas_estimadas: 2, bagagem: 'estudei' },
        { id: 'novo', nome: 'Inédito', incidencia_pct: 10, status: 'pendente', horas_estimadas: 2 }
      ]
    }],
    sessoes: []
  };
  const blocos = D.sugerirCiclo(st, { minutosSemana: 600, minBloco: 30, maxBloco: 75 });
  assert.equal(blocos.length, 1);
  assert.equal(blocos[0].topicoId, 'novo', 'inédito vem antes mesmo com incidência menor que o de bagagem');
});
