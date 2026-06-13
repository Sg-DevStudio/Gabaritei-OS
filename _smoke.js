const fs=require('fs');const {JSDOM}=require('jsdom');
const pf=JSON.parse(fs.readFileSync('data/plano-trf3-tecnico.json','utf8'));
const ef=JSON.parse(fs.readFileSync('data/edital-trf3-tjaa-2024.json','utf8'));
const pid='pln';
const state={versao:2,planos:[{id:pid,criadoEm:'2026-06-12',plano:Object.assign({},pf.plano,{ritmoAtivo:'sustentavel',gerado_em:pf.gerado_em}),disciplinas:pf.disciplinas,cronogramas:{sustentavel:[],hardcore:[]},links:[]}],planoAtivoId:pid,sessoes:[{id:'s1',planoId:pid,data:'2026-06-12',topicoId:'CON-01',tipo:'questoes',duracaoMin:30,qFeitas:10,qCertas:7}],revisoes:[],simulados:[],agenda:[],editais:[Object.assign({id:'e1',criadoEm:'2026-06-12',titulo:ef.titulo,banca:ef.banca,cargo:ef.cargo,orgao:'TRF3',estado:'SP',notaCorte:84,arquivado:false,disciplinas:ef.disciplinas})],config:{metaQuestoesSemana:120,tema:'claro',criadoEm:'2026-06-12',atualizadoEm:'2026-06-12',nomeUsuario:'Samuel',googleCalendar:{clientId:'',calendarId:'primary',eventos:{}}}};
const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{runScripts:'outside-only',pretendToBeVisual:true,url:'https://example.com/'});
const {window}=dom;global.window=window;
window.Chart=function(){return{destroy(){},update(){}};};window.matchMedia=window.matchMedia||function(){return{matches:false,addEventListener(){},addListener(){}};};
window.scrollTo=function(){};window.confirm=()=>false;window.fetch=()=>Promise.reject(new Error('no net'));
window.AudioContext=function(){return{state:'running',resume(){},currentTime:0,createOscillator(){return{type:'',frequency:{setValueAtTime(){}},connect(){return{connect(){}}},start(){},stop(){}};},createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return{connect(){}}}};},destination:{}};};
window.localStorage.setItem('estudos.v1',JSON.stringify(state));
const errs=[];window.addEventListener('error',e=>errs.push(e.error&&e.error.message||e.message));
['js/frases.js','js/domain.js','js/store.js','js/sync.js','js/timer.js','js/charts.js','js/app.js'].forEach(f=>window.eval(fs.readFileSync(f,'utf8')));
window.document.dispatchEvent(new window.Event('DOMContentLoaded',{bubbles:true}));window.dispatchEvent(new window.Event('load'));
const main=window.document.getElementById('conteudo');
['hoje','timer','edital','ajustes','disciplina-CON'].forEach(r=>{
  errs.length=0;
  window.location.hash='#'+r;window.dispatchEvent(new window.Event('hashchange'));
  console.log(r.padEnd(16),'len',String(main.innerHTML.length).padStart(6), errs.length?('ERR '+errs[0]):'ok');
});
// checagens específicas
window.location.hash='#edital';window.dispatchEvent(new window.Event('hashchange'));
// abrir Constitucional para ver fogo
const con=main.querySelector('[data-disc="CON"]'); if(con) con.click();
const fireEdital=(main.innerHTML.match(/🔥/g)||[]).length;
console.log('🔥 no edital (CON aberta):', fireEdital);
window.location.hash='#ajustes';window.dispatchEvent(new window.Event('hashchange'));
console.log('ajustes tem "Seu nome":', main.innerHTML.indexOf('Seu nome na tela Hoje')>=0);
console.log('ajustes tem "Plano atual":', main.innerHTML.indexOf('Plano atual')>=0);
console.log('ajustes tem "Organizar edital bruto":', main.innerHTML.indexOf('Organizar edital bruto')>=0);
console.log('ajustes tem "Meta de questões":', main.innerHTML.indexOf('Meta de questões')>=0);
console.log('ajustes tem Ritmo:', main.innerHTML.indexOf('Ritmo do cronograma')>=0);
window.location.hash='#hoje';window.dispatchEvent(new window.Event('hashchange'));
console.log('hoje tem botão editar meta:', main.innerHTML.indexOf('data-editar-meta')>=0);
console.log('hoje estudar-hoje-card:', main.innerHTML.indexOf('estudar-hoje-card')>=0);
console.log('timer noções stripped (disc detalhe header):');
window.location.hash='#disciplina-CON';window.dispatchEvent(new window.Event('hashchange'));
console.log('  detalhe h1 inclui "Noções":', main.innerHTML.indexOf('Noções de Direito Constitucional')>=0, '| inclui "Direito Constitucional":', main.innerHTML.indexOf('Direito Constitucional')>=0);
