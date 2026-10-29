const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const c=vm.createContext({window:{},URL});
for(const f of ['data/catalogo-editais.js','data/trilha-vinculos-trf2.js','data/caderno-tjsp.js','js/trilha.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);
test('TRF2 preserva as 13 disciplinas e recorta direitos e orçamento corretamente',()=>{
 const w=c.window,b=w.CATALOGO_EDITAIS_BASE.find(e=>e.id==='carreira-trf2-tjaa-2024'),m=w.TrilhaVinculosTRF2;
 assert.equal(b.disciplinas.length,13);assert.equal(b.disciplinas.flatMap(d=>d.topicos).length,121);
 assert.equal(m['ADM-09'].links[0].code,'404514,404515,404516,404517,404518');
 assert.equal(m['ADM-10'].links[0].code,'404519');
 assert.equal(m['AFO-03'].links[0].code,'405632,405633,405634');
 assert.equal(m['AFO-11'].links[0].code,'424344');
 assert.equal(m['AGP-03'].links[0].code,'404674');
 for(const id of ['ADM-14','EST-02']){assert.equal(m[id].links.length,0);assert(m[id].pendencia);}
 const html=w.Trilha.render({plano:{concurso:b.titulo},disciplinas:b.disciplinas,links:[]});
 assert.equal((html.match(/class="trilha-topico"/g)||[]).length,121);
 assert(html.includes('Filtro parcial do Gran'));assert(html.includes('Filtro específico do Gran'));
});
test('TJSP seleciona dispositivos da LBI e crimes, e informa ausência de questões no recorte',()=>{
 const w=c.window,m=w.TrilhaVinculosTJSP;
 assert.equal(m['ATU-04'].links[0].code,'433292,433279');assert.equal(m['ATU-05'].links[0].code,'433284');
 assert.equal(m['DPE-04'].links[0].code,'406475,406476,406477,406478,406479,406480');
 assert(m['DPP-04'].links[0].coberturaParcial);assert(m['ATU-05'].links[0].semResultadosNoRecorte);
 const b=w.CadernoTJSPBase,html=w.Trilha.render({plano:{concurso:b.titulo},disciplinas:b.disciplinas,links:[]});
 assert(html.includes('Sem questões no recorte selecionado'));assert(html.includes('Consultar no Gran'));
});
test('todos os novos vínculos referenciam categorias com acervo e justificam exceções',()=>{
 for(const tag of ['TRF2','TJSP'])for(const [id,t] of Object.entries(c.window['TrilhaVinculos'+tag])){
  assert(t.links.length<=1,id);
  if(!t.links.length){assert(t.pendencia,id);continue;}
  const l=t.links[0],u=new URL(l.url);assert.equal(u.pathname,'/questoes');
  assert.equal(l.assuntosVerificados.length,l.code.split(',').length,id);
  assert(l.assuntosVerificados.every(a=>a.questoesCatalogo>0),id);
  if(l.filtroAmplo||l.coberturaParcial)assert(l.aviso.length>20,id);
 }
});
test('registro da revisão contempla cada tópico de cada disciplina, inclusive pendências',()=>{
 for(const [tag,nd,nt] of [['trf2',13,121],['tjsp',12,80]]){
  const a=JSON.parse(fs.readFileSync('data/caderno-'+tag+'-gran-auditoria.json','utf8'));
  assert.equal(a.disciplinasConferidas.length,nd);
  const ts=a.disciplinasConferidas.flatMap(d=>d.topicos);assert.equal(ts.length,nt);
  assert(ts.every(t=>['especifico','amplo','parcial','pendente'].includes(t.tipo)));
  for(const t of ts.filter(t=>t.tipo!=='especifico'))assert(t.motivo,t.id);
 }
});
test('link pessoal da LBI substitui o aviso da base sem alterar a edição do aluno',()=>{
 const w=c.window,b=w.CadernoTJSPBase,link={id:'ref-editada',tipo:'trilha',topicoChave:'plano:ATU:ATU-05',nome:'Meu material',url:'https://example.org/lbi'};
 const html=w.Trilha.render({plano:{concurso:b.titulo},disciplinas:b.disciplinas,links:[link]});
 const row=html.split('<article class="trilha-topico"').find(x=>x.includes('arts. 34 a 38'));
 assert(row.includes('Links adicionados por você'));assert(!row.includes('Sem questões no recorte selecionado'));
 assert(row.includes(link.url));assert.equal(link.url,'https://example.org/lbi');
});
