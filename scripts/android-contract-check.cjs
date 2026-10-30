// Confere uma saída sintética dos testes Kotlin usando as regras reais do site.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const file=process.argv[2];if(!file)throw Error('Informe o JSON gerado por StateCompatTest (GABARITEI_FIXTURE_OUT).');
const c=vm.createContext({window:{},console});
for(const name of ['js/domain.js','js/store.js'])vm.runInContext(fs.readFileSync(name,'utf8'),c);
const raw=JSON.parse(fs.readFileSync(file,'utf8'));raw.planoAtivoId='pl-real';
const state=c.window.Store.normalizar(raw),totals=c.window.Dominio.totaisEstudo(state);
assert.equal(totals.minutos,30);assert.equal(totals.qFeitas,10);assert.equal(totals.qCertas,8);
assert.equal(state.planos[0].disciplinas[0].topicos[0].status,'teoria_concluida');
assert.equal(state.planos[0].disciplinas[0].topicos[0].futuro,'não apagar');
assert.equal(state.revisoes.length,5);assert.equal(state.agenda.length,1);
assert.equal(state.outraRaiz.valor,true);assert.equal(state.config.metaDesconhecida,'preservada');
console.log('Contrato Kotlin → site: tempo, questões, acertos, conclusão, agenda, revisões e campos desconhecidos preservados.');

if(process.argv[3]){
  const edited=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));edited.planoAtivoId='p';
  const normalized=c.window.Store.normalizar(edited);
  assert.equal(normalized.sessoes.length,2);
  const free=normalized.sessoes.find(s=>s.id==='free');
  assert.equal(free.estudoLivre,true);assert.equal(free.planoId,null);
  assert.equal(free.topicoNome,'Leitura livre');
  assert.equal(normalized.planos[0].disciplinas[0].campoFuturo,99);
  const planned=c.window.Dominio.totaisEstudo(normalized);
  assert.equal(planned.minutos,20);assert.equal(planned.qFeitas,10);
  console.log('Estudo livre preservado no site e separado dos totais do plano.');
}

if(process.argv[4]){
  const notebook=JSON.parse(fs.readFileSync(process.argv[4],'utf8'));notebook.planoAtivoId='p';
  const normalized=c.window.Store.normalizar(notebook);
  const links=normalized.planos[0].links;
  assert.equal(links.length,3);
  assert.equal(links.filter(l=>l.topicoChave==='plano:d:t').length,3);
  assert.equal(links.find(l=>l.id==='gran').principal,true);
  assert.equal(links.find(l=>l.id==='notebook').url,'https://notebooklm.google.com/notebook/x');
  console.log('Caderno com vários links e IDs preservado no contrato do site.');
}
