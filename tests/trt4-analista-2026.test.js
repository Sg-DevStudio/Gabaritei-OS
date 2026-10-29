const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function load(){const c=vm.createContext({window:{},URL});for(const f of ['data/edital-trt4-2026.js','data/edital-trt4-analista-2026.js','data/caderno-trt4.js','js/trilha.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);return c.window;}
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
 assert(w.Trilha.render({plano:{concurso:b.titulo},disciplinas:b.disciplinas,links:[]}).includes('Caderno de questões indisponível'));
 assert.equal(w.CATALOGO_EDITAIS_BASE.filter(e=>e.id===b.id).length,1);
});
