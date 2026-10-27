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

test('catálogo de carreiras inclui apenas as trilhas multiconcurso TRF e TRT', function () {
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
    assert.ok(fs.statSync(path.join(__dirname, '..', c.foto.split('?')[0])).size > 1000);
    assert.ok(c.fotoAlt.length > 20);
    assert.ok(c.metodologia.length > 80);
    assert.match(c.foto, /^assets\/carreiras\/.+\.jpg\?v=\d{8}-[a-z0-9-]+$/);
    assert.match(c.fotoCredito, /Wikimedia Commons/);
    assert.match(c.fotoFonte, /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
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

  assert.equal(resultado.length, base.length + 1);
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


test('TRF2 é um plano específico completo, com logo e meta de estudo preservados', function () {
  const trf2 = carregarEditaisBase().find(function (e) { return e.id === 'carreira-trf2-tjaa-2024'; });
  assert.ok(trf2);
  assert.equal(trf2.tipoCatalogo, 'concurso');
  assert.equal(carregarCarreiras().some(function (e) { return e.id === trf2.id; }), false);
  assert.equal(trf2.disciplinas.length, 13);
  assert.equal(trf2.disciplinas.reduce(function (n, d) { return n + d.topicos.length; }, 0), 121);
  assert.match(trf2.foto, /^assets\/carreiras\/.+\.svg$/);
  assert.ok(fs.statSync(path.join(__dirname, '..', trf2.foto)).size > 1000);
  assert.match(trf2.fotoAlt, /TRF2/);
  assert.equal(trf2.metaDesempenho, true);
  assert.equal(trf2.janelaProva.inicio, '');
  assert.equal(trf2.janelaProva.fim, '');
  assert.equal(D.validarPlano({ versao: 1, plano: { concurso: trf2.titulo, meta: { corte_pct: trf2.notaCorte } }, disciplinas: trf2.disciplinas }).ok, true);
  trf2.disciplinas.forEach(function (d) {
    assert.equal(d.topicos.reduce(function (n, t) { return n + t.incidencia_pct; }, 0), 100, d.nome);
  });
});

test('cópias antigas do TRF2 e da UFRJ entram em Concursos sem duplicar nem perder conteúdo', function () {
  const carreiras = carregarCarreiras().map(function (e) { return Object.assign({}, e, { cortes: { ampla: e.notaCorte, negros: null, pcd: null }, janelaProva: { inicio: '', fim: '' } }); });
  const editais = carregarEditaisBase();
  const trf2 = JSON.parse(JSON.stringify(editais.find(function (e) { return e.id === 'carreira-trf2-tjaa-2024'; })));
  trf2.tipoCatalogo = 'carreira';
  const ufrj = {
    id: 'carreira-mvpqta7j-nt9g8', tipoCatalogo: 'carreira',
    titulo: 'Analista em Educação — Gestão Pública (base UFRJ)',
    foto: 'data:image/jpeg;base64,logo-ufrj',
    notaCorte: 85, cortes: { ampla: 85, negros: null, pcd: null },
    janelaProva: { inicio: '', fim: '' },
    disciplinas: [{ id: 'ADM', nome: 'Administração', topicos: [{ id: 'ADM-01', nome: 'Planejamento' }] }]
  };
  const antes = JSON.stringify([trf2, ufrj]);
  const contexto = {
    window: { Store: S }, D: D,
    state: { editais: [trf2, ufrj], config: { carreirasPersonalizadas: [] } },
    catalogoEditaisBase: editais, catalogoCarreirasBase: carreiras,
    catalogoGlobalEditais: [ufrj], usuarioAdmin: function () { return true; }
  };
  vm.runInNewContext(appSource.slice(appSource.indexOf('  function clonarJson('), appSource.indexOf('  function calculadoraDoEdital(')), contexto);
  const resultado = contexto.editaisDoCatalogo();
  [trf2, ufrj].forEach(function (original) {
    const encontrados = resultado.filter(function (e) { return e.id === original.id; });
    assert.equal(encontrados.length, 1);
    const corrigido = encontrados[0];
    assert.equal(corrigido.tipoCatalogo, 'concurso');
    assert.equal(contexto.ehItemCarreira(corrigido), false);
    assert.equal(corrigido.metaDesempenho, true);
    assert.equal(corrigido.foto, original.foto);
    assert.equal(corrigido.titulo, original.titulo);
    assert.equal(JSON.stringify(corrigido.disciplinas), JSON.stringify(original.disciplinas));
    assert.equal(contexto.carreirasDoCatalogo().some(function (e) { return e.id === original.id; }), false);
    assert.equal(contexto.editaisDoCatalogoAdmin().some(function (e) { return e.id === original.id; }), true);
  });
  assert.equal(contexto.carreirasDoCatalogo().length, 2);
  assert.equal(JSON.stringify([trf2, ufrj]), antes);
  const limparInicio = appSource.indexOf('  function limparEditalParaCatalogo(');
  vm.runInNewContext(appSource.slice(limparInicio, appSource.indexOf('\n  // Plano combinado', limparInicio)), contexto);
  assert.equal(contexto.limparEditalParaCatalogo(ufrj).tipoCatalogo, 'concurso');
});


test('excluir um plano distribuído preserva os estudos e impede seu retorno por cópias antigas', function () {
  const bases = carregarEditaisBase();
  const trf2 = bases.find(function (e) { return e.id === 'carreira-trf2-tjaa-2024'; });
  const planos = [{ id: 'meu-plano', plano: { origemEditalId: trf2.id }, disciplinas: trf2.disciplinas }];
  const estudosAntes = JSON.stringify(planos);
  const ctx = {
    window: { Store: S }, D: D, state: { editais: [], planos: planos, config: {} },
    catalogoEditaisBase: bases, catalogoCarreirasBase: [], catalogoGlobalEditais: [],
    usuarioAdmin: function () { return true; }
  };
  vm.runInNewContext(appSource.slice(appSource.indexOf('  function clonarJson('), appSource.indexOf('  function calculadoraDoEdital(')), ctx);
  const resultado = ctx.removerEditalDoCatalogo(trf2.id);
  assert.equal(resultado.removerId, null);
  assert.equal(ctx.state.editais.length, 1);
  assert.equal(ctx.state.editais[0].excluidoDoCatalogo, true);
  assert.equal(JSON.stringify(planos), estudosAntes);
  assert.equal(ctx.editaisDoCatalogo().some(function (e) { return e.id === trf2.id; }), false);
  assert.equal(ctx.editaisDoCatalogoAdmin().some(function (e) { return e.id === trf2.id; }), false);
  ctx.catalogoGlobalEditais = JSON.parse(JSON.stringify(ctx.state.editais));
  ctx.state.editais = [JSON.parse(JSON.stringify(trf2))];
  assert.equal(ctx.editaisDoCatalogo().some(function (e) { return e.id === trf2.id; }), false);
  assert.equal(ctx.editaisDoCatalogoAdmin().some(function (e) { return e.id === trf2.id; }), false);
  assert.equal(trf2.excluidoDoCatalogo, undefined);
});
