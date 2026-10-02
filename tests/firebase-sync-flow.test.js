'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadStore } = require('./helpers/load-store');
const { loadFirebaseSync } = require('./helpers/load-firebase-sync');
const S = loadStore();
function state(ids, time, rev = 1) {
  const s = S.estadoVazio();
  s.sessoes = ids.map(id => ({ id, data: '2026-09-29', duracaoMin: 30 }));
  Object.assign(s.config, { syncGeneration: 'auto-teste', atualizadoEm: time, rev });
  return s;
}
const ids = harness => Array.from(harness.state().sessoes, s => s.id).sort();

test('limpeza total vence sessões remotas anteriores ainda desconhecidas', async () => {
  const local = state([], '2026-09-30T12:00:00Z', 4);
  Object.assign(local.config, { apagadoEm: '2026-09-30T12:00:00Z', removidos: ['conhecida'], metaQuestoesSemana: 250 });
  const h = loadFirebaseSync(local, state(['conhecida', 'outro-aparelho'], '2026-09-30T11:00:00Z', 3));
  await h.sync.sincronizarAgora();
  assert.deepEqual(ids(h), []);
  assert.equal(h.state().config.metaQuestoesSemana, 250);
  assert.equal(h.writes(), 1);
});

test('limpeza remota posterior também vence a cópia local antiga', async () => {
  const remote = state([], '2026-09-30T12:00:00Z', 4);
  remote.config.apagadoEm = remote.config.atualizadoEm;
  const h = loadFirebaseSync(state(['antiga'], '2026-09-30T11:00:00Z', 3), remote);
  await h.sync.sincronizarAgora();
  assert.deepEqual(ids(h), []);
});

test('trabalho remoto posterior à limpeza local é preservado', async () => {
  const local = state([], '2026-09-30T11:00:00Z', 3);
  local.config.apagadoEm = local.config.atualizadoEm;
  const h = loadFirebaseSync(local, state(['nova'], '2026-09-30T12:00:00Z', 4));
  await h.sync.sincronizarAgora();
  assert.deepEqual(ids(h), ['nova']);
});

test('falha de gravação mantém erro visível e agenda tentativa de reconciliação', async () => {
  const h = loadFirebaseSync(state(['local'], '2026-09-30T10:00:00Z'), state(['remoto'], '2026-09-30T11:00:00Z', 2), { failWrites: true });
  await h.sync.sincronizarAgora();
  assert.equal(h.sync.status().estado, 'erro');
  assert.equal(h.writes(), 0);
  assert.ok(Array.from(h.timers.values()).some(timer => timer.delay === 5000));
});

test('restaurar backup durante leitura conserva o estado atual e seu histórico', async () => {
  const h = loadFirebaseSync(state(['antes'], '2026-09-30T10:00:00Z'), state(['remoto'], '2026-09-30T11:00:00Z', 2), { delayRead: true });
  const pending = h.sync.sincronizarAgora();
  h.replace(state(['backup-restaurado'], '2026-09-30T12:00:00Z', 3));
  h.release(); await pending;
  assert.deepEqual(ids(h), ['backup-restaurado', 'remoto']);
  assert.equal(h.sync.status().estado, 'sincronizado');
});

test('resposta de uma conta anterior não modifica o estado da conta atual', async () => {
  const h = loadFirebaseSync(state(['anterior'], '2026-09-30T10:00:00Z'), state(['remoto-anterior'], '2026-09-30T11:00:00Z', 2), { delayRead: true });
  const pending = h.sync.sincronizarAgora();
  h.switchUser(); h.replace(state(['outra-conta'], '2026-09-30T12:00:00Z', 3));
  h.release(); await pending;
  assert.deepEqual(ids(h), ['outra-conta']);
  assert.equal(h.writes(), 0);
});

test('envio agendado usa o estado atual após uma restauração', async () => {
  const h = loadFirebaseSync(state(['antes'], '2026-09-30T10:00:00Z'), null);
  h.sync.agendarEnvio(h.state());
  h.replace(state(['restaurado'], '2026-09-30T12:00:00Z', 3));
  const timer = Array.from(h.timers.values()).find(t => t.delay === 650);
  timer.fn();
  for (let i = 0; i < 20; i++) await Promise.resolve();
  assert.deepEqual(ids(h), ['restaurado']);
  assert.equal(h.writes(), 1);
});

test('dois aparelhos no mesmo dia não sobrescrevem o primeiro backup diário', async () => {
  const documents = new Map();
  const a = loadFirebaseSync(state(['primeiro'], '2026-10-02T10:00:00Z'), null, { documents });
  await a.sync.sincronizarAgora();
  await new Promise(setImmediate);
  assert.equal(a.backupWrites(), 1, a.warnings.join('\n'));
  const b = loadFirebaseSync(state(['segundo'], '2026-10-02T11:00:00Z'), null, { documents });
  await b.sync.sincronizarAgora();
  await new Promise(setImmediate);
  assert.equal(b.backupWrites(), 0);
  assert.deepEqual(ids(b), ['primeiro', 'segundo']);
});
