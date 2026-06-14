const fs=require('fs');const {JSDOM}=require('jsdom');
const pf=JSON.parse(fs.readFileSync('data/plano-trf3-tecnico.json','utf8'));
const pid='pln';
const state={versao:2,planos:[{id:pid,criadoEm:'2026-06-12',plano:Object.assign({},pf.plano,{ritmoAtivo:'sustentavel',gerado_em:'2026-06-08',radar:{janela_prova:['2026-11','2027-02'],reavaliar_em:null}}),disciplinas:pf.disciplinas,cronogramas:pf.cronogramas||{sustentavel:[],hardcore:[]},links:[]}],planoAtivoId:pid,sessoes:[{id:'s1',planoId:pid,data:'2026-06-13',topicoId:null,tipo:'teoria',duracaoMin:120,qFeitas:120,qCertas:90}],revisoes:[],simulados:[],agenda:[],editais:[],config:{metaQuestoesSemana:120,tema:'escuro',criadoEm:'2026-06-12',atualizadoEm:'2026-06-12',nomeUsuario:'Samuel',googleCalendar:{clientId:'',calendarId:'primary',eventos:{}}}};
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:'outside-only',pretendToBeVisual:true,url:'https://example.com/'});
const {window}=dom;global.window=window;
window.Chart=function(){return{destroy(){},update(){}};};window.matchMedia=window.matchMedia||function(){return{matches:false,addEventListener(){},addListener(){}};};
window.scrollTo=function(){};window.confirm=()=>false;window.fetch=()=>Promise.reject(new Error('no net'));
window.AudioContext=function(){return{state:'running',currentTime:0,resume(){},createOscillator(){return{type:'',frequency:{value:0},connect(){},start(){},stop(){}};},createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};},destination:{}};};
// fake logged-in firebase before app.js loads
window.FirebaseSync={ _opts:null, status(){return{estado:'sincronizado',texto:'ok',fonte:'Firebase',usuario:{email:'casar70@gmail.com',nome:'Samuel',uid:'u1'}};}, iniciar(o){this._opts=o;}, agendarEnvio(){}, sincronizarAgora(){return Promise.resolve();}, login(){return Promise.resolve();}, logout(){return Promise.resolve();}, ativo(){return true;}, carregarCatalogoGlobal(){return Promise.resolve([]);} };
window.localStorage.setItem('estudos.v1',JSON.stringify(state));
const errs=[];window.addEventListener('error',e=>errs.push(e.error&&e.error.stack||e.message));
['js/frases.js','js/domain.js','js/store.js','js/sync.js','js/timer.js','js/charts.js','js/app.js'].forEach(f=>window.eval(fs.readFileSync(f,'utf8')));
window.dispatchEvent(new window.Event('firebase-sync-ready'));
window.document.dispatchEvent(new window.Event('DOMContentLoaded',{bubbles:true}));window.dispatchEvent(new window.Event('load'));
const main=window.document.getElementById('conteudo');
function go(r){errs.length=0;window.location.hash='#'+r;window.dispatchEvent(new window.Event('hashchange'));console.log(r.padEnd(13),'len',String(main.innerHTML.length).padEnd(6), errs.length?('ERR '+errs[0]):'ok');}
go('hoje');
console.log('  login-gate?', window.document.body.classList.contains('login-gate'));
console.log('  conquistas medalha buttons:', main.querySelectorAll('.medalha[data-conquista]').length);
console.log('  painel ver-mais:', !!main.querySelector('[data-painel-vermais]'));
console.log('  painel extra count:', main.querySelectorAll('.painel-disc-extra').length);
console.log('  apoio-links present:', !!main.querySelector('.apoio-links'));
// tap a conquista
const med=main.querySelector('.medalha[data-conquista]'); if(med){errs.length=0;med.click();console.log('  tap conquista modal:', !!window.document.querySelector('.conquista-detalhe'), errs.length?('ERR '+errs[0]):'ok');}
go('planejamento');
console.log('  checkin-nota gone:', !main.querySelector('.checkin-nota'));
console.log('  recalc button:', !!main.querySelector('#pl-recalcular'));
console.log('  plano-atual-foto:', !!main.querySelector('.plano-atual-foto'));
console.log('  reavaliar text:', main.innerHTML.indexOf('reavaliar em')>=0);
