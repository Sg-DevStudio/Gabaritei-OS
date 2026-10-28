'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
test('TRF2 usa a base completa no caderno sem modificar estrutura ou histórico salvo', () => {
  const root = path.join(__dirname, '..');
  const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  const fonte = app.slice(app.indexOf('  function estadoCaderno() {'), app.indexOf('  function rotaAtual()'));
  const plano = { id: 'p', plano: { concurso: 'TRF2 Técnico Administrativo' }, disciplinas: [{ nome: 'Estrutura antiga', topicos: [] }], links: [] };
  const c = vm.createContext({ window: {}, cadernoPlanoId: 'edital:trf2', state: { planos: [plano], sessoes: [{ id: 'historico' }], planoAtivoId: 'p' }, editalPorId: () => ({ titulo: 'TRF2 Técnico Administrativo' }) });
  vm.runInContext(fs.readFileSync(path.join(root, 'data/catalogo-editais.js'), 'utf8'), c);
  vm.runInContext(fonte + '; resultado = estadoCaderno();', c);
  assert.equal(c.resultado.disciplinas.length, 13);
  assert.equal(c.resultado.disciplinas.flatMap(d => d.topicos).length, 121);
  assert.equal(plano.disciplinas.length, 1);
  assert.equal(c.state.sessoes[0].id, 'historico');
  assert.equal(c.resultado.links, plano.links);
  c.editalPorId = () => ({ titulo: 'Analista da Educação', disciplinas: [{ nome: 'Educação', topicos: [] }] });
  vm.runInContext('resultado = estadoCaderno();', c);
  assert.equal(c.resultado.plano.concurso, 'Analista da Educação');
  assert.equal(c.resultado.disciplinas[0].nome, 'Educação');
  assert.equal(c.resultado.links.length, 0);
});

test('TJSP abre a base do caderno 2025 e preserva o plano ativo de outro concurso', () => {
 const root=path.join(__dirname,'..'), app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
 const fonte=app.slice(app.indexOf('  function estadoCaderno() {'),app.indexOf('  function rotaAtual()'));
 const c=vm.createContext({window:{},cadernoPlanoId:'edital:edt-mqifhb2v-yh9ym',state:{planos:[],plano:{concurso:'TRF2'},disciplinas:[]},editalPorId:()=>({titulo:'TJSP - Escrevente Técnico Judiciário (Edital 2025)',disciplinas:[]})});
 vm.runInContext(fs.readFileSync(path.join(root,'data/caderno-tjsp.js'),'utf8'),c);
 vm.runInContext(fonte+'; resultado=estadoCaderno();',c);
 assert.equal(c.resultado.disciplinas.length,12);
 assert.equal(c.resultado.disciplinas.flatMap(d=>d.topicos).length,80);
 assert.equal(c.state.plano.concurso,'TRF2');
 assert.equal(c.state.disciplinas.length,0);
});
