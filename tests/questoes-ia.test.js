const test=require('node:test'),assert=require('node:assert/strict');
const Q=require('../js/questoes-ia');
const config={nome:'Licitações',formato:'multipla5',quantidade:10,dificuldade:'intermediaria'};
const origem={tipo:'texto',texto:'A sessão de estudo tem duração de sessenta minutos.'};
function resposta(){return {questoes:Array.from({length:10},(_,i)=>({enunciado:'Questão '+i,alternativas:['A','B','C','D','E'],correta:i%5,comentario:'Explicação do gabarito.',trecho:'A sessão de estudo tem duração de sessenta minutos.',pagina:0}))};}
test('explicações de caderno antigo são validadas e persistem sem alterar gabarito e respostas',()=>{
 const old=Q.validar(resposta(),config,origem);old.respostas.q1=2;const before=JSON.stringify(old),q=old.questoes[0];
 const reasons=Q.validarExplicacoes({erro:'',explicacoes:q.alternativas.map((_,i)=>'A justificativa específica da alternativa '+i+'.')},q);
 const copy=JSON.parse(before);copy.questoes[0].explicacoes=reasons;const restored=Q.caderno(copy);
 assert.equal(JSON.stringify(old),before);assert.equal(restored.respostas.q1,2);assert.equal(restored.questoes[0].correta,q.correta);assert.deepEqual(restored.questoes[0].explicacoes,reasons);
});
test('não aceita explicação truncada ou sem fundamento e pede o conceito errado no prompt',()=>{
 const q=resposta().questoes[0];assert.throws(()=>Q.validarExplicacoes({erro:'A referência não sustenta esta distinção.',explicacoes:[]},q),/referência/);
 assert.throws(()=>Q.validarExplicacoes({explicacoes:['Só uma']},q),/incompletas/);
 assert.throws(()=>Q.validarExplicacoes({explicacoes:q.alternativas.map(()=>'<'.repeat(801))},q),/incompletas/);
 const prompt=Q.promptExplicacoes(q);assert.match(prompt,/conceito errado/);assert.match(prompt,/SOMENTE/);assert.match(prompt,/Não altere o gabarito/);assert.match(prompt,/sessão de estudo/);
});
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

test('organização e lixeira não removem respostas ou referências de cadernos antigos',()=>{
 const original=Q.validar(resposta(),config,origem);original.id='bank-1';original.respostas.q1=0;
 const clean=Q.caderno({...original,config:{...original.config,disciplina:'Administrativo',assunto:'Atos',planoId:'trf2',planoNome:'TRF2'},excluidoEm:'2026-11-11T12:00:00Z'});
 assert.equal(clean.respostas.q1,0);assert.equal(clean.config.disciplina,'Administrativo');assert.equal(clean.origem.arquivo,original.origem.arquivo);
 const restored=Q.caderno({...clean,excluidoEm:''});assert.deepEqual(restored.questoes,clean.questoes);assert.deepEqual(restored.respostas,clean.respostas);
 assert.equal(Q.caderno(original).config.disciplina,'');
});

test('quantidade personalizada aceita de 1 a 100 e gera etapas de até 20',async()=>{
 for(const quantidade of [1,17,100])assert.equal(Q.configurar({...config,quantidade}).quantidade,quantidade);
 for(const quantidade of [0,101,1.5])assert.throws(()=>Q.configurar({...config,quantidade}),/1 e 100/);
 const chamadas=[];const result=await Q.gerarEmLotes({...config,quantidade:100},async(c,contexto)=>{
  chamadas.push(c.quantidade);return {questoes:Array.from({length:c.quantidade},(_,i)=>({...resposta().questoes[0],enunciado:'Questão '+(contexto.geradas+i)}))};
 });assert.deepEqual(chamadas,[20,20,20,20,20]);assert.equal(Q.validar(result,{...config,quantidade:100},origem).questoes.length,100);
});
test('uma falha de cota preserva o que já foi gerado para salvar um lote parcial',async()=>{
 await assert.rejects(Q.gerarEmLotes({...config,quantidade:41},async(c,ctx)=>{
  if(ctx.indice===3)throw Error('HTTP 429: quota');return {questoes:Array.from({length:c.quantidade},(_,i)=>({...resposta().questoes[0],enunciado:'Questão '+(ctx.geradas+i)}))};
 }),error=>error.questoesParciais.length===40&&error.quantidadeSolicitada===41);
});

test('geração em etapas mantém a página do PDF até o mapeamento final',async()=>{
 const result=await Q.gerarEmLotes(config,async()=>{const data=resposta();data.questoes.forEach(q=>q.pagina=2);return JSON.stringify(data);});
 const bank=Q.validar(result,config,{tipo:'pdf',nome:'arquivo.pdf',paginas:[1,3]});assert.equal(bank.questoes[0].pagina,4);
});

test('exemplos de concursos são cadernos comuns, editáveis e com referências legais',()=>{
 const examples=require('../data/cadernos-exemplos.json');assert.equal(examples.length,3);
 for(const bank of examples){const clean=Q.caderno(bank);assert.equal(clean.questoes.length,5);assert.equal(clean.excluidoEm,'');assert.equal(clean.arquivadoEm,'');assert.equal(clean.id,'');assert.equal(/teste|fictíci/i.test(clean.nome),false);assert.ok(clean.questoes.every(q=>q.comentario.includes('Referência:')));}
});

test('lotes Groq com justificativas respeitam três questões por etapa',async()=>{
 const chunks=[];const result=await Q.gerarEmLotes({...config,quantidade:12},async(c,ctx)=>{chunks.push(c.quantidade);return {questoes:Array.from({length:c.quantidade},(_,i)=>({...resposta().questoes[0],enunciado:'Assunto '+(ctx.geradas+i)}))};},undefined,3);assert.deepEqual(chunks,[3,3,3,3]);assert.equal(result.questoes.length,12);
});

test('justificativas por alternativa são opcionais em cadernos antigos e preservadas nos novos',()=>{
 const raw=resposta();raw.questoes[0].explicacoes=['Razão A','Razão B','Razão C','Razão D','Razão E'];const bank=Q.validar(raw,config,origem);bank.respostas.q1=2;
 const restored=Q.caderno(JSON.parse(JSON.stringify(bank)));assert.deepEqual(restored.questoes[0].explicacoes,raw.questoes[0].explicacoes);assert.equal(restored.respostas.q1,2);assert.equal(restored.questoes[1].explicacoes,undefined);
 raw.questoes[0].explicacoes=['Incompleta'];assert.throws(()=>Q.validar(raw,config,origem),/justificativas/);
});
test('geração nova exige justificativas completas sem invalidar a leitura de versões antigas',async()=>{
 await assert.rejects(Q.gerarEmLotes(config,async()=>resposta(),origem,10,true),/justificativas/);
 const raw=resposta();raw.questoes.forEach(q=>q.explicacoes=q.alternativas.map((a,i)=>'Explicação '+i));const result=await Q.gerarEmLotes(config,async()=>raw,origem,10,true);assert.equal(result.questoes[0].explicacoes.length,5);
});
test('autoavaliação dos cartões é independente das respostas e conserva tentativas anteriores',()=>{
 const bank=Q.validar(resposta(),config,origem);bank.respostas.q1=0;bank.treinoCartoes=Q.avaliarCartao(bank,'q1',false,'2026-11-12');bank.treinoCartoes=Q.avaliarCartao(bank,'q1',true,'2026-11-12');
 const restored=Q.caderno(JSON.parse(JSON.stringify(bank)));assert.equal(restored.respostas.q1,0);assert.equal(restored.treinoCartoes.q1.acertos,1);assert.equal(restored.treinoCartoes.q1.erros,1);assert.equal(restored.treinoCartoes.q1.ultimo,'acertou');
 assert.throws(()=>Q.avaliarCartao(bank,'inexistente',true,''));assert.throws(()=>Q.caderno({...bank,treinoCartoes:{q1:{acertos:-1,erros:0,ultimo:'acertou'}}}),/inválido/);
});
