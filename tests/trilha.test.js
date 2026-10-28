'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
function carregar() {
  const c = vm.createContext({ window: {}, URL });
  for (const file of ['data/trilha-trf2.js', 'js/trilha.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), c);
  return c.window.Trilha;
}
test('trilha bloqueia scripts, protocolos e credenciais em links pessoais', () => {
  const t = carregar();
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'file:///etc/passwd', 'https://usuario:senha@example.org']) assert.equal(t.urlSegura(url), '');
  assert.equal(t.urlSegura('https://example.org/quiz'), 'https://example.org/quiz');
});
test('referências TRF2 não são apresentadas como cadernos de outro concurso', () => {
  const t = carregar();
  const state = { plano: { concurso: 'TRF3 — Técnico' }, disciplinas: [], links: [] };
  assert.ok(!t.render(state).includes('data-trilha-adicionar="ref:'));
  state.plano.concurso = 'TRF2 — Técnico';
  assert.equal((t.render(state).match(/data-trilha-adicionar="ref:/g) || []).length, 200);
  state.disciplinas = [{ id: 'pt', nome: 'Português', topicos: [{ id: 'c', nome: 'Crase' }] }];
  assert.ok(t.render(state).includes('Resolver no Gran'));
  const html = t.render(state);
  assert.equal((html.match(/class="trilha-topico"/g) || []).length, 200);
  assert.equal((html.match(/Ver catálogo no Gran/g) || []).length, 18);
  assert.ok(!html.includes('revisados</strong>'));
  assert.ok(!html.includes('data-caderno-feito'));
  assert.ok(!html.includes('caderno-pendentes'));
});
test('links removidos não reaparecem pelo fallback e nomes são escapados', () => {
  const t = carregar();
  const state = { plano: { concurso: 'TRF2 — Técnico' }, disciplinas: [{ id: 'p', nome: 'Português', topicos: [{ id: 'c', nome: 'Crase' }] }], links: [{ id: 'x', tipo: 'trilha', topicoChave: 'plano:p:c', oculto: true }] };
  const html = t.render(state);
  assert.ok(!html.includes('data-trilha-editar="plano:p:c"'));
  state.links = [{ id: 'x', tipo: 'trilha', topicoChave: 'plano:p:c', nome: '<script>teste</script>', url: 'https://example.org' }];
  assert.ok(t.render(state).includes('&lt;script&gt;teste&lt;/script&gt;'));
});
