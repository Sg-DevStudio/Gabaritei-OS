'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

function carregarCarreiras() {
  const contexto = { window: {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'carreiras.js'), 'utf8'),
    contexto
  );
  return contexto.window.CATALOGO_CARREIRAS;
}

test('catálogo de carreiras oferece TRF e TRT para Técnico da Área Administrativa', function () {
  const carreiras = carregarCarreiras();

  assert.equal(carreiras.length, 2);
  assert.deepEqual(
    Array.from(carreiras, function (c) { return c.id; }).sort(),
    ['carreira-trf-tjaa', 'carreira-trt-tjaa']
  );
  carreiras.forEach(function (c) {
    assert.equal(c.tipoCatalogo, 'carreira');
    assert.match(c.cargo, /Técnico Judiciário/);
    assert.match(c.area, /Administrativa/);
    assert.match(c.foto, /^assets\/carreiras\/.+\.jpg$/);
    assert.ok(fs.statSync(path.join(__dirname, '..', c.foto)).size > 10000);
    assert.ok(c.metodologia.length > 80);
    assert.ok(c.baseEditais.length >= 4);
  });
});

test('disciplinas das carreiras têm prioridade relativa fechando em 100%', function () {
  const carreiras = carregarCarreiras();

  carreiras.forEach(function (carreira) {
    carreira.disciplinas.forEach(function (disciplina) {
      const soma = disciplina.topicos.reduce(function (n, t) { return n + t.incidencia_pct; }, 0);
      assert.equal(soma, 100, carreira.id + ' · ' + disciplina.nome);
    });
  });
});

test('planos de carreira cumprem o contrato de importação do domínio', function () {
  const carreiras = carregarCarreiras();

  carreiras.forEach(function (carreira) {
    const resultado = D.validarPlano({
      versao: 1,
      plano: {
        concurso: carreira.titulo,
        banca: carreira.banca,
        meta: { corte_pct: carreira.notaCorte }
      },
      disciplinas: carreira.disciplinas,
      cronograma: {}
    });
    assert.deepEqual(resultado.erros, [], carreira.id);
    assert.equal(resultado.ok, true, carreira.id);
  });
});
