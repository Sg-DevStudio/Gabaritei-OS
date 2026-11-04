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

test('TJSP abre a base do caderno 2026 e preserva o plano ativo de outro concurso', () => {
 const root=path.join(__dirname,'..'), app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
 const fonte=app.slice(app.indexOf('  function estadoCaderno() {'),app.indexOf('  function rotaAtual()'));
 const c=vm.createContext({window:{},cadernoPlanoId:'edital:edt-mqifhb2v-yh9ym',state:{planos:[],plano:{concurso:'TRF2'},disciplinas:[]},editalPorId:()=>({titulo:'TJSP - Escrevente Técnico Judiciário (Edital 2026)',disciplinas:[]})});
 vm.runInContext(fs.readFileSync(path.join(root,'data/caderno-tjsp.js'),'utf8'),c);
 vm.runInContext(fonte+'; resultado=estadoCaderno();',c);
 assert.equal(c.resultado.disciplinas.length,12);
 assert.equal(c.resultado.disciplinas.flatMap(d=>d.topicos).length,80);
 assert.equal(c.state.plano.concurso,'TRF2');
 assert.equal(c.state.disciplinas.length,0);
});

test('caderno encontra plano pelo edital de origem quando o título publicado mudou', () => {
 const app=fs.readFileSync(path.join(__dirname,'../js/app.js'),'utf8');
 const fonte=app.slice(app.indexOf('  function estadoCaderno() {'),app.indexOf('  function rotaAtual()'));
 const entrada={id:'aluno',plano:{concurso:'TJSP 2025',origemEditalId:'edt-mqifhb2v-yh9ym'},disciplinas:[],links:[{id:'meu-link'}]};
 const referencia={id:'edt-mqifhb2v-yh9ym',titulo:'TJSP - Escrevente Técnico Judiciário (Edital 2026)',disciplinas:[]};
 const c=vm.createContext({window:{},cadernoPlanoId:'edital:'+referencia.id,state:{planos:[entrada],planoAtivoId:'outro'},editalPorId:()=>referencia});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../data/caderno-tjsp.js'),'utf8'),c);
 vm.runInContext(fonte+'; resultado=estadoCaderno();',c);
 assert.equal(c.resultado.planoAtivoId,'aluno');assert.equal(c.resultado.links,entrada.links);
 assert.equal(entrada.plano.concurso,'TJSP 2025');assert.equal(c.resultado.cadernoConsulta,undefined);
 assert.equal(c.resultado.cadernoPlanoAtivo,false);assert.equal(c.resultado.disciplinas.length,12);
});

test('uma nova referência TRF2 não recebe à força o programa da edição 2024', () => {
 const app=fs.readFileSync(path.join(__dirname,'../js/app.js'),'utf8');
 const fonte=app.slice(app.indexOf('  function estadoCaderno() {'),app.indexOf('  function rotaAtual()'));
 const disciplinas=[{id:'NOVO',nome:'Disciplina do edital futuro',topicos:[]}];
 const entrada={id:'aluno',plano:{concurso:'TRF2 Técnico Administrativo 2028',origemEditalId:'trf2-edital-2028'},disciplinas,links:[]};
 const referencia={id:'trf2-edital-2028',titulo:entrada.plano.concurso,disciplinas};
 const c=vm.createContext({window:{},cadernoPlanoId:'aluno',state:{planos:[entrada],planoAtivoId:'aluno'},editalPorId:()=>referencia});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../data/catalogo-editais.js'),'utf8'),c);
 vm.runInContext(fonte+'; resultado=estadoCaderno();',c);
 assert.equal(c.resultado.disciplinas,disciplinas);assert.equal(c.resultado.disciplinas.length,1);
});
