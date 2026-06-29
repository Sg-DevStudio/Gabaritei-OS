'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

function edital(nome, disciplinas, extra) {
  return Object.assign({ titulo: nome, banca: 'FGV', notaCorte: 70, janelaProva: { inicio: '', fim: '' }, disciplinas }, extra || {});
}
function disc(nome, topicos) {
  return { nome, peso: 1, topicos: topicos.map(function (t) { return { nome: t[0], horas_estimadas: t[1], incidencia_pct: t[2] || 0, prioridade: t[3] || 2 }; }) };
}

test('conciliarPlanos: editais idênticos → 100% de sobreposição e compatibilidade alta', () => {
  const ed = edital('A', [disc('Direito Constitucional', [['Princípios fundamentais', 4, 30], ['Direitos e garantias', 3, 20]])]);
  const r = D.conciliarPlanos(ed, JSON.parse(JSON.stringify(ed)), { horasSemana: 20, hoje: '2026-06-19' });
  assert.equal(r.detalhes.overlapPct, 100);
  assert.equal(r.detalhes.topicosComuns, r.detalhes.totalA);
  assert.equal(r.detalhes.exclusivosA, 0);
  assert.equal(r.nivel, 'alta');
});

test('conciliarPlanos: editais disjuntos → 0% de sobreposição, nada em comum', () => {
  const a = edital('A', [disc('Matemática Financeira', [['Juros compostos', 4, 40]])]);
  const b = edital('B', [disc('Biologia Celular', [['Mitocôndria', 4, 40]])]);
  const r = D.conciliarPlanos(a, b, { horasSemana: 40, hoje: '2026-06-19' });
  assert.equal(r.detalhes.overlapPct, 0);
  assert.equal(r.detalhes.nDisciplinasComuns, 0);
  assert.equal(r.detalhes.exclusivosA, r.detalhes.totalA);
  assert.ok(['nao_recomendado', 'baixa', 'moderada', 'alta'].includes(r.nivel));
});

test('conciliarPlanos: prazo curto + carga acima da capacidade derruba o nível', () => {
  // edital grande, prova logo, poucas horas → não recomendado
  const tops = Array.from({ length: 20 }, (_, i) => ['Tópico ' + i, 5, 10]);
  const a = edital('A', [disc('Disciplina Alfa', tops)], { janelaProva: { inicio: '2026-07', fim: '2026-07' } });
  const b = edital('B', [disc('Disciplina Beta', tops.map((t) => ['Outro ' + t[0], 5, 10]))], { janelaProva: { inicio: '2026-07', fim: '2026-07' } });
  const r = D.conciliarPlanos(a, b, { horasSemana: 5, hoje: '2026-06-19' });
  assert.ok(r.ratio > 1.45, 'ratio deveria indicar carga acima da capacidade');
  assert.equal(r.nivel, 'nao_recomendado');
});

test('combinarEditais: dedup por nome, pega maior incidência/horas e menor prioridade', () => {
  const a = edital('Concurso A', [disc('Direito Constitucional', [['Princípios fundamentais', 3, 30, 1]])]);
  const b = edital('Concurso B', [
    disc('Direito Constitucional', [['Princípios fundamentais', 5, 50, 2]]),
    disc('Português', [['Crase', 2, 20, 3]]),
  ], { notaCorte: 80, banca: 'Cebraspe' });

  const comb = D.combinarEditais(a, b);
  assert.equal(comb.disciplinas.length, 2, 'disciplina repetida é unificada');
  const dc = comb.disciplinas.find((d) => /Constitucional/.test(d.nome));
  assert.equal(dc.topicos.length, 1, 'tópico repetido é unificado');
  assert.equal(dc.topicos[0].incidencia_pct, 50); // maior incidência
  assert.equal(dc.topicos[0].horas_estimadas, 5); // maior horas
  assert.equal(dc.topicos[0].prioridade, 1);      // menor (mais alta) prioridade
  // meta = a mais exigente (max): pronto p/ os dois
  assert.equal(comb.notaCorte, 80);
  assert.match(comb.banca, /FGV/);
  assert.match(comb.banca, /Cebraspe/);
});

test('combinarEditais: expõe rótulos de origem e prova de cada edital', () => {
  const a = edital('Alfa', [disc('Português', [['Crase', 2, 20]])]);
  const b = edital('Beta', [disc('Matemática', [['Juros', 2, 20]])], { janelaProva: { inicio: '2026-09', fim: '' } });
  const comb = D.combinarEditais(a, b);
  assert.equal(comb.rotulos.a, 'Alfa');
  assert.equal(comb.rotulos.b, 'Beta');
  assert.equal(comb.rotulos.provaB, '2026-09');
});

test('fatorEnfase: sem ênfase mantém o peso (fator 1)', () => {
  assert.equal(D.fatorEnfase(null, { origem: 'Alfa' }, '2026-06-19'), 1);
});

test('fatorEnfase: só a disciplina EXCLUSIVA do secundário perde peso', () => {
  const enf = { principal: 'Alfa', secundario: 'Beta', split: 0.7, provaSecundario: '2026-12' };
  assert.equal(D.fatorEnfase(enf, { origem: 'Beta' }, '2026-06-19'), 0.43); // (1-0.7)/0.7
  assert.equal(D.fatorEnfase(enf, { origem: 'Alfa' }, '2026-06-19'), 1);        // principal cheio
  assert.equal(D.fatorEnfase(enf, { origem: 'Alfa + Beta' }, '2026-06-19'), 1); // comum cheio
});

test('fatorEnfase: após a prova do secundário, foco volta ao principal', () => {
  const enf = { principal: 'Alfa', secundario: 'Beta', split: 0.7, provaSecundario: '2026-07' };
  assert.equal(D.fatorEnfase(enf, { origem: 'Beta' }, '2026-09-01'), 0.12);
});
