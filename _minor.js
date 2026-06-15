const fs = require('fs');
const { JSDOM } = require('jsdom');
const pf = JSON.parse(fs.readFileSync('data/plano-trf3-tecnico.json', 'utf8'));
const pid = 'pln';
const d0 = pf.disciplinas[0];
const t0 = (d0.topicos && d0.topicos[0]) ? d0.topicos[0].id : null;

function mk(rotinaDias) {
  const plano = Object.assign({}, pf.plano, { ritmoAtivo: 'plano_ativo', gerado_em: '2026-01-05', ritmos: { plano_ativo: { meses: 1, semanas: 2, h_semana: 20 } } });
  const cron = { plano_ativo: [{ semana: 1, inicio: '2026-01-05', blocos: [{ disciplina: d0.id, topico: t0, tipo: 'teoria' }], marcos: [] }] };
  return { versao: 2, planos: [{ id: pid, criadoEm: '2026-01-01', plano: plano, disciplinas: pf.disciplinas, cronogramas: cron, links: [] }], planoAtivoId: pid, sessoes: [], revisoes: [], simulados: [], agenda: [{ id: 'a1', planoId: pid, data: '2026-01-06', disciplinaId: d0.id, topicoId: null, duracaoMin: 60, obs: 'teoria', feito: false, gerado: true }], editais: [], flashcards: [], config: { rotinaEstudos: { dias: rotinaDias, minBloco: 45, maxBloco: 60 }, tema: 'escuro', criadoEm: '2026-01-01', atualizadoEm: '2026-01-01', googleCalendar: { calendarId: 'primary', eventos: {} } } };
}
function run(state, cb) {
  const dom = new JSDOM(fs.readFileSync('index.html', 'utf8'), { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://example.com/' });
  const w = dom.window; global.window = w;
  w.Chart = function () { return { destroy() {}, update() {} }; };
  w.matchMedia = function (q) { return { matches: false, media: q, addEventListener() {}, addListener() {} }; };
  w.scrollTo = function () {}; w.confirm = () => false; w.fetch = () => Promise.reject(new Error('no net'));
  w.FirebaseSync = { status() { return { estado: 'sincronizado', texto: 'ok', fonte: 'Firebase', usuario: { email: 'casar70@gmail.com', uid: 'u1' } }; }, iniciar() {}, agendarEnvio() {}, sincronizarAgora() { return Promise.resolve(); }, login() { return Promise.resolve(); }, logout() { return Promise.resolve(); }, ativo() { return true; }, carregarCatalogoGlobal() { return Promise.resolve([]); } };
  w.localStorage.setItem('estudos.v1', JSON.stringify(state));
  const errs = []; w.addEventListener('error', e => errs.push(e.error && e.error.stack || e.message));
  ['js/frases.js', 'js/domain.js', 'js/store.js', 'js/sync.js', 'js/timer.js', 'js/charts.js', 'js/app.js'].forEach(f => w.eval(fs.readFileSync(f, 'utf8')));
  w.dispatchEvent(new w.Event('firebase-sync-ready'));
  w.document.dispatchEvent(new w.Event('DOMContentLoaded', { bubbles: true })); w.dispatchEvent(new w.Event('load'));
  cb(w, errs);
}
const diasCheios = { seg: { ativo: true, minutos: 120 } };
const diasVazios = { seg: { ativo: false, minutos: 0 }, ter: { ativo: false, minutos: 0 }, qua: { ativo: false, minutos: 0 }, qui: { ativo: false, minutos: 0 }, sex: { ativo: false, minutos: 0 }, sab: { ativo: false, minutos: 0 }, dom: { ativo: false, minutos: 0 } };
run(mk(diasCheios), function (w, errs) {
  const main = w.document.getElementById('conteudo');
  w.location.hash = '#hoje'; w.dispatchEvent(new w.Event('hashchange'));
  console.log('CTA fim-cronograma:', !!main.querySelector('#hoje-nova-fase'), '| bloco:', !!main.querySelector('.fim-cronograma'), errs.length ? ('ERR ' + errs[0]) : '');
});
run(mk(diasVazios), function (w, errs) {
  const main = w.document.getElementById('conteudo');
  w.location.hash = '#planejamento'; w.dispatchEvent(new w.Event('hashchange'));
  console.log('aviso rotina sem dias:', !!main.querySelector('.aviso-rotina'), '| botão ajustar:', !!main.querySelector('#pl-ajustar-rotina'), errs.length ? ('ERR ' + errs[0]) : '');
});
