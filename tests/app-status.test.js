'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {loadAppStatus}=require('./helpers/load-app-status');
const status=estado=>({estado,usuario:{uid:'qa'}});
test('sincronização pendente e em andamento só confirmam sucesso após resposta da nuvem',()=>{
 const h=loadAppStatus();assert(h.pill.hidden);h.sync(status('pendente'));assert.equal(h.pill.dataset.estado,'ocupado');
 h.sync(status('enviando'));assert.equal(h.label.textContent,'Sincronizando…');
 h.sync(status('erro'));assert.equal(h.pill.dataset.estado,'pendente');assert.equal(h.symbol.textContent,'!');
 h.sync(status('sincronizado'));assert.equal(h.pill.dataset.estado,'concluido');h.advance(2100);assert(h.pill.hidden);
 h.sync(null);assert(h.pill.hidden);
});
test('atualização espera uma janela segura e aplica sem clique apenas uma vez',()=>{
 const h=loadAppStatus();h.events.controllerchange();h.advance(6000);assert.equal(h.reloads(),0);assert.equal(h.pill.dataset.estado,'aguardando');
 h.setSafe(true);h.events.focus();assert.equal(h.pill.dataset.estado,'ocupado');h.advance(650);assert.equal(h.reloads(),1);
 h.events.controllerchange();h.events.focus();h.advance(6000);assert.equal(h.reloads(),1);assert.equal(h.session.get('gabaritei-atualizado'),'1');
});
test('abrir uma edição durante a transição cancela a recarga até ficar seguro novamente',()=>{
 const h=loadAppStatus();h.setSafe(true);h.events.controllerchange();h.setSafe(false);h.advance(650);assert.equal(h.reloads(),0);assert.equal(h.pill.dataset.estado,'aguardando');
 h.setSafe(true);h.advance(2600);assert.equal(h.reloads(),1);
});
test('primeira instalação do worker não recarrega; aba oculta não é interrompida',()=>{
 const h=loadAppStatus(false);h.setSafe(true);h.events.controllerchange();h.advance(4000);assert.equal(h.reloads(),0);
 h.c.document.hidden=true;h.events.controllerchange();h.advance(4000);assert.equal(h.reloads(),0);
 h.c.document.hidden=false;h.docEvents.visibilitychange();h.advance(650);assert.equal(h.reloads(),1);
});
test('guarda real distingue formulário limpo, edição, timer pausado e envio agendado',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),s=fs.readFileSync('js/app.js','utf8');
 let timer=null,modal=false,pending=false,foco=null,cloud={estado:'sincronizado',usuario:{uid:'qa'}};const form={},events={};
 const c={modoDemo:false,window:{Timer:{estado:()=>timer},FirebaseSync:{temEnvioPendente:()=>pending}},statusSincronizacao:()=>cloud,document:{activeElement:null,querySelector:()=>modal?{}:null,querySelectorAll:()=>[form],addEventListener:(k,f)=>events[k]=f}};
 vm.runInNewContext(s.slice(s.indexOf('  const formulariosEditados ='),s.indexOf('  // Ao sair do app (segundo plano)')),c);
 const safe=c.window.GabariteiAtualizacaoSegura;
 assert(safe());timer={rodando:false};assert(!safe());timer=null;pending=true;assert(!safe());pending=false;
 cloud={estado:'enviando',usuario:{uid:'qa'}};assert(!safe());cloud=null;modal=true;assert(!safe());modal=false;
 c.document.activeElement={matches:()=>true};assert(!safe());c.document.activeElement=null;
 events.input({target:{closest:()=>form}});assert(!safe());c.modoDemo=true;assert(!safe());
});
test('animação inicial aguarda a primeira leitura sem bloquear estudos já salvos ou sincronizações seguintes',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),s=fs.readFileSync('js/app.js','utf8');let cloud={estado:'sincronizando'},local=false;
 const c={modoDemo:false,syncInicialFeito:false,state:{},statusSincronizacao:()=>cloud,usuarioLogado:()=>true,window:{Store:{temDados:()=>local}}};
 vm.runInNewContext(s.slice(s.indexOf('  function carregandoNuvemInicial()'),s.indexOf('  function telaCarregandoAuth()')),c);
 assert(c.carregandoNuvemInicial());local=true;assert(!c.carregandoNuvemInicial());local=false;c.syncInicialFeito=true;assert(!c.carregandoNuvemInicial());c.syncInicialFeito=false;cloud={estado:'erro'};assert(!c.carregandoNuvemInicial());
});
