'use strict';

const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} = require('@firebase/rules-unit-testing');
const {
  doc,
  getDoc,
  setDoc,
  Timestamp
} = require('firebase/firestore');

const ativo = !!process.env.FIRESTORE_EMULATOR_HOST;
let ambiente;

test.before(async () => {
  if (!ativo) return;
  ambiente = await initializeTestEnvironment({
    projectId: 'demo-gabaritei-os',
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8')
    }
  });
});

test.beforeEach(async () => {
  if (ambiente) await ambiente.clearFirestore();
});

test.after(async () => {
  if (ambiente) await ambiente.cleanup();
});

function banco(uid, email) {
  return ambiente.authenticatedContext(uid, { email: email || uid + '@teste.local' }).firestore();
}

function metadataAtual() {
  return {
    formato: 2,
    chunks: 1,
    updatedAt: new Date().toISOString(),
    clientId: 'teste',
    rev: 1,
    resumo: { registros: 0, planos: 0 },
    savedAt: Timestamp.now()
  };
}

test('dono grava formato particionado e ainda pode migrar formato legado', { skip: !ativo }, async () => {
  const db = banco('aluno');
  await assertSucceeds(setDoc(doc(db, 'users/aluno/state/current'), metadataAtual()));
  await assertSucceeds(setDoc(doc(db, 'users/aluno/state/current-chunk-00'), {
    payload: '{"versao":2}',
    index: 0,
    rev: 1,
    savedAt: Timestamp.now()
  }));
  await assertSucceeds(setDoc(doc(db, 'users/aluno/state/backup-0'), {
    state: { versao: 2, planos: [] },
    criadoEm: new Date().toISOString(),
    clientId: 'legado',
    savedAt: Timestamp.now()
  }));
});

test('IDs extras e partes fora do limite são negados', { skip: !ativo }, async () => {
  const db = banco('aluno');
  await assertFails(setDoc(doc(db, 'users/aluno/state/lixeira'), metadataAtual()));
  await assertFails(setDoc(doc(db, 'users/aluno/state/current-chunk-24'), {
    payload: '{}',
    index: 24,
    rev: 1,
    savedAt: Timestamp.now()
  }));
});

test('partes aceitam Unicode dentro do codec e negam texto acima do limite', { skip: !ativo }, async () => {
  const db = banco('aluno');
  await assertSucceeds(setDoc(doc(db, 'users/aluno/state/current-chunk-00'), {
    payload: '🧠'.repeat(90000),
    index: 0,
    rev: 1,
    savedAt: Timestamp.now()
  }));
  await assertFails(setDoc(doc(db, 'users/aluno/state/current-chunk-01'), {
    payload: 'x'.repeat(180001),
    index: 1,
    rev: 1,
    savedAt: Timestamp.now()
  }));
});

test('um usuário não lê nem grava o estado de outro', { skip: !ativo }, async () => {
  const db = banco('intruso');
  await assertFails(getDoc(doc(db, 'users/aluno/state/current')));
  await assertFails(setDoc(doc(db, 'users/aluno/state/current'), metadataAtual()));
});

test('push aceita somente tokens e limita vinte dispositivos', { skip: !ativo }, async () => {
  const db = banco('aluno');
  const vinte = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [
    'token-' + i,
    { criadoEm: new Date().toISOString(), ua: 'teste' }
  ]));
  await assertSucceeds(setDoc(doc(db, 'users/aluno/push/tokens'), vinte));
  await assertFails(setDoc(doc(db, 'users/aluno/push/outro'), { token: {} }));
  await assertFails(setDoc(doc(db, 'users/aluno/push/tokens'), {
    ...vinte,
    'token-20': { criadoEm: new Date().toISOString(), ua: 'teste' }
  }));
});

test('catálogo continua público e pedido é limitado ao próprio usuário', { skip: !ativo }, async () => {
  const anonimo = ambiente.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(anonimo, 'public/catalogo')));

  const db = banco('aluno');
  await assertSucceeds(setDoc(doc(db, 'pedidosEdital/aluno'), {
    texto: 'TJSP Escrevente 2027',
    status: 'novo',
    criadoEm: new Date().toISOString(),
    usuario: { uid: 'aluno', email: 'aluno@teste.local', nome: 'Aluno' },
    savedAt: Timestamp.now()
  }));
  await assertFails(setDoc(doc(db, 'pedidosEdital/outro'), {
    texto: 'TJSP Escrevente 2027',
    status: 'novo',
    criadoEm: new Date().toISOString(),
    usuario: { uid: 'aluno', email: 'aluno@teste.local', nome: 'Aluno' },
    savedAt: Timestamp.now()
  }));
});
