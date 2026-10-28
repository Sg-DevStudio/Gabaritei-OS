'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const c = vm.createContext({ window: {}, Date, URL });
for (const f of ['js/domain.js', 'js/demo.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'), c);
const D = c.window.Dominio, demo = c.window.DemoEstudos;
test('histórico da demonstração acompanha a semana sem modificar o arquivo original', () => {
  const json = { sessoes: [{ data: '2026-06-20' }], revisoes: [{ dataAgendada: '2026-06-22' }] };
  const novo = demo.atualizarDatas(json, '2026-10-28', D);
  assert.equal(novo.sessoes[0].data, '2026-10-25');
  assert.equal(novo.revisoes[0].dataAgendada, '2026-10-27');
  assert.equal(json.sessoes[0].data, '2026-06-20');
});
test('blocos passados geram tempo e questões uma única vez; futuros e outros planos ficam fora', () => {
  const base = { planoId: 'p', topicoId: 't', feito: true, duracaoMin: 60, obs: 'teoria' };
  const s = { planoAtivoId: 'p', sessoes: [], agenda: [Object.assign({ id: 'seg', data: '2026-10-26' }, base), Object.assign({ id: 'ter', data: '2026-10-27' }, base), Object.assign({ id: 'fut', data: '2026-10-29' }, base), Object.assign({}, base, { id: 'outro', planoId: 'outro', data: '2026-10-26' })] };
  demo.registrarSemana(s, '2026-10-28', D);
  demo.registrarSemana(s, '2026-10-28', D);
  assert.equal(s.sessoes.length, 2);
  assert.equal(s.sessoes.reduce((n, x) => n + x.duracaoMin, 0), 120);
  assert.ok(s.sessoes.every(x => x.qFeitas > 0 && x.qCertas <= x.qFeitas));
});
