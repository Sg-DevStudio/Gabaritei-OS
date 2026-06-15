const fs=require('fs');const {JSDOM}=require('jsdom');
const pf=JSON.parse(fs.readFileSync('data/plano-trf3-tecnico.json','utf8'));
const pid='pln';
const state={versao:2,planos:[{id:pid,criadoEm:'2026-06-12',plano:Object.assign({},pf.plano,{ritmoAtivo:'sustentavel',gerado_em:'2026-06-08'}),disciplinas:pf.disciplinas,cronogramas:pf.cronogramas||{sustentavel:[],hardcore:[]},links:[]}],planoAtivoId:pid,sessoes:[],revisoes:[],simulados:[],agenda:[],editais:[],flashcards:[],config:{tema:'escuro',criadoEm:'2026-06-12',atualizadoEm:'2026-06-12',googleCalendar:{calendarId:'primary',eventos:{}}}};
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
const modal=()=>window.document.getElementById('modal-raiz');
function go(){window.location.hash='#revisoes';window.dispatchEvent(new window.Event('hashchange'));}
go();
console.log('1) revisoes renderiza:', errs.length?('ERR '+errs[0]):'ok');
console.log('   seg-control 2 abas:', main.querySelectorAll('[data-rev-aba]').length);
// alternar para flashcards
main.querySelector('[data-rev-aba="flashcards"]').click();
console.log('2) aba flashcards empty-state:', main.innerHTML.indexOf('Nenhum flashcard ainda')>=0);
console.log('   botão novo deck:', !!main.querySelector('#fc-novo-deck'));
// criar deck
main.querySelector('#fc-novo-deck').click();
const m=modal();
m.querySelector('#fc-deck-nome').value='Princípios';
m.querySelector('#fc-deck-criar').click();
console.log('3) deck criado:', window.JSON.parse(window.localStorage.getItem('estudos.v1')).flashcards.length===1);
console.log('   pasta + deck na tela:', !!main.querySelector('.fc-pasta'), !!main.querySelector('[data-fc-gerenciar]'));
// gerenciar deck -> add carta
main.querySelector('[data-fc-gerenciar]').click();
const mg=modal();
mg.querySelector('#fc-frente').value='O que é princípio da legalidade?';
mg.querySelector('#fc-verso').value='Admin só pode fazer o que a lei permite';
mg.querySelector('#fc-add').click();
const st1=window.JSON.parse(window.localStorage.getItem('estudos.v1'));
console.log('4) carta adicionada:', (st1.flashcards[0].cards||[]).length===1, 'frente:', st1.flashcards[0].cards[0].frente.slice(0,10));
// fechar gerenciar
mg.querySelector('#fc-fechar').click();
// estudo aleatório (1 devida)
console.log('5) estudo aleatório habilitado:', !main.querySelector('#fc-aleatorio').disabled);
main.querySelector('#fc-aleatorio').click();
const ms=modal();
console.log('   sessão aberta, carta presente:', !!ms.querySelector('#fc-carta'));
ms.querySelector('#fc-revelar').click();
console.log('   após revelar, SR visível:', !ms.querySelector('#fc-sr').classList.contains('oculto'), 'carta virada:', ms.querySelector('#fc-carta').classList.contains('virada'));
// nota "bom"
ms.querySelector('[data-nota="bom"]').click();
const st2=window.JSON.parse(window.localStorage.getItem('estudos.v1'));
const sr=st2.flashcards[0].cards[0].sr;
console.log('6) SR atualizado proximaRevisao:', sr.proximaRevisao, 'rep:', sr.repeticoes);
console.log('   sessão concluída (fim):', modal().innerHTML.indexOf('Sessão concluída')>=0);
console.log('errors:', errs.length?errs[0]:'none');
