'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadDomain } = require('./helpers/load-domain');
const { loadStore } = require('./helpers/load-store');
const D = loadDomain();
const S = loadStore();
const appSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

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

test('carreira personalizada substitui o modelo-base e novas carreiras são acrescentadas', function () {
  const base = carregarCarreiras();
  const personalizadas = [
    Object.assign({}, base[0], { titulo: 'Minha versão TRF' }),
    {
      id: 'carreira-fiscal-manual',
      tipoCatalogo: 'carreira',
      titulo: 'Carreira Fiscal',
      disciplinas: []
    }
  ];
  const resultado = D.mesclarCatalogoCarreiras(base, personalizadas);

  assert.equal(resultado.length, 3);
  assert.equal(resultado[0].id, base[0].id);
  assert.equal(resultado[0].titulo, 'Minha versão TRF');
  assert.equal(resultado[0]._personalizada, true);
  assert.equal(resultado[1]._personalizada, false);
  assert.equal(resultado[2].id, 'carreira-fiscal-manual');
  assert.equal(base[0].titulo, 'Carreira TRF — Técnico Judiciário · Área Administrativa');
});

test('estado novo e migração preservam uma coleção própria para carreiras personalizadas', function () {
  const vazio = S.estadoVazio();
  assert.deepEqual(vazio.config.carreirasPersonalizadas, []);

  delete vazio.config.carreirasPersonalizadas;
  const migrado = S.normalizar(vazio);
  assert.deepEqual(migrado.config.carreirasPersonalizadas, []);
});

test('configurações publicam carreiras do administrador e mantêm carreiras pessoais dos alunos', function () {
  assert.match(appSource, /Catálogo da plataforma/);
  assert.match(appSource, /Catálogo pessoal/);
  assert.match(appSource, /if \(admin\) publicarCatalogoAdmin\(\{ toast: true \}\)/);
  assert.match(appSource, /state\.config\.carreirasPersonalizadas\.push\(registro\)/);
  assert.match(appSource, /tipoCatalogo: 'carreira'/);
});
