'use strict';

// Carrega js/store.js (script de navegador que faz `window.Store = {...}`) com
// stubs mínimos de window/localStorage, no mesmo realm (ver load-domain.js).
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadStore() {
  const file = path.join(__dirname, '..', '..', 'js', 'store.js');
  const code = fs.readFileSync(file, 'utf8');
  const mem = {};
  global.window = global.window || {};
  global.localStorage = {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
    setItem: function (k, v) { mem[k] = String(v); },
    removeItem: function (k) { delete mem[k]; }
  };
  vm.runInThisContext(code, { filename: file });
  if (!global.window.Store) {
    throw new Error('store.js não exportou window.Store');
  }
  return global.window.Store;
}

module.exports = { loadStore };
