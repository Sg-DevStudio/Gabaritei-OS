const fs = require('fs');
const { JSDOM } = require('jsdom');
const pf = JSON.parse(fs.readFileSync('data/plano-trf3-tecnico.json', 'utf8'));
const pid = 'pln';
const d0 = pf.disciplinas[0];
const t0 = (d0.topicos && d0.topicos[0]) ? d0.topicos[0].id : null;
const hojeSeg = (function(){ const d=new Date(); const wd=d.getDay(); const off=wd===0?6:wd-1; d.setDate(d.getDate()-off); return d.toISOString().slice(0,10); })();
function run(state, hash, cb) {
  const dom = new JSDOM(fs.readFileSync('index.html', 'utf8'), { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://example.com/' });
  const w = dom.window; global.window = w;
  w.Chart = function () { return { destroy() {}, update() {} }; };
  w.matchMedia = function (q) { return { matches: false, media: q, addEventListener() {}, addListener() {} }; };
  w.scrollTo = function () {}; w.confirm = () => false; w.fetch = () => Promise.reject(new Error('no net'));
  w.FirebaseSync = { status() { return { estado: 'sincronizado', texto: 'ok', fonte: 'Firebase', usuario: { email: 'x@y.com', uid: 'u1' } }; }, iniciar() {}, agendarEnvio() {}, sincronizarAgora() { return Promise.resolve(); }, login() { return Promise.resolve(); }, logout() { return Promise.resolve(); }, ativo() { return true; }, carregarCatalogoGlobal() { return Promise.resolve([]); } };
  w.localStorage.setItem('estudos.v1', JSON.stringify(state));
  const errs = []; w.addEventListener('error', e => errs.push(e.error && e.error.stack || e.message));
  ['js/frases.js','js/domain.js','js/store.js','js/sync.js','js/timer.js','js/charts.js','js/app.js'].forEach(f => w.eval(fs.readFileSync(f, 'utf8')));
  w.dispatchEvent(new w.Event('firebase-sync-ready'));
  w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true })); w.dispatchEvent(new w.Event('load'));
  w.location.hash = hash; w.dispatchEvent(new w.Event('hashchange'));
  cb(w, errs);
}
function plano(extra){ return Object.assign({}, pf.plano, Object.assign({ ritmoAtivo:'plano_ativo', gerado_em: hojeSeg, ultimaRecalcSemana: hojeSeg, ritmos:{plano_ativo:{meses:9,semanas:39,h_semana:27}} }, extra)); }
function st(sessoes){ return { versao:2, planos:[{id:pid,criadoEm:hojeSeg,plano:plano(),disciplinas:pf.disciplinas,cronogramas:{plano_ativo:[{semana:1,inicio:hojeSeg,blocos:[{disciplina:d0.id,topico:t0,tipo:'teoria'}],marcos:[]}]},links:[]}],planoAtivoId:pid,sessoes:sessoes||[],revisoes:[],simulados:[],agenda:[],editais:[],flashcards:[],config:{tema:'escuro',criadoEm:hojeSeg,atualizadoEm:hojeSeg,googleCalendar:{calendarId:'primary',eventos:{}}} }; }
// A) plano novo, 0h
run(st([]), '#planejamento', function (w, errs) {
  const b = w.document.querySelector('.checkin-badge');
  console.log('A) plano novo 0h → badge:', b ? b.textContent.trim() : '(sem)', errs.length?('ERR '+errs[0]):'');
});
