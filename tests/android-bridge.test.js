'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/android-bridge.js'), 'utf8');
function ambiente() {
  const handlers = {}, sent = [];
  let now = 100000;
  const context = { window: { addEventListener: (type, fn) => { handlers[type] = fn; } },
    document: { addEventListener() {}, querySelectorAll: () => [] },
    Date: { now: () => now } };
  vm.runInNewContext(source, context);
  const conectar = origin => handlers.message({ origin, data: 'gabaritei-native-ready', ports: [{ postMessage: data => sent.push(JSON.parse(data)) }] });
  return { api: context.window.GabariteiAndroid, sent, conectar, avancar: ms => { now += ms; } };
}
test('ponte Android rejeita mensagens vindas de outra origem', () => {
  const a = ambiente(); a.conectar('https://outro.example');
  assert.equal(a.api.ativo(), false); assert.equal(a.sent.length, 0);
});
test('ponte agenda o prazo e cancela quando o timer pausa, sem registrar estudo', () => {
  const a = ambiente(); a.conectar('https://sg-devstudio.github.io');
  a.api.atualizar({ rodando: true, limiteRestanteMs: 60000 });
  assert.equal(a.sent.at(-1).at, 160000);
  a.api.atualizar({ rodando: false, limiteRestanteMs: 60000 });
  assert.equal(a.sent.at(-1).type, 'cancelTimer');
  assert.deepEqual(a.sent.map(x => x.type), ['opened', 'timer', 'cancelTimer']);
});
test('ponte não duplica agendamentos em cada tick nem remove o aviso recém-entregue', () => {
  const a = ambiente(); a.conectar('https://sg-devstudio.github.io');
  a.api.atualizar({ rodando: true, limiteRestanteMs: 1000 });
  a.avancar(500); a.api.atualizar({ rodando: true, limiteRestanteMs: 500 });
  a.avancar(500); a.api.atualizar({ rodando: true, limiteRestanteMs: 0, limiteAvisado: true });
  assert.deepEqual(a.sent.map(x => x.type), ['opened', 'timer']);
});
test('ponte usa o prazo da fase do Pomodoro e reenvia para permitir mudança nas preferências nativas', () => {
  const a = ambiente(); a.conectar('https://sg-devstudio.github.io');
  a.api.atualizar({ rodando: true, modo: 'pomodoro', pomoFase: 'foco', pomoRestanteMs: 25000 });
  assert.equal(a.sent.at(-1).at, 125000);
  a.avancar(10000); a.api.atualizar({ rodando: true, modo: 'pomodoro', pomoFase: 'foco', pomoRestanteMs: 15000 });
  assert.equal(a.sent.filter(x => x.type === 'timer').length, 2);
  a.api.configuracoes(); assert.equal(a.sent.at(-1).type, 'settings');
});
