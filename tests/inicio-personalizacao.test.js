const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const {loadDomain} = require('./helpers/load-domain');
const {loadStore} = require('./helpers/load-store');
const D = loadDomain(), S = loadStore();
vm.runInThisContext(fs.readFileSync('js/inicio-layout.js','utf8'));
const L = window.InicioLayout;

test('personalização do site aceita metadados parciais e migra os grupos antigos', () => {
  assert.equal(L.ler({ordem: 'inválido', ocultos: null}).ordem.length, 10);
  const old = L.ler({ordem: ['resumos', 'conquistas'], ocultos: ['apoio']});
  assert.deepEqual(old.ordem.slice(0,3), ['performance','syllabus','quote']);
  assert.deepEqual(old.ocultos, ['week','subjects','reviews']);
});
test('salvar e restaurar layout do site preserva propriedades futuras', () => {
  const before = {ordem:['future','quote'],ocultos:['future','quote'],future:42,rev:5};
  const saved = L.preparar(before, {ordem:['goals'],ocultos:['quote']});
  assert.equal(saved.rev,6);assert.equal(saved.future,42);assert.equal(saved.ordem[0],'goals');
  assert(saved.ordem.includes('future'));assert(saved.ocultos.includes('future'));
  const reset = L.preparar(saved,L.ler());assert.equal(reset.rev,7);assert.deepEqual(L.ler(reset).ocultos,[]);
  assert.deepEqual(before.ocultos,['future','quote']);
});
test('site e Android mantêm layouts independentes ao mesclar nos dois sentidos', () => {
  const a=S.estadoVazio(),b=S.estadoVazio();
  a.config.inicioLayout={ordem:['study','quote'],ocultos:['quote'],rev:5,em:'2026-10-30T01:00:00Z'};
  a.config.inicioLayoutWeb={ordem:['study'],ocultos:[],rev:1};
  b.config.inicioLayoutWeb=L.preparar(a.config.inicioLayoutWeb,{ordem:['goals'],ocultos:['performance']});
  b.config.inicioLayout={ordem:['quote','study'],ocultos:[],rev:2};
  for(const [x,y] of [[a,b],[b,a]]){const merged=S.mesclarEstados(x,y);assert.deepEqual(merged.config.inicioLayout,a.config.inicioLayout);assert.deepEqual(merged.config.inicioLayoutWeb,b.config.inicioLayoutWeb);}
});
test('restaurar layout web vence uma cópia antiga sem ressuscitar cards ocultos', () => {
  const a=S.estadoVazio(),b=S.estadoVazio();
  a.config.inicioLayoutWeb=L.preparar(null,{ordem:['quote'],ocultos:Object.keys(L.labels)});
  b.config.inicioLayoutWeb=L.preparar(a.config.inicioLayoutWeb,L.ler());
  assert.deepEqual(L.ler(S.mesclarEstados(a,b).config.inicioLayoutWeb).ocultos,[]);
});
test('fila Hoje intercala Português mesmo com vários blocos urgentes do mesmo tópico', () => {
  const blocks=[{id:'por1',disciplinaId:'POR',topicoId:'POR-1',duracaoMin:60},{id:'por2',disciplinaId:'POR',topicoId:'POR-1',duracaoMin:60},{id:'adm',disciplinaId:'ADM',duracaoMin:60},{id:'rlm',disciplinaId:'RLM',duracaoMin:60}];
  const before=JSON.stringify(blocks), ordered=D.ordenarAgendaHoje(blocks);
  assert.deepEqual(ordered.map(b=>b.id),['por1','adm','por2','rlm']);assert.equal(JSON.stringify(blocks),before);
  assert.equal(ordered.reduce((n,b)=>n+b.duracaoMin,0),240);
});
test('escolha pelo lápis preserva o escolhido e dá a vez a outra disciplina em seguida', () => {
  const blocks=[{id:'a',disciplinaId:'POR'},{id:'b',disciplinaId:'ADM'},{id:'c',disciplinaId:'POR'}];
  assert.deepEqual(D.ordenarAgendaHoje(blocks,'c').map(b=>b.id),['c','b','a']);
  blocks[2].feito=true;
  assert.deepEqual(D.ordenarAgendaHoje(blocks,'c').map(b=>b.id),['a','b','c']);
});
test('fila mantém todos os blocos quando só uma disciplina tem pendências', () => {
  const blocks=[{id:'1',disciplinaId:'POR'},{id:'2',disciplinaId:'POR'},{id:'feito',disciplinaId:'ADM',feito:true}];
  assert.deepEqual(D.ordenarAgendaHoje(blocks).map(b=>b.id),['1','2','feito']);
});
