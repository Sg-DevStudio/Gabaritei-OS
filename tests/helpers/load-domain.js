'use strict';

// Carrega js/domain.js (script de navegador que faz `window.Dominio = {...}`)
// e devolve o objeto Dominio. Mantém os testes independentes de DOM/Firebase —
// domain.js é puro de propósito.
//
// Rodamos no MESMO realm (runInThisContext + window global) em vez de um vm
// context isolado: assim os objetos retornados (arrays/objetos) compartilham os
// protótipos do processo de teste e o assert.deepStrictEqual funciona normalmente.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadDomain() {
  const file = path.join(__dirname, '..', '..', 'js', 'domain.js');
  const code = fs.readFileSync(file, 'utf8');
  global.window = {};
  vm.runInThisContext(code, { filename: file });
  if (!global.window.Dominio) {
    throw new Error('domain.js não exportou window.Dominio');
  }
  return global.window.Dominio;
}

module.exports = { loadDomain };
