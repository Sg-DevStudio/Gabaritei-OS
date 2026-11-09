'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const { loadDomain } = require('./helpers/load-domain');
const { loadStore } = require('./helpers/load-store');
const D = loadDomain(), c = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync('js/planos-atualizacao.js', 'utf8'), c);
const A = c.window.PlanosAtualizacao;
const top = (id, nome, extras) => Object.assign({id,nome,status:'pendente',horas_estimadas:2,incidencia_pct:20,prioridade:2},extras);
function exemplo() {
 const entry={id:'aluno',plano:{concurso:'TRF2 — base anterior',origemEditalId:'trf2',origemEditalVersao:'2026-01-01',meta:{corte_pct:85},rotina:{seg:2}},
 disciplinas:[{id:'ADM',nome:'Direito Administrativo',peso:1,cor:'#123456',pausa:{ate:'2027-01-01'},topicos:[top('ADM-01','Atos administrativos',{status:'dominado',reaberto:true,anotacoes:'Minhas notas'}),top('ADM-02','Tópico retirado',{status:'em_curso'})]}],
 links:[{id:'pessoal',tipo:'trilha',topicoChave:'plano:ADM:ADM-01',url:'https://example.org/anotacoes'}]};
 const edital={id:'trf2',titulo:'TRF2 — referência atualizada',atualizadoEm:'2026-11-04',banca:'AOCP',foto:'assets/carreiras/capa-trf2-tjaa.svg',
 disciplinas:[{id:'ADM',nome:'Direito Administrativo',peso:2,cor:'#999999',topicos:[top('ADM-01','Atos administrativos: requisitos'),top('ADM-03','Contratações')]}]};
 return {entry,edital};
}
test('prévia é pura e distingue inclusões, ajustes e saídas da referência',()=>{
 const {entry,edital}=exemplo(),antes=JSON.stringify(entry),r=A.analisar(entry,edital);
 assert.equal(r.incluidos.length,1);assert.equal(r.alterados.length,1);assert.equal(r.retirados.length,1);
 assert.equal(r.mantidos,1);assert.equal(JSON.stringify(entry),antes);
});
test('atualização mantém ids locais, notas, progresso, links, meta e rotina',()=>{
 const {entry,edital}=exemplo(),links=entry.links,rotina=entry.plano.rotina;
 A.aplicar(entry,edital,D,'2026-11-04');
 const ds=entry.disciplinas, mantido=ds[0].topicos.find(t=>t.id==='ADM-01');
 assert.equal(mantido.status,'dominado');assert.equal(mantido.reaberto,true);assert.equal(mantido.anotacoes,'Minhas notas');
 assert.equal(ds[0].cor,'#123456');assert.equal(ds[0].pausa.ate,'2027-01-01');assert.equal(ds[0].peso,2);
 assert.equal(ds[0].topicos.find(t=>t.id==='ADM-03').status,'pendente');
 assert.equal(ds[0].topicos.find(t=>t.id==='ADM-02').removidoDoEdital,true);
 assert.equal(entry.links,links);assert.equal(entry.plano.rotina,rotina);assert.equal(entry.plano.meta.corte_pct,85);
 assert.equal(entry.id,'aluno');assert.equal(entry.plano.atualizacoesEdital.length,1);
 assert.equal(A.pendente(entry,[edital]),null);
});
test('nova edição reaproveita apenas nomes exatos únicos e não confunde ids reutilizados',()=>{
 const {entry,edital}=exemplo();edital.id='trf2-edital-novo';
 edital.disciplinas[0].id='DADM';edital.disciplinas[0].topicos=[top('DADM-10','Atos administrativos'),top('ADM-02','Assunto completamente diferente')];
 A.aplicar(entry,edital,D);
 const ativos=entry.disciplinas[0].topicos.filter(t=>!t.removidoDoEdital);
 assert.equal(ativos[0].id,'ADM-01');assert.equal(ativos[0].status,'dominado');
 assert.notEqual(ativos[1].id,'ADM-02');assert.equal(ativos[1].status,'pendente');
 assert.equal(entry.disciplinas[0].topicos.find(t=>t.id==='ADM-02').removidoDoEdital,true);
 edital.atualizadoEm='2026-11-05';edital.disciplinas[0].topicos[0].nome='Atos administrativos — complemento';
 A.aplicar(entry,edital,D);assert.equal(entry.disciplinas[0].topicos.find(t=>t.id==='ADM-01').status,'dominado');
});
test('nomes duplicados não transferem domínio por aproximação',()=>{
 const {entry,edital}=exemplo();edital.id='outra-edicao';
 entry.disciplinas[0].topicos=[top('A','Tema',{status:'dominado'}),top('B','Tema',{status:'em_curso'})];
 edital.disciplinas[0].topicos=[top('C','Tema')];A.aplicar(entry,edital,D);
 assert.equal(entry.disciplinas[0].topicos.find(t=>t.id==='C').status,'pendente');
 assert.equal(entry.disciplinas[0].topicos.filter(t=>t.removidoDoEdital).length,2);
});
test('logo ausente é recuperada sem tocar em estudo, capa própria ou plano não identificado',()=>{
 const {entry,edital}=exemplo(),outra={id:'outro',plano:{concurso:'Plano manual'},disciplinas:[]};
 const state={planos:[entry,outra],sessoes:[{id:'s'}],revisoes:[{id:'r'}],simulados:[{id:'sim'}],agenda:[{id:'a'}]};
 const historico=JSON.stringify([state.sessoes,state.revisoes,state.simulados,state.agenda]);
 assert.equal(A.repararMetadados(state,[edital]),true);assert.equal(entry.plano.foto,edital.foto);
 assert.equal(JSON.stringify([state.sessoes,state.revisoes,state.simulados,state.agenda]),historico);
 entry.plano.foto='minha-capa.png';A.repararMetadados(state,[edital]);assert.equal(entry.plano.foto,'minha-capa.png');assert.equal(outra.plano.origemEditalId,undefined);
});
test('catálogo antigo não oferece downgrade e referência vazia não apaga disciplinas',()=>{
 const {entry,edital}=exemplo();entry.plano.origemEditalVersao='2027-01-01';assert.equal(A.pendente(entry,[edital]),null);
 const antes=JSON.stringify(entry);assert.throws(()=>A.aplicar(entry,Object.assign({},edital,{disciplinas:[]}),D));assert.equal(JSON.stringify(entry),antes);
});
test('incidência não aferida no catálogo não bloqueia atualização nem vira estatística inventada',()=>{
 const {entry,edital}=exemplo();edital.disciplinas[0].topicos[0].incidencia_pct=null;
 A.aplicar(entry,edital,D);assert.equal(entry.disciplinas[0].topicos[0].incidencia_pct,null);
});
test('uma atualização apenas de peso da disciplina também é oferecida na prévia',()=>{
 const {entry,edital}=exemplo();
 edital.titulo=entry.plano.concurso;edital.banca='';edital.foto='';
 edital.disciplinas=JSON.parse(JSON.stringify(entry.disciplinas));edital.disciplinas[0].peso=3;
 const r=A.analisar(entry,edital);assert.equal(r.alterados.length,0);assert.equal(r.disciplinasAjustadas.length,1);assert.equal(r.mudou,true);
 assert.equal(A.pendente(entry,[edital]),edital);A.aplicar(entry,edital,D);assert.equal(entry.disciplinas[0].peso,3);
});
test('assunto histórico que volta à referência fica ativo sem perder progresso',()=>{
 const {entry,edital}=exemplo();entry.disciplinas[0].topicos[0].orfao=true;entry.disciplinas[0].topicos[0].removidoDoEdital=true;
 A.aplicar(entry,edital,D);const t=entry.disciplinas[0].topicos.find(t=>t.id==='ADM-01');
 assert.equal(t.orfao,false);assert.equal(t.removidoDoEdital,undefined);assert.equal(t.status,'dominado');
});
test('novo edital conserva sessões, revisões, simulados e agenda após salvar e recarregar',()=>{
 const S=loadStore(),{entry,edital}=exemplo(),state=S.estadoVazio();state.planos=[entry];state.planoAtivoId=entry.id;S.hidratar(state);
 state.sessoes=[{id:'s',planoId:entry.id,topicoId:'ADM-01',data:D.hojeISO(),tipo:'questoes',duracaoMin:30,qFeitas:20,qCertas:18}];
 state.revisoes=[{id:'r',planoId:entry.id,topicoId:'ADM-02',dataAgendada:'2027-01-01'}];
 state.simulados=[{id:'sim',planoId:entry.id,data:D.hojeISO(),acertos:[{disciplinaId:'ADM',certas:18,total:20}]}];
 state.agenda=[{id:'a',planoId:entry.id,disciplinaId:'ADM',topicoId:'ADM-02',data:D.hojeISO(),duracaoMin:30,feito:true,feitoMin:30,gerado:false}];
 S.salvar(state);const antes=JSON.stringify([state.sessoes,state.revisoes,state.simulados,state.agenda]);
 A.sincronizar(state,[edital],D);S.hidratar(state);
 assert.equal(JSON.stringify([state.sessoes,state.revisoes,state.simulados,state.agenda]),antes);
 S.salvar(state);const salvo=S.carregar();
 assert.equal(salvo.sessoes[0].qCertas,18);assert.equal(salvo.revisoes[0].topicoId,'ADM-02');assert.equal(salvo.simulados.length,1);assert.equal(salvo.agenda[0].feitoMin,30);
});
test('atualização automática alcança planos inativos uma vez, sem recriar estudo nem rotina',()=>{
 const {entry,edital}=exemplo(),outro=JSON.parse(JSON.stringify(entry));outro.id='inativo';
 const state={planos:[entry,outro],planoAtivoId:entry.id,config:{},sessoes:[{id:'s',topicoId:'ADM-02'}],revisoes:[{id:'r'}],agenda:[{id:'a',feito:true}],simulados:[{id:'sim'}]};
 const history=JSON.stringify([state.sessoes,state.revisoes,state.agenda,state.simulados]);
 const r=A.sincronizar(state,[edital],D);assert.equal(r.atualizados.length,2);assert.equal(r.erros.length,0);
 for(const p of state.planos){assert.equal(p.plano.origemEditalVersao,edital.atualizadoEm);assert.equal(p.disciplinas[0].topicos.find(t=>t.id==='ADM-01').status,'dominado');assert.equal(p.links[0].id,'pessoal');assert.equal(p.plano.rotina.seg,2);assert.equal(p.plano.meta.corte_pct,85);assert.equal(p.plano.atualizacoesEdital.length,1);}
 assert.equal(JSON.stringify([state.sessoes,state.revisoes,state.agenda,state.simulados]),history);
 state.planos[0].disciplinas[0].topicos[0].nome='Minha personalização após atualizar';
 assert.equal(A.sincronizar(state,[edital],D).mudou,false);assert.equal(state.planos[0].disciplinas[0].topicos[0].nome,'Minha personalização após atualizar');
});
test('automação respeita exclusões, planos manuais, combinados, rascunhos e catálogo antigo',()=>{
 const {entry,edital}=exemplo();const removido=JSON.parse(JSON.stringify(entry));removido.id='apagado';
 const state={planos:[entry,removido,{id:'manual',plano:{concurso:'Meu plano'},disciplinas:[]},{id:'combo',plano:{combinado:true,origemEditalId:edital.id},disciplinas:[]},{id:'draft',plano:{rascunho:true,origemEditalId:edital.id},disciplinas:[]}],config:{planosExcluidos:{apagado:true},entidadesExcluidas:{'top:aluno:ADM-03':'2026-11-01'}}};
 A.sincronizar(state,[edital],D);assert(!state.planos[0].disciplinas[0].topicos.some(t=>t.id==='ADM-03'));assert.equal(state.planos[1],removido);assert.equal(state.planos[2].plano.origemEditalId,undefined);assert.equal(state.planos[3].disciplinas.length,0);assert.equal(state.planos[4].disciplinas.length,0);
 const before=JSON.stringify(state);assert.equal(A.sincronizar(state,[Object.assign({},edital,{atualizadoEm:'2025-01-01'})],D).mudou,false);assert.equal(JSON.stringify(state),before);
});
test('falha em uma referência não altera sua cópia nem impede outros planos',()=>{
 const {entry,edital}=exemplo();const good=JSON.parse(JSON.stringify(entry));good.id='outro';good.plano.origemEditalId='valido';
 const state={planos:[entry,good],config:{}};const before=JSON.stringify(entry);
 const invalid=JSON.parse(JSON.stringify(edital));delete invalid.disciplinas[0].topicos[0].nome;
 const r=A.sincronizar(state,[invalid,Object.assign({},edital,{id:'valido'})],D);
 assert.equal(r.erros.length,1);assert.equal(state.planos[0],entry);assert.equal(JSON.stringify(entry),before);assert.equal(state.planos[1].plano.origemEditalVersao,edital.atualizadoEm);
});
test('uma exclusão com ids locais mapeados não renasce ao atualizar',()=>{
 const {entry,edital}=exemplo();entry.plano.mapaEdital={origemId:edital.id,disciplinas:{ADM:'ADM'},topicos:{'ADM:ADM-03':'meu-id-local'}};
 const state={planos:[entry],config:{entidadesExcluidas:{'top:aluno:meu-id-local':'2026-11-01'}}};A.sincronizar(state,[edital],D);
 assert(!state.planos[0].disciplinas[0].topicos.some(t=>t.nome==='Contratações'));
});
