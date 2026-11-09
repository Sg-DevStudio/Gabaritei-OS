const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('atualização do service worker é automática e aguarda o estudo terminar',()=>{
 const h=require('./helpers/load-app-status').loadAppStatus();h.events.controllerchange();h.advance(5000);assert.equal(h.reloads(),0);h.setSafe(true);h.events.focus();h.advance(650);assert.equal(h.reloads(),1);
});
test('retomar aba via foco e visibilidade provoca apenas uma sincronização',()=>{
 const source=fs.readFileSync('js/firebase-sync.js','utf8');const a=source.indexOf('function registrarReSyncPrimeiroPlano()');const b=source.indexOf('// Registra o token',a);let n=0,agora=100000;const eventos={},deventos={};const c={reSyncRegistrado:false,refEstado:{},reconciliando:false,enviando:false,Date:{now:()=>agora},document:{hidden:false,addEventListener:(e,f)=>deventos[e]=f},window:{addEventListener:(e,f)=>eventos[e]=f},setInterval:()=>{},flushEnvio:()=>{},observarMudancas:()=>{},reconciliarComRemoto:()=>{n++;return Promise.resolve();}};vm.runInNewContext(source.slice(a,b)+';registrarReSyncPrimeiroPlano();',c);eventos.focus();deventos.visibilitychange();assert.equal(n,1);agora+=31000;eventos.focus();assert.equal(n,2);eventos.online();assert.equal(n,3);
});
