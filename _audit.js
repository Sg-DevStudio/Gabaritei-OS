const fs=require('fs');const {JSDOM}=require('jsdom');
const pf=JSON.parse(fs.readFileSync('data/plano-trf3-tecnico.json','utf8'));
const ef=JSON.parse(fs.readFileSync('data/edital-trf3-tjaa-2024.json','utf8'));
const pid='pln';
// edital no catálogo (state.editais) p/ testar criar/refazer
const ed={id:'e1',criadoEm:'2026-06-12',titulo:pf.plano.concurso,banca:'FCC',orgao:'TRF3',cargo:'Tec',estado:'SP',notaCorte:84,arquivado:false,foto:'',disciplinas:pf.disciplinas};
const state={versao:2,planos:[],planoAtivoId:null,sessoes:[],revisoes:[],simulados:[],agenda:[],editais:[ed],flashcards:[],config:{tema:'escuro',apagadoEm:'2026-06-10T00:00:00.000Z',criadoEm:'2026-06-12',atualizadoEm:'2026-06-12',googleCalendar:{calendarId:'primary',eventos:{}}}};
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:'outside-only',pretendToBeVisual:true,url:'https://example.com/'});
const {window}=dom;global.window=window;
window.Chart=function(){return{destroy(){},update(){}};};window.matchMedia=function(q){return{matches:false,media:q,addEventListener(){},addListener(){}};};
window.scrollTo=function(){};window.confirm=()=>false;window.fetch=()=>Promise.reject(new Error('no net'));
window.FirebaseSync={status(){return{estado:'sincronizado',texto:'ok',fonte:'Firebase',usuario:{email:'casar70@gmail.com',uid:'u1'}};},iniciar(){},agendarEnvio(){},sincronizarAgora(){return Promise.resolve();},login(){return Promise.resolve();},logout(){return Promise.resolve();},ativo(){return true;},carregarCatalogoGlobal(){return Promise.resolve([]);}};
window.localStorage.setItem('estudos.v1',JSON.stringify(state));
const errs=[];window.addEventListener('error',e=>errs.push(e.error&&e.error.stack||e.message));
['js/frases.js','js/domain.js','js/store.js','js/sync.js','js/timer.js','js/charts.js','js/app.js'].forEach(f=>window.eval(fs.readFileSync(f,'utf8')));
window.dispatchEvent(new window.Event('firebase-sync-ready'));
window.document.dispatchEvent(new window.Event('DOMContentLoaded',{bubbles:true}));window.dispatchEvent(new window.Event('load'));
const main=window.document.getElementById('conteudo');
const ls=()=>window.JSON.parse(window.localStorage.getItem('estudos.v1'));
// 1) criar plano de edital (dispara wizard); cancelar via hashchange (phantom plan deve sumir)
window.location.hash='#planos';window.dispatchEvent(new window.Event('hashchange'));
main.querySelector('[data-pl-iniciar]').click();
console.log('1) wizard aberto:', !!window.document.querySelector('#form-gerar-plano-rotina'), 'planos após criar:', ls().planos.length, 'apagadoEm limpo:', ls().config.apagadoEm===undefined);
// simula sair via hashchange (back/navegação)
window.location.hash='#hoje';window.dispatchEvent(new window.Event('hashchange'));
console.log('   após hashchange (sair sem gerar) -> planos:', ls().planos.length, '(esperado 0, phantom removido)', errs.length?('ERR '+errs[0]):'');
// 2) criar de novo e GERAR (completar wizard)
window.location.hash='#planos';window.dispatchEvent(new window.Event('hashchange'));
main.querySelector('[data-pl-iniciar]').click();
const f=window.document.querySelector('#form-gerar-plano-rotina');
f.dispatchEvent(new window.Event('submit',{cancelable:true,bubbles:true}));
let st=ls();
console.log('2) plano gerado:', st.planos.length===1, 'gerado_em é segunda?', (function(){const D=window.Dominio;return st.planos[0].plano.gerado_em===D.segundaDaSemana(D.hojeISO());})());
// 3) past-day blocks: nenhum bloco gerado antes de hoje na agenda
const hoje=window.Dominio.hojeISO();
const passados=(st.agenda||[]).filter(a=>a.gerado&&a.data<hoje).length;
console.log('3) blocos gerados em dias passados:', passados, '(esperado 0)');
// 4) "Refazer" não duplica: clicar iniciar de novo no mesmo edital
window.location.hash='#planos';window.dispatchEvent(new window.Event('hashchange'));
main.querySelector('[data-pl-iniciar]').click(); // existe -> reaproveita
console.log('4) refazer não duplica -> planos:', ls().planos.length, '(esperado 1)');
window.document.querySelector('#gp-cancelar').click();
console.log('   após cancelar refazer -> planos:', ls().planos.length, '(esperado 1, não apaga existente)');
console.log('errors:', errs.length?errs[0]:'none');
