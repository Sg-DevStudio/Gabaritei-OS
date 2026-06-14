const fs=require('fs');const {JSDOM}=require('jsdom');
const pf=JSON.parse(fs.readFileSync('data/plano-trf3-tecnico.json','utf8'));
const ef=JSON.parse(fs.readFileSync('data/edital-trf3-tjaa-2024.json','utf8'));
const pid='pln';
const ed={id:'e1',criadoEm:'2026-06-12',titulo:'TRF3 Tecnico 2026',banca:'FCC',orgao:'TRF3',cargo:'Tec',estado:'SP',notaCorte:84,arquivado:false,foto:'',disciplinas:pf.disciplinas};
const ed2={id:'e2',criadoEm:'2026-06-12',titulo:'TJ-RJ Tecnico 2026',banca:'FGV',orgao:'TJ-RJ',estado:'RJ',notaCorte:68,arquivado:false,foto:'',disciplinas:ef.disciplinas};
const ed3={id:'e3',criadoEm:'2026-06-12',titulo:'INSS Tecnico 2026',banca:'Cebraspe',orgao:'INSS',estado:'DF',notaCorte:70,arquivado:false,foto:'',disciplinas:ef.disciplinas};
const state={versao:2,planos:[{id:pid,criadoEm:'2026-06-12',plano:Object.assign({},pf.plano,{ritmoAtivo:'sustentavel',gerado_em:'2026-06-08'}),disciplinas:pf.disciplinas,cronogramas:pf.cronogramas||{sustentavel:[],hardcore:[]},links:[]}],planoAtivoId:pid,sessoes:[],revisoes:[],simulados:[],agenda:[],editais:[ed,ed2,ed3],config:{tema:'claro',criadoEm:'2026-06-12',atualizadoEm:'2026-06-12',googleCalendar:{calendarId:'primary',eventos:{}}}};
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:'outside-only',pretendToBeVisual:true,url:'https://example.com/'});
const {window}=dom;global.window=window;
window.Chart=function(){return{destroy(){},update(){}};};window.matchMedia=function(){return{matches:false,addEventListener(){},addListener(){}};};
window.scrollTo=function(){};window.confirm=()=>false;window.fetch=()=>Promise.reject(new Error('no net'));
window.FirebaseSync={status(){return{estado:'sincronizado',texto:'ok',fonte:'Firebase',usuario:{email:'casar70@gmail.com',uid:'u1'}};},iniciar(){},agendarEnvio(){},sincronizarAgora(){return Promise.resolve();},login(){return Promise.resolve();},logout(){return Promise.resolve();},ativo(){return true;},carregarCatalogoGlobal(){return Promise.resolve([]);}};
window.localStorage.setItem('estudos.v1',JSON.stringify(state));
const errs=[];window.addEventListener('error',e=>errs.push(e.error&&e.error.stack||e.message));
['js/frases.js','js/domain.js','js/store.js','js/sync.js','js/timer.js','js/charts.js','js/app.js'].forEach(f=>window.eval(fs.readFileSync(f,'utf8')));
window.dispatchEvent(new window.Event('firebase-sync-ready'));
window.document.dispatchEvent(new window.Event('DOMContentLoaded',{bubbles:true}));window.dispatchEvent(new window.Event('load'));
const main=window.document.getElementById('conteudo');
errs.length=0;window.location.hash='#planos';window.dispatchEvent(new window.Event('hashchange'));
console.log('initial:', errs.length?('ERR '+errs[0]):'ok', 'cards:', main.querySelectorAll('.catalogo-card-compacto').length);
console.log('chips initial:', main.querySelectorAll('.comparar-chip').length, 'hint:', !!main.querySelector('.comparar-hint'));
// click first Comparar
const btn1=main.querySelectorAll('[data-pl-comparar]')[0]; btn1.click();
console.log('after 1 click: chips:', main.querySelectorAll('.comparar-chip').length, 'cards selected:', main.querySelectorAll('.catalogo-card-comparando').length);
const btn2=main.querySelectorAll('[data-pl-comparar]')[1]; btn2.click();
console.log('after 2 clicks: chips:', main.querySelectorAll('.comparar-chip').length, 'verdict:', !!main.querySelector('.conciliar-veredito'));
// add 3rd -> should drop oldest, stay at 2
const btn3=main.querySelectorAll('[data-pl-comparar]')[2]; btn3.click();
console.log('after 3 clicks: chips (max 2):', main.querySelectorAll('.comparar-chip').length, 'selected cards:', main.querySelectorAll('.catalogo-card-comparando').length);
// remove via chip
const chipX=main.querySelector('[data-cmp-remover]'); chipX.click();
console.log('after remove: chips:', main.querySelectorAll('.comparar-chip').length);
// limpar
const btn=main.querySelectorAll('[data-pl-comparar]')[0]; btn.click();
const btn2b=main.querySelectorAll('[data-pl-comparar]')[1]; btn2b.click();
const lim=main.querySelector('#cmp-limpar'); if(lim) lim.click();
console.log('after limpar: chips:', main.querySelectorAll('.comparar-chip').length);
console.log('errors:', errs.length?errs[0]:'none');
