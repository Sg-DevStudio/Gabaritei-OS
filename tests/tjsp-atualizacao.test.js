const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function load(){const c=vm.createContext({window:{}});for(const f of ['js/domain.js','data/edital-tjsp-2026.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);return c.window;}
test('atualização TJSP mantém IDs, progresso, links e sessões e não altera outros planos',()=>{
 const w=load(), api=w.EditalTJSP2026, id=api.base.id;
 const p={id:'p',plano:{concurso:'TJSP 2025',origemEditalId:id},disciplinas:[{id:'POR',nome:'Português',topicos:[{id:'POR-01',nome:'Antigo',status:'dominado',reaberto:true}]}],links:[{url:'https://example.org',topicoChave:'plano:POR:POR-01'}]};
 const outro={id:'o',plano:{concurso:'Outro'},disciplinas:[]};const state={planos:[p,outro],sessoes:[{id:'s'}]};
 const links=p.links,sessoes=state.sessoes;
 assert(api.atualizarPlanos(state,w.Dominio.mesclarEditalNoPlano));
 assert.equal(p.disciplinas.length,12);assert.equal(p.disciplinas[0].topicos[0].status,'dominado');assert.equal(p.disciplinas[0].topicos[0].reaberto,true);assert.equal(p.links,links);assert.equal(state.sessoes,sessoes);assert.equal(outro.plano.concurso,'Outro');assert.equal(p.plano.radar.janela_prova[0],'2027-03-14');assert(!api.atualizarPlanos(state,w.Dominio.mesclarEditalNoPlano));
});
test('catálogo corrige data, salário e programa de 2026, preserva capa e versões posteriores',()=>{
 const api=load().EditalTJSP2026, e=api.atualizarCatalogo({id:api.base.id,titulo:'2025',foto:'capa.png'});
 assert(e.titulo.includes('2026'));assert.equal(e.foto,'capa.png');assert.equal(e.salario,'R$ 6.782,54');assert(e.disciplinas.find(d=>d.id==='ATU').topicos[0].nome.includes('2026'));
 const futuro={id:api.base.id,atualizadoEm:'2027-01-01'};assert.equal(api.atualizarCatalogo(futuro),futuro);
});
