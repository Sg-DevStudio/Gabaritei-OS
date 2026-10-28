'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const c=vm.createContext({window:{},URL});
for(const f of ['data/caderno-tjsp.js','data/trilha-vinculos-trf2.js','js/trilha.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c);
const base=c.window.CadernoTJSPBase, mapa=c.window.TrilhaVinculosTJSP;
const state={plano:{concurso:base.titulo},disciplinas:base.disciplinas,links:[]};
test('TJSP mantém as 12 disciplinas e 80 tópicos do plano cadastrado, com três bancas',()=>{
 assert.equal(base.disciplinas.length,12);
 assert.equal(base.disciplinas.flatMap(d=>d.topicos).length,80);
 const html=c.window.Trilha.render(state);
 assert.equal((html.match(/class="trilha-topico"/g)||[]).length,80);
 const hrefs=[...html.matchAll(/href="([^"]*questoes\.grancursosonline[^\"]*)"/g)].map(m=>new URL(m[1].replaceAll('&amp;','&')));
 assert.equal(hrefs.length,74);
 for(const u of hrefs){assert.equal(u.searchParams.get('banca'),'252,982,102');assert.equal(u.searchParams.get('nivel'),'2');assert.equal(u.pathname,'/questoes');}
 assert.equal(Object.values(mapa).filter(t=>!t.links.length).length,6);
 assert.ok(html.includes('Filtro amplo'));
 assert.ok(html.includes('gran-logo'));
 assert.ok(html.includes('aria-label="Resolver no Gran:'));
});
test('caderno TJSP 2025 não vaza para planos de outros concursos ou edital 2026',()=>{
 for(const titulo of ['TJSP - Escrevente (Edital 2026)','TJSP - Escrevente (Edital 2024)','Analista da Educação']){
 const html=c.window.Trilha.render({...state,plano:{concurso:titulo}});
 assert.ok(html.includes('Caderno de questões indisponível'));
 assert.ok(!html.includes('gran-logo'));
 }
});
