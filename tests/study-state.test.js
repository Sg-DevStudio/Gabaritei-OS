'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { lerEstadoEstudo } = require('../functions/study-state');

function ler(documentos) {
  return lerEstadoEstudo({ collection: () => ({ doc: id => id }) }, {
    get: async id => ({ exists: !!documentos[id], data: () => documentos[id] })
  });
}
test('lembrete recupera sessões do estado particionado atual', async () => {
  const estado = { sessoes: [{ data: '2026-09-09' }] };
  const json = JSON.stringify(estado);
  assert.deepEqual(await ler({
    current: { formato: 2, chunks: 2, rev: 5 },
    'current-chunk-00': { index: 0, rev: 5, payload: json.slice(0, 10) },
    'current-chunk-01': { index: 1, rev: 5, payload: json.slice(10) }
  }), estado);
});
test('lembrete preserva compatibilidade com o legado', async () => {
  assert.deepEqual(await ler({ current: { state: { sessoes: [] } } }), { sessoes: [] });
});
test('partes ausentes não viram falso histórico vazio', async () => {
  await assert.rejects(ler({ current: { formato: 2, chunks: 1, rev: 1 } }), /incompleto/);
});
