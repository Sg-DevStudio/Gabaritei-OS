'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();
const sessao = (data, certas, extra = {}) => ({ planoId: 'p', topicoId: 't', data, qFeitas: 20, qCertas: certas, ...extra });
const estado = sessoes => ({ planoAtivoId: 'p', plano: { meta: { corte_pct: 70 }, radar: { janela_prova: ['2026-11', '2026-11'] } }, disciplinas: [{ id: 'd', topicos: [{ id: 't' }] }], sessoes, revisoes: [] });

test('sessões do mesmo dia usam a última inserida no histórico legado', () => {
  assert.equal(D.desempenhoTopico([sessao('2026-09-10', 0), sessao('2026-09-10', 20)], 't').pct, 100);
});
test('horário vence ordem do array, sem substituir a data real do estudo', () => {
  const nova = sessao('2026-09-10', 20, { registradoEm: '2026-09-10T12:00:00Z' });
  const velha = sessao('2026-09-10', 0, { registradoEm: '2026-09-10T10:00:00Z' });
  assert.equal(D.desempenhoTopico([nova, velha], 't').pct, 100);
});
test('agendamento e zero acertos não comprovam aprendizado', () => {
  const s = estado([sessao('2026-09-10', 0)]);
  s.revisoes.push({ planoId: 'p', topicoId: 't', dataAgendada: '2026-09-01' });
  const p = D.prontidaoProva(s, '2026-09-10');
  assert.equal(p.evidencias.evidenciados, 0);
  assert.equal(p.revisoesAtrasadas, 1);
});
test('evidência exige dois dias, recência, meta e revisões em dia', () => {
  const s = estado([sessao('2026-09-09', 20), sessao('2026-09-10', 20)]);
  assert.equal(D.diagnosticoAprendizagem(s, '2026-09-10').evidenciados, 1);
  assert.equal(D.diagnosticoAprendizagem(s, '2026-11-10').evidenciados, 0);
  s.revisoes.push({ planoId: 'p', topicoId: 't', dataAgendada: '2026-09-01' });
  assert.equal(D.diagnosticoAprendizagem(s, '2026-09-10').evidenciados, 0);
});
test('pesos de pontuação, brancas e mínimo eliminatório', () => {
  const nota = D.pontuacaoSimulado({ regraPontuacao: true, acertos: [
    { disciplinaId: 'a', certas: 10, total: 10, pontosAcerto: 1 },
    { disciplinaId: 'b', certas: 0, total: 10, pontosAcerto: 3, brancas: 5, penalidadeErro: 1, minimoPct: 20 }
  ] });
  assert.equal(nota.pct, 13); // 5/40 arredondado
  assert.equal(nota.acertoPct, 50);
  assert.deepEqual(nota.eliminadas, ['b']);
});
test('simulado legado não declara regra de pontuação', () => {
  assert.equal(D.pontuacaoSimulado({ acertos: [{ certas: 5, total: 10 }] }).configurada, false);
});
test('recuperação exige prática posterior, não reutiliza a sessão que motivou o erro', () => {
  const rec = { topicoId: 't', data: '2026-09-10', criadoEm: '2026-09-10T12:00:00Z' };
  const s = [sessao('2026-09-10', 20, { registradoEm: '2026-09-10T14:00:00Z' })];
  assert.equal(D.avaliarRecuperacao(rec, s, 70, '2026-09-11').situacao, 'aguardando');
  s.push(sessao('2026-09-11', 20, { registradoEm: '2026-09-11T14:00:00Z' }));
  assert.equal(D.avaliarRecuperacao(rec, s, 70, '2026-09-10').situacao, 'aguardando');
  assert.equal(D.avaliarRecuperacao(rec, s, 70, '2026-09-11').situacao, 'melhora');
});
test('novo resultado ruim mantém a recuperação aberta', () => {
  const rec = { topicoId: 't', data: '2026-09-10', criadoEm: '2026-09-10T12:00:00Z' };
  assert.equal(D.avaliarRecuperacao(rec, [sessao('2026-09-11', 0, { registradoEm: '2026-09-11T14:00:00Z' })], 70, '2026-09-11').situacao, 'reforcar');
});

test('pontuação e recuperação sobrevivem à persistência local', () => {
  const { loadStore } = require('./helpers/load-store');
  const S = loadStore();
  const s = S.estadoVazio();
  const sim = { id: 'sim-qa', data: '2026-09-10', regraPontuacao: true, acertos: [{ disciplinaId: 'd', certas: 1, total: 2, pontosAcerto: 3, penalidadeErro: 1, brancas: 0, minimoPct: 50, recuperacoes: [{ id: 'rec-qa', topicoId: 't', dificuldade: 'Teste', explicacao: 'Referência', acao: 'Praticar', data: '2026-09-10', criadoEm: '2026-09-10T12:00:00Z' }] }] };
  s.simulados.push(sim);
  assert.equal(S.salvar(s).ok, true);
  const salvo = S.carregar().simulados.find(x => x.id === sim.id);
  assert.deepEqual(salvo.acertos, sim.acertos);
  assert.equal(salvo.regraPontuacao, true);
});
