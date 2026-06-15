const fs=require('fs');const {JSDOM}=require('jsdom');
const pf=JSON.parse(fs.readFileSync('data/plano-trf3-tecnico.json','utf8'));
const pid='pln';
const disc0=(pf.disciplinas[0]||{}).id||'LP';
const deck={id:'fcd-1',planoId:pid,disciplinaId:disc0,nome:'Crase',criadoEm:'2026-06-12',cards:[
  {id:'fck-1',frente:'F1',verso:'V1',criadoEm:'2026-06-12',sr:{intervalo:0,facilidade:2.5,repeticoes:0,lapsos:0,proximaRevisao:null,ultimaRevisao:null}},
  {id:'fck-2',frente:'F2',verso:'V2',criadoEm:'2026-06-12',sr:{intervalo:0,facilidade:2.5,repeticoes:0,lapsos:0,proximaRevisao:null,ultimaRevisao:null}}
]};
const state={versao:2,planos:[{id:pid,criadoEm:'2026-06-12',plano:Object.assign({},pf.plano,{ritmoAtivo:'sustentavel',gerado_em:'2026-06-08'}),disciplinas:pf.disciplinas,cronogramas:pf.cronogramas||{sustentavel:[],hardcore:[]},links:[]}],planoAtivoId:pid,sessoes:[],revisoes:[],simulados:[],agenda:[],editais:[],flashcards:[deck],config:{tema:'escuro',criadoEm:'2026-06-12',atualizadoEm:'2026-06-12',googleCalendar:{calendarId:'primary',eventos:{}}}};
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
window.location.hash='#revisoes';window.dispatchEvent(new window.Event('hashchange'));
main.querySelector('[data-rev-aba="flashcards"]').click();
// estudo aleatório (2 devidas), erra a 1ª (re-enfileira) e acerta as duas
main.querySelector('#fc-aleatorio').click();
function rodada(nota){const m=window.document.getElementById('modal-raiz');m.querySelector('#fc-revelar').click();m.querySelector('[data-nota="'+nota+'"]').click();}
rodada('errei'); // F? re-enfileira
rodada('bom');   // próxima
rodada('bom');   // a re-enfileirada
const fim=window.document.getElementById('modal-raiz').innerHTML;
const mfeitas=fim.match(/revisou (\d+) carta/);
console.log('contagem distinta (esperado 2):', mfeitas&&mfeitas[1]);
console.log('multilinha pedirTexto disponível:', fs.readFileSync('js/app.js','utf8').indexOf('opcoes.multilinha')>=0);
console.log('errors:', errs.length?errs[0]:'none');
