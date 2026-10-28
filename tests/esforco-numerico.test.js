const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const c=vm.createContext({window:{}});for(const f of ['js/domain.js','data/edital-tjsp-2026.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c);const d=c.window.Dominio;
test('horas importadas como texto são somadas numericamente em todos os tópicos',()=>{
 const disciplinas=[{id:'PT',topicos:[{horas_estimadas:'6'},{horas_estimadas:4},{horas_estimadas:'2.5'}]},{id:'DIR',topicos:[{horas_estimadas:'8'},{horas_estimadas:'999',orfao:true}]},{id:'ORF',topicos:[{horas_estimadas:'999'}]}];
 assert.equal(d.totalHorasTeoria(disciplinas),20.5);assert.equal(d.totalHorasTeoriaAjustada(disciplinas),20.5);
 assert.equal(d.totalHorasTeoria([{topicos:[{horas_estimadas:'6'},{horas_estimadas:'4'}]}]),10);
 for(const valor of [undefined,null,'',0,-1,'inválido',Infinity])assert.equal(d.horasTeoriaTopico({horas_estimadas:valor}),2);
});
test('esforço real do TJSP equivale à soma das estimativas multiplicada por 1.8',()=>{
 const ds=c.window.EditalTJSP2026.base.disciplinas;
 const esperado=ds.flatMap(x=>x.topicos).reduce((s,t)=>s+Number(t.horas_estimadas),0);
 assert.equal(d.totalHorasTeoria(ds),esperado);
 const horas=Math.round(d.totalHorasTeoria(ds)*1.8);assert(horas>100&&horas<3000);assert(!String(horas).includes('e+'));console.log('TJSP:',esperado,'h de teoria;',horas,'h com questões e revisão');
});
