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


test('troca de conta durante transação não grava nem aplica dados da conta anterior', async () => {
  const h = loadFirebaseSync(state(['anterior'], '2026-10-03T10:00:00Z'), null, { delayTransactionRead: true });
  const pending = h.flushWrite();
  h.switchUser(); h.replace(state(['outra-conta'], '2026-10-03T12:00:00Z', 3));
  h.release(); await pending;
  assert.deepEqual(ids(h), ['outra-conta']);
  assert.equal(h.writes(), 0);
  assert.equal(h.documents.has('users/outra-conta/state/current'), false);
  assert.equal(Array.from(h.documents.keys()).some(key => key.startsWith('users/outra-conta/')), false);
});


test('resposta de gravação já concluída não mistura contas após troca de sessão', async () => {
  const h = loadFirebaseSync(state(['anterior'], '2026-10-03T10:00:00Z'), null, { delayTransactionCommit: true });
  const pending = h.flushWrite();
  for (let i = 0; i < 30 && !h.writes(); i++) await Promise.resolve();
  assert.equal(h.writes(), 1);
  h.switchUser(); h.replace(state(['outra-conta'], '2026-10-03T12:00:00Z', 3));
  h.releaseCommit(); await pending;
  assert.deepEqual(ids(h), ['outra-conta']);
  assert.equal(h.documents.has('users/outra-conta/state/current'), false);
  assert.notEqual(h.sync.status().estado, 'sincronizado');
});


test('troca de conta durante leitura retoma a reconciliação solicitada pela nova conta', async () => {
  const h = loadFirebaseSync(state(['anterior'], '2026-10-03T10:00:00Z'), state(['remoto-antigo'], '2026-10-03T11:00:00Z', 2), { delayRead: true });
  const pending = h.sync.sincronizarAgora();
  h.switchUser(); h.replace(state(['nova'], '2026-10-03T12:00:00Z', 3));
  h.documents.set('users/outra-conta/state/current', { state: state(['remoto-novo'], '2026-10-03T13:00:00Z', 4) });
  await h.sync.sincronizarAgora();
  h.release(); await pending;
  const deferred = Array.from(h.timers.values()).find(t => t.delay === 0);
  assert.ok(deferred, 'a reconciliação da nova conta precisa ser retomada');
  deferred.fn();
  for (let i = 0; i < 50; i++) await Promise.resolve();
  assert.deepEqual(ids(h), ['nova', 'remoto-novo']);
  assert.equal(h.sync.status().estado, 'sincronizado');
});

for (const action of ['listarBackupsNuvem', 'lerBackupNuvem']) {
  test(action + ': resposta da conta anterior é rejeitada após troca de sessão', async () => {
    const backupRef = 'users/aluno/state/backup-0';
    const documents = new Map([[backupRef, { state: state(['backup-antigo'], '2026-10-03T10:00:00Z'), criadoEm: '2026-10-03T10:00:00Z' }]]);
    const h = loadFirebaseSync(state([], '2026-10-03T12:00:00Z'), null, { documents, delayReadRef: backupRef });
    const pending = h.sync[action]('backup-0');
    const rejected = assert.rejects(pending, /conta mudou/i);
    h.switchUser(); h.release();
    await rejected;
    assert.deepEqual(ids(h), []);
  });
}


test('backup particionado descarta a resposta quando a conta muda durante a leitura das partes', async () => {
  const codec = require('../js/remote-state.js');
  const backup = state(['backup-antigo'], '2026-10-03T10:00:00Z', 2);
  const encoded = codec.codificar(backup);
  const backupRef = 'users/aluno/state/backup-0';
  const chunkRef = 'users/aluno/state/' + codec.idParte('backup-0', 0);
  const documents = new Map([[backupRef, { formato: codec.FORMATO, chunks: encoded.partes.length, rev: 2 }]]);
  encoded.partes.forEach((payload, index) => documents.set('users/aluno/state/' + codec.idParte('backup-0', index), { payload, index, rev: 2 }));
  const h = loadFirebaseSync(state([], '2026-10-03T12:00:00Z'), null, { documents, delayReadRef: chunkRef });
  const pending = h.sync.lerBackupNuvem('backup-0');
  const rejected = assert.rejects(pending, /conta mudou/i);
  for (let i = 0; i < 20 && !h.reads.includes(chunkRef); i++) await Promise.resolve();
  assert.ok(h.reads.includes(chunkRef));
  h.switchUser(); h.release(); await rejected;
  assert.equal(h.reads.some(ref => ref.startsWith('users/outra-conta/')), false);
});

test('consulta e restauração de backup continuam funcionando na mesma conta', async () => {
  const backup = state(['salva'], '2026-10-03T10:00:00Z');
  const documents = new Map([['users/aluno/state/backup-0', { state: backup, criadoEm: '2026-10-03T10:00:00Z' }]]);
  const h = loadFirebaseSync(state([], '2026-10-03T12:00:00Z'), null, { documents });
  const list = await h.sync.listarBackupsNuvem();
  assert.equal(list.length, 1);
  assert.equal(list[0].id, 'backup-0');
  const restored = await h.sync.lerBackupNuvem('backup-0');
  assert.deepEqual(Array.from(restored.sessoes, s => s.id), ['salva']);
});
