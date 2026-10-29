const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function load() {
  const c = vm.createContext({window:{},URL});
  for (const f of ['js/domain.js','data/edital-trt4-2026.js','data/caderno-trt4.js','js/trilha.js']) vm.runInContext(fs.readFileSync(f,'utf8'),c);
  return c;
}
test('TRT4 cargo 19: edital 2026, calendário e programa completo sincronizados', () => {
  const w=load().window, b=w.EditalTRT42026.base;
  assert.equal(b.nivel,'superior'); assert.equal(b.janelaProva.inicio,'2027-01-31');
  assert.equal(b.salario,'R$ 9.776,71'); assert.equal(b.banca,'FCC');
  assert.equal(b.disciplinas.length,12);
  const topics=b.disciplinas.flatMap(d=>d.topicos);
  assert.equal(topics.length,133); assert.equal(new Set(topics.map(t=>t.id)).size,133);
  assert(topics.every(t=>Number.isFinite(t.horas_estimadas) && t.horas_estimadas>0 && t.horas_estimadas<100));
  assert(!b.disciplinas.some(d=>d.id==='AFO'||d.id==='DDG'));
  assert(b.disciplinas.find(d=>d.id==='DH'));
  assert.equal(JSON.stringify(b.disciplinas),JSON.stringify(w.CadernoTRT4Base.disciplinas));
});
test('TRT4 preserva progresso e links, arquiva conteúdo removido e não altera outros planos', () => {
  const w=load().window, api=w.EditalTRT42026;
  const links=[{topicoChave:'plano:POR:POR-01',url:'https://example.org'}];
  const p={plano:{origemEditalId:api.base.id},links,disciplinas:[{id:'POR',topicos:[{id:'POR-01',status:'dominado',reaberto:true}]},{id:'AFO',topicos:[{id:'AFO-01',status:'dominado'}]}]};
  const outro={plano:{concurso:'TRF2'},disciplinas:[]},sessoes=[{id:'s'}],state={planos:[p,outro],sessoes};
  assert(api.atualizarPlanos(state,w.Dominio.mesclarEditalNoPlano));
  assert.equal(p.disciplinas[0].topicos[0].status,'dominado');
  assert.equal(p.disciplinas[0].topicos[0].reaberto,true);
  assert(p.disciplinas.find(d=>d.id==='AFO').removidoDoEdital);
  assert.equal(p.links,links);assert.equal(state.sessoes,sessoes);
  assert.equal(outro.plano.concurso,'TRF2');assert(!api.atualizarPlanos(state,w.Dominio.mesclarEditalNoPlano));
  const atualizado=api.atualizarCatalogo({id:api.base.id,foto:'capa'});
  assert.equal(atualizado.foto,'capa');
  const futuro={id:api.base.id,atualizadoEm:'2027'};assert.equal(api.atualizarCatalogo(futuro),futuro);
});
test('caderno TRT4: um filtro por tópico, FCC, superior e isolamento por cargo e edição', () => {
  const w=load().window, b=w.CadernoTRT4Base,state={plano:{concurso:b.titulo},disciplinas:b.disciplinas,links:[]};
  const html=w.Trilha.render(state);
  assert.equal((html.match(/class="trilha-topico"/g)||[]).length,133);
  const urls=[...html.matchAll(/href="([^"]*questoes\.grancursosonline[^\"]*)"/g)].map(m=>new URL(m[1].replaceAll('&amp;','&')));
  assert.equal(urls.length,128);
  for(const u of urls){assert.equal(u.searchParams.get('banca'),'92');assert.equal(u.searchParams.get('nivel'),'1');assert(u.searchParams.get('assunto'));}
  assert(Object.values(w.TrilhaVinculosTRT4).every(t=>t.links.length<=1));
  for(const titulo of ['TRT4 Técnico Administrativo (Edital 2022)','TRT4 Analista Administrativo (Edital 2026)','TRT4 Técnico Administrativo Polícia Judicial (Edital 2026)','TRF2 Analista Administrativo']) {
    assert(w.Trilha.render({...state,plano:{concurso:titulo}}).includes('Caderno de questões indisponível'));
  }
});
test('rota do caderno TRT4 conserva o plano ativo de outro concurso',()=>{
  const c=load(),app=fs.readFileSync('js/app.js','utf8');
  c.cadernoPlanoId='edital:edt-mqhyvmmq-v1pj6';c.state={planos:[],plano:{concurso:'TRF2'},disciplinas:[]};
  c.editalPorId=()=>c.window.EditalTRT42026.base;
  const fonte=app.slice(app.indexOf('  function estadoCaderno() {'),app.indexOf('  function rotaAtual()'));
  vm.runInContext(fonte+'; resultado=estadoCaderno();',c);
  assert.equal(c.resultado.disciplinas.flatMap(d=>d.topicos).length,133);
  assert.equal(c.state.plano.concurso,'TRF2');
});
