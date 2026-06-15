const fs=require('fs');const {JSDOM}=require('jsdom');
const pid='pln';
const hojeSeg=(function(){const d=new Date();const wd=d.getDay();const off=wd===0?6:wd-1;d.setDate(d.getDate()-off);return d.toISOString().slice(0,10);})();
function topico(i){return {id:'t'+i,nome:'T'+i,incidencia_pct:10,prioridade:2,horas_estimadas:2,semana_sugerida:null,status:'pendente',reaberto:false,orfao:false};}
function disc(id,n){const ts=[];for(let i=0;i<n;i++)ts.push(topico(id+'-'+i));return {id:id,nome:'D'+id,cor:'#3B82F6',peso:2,base_teorica:'pdf',topicos:ts};}
function discs(nd,nt){const a=[];for(let i=0;i<nd;i++)a.push(disc('D'+i,nt));return a;}
function run(titulo,nd,nt,cb){
  const ed={id:'e-'+titulo,criadoEm:hojeSeg,titulo:titulo,banca:'X',orgao:'O',cargo:'C',estado:'SP',notaCorte:70,arquivado:false,foto:'',disciplinas:discs(nd,nt)};
  const plano={concurso:titulo,banca:'X',meta:{corte_pct:70},radar:null,ritmos:null,ritmoAtivo:null};
  const state={versao:2,planos:[{id:pid,criadoEm:hojeSeg,plano:plano,disciplinas:ed.disciplinas,cronogramas:{},links:[]}],planoAtivoId:pid,sessoes:[],revisoes:[],simulados:[],agenda:[],editais:[ed],flashcards:[],config:{rotinaEstudos:{dias:{seg:{ativo:true,minutos:180}},minBloco:45,maxBloco:60},tema:'escuro',criadoEm:hojeSeg,atualizadoEm:hojeSeg,googleCalendar:{calendarId:'primary',eventos:{}}}};
  const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:'outside-only',pretendToBeVisual:true,url:'https://example.com/'});
  const w=dom.window;global.window=w;
  w.Chart=function(){return{destroy(){},update(){}};};w.matchMedia=function(q){return{matches:false,media:q,addEventListener(){},addListener(){}};};
  w.scrollTo=function(){};w.confirm=()=>false;w.fetch=()=>Promise.reject(new Error('no net'));
  w.FirebaseSync={status(){return{estado:'sincronizado',texto:'ok',fonte:'Firebase',usuario:{email:'x@y.com',uid:'u1'}};},iniciar(){},agendarEnvio(){},sincronizarAgora(){return Promise.resolve();},login(){return Promise.resolve();},logout(){return Promise.resolve();},ativo(){return true;},carregarCatalogoGlobal(){return Promise.resolve([]);}};
  w.localStorage.setItem('estudos.v1',JSON.stringify(state));
  const errs=[];w.addEventListener('error',e=>errs.push(e.error&&e.error.stack||e.message));
  ['js/frases.js','js/domain.js','js/store.js','js/sync.js','js/timer.js','js/charts.js','js/app.js'].forEach(f=>w.eval(fs.readFileSync(f,'utf8')));
  w.dispatchEvent(new w.Event('firebase-sync-ready'));
  w.document.dispatchEvent(new w.Event('DOMContentLoaded',{bubbles:true}));w.dispatchEvent(new w.Event('load'));
  const main=w.document.getElementById('conteudo');
  w.location.hash='#planos';w.dispatchEvent(new w.Event('hashchange'));
  main.querySelector('[data-pl-iniciar]').click();
  const cards=[...w.document.querySelectorAll('.gp-prazo-card')].map(c=>(c.querySelector('.gp-prazo-ritmo')||{}).textContent+' -> '+(c.querySelector('.gp-prazo-unid')||{}).textContent);
  cb(titulo,cards,errs);
}
function show(t,cards,errs){console.log(t+':');cards.forEach(c=>console.log('  '+c));console.log('  err:',errs.length?errs[0]:'none');}
run('Edital MINÚSCULO (6 tópicos)',2,3,show);
run('Edital PEQUENO (assistente ~40)',5,8,show);
run('Edital MÉDIO (~90)',9,10,show);
run('Edital GRANDE (analista ~165)',11,15,show);
