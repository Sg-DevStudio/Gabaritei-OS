'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function carregarTimer() {
  let agora = 0;
  const dados = {};
  const contexto = {
    window: {},
    localStorage: {
      getItem: function (chave) { return dados[chave] || null; },
      setItem: function (chave, valor) { dados[chave] = String(valor); },
      removeItem: function (chave) { delete dados[chave]; }
    },
    Date: { now: function () { return agora; } },
    setInterval: function () { return 1; },
    clearInterval: function () {},
    console
  };
  vm.createContext(contexto);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'timer.js'), 'utf8'), contexto);
  return {
    Timer: contexto.window.Timer,
    avancar: function (ms) { agora += ms; }
  };
}

test('Pomodoro registra apenas minutos de foco, sem somar a pausa', () => {
  const relogio = carregarTimer();
  relogio.Timer.iniciar('t1', 'pomodoro');
  relogio.avancar(30 * 60000);
  const estado = relogio.Timer.estado();

  assert.equal(estado.decorridoMin, 30);
  assert.equal(estado.estudoMin, 25);
  assert.equal(estado.pomoCiclos, 1);
  assert.equal(estado.pomoFase, 'foco');
});

test('Pomodoro atravessa várias fases mesmo após um tick atrasado', () => {
  const relogio = carregarTimer();
  relogio.Timer.iniciar('t1', 'pomodoro');
  relogio.avancar(67 * 60000);
  const estado = relogio.Timer.estado();

  assert.equal(estado.pomoCiclos, 2);
  assert.equal(estado.pomoFase, 'foco');
  assert.equal(estado.estudoMin, 57);
  assert.equal(estado.pomoRestanteMs, 18 * 60000);
});
