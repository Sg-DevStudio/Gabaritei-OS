const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function load(){const c=vm.createContext({window:{},URL});for(const f of ['data/edital-trt4-2026.js','data/edital-trt4-analista-2026.js','data/caderno-trt4.js','data/caderno-trt4-analista.js','js/trilha.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);return c.window;}
test('novo plano corresponde ao cargo 01 e não reaproveita o programa errado do Técnico',()=>{
 const w=load(),b=w.EditalTRT4Analista2026.base,tec=w.EditalTRT42026.base;
 assert.equal(b.id,'edital-trt4-analista-judiciaria-2026');assert.notEqual(b.id,tec.id);
 assert.equal(b.disciplinas.length,13);assert.equal(b.disciplinas.flatMap(d=>d.topicos).length,228);
 assert.equal(b.salario,'R$ 16.040,88');assert.equal(b.nivel,'superior');assert(b.requisito.includes('Direito'));
 assert.equal(b.janelaProva.inicio,'2027-01-31');assert.equal(b.banca,'FCC');
 for(const id of ['CIV','DPC','EC'])assert(b.disciplinas.some(d=>d.id===id));
 for(const id of ['APU','AFO','RED','PEN','DPP'])assert(!b.disciplinas.some(d=>d.id===id),id);
 assert(!b.disciplinas.find(d=>d.id==='DAD').topicos.some(t=>t.nome.toLowerCase().includes('improbidade')));
 assert(tec.disciplinas.find(d=>d.id==='DAD').topicos.some(t=>t.id==='DAD-12'));
 assert(b.disciplinas.find(d=>d.id==='CON').topicos.some(t=>t.nome.includes('Ministros')));
 assert(b.disciplinas.find(d=>d.id==='DTR').topicos.some(t=>t.nome.includes('intermitente')));
});
test('estimativas honestas, identidade e horas numéricas não contaminam outros planos',()=>{
 const w=load(),b=w.EditalTRT4Analista2026.base,tec=w.EditalTRT42026.base;
 assert.equal(b.notaCorteVerificada,false);assert.equal(b.incidenciaVerificada,false);assert.equal(b.notaCorte,'');
 const ts=b.disciplinas.flatMap(d=>d.topicos);assert.equal(new Set(ts.map(t=>t.id)).size,ts.length);
 assert(ts.every(t=>Number.isFinite(t.horas_estimadas)&&t.horas_estimadas>0&&t.horas_estimadas<=9));
 assert(ts.reduce((a,t)=>a+t.horas_estimadas,0)<3000);
 assert.notEqual(b.disciplinas[0],tec.disciplinas[0]);
 assert(!w.Trilha.render({plano:{concurso:b.titulo},disciplinas:b.disciplinas,links:[]}).includes('Caderno de questões indisponível'));
 assert(fs.existsSync(b.foto));assert(b.fotoAlt.includes('TRT'));
 assert.equal(w.EditalTRT4Analista2026.atualizarCatalogo({id:b.id}).foto,b.foto);
 assert.equal(w.EditalTRT4Analista2026.atualizarCatalogo({id:b.id,foto:'pessoal.png'}).foto,'pessoal.png');
 assert.equal(w.CATALOGO_EDITAIS_BASE.filter(e=>e.id===b.id).length,1);
});


test('caderno próprio cobre todos os tópicos com um filtro FCC ou pendência explícita',()=>{
 const w=load(),b=w.EditalTRT4Analista2026.base,map=w.TrilhaVinculosTRT4Analista;
 const audit=JSON.parse(fs.readFileSync('data/caderno-trt4-analista-gran-auditoria.json','utf8'));
 const ts=b.disciplinas.flatMap(d=>d.topicos);assert.equal(Object.keys(map).length,228);
 assert.equal(audit.vinculos.length,228);
 for(const t of ts){
  const v=map[t.id];assert(v,t.id);assert.equal(v.nome,t.nome);assert(v.links.length<=1);
  if(!v.links.length){assert(v.pendencia);continue;}
  const l=v.links[0],u=new URL(l.url);assert.equal(u.hostname,'questoes.grancursosonline.com.br');
  assert.equal(u.searchParams.get('banca'),'92');assert.equal(u.searchParams.get('nivel'),'1');
  assert.equal(u.searchParams.get('assunto'),l.code);assert(l.verificadoEm);
  assert.equal(l.assuntosVerificados.map(x=>x.id).join(','),l.code);
  assert(l.assuntosVerificados.every(x=>x.nome&&x.questoesCatalogo>0));
  if(l.filtroAmplo||l.coberturaParcial)assert(l.aviso);
 }
 assert.equal(map['CIV-27'].links[0].code,'425028');
 assert(map['CIV-28'].links[0].code.includes('406105'));
 assert.equal(map['DPC-23'].links[0].code,'402224,402225,402226,402227');
 const html=w.Trilha.render({plano:{concurso:b.titulo},disciplinas:b.disciplinas,links:[]});
 assert.equal((html.match(/class="trilha-topico"/g)||[]).length,228);assert(html.includes('>FCC<'));
 for(const titulo of ['TRT4 RS — Analista Judiciário · Área Administrativa (Edital 2026)','TRT4 RS — Analista Judiciário · Área Judiciária — Oficial de Justiça (Edital 2026)','TRT1 — Analista Judiciário · Área Judiciária (Edital 2026)']){
  assert(w.Trilha.render({plano:{concurso:titulo},disciplinas:b.disciplinas,links:[]}).includes('Caderno de questões indisponível'),titulo);
 }
});
