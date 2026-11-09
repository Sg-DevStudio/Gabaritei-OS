'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('js/app.js','utf8');
const between=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
test('falha ao persistir uma atualização não envia estado não salvo para a nuvem',()=>{
 let sent=0;
 const c=vm.createContext({modoDemo:false,state:{id:'anterior'},falhaPersistenciaAvisadaEm:0,toast(){},Date,window:{Store:{salvar:()=>({ok:false})},Sync:{agendarEnvio(){sent++;}},FirebaseSync:{agendarEnvio(){sent++;}}}});
 vm.runInContext(between('  function salvar(opcoes)', '  function statusSincronizacao()')+';resultado=salvar();',c);
 assert.equal(c.resultado,false);assert.equal(sent,0);
});
test('integração restaura o estado inteiro se a gravação automática falhar e respeita modo exemplo e edição',()=>{
 const original={planos:[{id:'p'}],sessoes:[{id:'s'}],config:{}};
 let modal=false,calls=0,saves=0;
 const c=vm.createContext({modoDemo:false,catalogoGlobalCarregado:true,state:original,D:{},console,document:{querySelector:()=>modal},clonarJson:v=>JSON.parse(JSON.stringify(v)),editaisDoCatalogo:()=>[],salvar:()=>{saves++;return false;},window:{Store:{hidratar(){}},PlanosAtualizacao:{sincronizar(s){calls++;s.planos=[{id:'novo'}];return {mudou:true,erros:[]};}}}});
 vm.runInContext(between('  function sincronizarPlanosDoCatalogo()', '  function ligarEditaisEsquematizados(')+';sincronizarPlanosDoCatalogo();',c);
 assert.equal(c.state,original);assert.equal(original.planos[0].id,'p');assert.equal(original.sessoes[0].id,'s');assert.equal(saves,1);
 modal=true;vm.runInContext('sincronizarPlanosDoCatalogo()',c);c.modoDemo=true;modal=false;vm.runInContext('sincronizarPlanosDoCatalogo()',c);assert.equal(calls,1);
});
test('novas publicações no catálogo redesenham o app sem exigir botão ou recarregar a página',async()=>{
 let listener,reads=0,renders=0;
 const c=vm.createContext({catalogoGlobalPromise:null,catalogoGlobalTentado:false,catalogoGlobalEditais:[],catalogoGlobalCarregado:false,cancelarCatalogoAoVivo:null,normalizarCatalogoGlobal:x=>x,render(){renders++;},console,window:{FirebaseSync:{carregarCatalogoGlobal:async()=>{reads++;return [{id:'e',atualizadoEm:'v1'}];},observarCatalogoGlobal(fn){listener=fn;return ()=>{};}}}});
 vm.runInContext(between('  function carregarCatalogoGlobalFirebase()', '  function publicarCatalogoAdmin('),c);
 await c.carregarCatalogoGlobalFirebase();assert.equal(renders,1);
 listener([{id:'e',atualizadoEm:'v1'}]);assert.equal(renders,1);
 listener([{id:'e',atualizadoEm:'v2'}]);assert.equal(renders,2);assert.equal(c.catalogoGlobalEditais[0].atualizadoEm,'v2');
 await c.carregarCatalogoGlobalFirebase();assert.equal(reads,1);
});
