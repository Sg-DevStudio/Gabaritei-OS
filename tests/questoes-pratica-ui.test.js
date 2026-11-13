const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const Q=require('../js/questoes-ia');const ctx={window:{QuestoesIA:Q}};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../js/questoes-pratica-ui.js'),'utf8'),ctx);const ui=ctx.window.PraticarQuestoes;
const banco={nome:'Princípios',config:{disciplina:'Administração'},questoes:[{id:'q1',enunciado:'Qual é o princípio?',alternativas:['Opção indevida','Gabarito privado'],correta:1,comentario:'Comentário reservado',trecho:'Fonte',explicacoes:['Justificativa errada','Justificativa correta']}],respostas:{q1:0}};
test('riscar é reversível, desmarca a escolha riscada e não altera respostas salvas',()=>{
 const before=JSON.stringify(banco),old=new Set([1]);const cut=ui.alternarRisco(old,0,0,2);
 assert.deepEqual([...old],[1]);assert.deepEqual([...cut.riscadas].sort(),[0,1]);assert.equal(cut.selecionada,-1);
 const undo=ui.alternarRisco(cut.riscadas,cut.selecionada,0,2);assert.equal(undo.selecionada,-1);assert.deepEqual([...undo.riscadas],[1]);assert.equal(JSON.stringify(banco),before);
 assert.throws(()=>ui.alternarRisco(old,0,2,2));
});
test('uma opção riscada fica indisponível, mas os riscos desaparecem na correção',()=>{
 const draft=ui.html(banco,0,{mostrou:false,riscadas:[0],selecionada:0});assert.match(draft,/qia-eliminada/);assert.match(draft,/value="0" disabled/);assert.doesNotMatch(draft,/ checked/);assert.match(draft,/Restaurar alternativa A/);
 const result=ui.html(banco,0,{mostrou:true,riscadas:[0]});assert.doesNotMatch(result,/qia-eliminada|data-qia-riscar/);assert.match(result,/Justificativa errada/);
});
test('reabrir não expõe o gabarito nem a resposta selecionada anteriormente',()=>{const html=ui.html(banco,0,{mostrou:false});assert.doesNotMatch(html,/ checked|Justificativa errada|Comentário reservado/);assert.match(html,/Errou anteriormente/);});
test('justificativa da alternativa errada fica no mesmo bloco da opção escolhida',()=>{const html=ui.html(banco,0,{mostrou:true});assert.match(html,/incorreta[\s\S]*?Justificativa errada[\s\S]*?<\/label>/);assert.match(html,/correta[\s\S]*?Justificativa correta/);});
test('caderno antigo oferece detalhamento só depois de errar e não aponta para outra alternativa',()=>{
 const old=JSON.parse(JSON.stringify(banco));delete old.questoes[0].explicacoes;
 assert.doesNotMatch(ui.html(old,0,{mostrou:false}),/data-qia-explicar/);
 const html=ui.html(old,0,{mostrou:true});assert.equal((html.match(/data-qia-explicar/g)||[]).length,1);assert.match(html,/Explicar esta alternativa/);assert.doesNotMatch(html,/Veja a explicação junto/);
 old.respostas.q1=1;assert.doesNotMatch(ui.html(old,0,{mostrou:true}),/data-qia-explicar/);
});
test('cartão esconde a resposta antes de virar e escapa o conteúdo do material',()=>{const b=JSON.parse(JSON.stringify(banco));b.questoes[0].enunciado='<script>malicioso</script>';const html=ui.html(b,0,{cartoes:true,mostrou:false});assert.doesNotMatch(html,/Gabarito privado|Comentário reservado|<script>/);assert.match(html,/&lt;script&gt;/);const verso=ui.html(b,0,{cartoes:true,mostrou:true});assert.match(verso,/Gabarito privado/);assert.match(verso,/data-qia-avaliar="false"/);});
