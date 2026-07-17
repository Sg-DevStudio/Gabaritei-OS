'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const arquivoSync = path.join(__dirname, '..', 'js', 'sync.js');
const codigoSync = fs.readFileSync(arquivoSync, 'utf8');

function carregarSync(fetchImpl) {
  const intervalos = [];
  const cancelados = [];
  const contexto = {
    window: {
      Store: {
        temDados: function () { return false; },
        normalizar: function (state) { return state; }
      },
      addEventListener: function () {}
    },
    document: {
      hidden: false,
      addEventListener: function () {}
    },
    location: { protocol: 'https:', origin: 'https://app.exemplo' },
    localStorage: {
      getItem: function () { return null; },
      setItem: function () {}
    },
    fetch: fetchImpl,
    setInterval: function (fn, ms) {
      const id = { fn: fn, ms: ms };
      intervalos.push(id);
      return id;
    },
    clearInterval: function (id) { cancelados.push(id); },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    Date: Date,
    Math: Math,
    Number: Number,
    Promise: Promise,
    Error: Error
  };
  vm.createContext(contexto);
  vm.runInContext(codigoSync, contexto, { filename: arquivoSync });
  return { Sync: contexto.window.Sync, intervalos: intervalos, cancelados: cancelados };
}

function proximoCiclo() {
  return new Promise(function (resolve) { setImmediate(resolve); });
}

test('sync legado desativa polling quando /api/sync não existe', async () => {
  let chamadas = 0;
  const ambiente = carregarSync(async function () {
    chamadas++;
    return { status: 404, ok: false };
  });

  ambiente.Sync.iniciar({ obterEstado: function () { return { config: {} }; } });
  await proximoCiclo();
  await proximoCiclo();

  assert.equal(chamadas, 1);
  assert.equal(ambiente.intervalos.length, 1);
  assert.equal(ambiente.cancelados.length, 1);
  assert.equal(ambiente.Sync.status().estado, 'local');
  assert.equal(ambiente.Sync.status().endpoint, null);

  await ambiente.intervalos[0].fn();
  assert.equal(chamadas, 1, 'callback já agendado não deve voltar a consultar a API');
});

test('sync legado mantém polling para falha transitória do servidor', async () => {
  const ambiente = carregarSync(async function () {
    return { status: 503, ok: false };
  });

  ambiente.Sync.iniciar({ obterEstado: function () { return { config: {} }; } });
  await proximoCiclo();
  await proximoCiclo();

  assert.equal(ambiente.cancelados.length, 0);
  assert.equal(ambiente.Sync.status().estado, 'local');
  assert.equal(ambiente.Sync.status().endpoint, 'https://app.exemplo/api/sync');
});
