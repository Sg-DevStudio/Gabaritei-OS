const fs=require('fs');const {JSDOM}=require('jsdom');
const pf=JSON.parse(fs.readFileSync('data/plano-trf3-tecnico.json','utf8'));
const pid='pln';
const state={versao:2,planos:[{id:pid,criadoEm:'2026-06-12',plano:Object.assign({},pf.plano,{ritmoAtivo:'sustentavel',gerado_em:'2026-06-08',radar:{janela_prova:['2026-11','2027-02'],reavaliar_em:null}}),disciplinas:pf.disciplinas,cronogramas:pf.cronogramas||{sustentavel:[],hardcore:[]},links:[]}],planoAtivoId:pid,sessoes:[{id:'s1',planoId:pid,data:'2026-06-13',tipo:'teoria',duracaoMin:120,qFeitas:120,qCertas:90}],revisoes:[],simulados:[],agenda:[],editais:[],config:{tema:'escuro',criadoEm:'2026-06-12',atualizadoEm:'2026-06-12',googleCalendar:{calendarId:'primary',eventos:{}}}};
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:'outside-only',pretendToBeVisual:true,url:'https://example.com/'});
const {window}=dom;global.window=window;
window.Chart=function(){return{destroy(){},update(){}};};window.matchMedia=function(){return{matches:false,addEventListener(){},addListener(){}};};
window.scrollTo=function(){};window.confirm=()=>false;window.fetch=()=>Promise.reject(new Error('no net'));
window.AudioContext=function(){return{state:'running',currentTime:0,resume(){},createOscillator(){return{type:'',frequency:{value:0},connect(){},start(){},stop(){}};},createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};},destination:{}};};
window.FirebaseSync={status(){return{estado:'sincronizado',texto:'ok',fonte:'Firebase',usuario:{email:'casar70@gmail.com',uid:'u1'}};},iniciar(){},agendarEnvio(){},sincronizarAgora(){return Promise.resolve();},login(){return Promise.resolve();},logout(){return Promise.resolve();},ativo(){return true;},carregarCatalogoGlobal(){return Promise.resolve([]);}};
window.localStorage.setItem('estudos.v1',JSON.stringify(state));
const errs=[];window.addEventListener('error',e=>errs.push(e.error&&e.error.stack||e.message));
['js/frases.js','js/domain.js','js/store.js','js/sync.js','js/timer.js','js/charts.js','js/app.js'].forEach(f=>window.eval(fs.readFileSync(f,'utf8')));
window.dispatchEvent(new window.Event('firebase-sync-ready'));
window.document.dispatchEvent(new window.Event('DOMContentLoaded',{bubbles:true}));window.dispatchEvent(new window.Event('load'));
const main=window.document.getElementById('conteudo');
function go(r){errs.length=0;window.location.hash='#'+r;window.dispatchEvent(new window.Event('hashchange'));console.log(r.padEnd(13),'len',String(main.innerHTML.length).padEnd(6), errs.length?('ERR '+errs[0]):'ok');}
go('hoje');
console.log('  home-cab-prova:', !!main.querySelector('.home-cab-prova'));
console.log('  prova-card-mobile:', !!main.querySelector('.prova-card-mobile'));
console.log('  prova-editar count:', main.querySelectorAll('.prova-editar').length);
console.log('  constancia has prova inside:', !!main.querySelector('.constancia-card .prova-card'));
go('planejamento');
console.log('  paleta ver-mais:', !!main.querySelector('[data-paleta-vermais]'));
console.log('  chip extras:', main.querySelectorAll('.chip-disc-extra').length);
go('edital');
console.log('  edital renders (per active plan):', main.innerHTML.indexOf('Edital verticalizado')>=0, errs.length?('ERR '+errs[0]):'ok');
go('planos');
console.log('  planos catalogo-feito in info:', !!main.querySelector('.catalogo-card-info .catalogo-feito'), ' comparar btn:', !!main.querySelector('[data-pl-comparar]'));
// admin card no foto: render ajustes (admin email)
go('ajustes');
console.log('  admin plano-mini-top-foto present:', !!main.querySelector('.plano-mini-top-foto'));
// nav check
console.log('  sidebar edital nav present:', !!window.document.querySelector('#sidebar [data-rota=edital]'));
