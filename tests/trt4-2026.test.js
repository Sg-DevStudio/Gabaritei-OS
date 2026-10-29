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
  assert.equal(urls.length,127);
  for(const u of urls){assert.equal(u.searchParams.get('banca'),'92');assert.equal(u.searchParams.get('nivel'),'1');assert(u.searchParams.get('assunto'));}
  assert(Object.values(w.TrilhaVinculosTRT4).every(t=>t.links.length<=1));
  for(const titulo of ['TRT4 Técnico Administrativo (Edital 2022)','TRT4 Analista Administrativo (Edital 2026)','TRT4 Técnico Administrativo Polícia Judicial (Edital 2026)','TRF2 Analista Administrativo']) {
    assert(w.Trilha.render({...state,plano:{concurso:titulo}}).includes('Caderno de questões indisponível'));
  }
});
test('Lei 8.112 usa capítulos por subtópico e não o filtro da lei inteira',()=>{
  const w=load().window,m=w.TrilhaVinculosTRT4;
  const esperado={'LEG-01':'404501,404503,404512','LEG-02':'404511,404510','LEG-03':'404505,404506,404507,404508,422909','LEG-04':'404514,404515,404516','LEG-05':'404517,404518','LEG-06':'404519'};
  for(const [id,code] of Object.entries(esperado)){
    const l=m[id].links[0];assert.equal(new URL(l.url).searchParams.get('assunto'),code,id);
    assert.equal(l.exact,true,id);assert.equal(l.filtroAmplo,false,id);
    assert(!l.code.split(',').includes('404430'),id);
  }
});
test('assuntos específicos corrigidos não voltam a usar filtros de disciplina',()=>{
  const m=load().window.TrilhaVinculosTRT4;
  for(const [id,code] of Object.entries({'POR-16':'406881','MAT-10':'7194,7195,7202,7206,7212','LTRT-02':'399889','DAD-15':'395730','DAD-17':'459054','DPT-08':'431650,406839'})){
    assert.equal(m[id].links[0].code,code,id);
  }
  const proibidos=new Set(['403587','403825','404335','403716','404571','406746','406809','407069','404430']);
  for(const [id,t] of Object.entries(m))for(const l of t.links){
    assert(l.code.split(',').every(code=>!proibidos.has(code)),id);
    assert.equal(l.assuntosVerificados.length,l.code.split(',').length,id);
    if(l.filtroAmplo)assert(l.aviso.length>30,id);
  }
  assert.equal(m['LTRT-06'].links.length,0);
  assert(m['LTRT-06'].pendencia.includes('Código de Conduta'));
});
test('auditoria registra origem e exceções; correção mantém links pessoais do aluno',()=>{
  const w=load().window,a=JSON.parse(fs.readFileSync('data/caderno-trt4-gran-auditoria.json','utf8'));
  assert.equal(a.vinculos.length,127);assert.equal(a.pendencias.length,6);
  assert.equal(a.vinculos.filter(v=>v.tipo==='amplo').length,3);
  assert(a.vinculos.filter(v=>v.tipo==='amplo').every(v=>v.motivo.length>30));
  const b=w.CadernoTRT4Base;
  const custom={id:'pessoal',tipo:'trilha',topicoChave:'plano:LEG:LEG-02',nome:'Meu caderno',url:'https://example.org/minhas-questoes'};
  const state={planoAtivoId:'p',plano:{concurso:b.titulo},disciplinas:b.disciplinas,links:[custom]};
  const html=w.Trilha.render(state);assert(html.includes(custom.url));
  assert.equal(state.links[0],custom);assert(html.includes('Filtro específico do Gran'));assert(html.includes('Filtro amplo do Gran'));
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
