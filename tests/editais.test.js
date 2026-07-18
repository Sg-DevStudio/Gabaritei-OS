'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

function edital(nome, disciplinas, extra) {
  return Object.assign({ titulo: nome, banca: 'FGV', notaCorte: 70, janelaProva: { inicio: '', fim: '' }, disciplinas }, extra || {});
}
function disc(nome, topicos) {
  return { nome, peso: 1, topicos: topicos.map(function (t) { return { nome: t[0], horas_estimadas: t[1], incidencia_pct: t[2] || 0, prioridade: t[3] || 2 }; }) };
}

test('editais encerrados não anunciam uma janela de prova no passado', () => {
  const pasta = path.join(__dirname, '..', 'data');
  const mesAtual = new Date().toISOString().slice(0, 7);
  const invalidos = fs.readdirSync(pasta)
    .filter(function (nome) { return nome.startsWith('edital-') && nome.endsWith('.json'); })
    .filter(function (nome) {
      const edital = JSON.parse(fs.readFileSync(path.join(pasta, nome), 'utf8'));
      const inicio = edital.janela_prova && edital.janela_prova.inicio;
      return inicio && inicio < mesAtual;
    });
  assert.deepEqual(invalidos, []);
});

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

test('conciliarPlanos: muito conteúdo em comum (≥45%) não cai abaixo de "moderada" mesmo com carga apertada', () => {
  const comuns = Array.from({ length: 10 }, (_, i) => ['Comum ' + i, 6, 20]);
  const a = edital('A', [disc('Direito', comuns.concat([['ExA1', 6, 20], ['ExA2', 6, 20], ['ExA3', 6, 20]]))], { janelaProva: { inicio: '2026-09', fim: '' } });
  const b = edital('B', [disc('Direito', comuns.concat([['ExB1', 6, 20], ['ExB2', 6, 20], ['ExB3', 6, 20]]))], { janelaProva: { inicio: '2026-09', fim: '' } });
  const r = D.conciliarPlanos(a, b, { horasSemana: 5, hoje: '2026-06-19' });
  assert.ok(r.detalhes.overlapPct >= 45, 'sobreposição deveria ser alta, veio ' + r.detalhes.overlapPct);
  assert.ok(['moderada', 'alta'].includes(r.nivel), 'nível não deveria cair abaixo de moderada, veio ' + r.nivel);
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

test('fatorDisciplinaCombinada: concurso com prova passada esmaece mesmo SEM ênfase', () => {
  const plano = { combinado: { rotulos: { a: 'Alfa', b: 'Beta', provaA: '2026-07', provaB: '2026-12' } } };
  // prova de Alfa (jul) já passou em set → exclusiva de Alfa cai; Beta segue cheia
  assert.equal(D.fatorDisciplinaCombinada(plano, { origem: 'Alfa' }, '2026-09-01'), 0.12);
  assert.equal(D.fatorDisciplinaCombinada(plano, { origem: 'Beta' }, '2026-09-01'), 1);
  assert.equal(D.fatorDisciplinaCombinada(plano, { origem: 'Alfa + Beta' }, '2026-09-01'), 1); // comum segue cheio
  // antes de qualquer prova: tudo cheio
  assert.equal(D.fatorDisciplinaCombinada(plano, { origem: 'Alfa' }, '2026-06-01'), 1);
  // sem plano combinado: nunca interfere
  assert.equal(D.fatorDisciplinaCombinada({}, { origem: 'Alfa' }, '2026-09-01'), 1);
});

test('fatorDisciplinaCombinada: concurso ENCERRADO pelo aluno sai do peso (foco no outro)', () => {
  const plano = { combinado: { rotulos: { a: 'Alfa', b: 'Beta', provaA: '2026-12', provaB: '2027-03' }, encerrados: ['Alfa'] } };
  // mesmo antes da prova, Alfa foi encerrado → quase zero; Beta e comum seguem
  assert.equal(D.fatorDisciplinaCombinada(plano, { origem: 'Alfa' }, '2026-06-01'), 0.04);
  assert.equal(D.fatorDisciplinaCombinada(plano, { origem: 'Beta' }, '2026-06-01'), 1);
  assert.equal(D.fatorDisciplinaCombinada(plano, { origem: 'Alfa + Beta' }, '2026-06-01'), 1);
});
