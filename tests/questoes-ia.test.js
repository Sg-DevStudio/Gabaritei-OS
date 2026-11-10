const test=require('node:test'),assert=require('node:assert/strict');
const Q=require('../js/questoes-ia');
const config={nome:'Licitações',formato:'multipla5',quantidade:10,dificuldade:'intermediaria'};
const origem={tipo:'texto',texto:'A sessão de estudo tem duração de sessenta minutos.'};
function resposta(){return {questoes:Array.from({length:10},(_,i)=>({enunciado:'Questão '+i,alternativas:['A','B','C','D','E'],correta:i%5,comentario:'Explicação do gabarito.',trecho:'A sessão de estudo tem duração de sessenta minutos.',pagina:0}))};}
test('valida questões e preserva somente o contrato esperado',()=>{
 const r=resposta();r.questoes[0].extra='ignorado';const bank=Q.validar(JSON.stringify(r),config,origem);
 assert.equal(bank.questoes.length,10);assert.equal(bank.questoes[0].extra,undefined);assert.equal(bank.questoes[0].pagina,null);
});
test('rejeita lote truncado, gabarito inválido, repetições e citação inventada',()=>{
 const a=resposta();a.questoes.pop();assert.throws(()=>Q.validar(a,config,origem));
 const b=resposta();b.questoes[0].correta=5;assert.throws(()=>Q.validar(b,config,origem));
 const c=resposta();c.questoes[1].enunciado=c.questoes[0].enunciado;assert.throws(()=>Q.validar(c,config,origem));
 const d=resposta();d.questoes[0].trecho='Outra lei que não foi enviada';assert.throws(()=>Q.validar(d,config,origem));
});
test('páginas recortadas são mapeadas de volta ao PDF original',()=>{
 assert.deepEqual(Q.paginas('2,4-6,4',8),[1,3,4,5]);
 const r=resposta();r.questoes.forEach(q=>q.pagina=2);
 assert.equal(Q.validar(r,config,{tipo:'pdf',paginas:[1,7]}).questoes[0].pagina,8);
 assert.throws(()=>Q.validar(r,config,{tipo:'pdf',paginas:[1]}));
 for(const v of ['0','8-4','a','1-21','3-50'])assert.throws(()=>Q.paginas(v,100));
});
test('certo ou errado tem exatamente duas alternativas e gabarito consistente',()=>{
 const r=resposta();r.questoes.forEach(q=>{q.alternativas=['Certo','Errado'];q.correta=1;});
 const b=Q.validar(r,{...config,formato:'certoerrado'},origem);assert.equal(b.questoes[0].correta,1);
 r.questoes[0].alternativas=['Sim','Não'];assert.throws(()=>Q.validar(r,{...config,formato:'certoerrado'},origem));
});
test('salvar e reabrir conserva respostas, arquivo, páginas e identidade',()=>{
 const b=Q.validar(resposta(),config,origem);b.id='caderno-teste';b.respostas={q1:0,q2:1,q3:999};b.questoes[0].pagina=8;b.origem={arquivo:'Estudo.pdf',paginas:[8]};
 const restored=Q.caderno(JSON.parse(JSON.stringify(b)));
 assert.equal(restored.id,b.id);assert.equal(restored.questoes[0].pagina,8);assert.deepEqual(restored.origem,b.origem);assert.deepEqual(restored.respostas,{q1:0,q2:1});
 assert.deepEqual(Q.corrigir(restored.questoes,restored.respostas),{respondidas:2,certas:2,total:10});
});
test('cota gratuita é um erro explícito, sem trocar para modelo pago',()=>{
 assert.match(Q.mensagemErro({code:'resource-exhausted',message:'429 quota'}),/cota gratuita/);
 assert.match(Q.mensagemErro(Error('billing required')),/Nenhum serviço pago/);
 assert.throws(()=>Q.configurar({...config,quantidade:1000}));
 assert.throws(()=>Q.caderno({...Q.validar(resposta(),config,origem),id:'../../outro'}));
});
