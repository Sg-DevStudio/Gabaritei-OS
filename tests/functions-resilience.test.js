'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function backend(options = {}) {
  let cotas = 0, chamadas = 0, timeout, enviados = 0;
  const ref = { collection() { return this; }, doc() { return this; }, async get() { return { exists: true, data: () => ({ token: {} }) }; } };
  const firestore = () => ({ collection: () => ({ ...ref, listDocuments: async () => [ref] }),
    runTransaction: async fn => fn({ get: async () => ({ exists: false }), set() { cotas++; } }) });
  firestore.FieldValue = { serverTimestamp: () => 0, delete: () => null };
  const admin = { initializeApp() {}, firestore, messaging: () => ({ sendEachForMulticast: async () => {
    enviados++; return { successCount: 1, responses: [{ success: true }] };
  } }) };
  class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
  const modules = {
    'firebase-functions/v2/https': { onCall: (_opts, fn) => fn, HttpsError },
    'firebase-functions/v2/scheduler': { onSchedule: (_opts, fn) => fn },
    'firebase-functions/params': { defineSecret: () => ({ value: () => 'chave-de-teste' }), defineString: () => ({ value: () => options.model || '' }) },
    'firebase-functions/v2': { setGlobalOptions() {} }, 'firebase-admin': admin,
    './study-state': { lerEstadoEstudo: async () => options.state }
  };
  const ctx = { exports: {}, require: name => modules[name], Date, console: { log() {}, error() {} },
    AbortSignal: { timeout: ms => { timeout = ms; return { timeout: ms }; } },
    fetch: async (_url, opts) => { chamadas++; assert(opts.signal); if (options.timeout) throw Error('AbortError');
      return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '[{"frente":"Pergunta","verso":"Resposta"}]' }] } }] }) };
    } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../functions/index.js'), 'utf8'), ctx);
  return { api: ctx.exports, hoje: () => vm.runInContext('hojeISO()', ctx),
    ultima: state => ctx.ultimaSessaoISO(state), cotas: () => cotas, chamadas: () => chamadas, timeout: () => timeout, enviados: () => enviados };
}
const request = { auth: { uid: 'aluno' }, data: { material: 'Material suficiente para gerar um flashcard sobre o conteúdo estudado.' } };

test('IA sem modelo configurado informa indisponibilidade antes de consumir cota', async () => {
  const h = backend();
  await assert.rejects(h.api.gerarFlashcards(request), e => e.code === 'failed-precondition');
  assert.equal(h.cotas(), 0); assert.equal(h.chamadas(), 0);
});

test('IA requer autenticação e limita o tempo da chamada externa', async () => {
  const h = backend({ model: 'modelo-configurado' });
  await assert.rejects(h.api.gerarFlashcards({ data: request.data }), e => e.code === 'unauthenticated');
  const resultado = await h.api.gerarFlashcards(request);
  assert.equal(resultado.cards.length, 1);
  assert.equal(h.timeout(), 60000); assert.equal(h.cotas(), 1);
});

test('timeout da IA é traduzido em erro recuperável', async () => {
  const h = backend({ model: 'modelo-configurado', timeout: true });
  await assert.rejects(h.api.gerarFlashcards(request), e => e.code === 'unavailable');
});

test('simulado de hoje impede lembrete falso, mesmo com sessão futura no histórico', async () => {
  const h = backend();
  const hoje = h.hoje();
  const state = { config: { lembretesPush: true }, sessoes: [{ id: 'futura', data: '2099-01-01' }], simulados: [{ id: 'sim', data: hoje }] };
  assert.equal(h.ultima(state), hoje);
  const env = backend({ state }); await env.api.lembreteEstudo(); assert.equal(env.enviados(), 0);
});

test('lembretes desativados não enviam push para tokens que ainda existem', async () => {
  const h = backend({ state: { config: { lembretesPush: false }, sessoes: [], simulados: [] } });
  await h.api.lembreteEstudo(); assert.equal(h.enviados(), 0);
});

test('lembrete ativo é enviado quando não existe atividade de hoje', async () => {
  const h = backend({ state: { config: { lembretesPush: true }, sessoes: [], simulados: [] } });
  await h.api.lembreteEstudo(); assert.equal(h.enviados(), 1);
});
