'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

function baseState() {
  return { plano: null, disciplinas: [], config: {}, sessoes: [], revisoes: [], simulados: [], agenda: [], flashcards: [] };
}

test('mesclarPlano normaliza gerado_em com timestamp para AAAA-MM-DD (bug D)', () => {
  const json = {
    versao: 1,
    plano: { concurso: 'x', banca: '', meta: { corte_pct: 70 }, radar: null, ritmos: { ativo: 'sustentavel' } },
    gerado_em: '2026-06-01T10:30:00Z',
    disciplinas: [],
    cronograma: {},
  };
  const imp = D.mesclarPlano(baseState(), json);
  assert.equal(imp.plano.gerado_em, '2026-06-01');
});

test('mesclarPlano: gerado_em ausente/null vira null', () => {
  const json = { versao: 1, plano: { concurso: 'x', meta: { corte_pct: 70 }, ritmos: { ativo: 'sustentavel' } }, disciplinas: [], cronograma: {} };
  const imp = D.mesclarPlano(baseState(), json);
  assert.equal(imp.plano.gerado_em, null);
});

test('burndownEdital não produz NaN com gerado_em normalizado', () => {
  const json = {
    versao: 1,
    plano: { concurso: 'x', meta: { corte_pct: 70 }, radar: null, ritmos: { ativo: 'sustentavel', sustentavel: { semanas: 24, meses: 6, h_semana: 20 } } },
    gerado_em: '2026-06-01T10:30:00Z',
    disciplinas: [],
    cronograma: {},
  };
  const imp = D.mesclarPlano(baseState(), json);
  const st = { plano: imp.plano, disciplinas: [], cronogramas: imp.cronogramas, sessoes: [], revisoes: [] };
  const bd = D.burndownEdital(st, '2026-06-19');
  assert.ok(bd, 'burndown deveria retornar objeto');
  assert.equal(Number.isNaN(bd.pctConcluido), false);
});

test('validarPlano: aceita plano mínimo válido e recusa inválido', () => {
  const ok = D.validarPlano({ versao: 1, plano: { concurso: 'C', meta: { corte_pct: 70 } }, disciplinas: [{ id: 'D1', nome: 'Disc', topicos: [{ id: 't1', nome: 'T', incidencia_pct: 10 }] }] });
  assert.equal(ok.ok, true);
  const bad = D.validarPlano({ versao: 2, disciplinas: [] });
  assert.equal(bad.ok, false);
  assert.ok(bad.erros.length > 0);
});

test('validarPlano: rejeita percentuais, horas, dificuldade e ids de disciplina inválidos', () => {
  const resultado = D.validarPlano({
    versao: 1,
    plano: { concurso: 'C', meta: { corte_pct: 250 } },
    disciplinas: [
      {
        id: 'DUP',
        nome: 'Disciplina A',
        peso: -1,
        dificuldade: 'impossivel',
        topicos: [{ id: 'T1', nome: 'Tópico A', incidencia_pct: -10, horas_estimadas: -2, prioridade: 7 }]
      },
      {
        id: 'DUP',
        nome: 'Disciplina B',
        topicos: [{ id: 'T2', nome: 'Tópico B', incidencia_pct: 150 }]
      }
    ]
  });

  assert.equal(resultado.ok, false);
  assert.ok(resultado.erros.some(function (e) { return e.includes('corte_pct') && e.includes('0 e 100'); }));
  assert.ok(resultado.erros.some(function (e) { return e.includes('id duplicado: DUP'); }));
  assert.ok(resultado.erros.some(function (e) { return e.includes('peso'); }));
  assert.ok(resultado.erros.some(function (e) { return e.includes('dificuldade'); }));
  assert.ok(resultado.erros.some(function (e) { return e.includes('incidencia_pct'); }));
  assert.ok(resultado.erros.some(function (e) { return e.includes('horas_estimadas'); }));
  assert.ok(resultado.erros.some(function (e) { return e.includes('prioridade'); }));
});

test('validarPlano: rejeita simulados inconsistentes', () => {
  const resultado = D.validarPlano({
    versao: 1,
    plano: { concurso: 'C', meta: { corte_pct: 70 } },
    disciplinas: [{ id: 'D1', nome: 'Disciplina', topicos: [{ id: 'T1', nome: 'Tópico', incidencia_pct: 50 }] }],
    simulados: [{
      id: 'S1',
      data: '17/07/2026',
      acertos: [
        { disciplinaId: 'D1', certas: 20, total: 10 },
        { disciplinaId: 'D2', certas: -1, total: 0 }
      ]
    }]
  });

  assert.equal(resultado.ok, false);
  assert.ok(resultado.erros.some(function (e) { return e.includes('.data deve usar o formato'); }));
  assert.ok(resultado.erros.some(function (e) { return e.includes('.certas não pode ser maior'); }));
  assert.ok(resultado.erros.some(function (e) { return e.includes('não existe em disciplinas: D2'); }));
  assert.ok(resultado.erros.some(function (e) { return e.includes('.total deve ser um inteiro maior'); }));
});

test('validarPlano: cronograma com tipo inválido retorna erro sem lançar exceção', () => {
  const entrada = {
    versao: 1,
    plano: { concurso: 'C', meta: { corte_pct: 70 } },
    disciplinas: [{ id: 'D1', nome: 'Disciplina', topicos: [{ id: 'T1', nome: 'Tópico', incidencia_pct: 50 }] }],
    cronograma: { sustentavel: { semana: 1 }, hardcore: 'inválido' }
  };

  assert.doesNotThrow(function () { D.validarPlano(entrada); });
  const resultado = D.validarPlano(entrada);
  assert.equal(resultado.ok, false);
  assert.ok(resultado.erros.some(function (e) { return e.includes('cronograma.sustentavel') && e.includes('lista'); }));
  assert.ok(resultado.erros.some(function (e) { return e.includes('cronograma.hardcore') && e.includes('lista'); }));
});

test('validarPlano rejeita cor de disciplina que poderia injetar CSS', () => {
  const resultado = D.validarPlano({
    versao: 1,
    plano: { concurso: 'C', meta: { corte_pct: 70 } },
    disciplinas: [{
      id: 'D1', nome: 'Disciplina', cor: 'red;position:fixed',
      topicos: [{ id: 'T1', nome: 'Tópico', incidencia_pct: 50 }]
    }]
  });

  assert.equal(resultado.ok, false);
  assert.ok(resultado.erros.some(function (e) { return e.includes('.cor') && e.includes('#RRGGBB'); }));
});

test('todos os JSONs de plano distribuídos em data/ cumprem o contrato de importação', () => {
  const pasta = path.join(__dirname, '..', 'data');
  const arquivos = fs.readdirSync(pasta).filter(function (nome) { return nome.endsWith('.json'); });
  const invalidos = [];
  let planosValidados = 0;

  arquivos.forEach(function (nome) {
    const json = JSON.parse(fs.readFileSync(path.join(pasta, nome), 'utf8'));
    // Os arquivos edital-*.json usam o contrato do catálogo verticalizado,
    // diferente do contrato v1 de importação de planos.
    if (!json.plano) return;
    planosValidados++;
    const resultado = D.validarPlano(json);
    if (!resultado.ok) invalidos.push({ nome: nome, erros: resultado.erros });
  });

  assert.ok(planosValidados > 0);
  assert.deepEqual(invalidos, []);
});
test('burndownEdital respeita bagagem na conclusao estimada', () => {
  const st = {
    plano: { gerado_em: '2026-06-01', ritmos: { ativo: 'sustentavel', sustentavel: { semanas: 12, meses: 3, h_semana: 9 } } },
    disciplinas: [{
      id: 'D1',
      topicos: [
        { id: 'novo', horas_estimadas: 10, status: 'pendente' },
        { id: 'bag', horas_estimadas: 10, status: 'pendente', bagagem: 'estudei' }
      ]
    }],
    sessoes: []
  };
  const bd = D.burndownEdital(st, '2026-06-01');

  assert.equal(D.totalHorasTeoria(st.disciplinas), 20);
  assert.equal(D.totalHorasTeoriaAjustada(st.disciplinas), 15);
  assert.equal(bd.restante, 27);
  assert.equal(bd.semanasParaConcluir, 3);
});
