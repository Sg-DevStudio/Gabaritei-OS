'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {loadDomain}=require('./helpers/load-domain'),{loadStore}=require('./helpers/load-store');
const D=loadDomain();
function fixture(){
 const S=loadStore(),state=S.estadoVazio();
 state.planos=[{id:'p',plano:{concurso:'TRF2',meta:{corte_pct:85},ciclo:{credito:45}},disciplinas:[{id:'ADM',nome:'Direito Administrativo',topicos:[{id:'ADM-01',nome:'Atos',status:'em_curso'}]}],cronogramas:{sustentavel:[],hardcore:[]},links:[]}];
 state.planoAtivoId='p';S.hidratar(state);
 state.sessoes=[{id:'s',planoId:'p',topicoId:'ADM-01',data:D.hojeISO(),registradoEm:'2026-11-09T10:00:00Z',tipo:'teoria',duracaoMin:45,qFeitas:0,qCertas:0,obs:'Minha aula',campoFuturo:{valor:7}}];
 state.agenda=[{id:'a',planoId:'p',disciplinaId:'ADM',topicoId:'ADM-01',data:D.hojeISO(),duracaoMin:45,feitoMin:45,feito:true,gerado:false}];
 state.revisoes=[{id:'r',planoId:'p',topicoId:'ADM-01',dataAgendada:D.hojeISO()}];
 return {S,state};
}
test('complementar questões mantém a sessão, o tempo e os créditos e atualiza as métricas',()=>{
 const {S,state}=fixture();S.salvar(state);const expected=JSON.parse(JSON.stringify(state.sessoes[0]));const old=S.carregar();
 const untouched=JSON.stringify([state.agenda,state.revisoes,state.plano.ciclo]);
 assert(D.atualizarQuestoesSessao(state,'s',{qFeitas:'25',qCertas:'20',obs:'Aula + prática'},expected).ok);
 assert.equal(state.sessoes.length,1);assert.equal(state.sessoes[0].id,'s');assert.equal(state.sessoes[0].duracaoMin,45);assert.equal(state.sessoes[0].registradoEm,expected.registradoEm);assert.deepEqual(state.sessoes[0].campoFuturo,{valor:7});
 assert.equal(JSON.stringify([state.agenda,state.revisoes,state.plano.ciclo]),untouched);
 S.salvar(state);const saved=S.carregar();const meta=D.metaSemanal(saved,D.hojeISO());assert.equal(meta.minutos,45);assert.equal(meta.qFeitas,25);assert.equal(meta.pctAcertos,80);
 const merged=S.mesclarEstados(old,saved);assert.equal(merged.sessoes.length,1);assert.equal(merged.sessoes[0].qFeitas,25);assert.equal(merged.sessoes[0].qCertas,20);
});
test('valores inválidos ou sessão removida não alteram o histórico',()=>{
 for(const counts of [{qFeitas:-1,qCertas:0},{qFeitas:2.5,qCertas:1},{qFeitas:10,qCertas:11},{qFeitas:'',qCertas:0},{qFeitas:1000,qCertas:1}]){
  const {state}=fixture(),before=JSON.stringify(state);assert.equal(D.atualizarQuestoesSessao(state,'s',counts).ok,false);assert.equal(JSON.stringify(state),before);
 }
 const {state}=fixture();state.config.removidos=['s'];const before=JSON.stringify(state);assert.equal(D.atualizarQuestoesSessao(state,'s',{qFeitas:10,qCertas:8}).ok,false);assert.equal(JSON.stringify(state),before);
});
test('edição antiga não sobrescreve resultado alterado enquanto o formulário estava aberto',()=>{
 const {state}=fixture(),expected=JSON.parse(JSON.stringify(state.sessoes[0]));
 assert(D.atualizarQuestoesSessao(state,'s',{qFeitas:30,qCertas:24,obs:'Outro aparelho'},expected).ok);
 assert.equal(D.atualizarQuestoesSessao(state,'s',{qFeitas:20,qCertas:10},expected).ok,false);assert.equal(state.sessoes[0].qFeitas,30);assert.equal(state.sessoes[0].obs,'Outro aparelho');
});
