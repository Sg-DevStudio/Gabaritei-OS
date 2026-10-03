'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Executa o módulo real com Auth/Firestore em memória: permite controlar a
// ordem de respostas e falhas sem rede, CDN ou conta Firebase de produção.
function loadFirebaseSync(initial, remote, options = {}) {
  const root = path.join(__dirname, '../..');
  const documents = options.documents || new Map();
  const storage = new Map();
  const warnings = [];
  const timers = new Map();
  let current = initial;
  let writes = 0, backupWrites = 0;
  let timerId = 0;
  let blockedRead;
  let releaseRead;
  if (options.delayRead || options.delayTransactionRead) blockedRead = new Promise(resolve => { releaseRead = resolve; });
  const snapshot = data => ({ exists: () => data != null, data: () => data });
  const currentRef = 'users/aluno/state/current';
  if (remote) documents.set(currentRef, { state: remote });
  let releaseCommit;
  const blockedCommit = options.delayTransactionCommit
    ? new Promise(resolve => { releaseCommit = resolve; }) : null;
  const context = {
    console: { error() {}, warn(...args) { warnings.push(args.join(" ")); }, log() {} }, TextEncoder, Date,
    window: { dispatchEvent() {}, addEventListener() {} },
    document: { addEventListener() {}, hidden: false }, navigator: {},
    CustomEvent: function () {},
    localStorage: {
      getItem: key => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, String(value)),
      removeItem: key => storage.delete(key)
    },
    setTimeout: (fn, delay) => { timers.set(++timerId, { fn, delay }); return timerId; },
    clearTimeout: id => timers.delete(id), setInterval: () => 1,
    initializeApp: () => ({}), getAuth: () => ({}), getFirestore: () => ({}),
    getFunctions: () => ({}), GoogleAuthProvider: function () {},
    doc: (_db, ...segments) => segments.join('/'), collection: () => ({}),
    serverTimestamp: () => new Date(),
    getDoc: async ref => {
      const result = snapshot(documents.get(ref));
      if (ref === currentRef && blockedRead) {
        const pending = blockedRead; blockedRead = null; await pending;
      }
      return result;
    },
    runTransaction: async (_db, callback) => {
      if (options.failWrites) throw new Error('permission-denied simulado');
      const pending = new Map();
      const result = await callback({
        get: async ref => {
          const result = snapshot(documents.get(ref));
          if (ref === currentRef && options.delayTransactionRead && blockedRead) {
            const pendingRead = blockedRead; blockedRead = null; await pendingRead;
          }
          return result;
        },
        set: (ref, data) => pending.set(ref, data),
        delete: ref => pending.set(ref, null)
      });
      pending.forEach((data, ref) => data == null ? documents.delete(ref) : documents.set(ref, data));
      if (pending.has(currentRef)) writes++;
      if (Array.from(pending.keys()).some(ref => /\/backup-[0-6]$/.test(ref))) backupWrites++;
      if (blockedCommit) await blockedCommit;
      return result;
    },
    writeBatch: () => ({ set() {}, delete() {}, commit: async () => {} }),
    onSnapshot: () => () => {},
    onAuthStateChanged() {}, signOut: async () => {},
    isMessagingSupported: async () => false
  };
  vm.createContext(context);
  for (const file of ['domain.js', 'store.js', 'remote-state.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'js', file), 'utf8'), context);
  }
  context.optionsForSync = {
    obterEstado: () => current,
    aplicarEstado: value => { current = value; },
    aoStatus() {}
  };
  const source = fs.readFileSync(path.join(root, 'js/firebase-sync.js'), 'utf8');
  vm.runInContext(source.slice(source.indexOf('const firebaseConfig')) + `
    usuario = { uid: 'aluno', email: 'aluno@teste.local' };
    refEstado = doc(db, 'users', usuario.uid, 'state', 'current');
    opcoes = optionsForSync;
    reconciliadoOk = true;
  `, context);
  return {
    sync: context.window.FirebaseSync,
    state: () => current,
    replace: value => { current = value; },
    release: () => releaseRead(),
    releaseCommit: () => releaseCommit(),
    flushWrite: () => vm.runInContext("gravarRemoto(opcoes.obterEstado())", context),
    writes: () => writes,
    backupWrites: () => backupWrites,
    documents, warnings,
    timers,
    switchUser: () => vm.runInContext("usuario = {uid: 'outra-conta'}; refEstado = 'users/outra-conta/state/current';", context)
  };
}
module.exports = { loadFirebaseSync };
