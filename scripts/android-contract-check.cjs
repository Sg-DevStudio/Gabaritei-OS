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
