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

function carregarEditaisBase() {
  const contexto = { window: {} };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '..', 'data', 'catalogo-editais.js'), 'utf8'),
    contexto
  );
  return contexto.window.CATALOGO_EDITAIS_BASE;
}

test('catálogo de carreiras continua restrito a TRF e TRT', function () {
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
    assert.match(c.foto, /^assets\/carreiras\/.+\.jpg\?v=\d{8}-[a-z0-9-]+$/);
    assert.ok(fs.statSync(path.join(__dirname, '..', c.foto.split('?')[0])).size > 10000);
    assert.ok(c.fotoAlt.length > 20);
    assert.match(c.fotoCredito, /Wikimedia Commons/);
    assert.match(c.fotoFonte, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    assert.ok(c.metodologia.length > 80);
    assert.ok(c.baseEditais.length >= 4);
  });
});

test('plano do INSS preserva a amostra oficial e a sequência pedagógica', function () {
  const inss = carregarEditaisBase().find(function (e) { return e.id === 'edital-inss-tecnico-2022'; });
  const topicos = inss.disciplinas.reduce(function (todos, d) { return todos.concat(d.topicos); }, []);

  assert.equal(inss.tipo, 'edital_esquematizado');
  assert.notEqual(inss.tipoCatalogo, 'carreira');
  assert.equal(inss.disciplinas.length, 8);
  assert.equal(topicos.length, 57);
  assert.match(inss.fonte, /240 itens/);
  assert.equal(inss.metaDesempenho, true);
  assert.match(inss.foto, /\.png$/);
  assert.equal(inss.disciplinas.find(function (d) { return d.id === 'PRE'; }).peso, 5);
  assert.equal(inss.disciplinas.find(function (d) { return d.id === 'BEN'; }).peso, 5);
  topicos.forEach(function (t) {
    assert.ok(Number.isInteger(t.semana_sugerida) && t.semana_sugerida > 0, t.id);
  });
  inss.disciplinas.forEach(function (disciplina) {
    const soma = disciplina.topicos.reduce(function (n, t) { return n + t.incidencia_pct; }, 0);
    assert.equal(soma, 100, disciplina.nome);
  });

  const resultado = D.validarPlano({
    versao: 1,
    plano: { concurso: inss.titulo, banca: inss.banca, meta: { corte_pct: inss.notaCorte } },
    disciplinas: inss.disciplinas,
    cronograma: {}
  });
  assert.equal(resultado.ok, true);
  assert.deepEqual(resultado.erros, []);
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
  const trf = base.find(function (c) { return c.id === 'carreira-trf-tjaa'; });
  const personalizadas = [
    Object.assign({}, trf, { titulo: 'Minha versão TRF' }),
    {
      id: 'carreira-fiscal-manual',
      tipoCatalogo: 'carreira',
      titulo: 'Carreira Fiscal',
      disciplinas: []
    }
  ];
  const resultado = D.mesclarCatalogoCarreiras(base, personalizadas);

  assert.equal(resultado.length, 3);
  const trfMesclado = resultado.find(function (c) { return c.id === trf.id; });
  assert.equal(trfMesclado.titulo, 'Minha versão TRF');
  assert.equal(trfMesclado._personalizada, true);
  assert.equal(resultado.find(function (c) { return c.id === 'carreira-fiscal-manual'; }).id, 'carreira-fiscal-manual');
  assert.equal(trf.titulo, 'Carreira TRF — Técnico Judiciário · Área Administrativa');
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
  assert.match(appSource, /class="ed-t-sem"/);
  assert.match(appSource, /semana_sugerida =/);
  assert.match(appSource, /catalogoEditaisBase/);
  assert.match(appSource, /baseObj\._global \|\| baseObj\._base/);
  assert.match(appSource, /fotoCreditoHtml\(e\)/);
});
