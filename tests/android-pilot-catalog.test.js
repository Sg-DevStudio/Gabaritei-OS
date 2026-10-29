const test=require('node:test'), assert=require('node:assert/strict'),fs=require('node:fs');
const data=JSON.parse(fs.readFileSync('android/piloto/src/main/assets/catalog.json','utf8'));
test('catálogo do piloto mantém identidade, edital completo e links utilizáveis offline',()=>{
 assert.equal(data.schemaVersion,1);assert.equal(data.plans.length,4);
 assert.deepEqual(data.plans.map(p=>p.disciplines.flatMap(d=>d.topics).length),[121,80,133,228]);
 assert.equal(new Set(data.plans.map(p=>p.id)).size,4);
 for(const plan of data.plans){
  const ts=plan.disciplines.flatMap(d=>d.topics);assert.equal(new Set(ts.map(t=>t.id)).size,ts.length);
  for(const t of ts){
   assert(t.id&&t.name);
   if(!t.link){assert(t.note);continue;}
   const u=new URL(t.link);assert.equal(u.protocol,'https:');assert.equal(u.hostname,'questoes.grancursosonline.com.br');assert(u.searchParams.get('assunto'));
   if(plan.id.includes('trt4'))assert.equal(u.searchParams.get('banca'),'92');
   if(t.noQuestions)assert(t.note.includes('Sem questões'));
  }
 }
});
