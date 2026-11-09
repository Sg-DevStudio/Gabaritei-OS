'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const c=vm.createContext({window:{},URL});
for(const f of ['data/catalogo-editais.js','data/trilha-vinculos-trf2.js','data/caderno-tjsp.js','data/caderno-trt4.js','data/caderno-trt4-analista.js','data/caderno-qconcursos.js','data/caderno-tec.js','js/trilha.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
const catalog=JSON.parse(fs.readFileSync(path.join(root,'android/piloto/src/main/assets/catalog.json'),'utf8'));
const platforms=new Set(['questoes.grancursosonline.com.br','www.tecconcursos.com.br','www.qconcursos.com']);
const canonical=s=>{const u=new URL(s);u.searchParams.sort();return u.href;};
test('o catálogo Android contém os mesmos filtros Gran, TEC e Qconcursos renderizados pelo site, tópico a tópico',()=>{
 let covered=0;
 for(const p of catalog.plans.filter(p=>p.disciplines.some(d=>d.topics.some(t=>t.links.length)))){
  for(const d of p.disciplines)for(const t of d.topics){
   const state={plano:{concurso:p.name,origemEditalId:p.id},disciplinas:[{id:d.id,nome:d.name,topicos:[{id:t.id,nome:t.name}]}],links:[]};
   const html=c.window.Trilha.render(state);
   const actual=[...html.matchAll(/href="(https:[^"]+)"/g)].map(m=>m[1].replaceAll('&amp;','&')).filter(s=>platforms.has(new URL(s).hostname)).map(canonical).sort();
   assert.deepEqual(t.links.map(l=>canonical(l.url)).sort(),actual,`${p.id}: ${d.name} / ${t.name}`);
   covered++;
  }
 }
 assert.equal(covered,562);
});
