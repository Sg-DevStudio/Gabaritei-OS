'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { loadStore } = require('./helpers/load-store');
const { loadDomain } = require('./helpers/load-domain');
const c = vm.createContext({ window: {}, URL });
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/tec-questoes.js'), 'utf8'), c);
const T = c.window.TecQuestoes;
function preparar() {
  const S = loadStore(), state = S.estadoVazio();
  state.planos = ['plano-a', 'plano-b'].map(id => ({ id, plano: { concurso: id },
    disciplinas: [{ id: 'ADM', nome: 'Direito Administrativo', peso: 1,
      topicos: [{ id: 'ADM-01', nome: 'Atos administrativos', status: 'pendente', horas_estimadas: 1, incidencia_pct: 20 }] }],
    cronogramas: { sustentavel: [], hardcore: [] }, links: [] }));
  state.planoAtivoId = 'plano-a'; S.hidratar(state);
  return { S, state };
}
test('vínculo aceita somente HTTPS do TEC, sem credenciais, portas ou domínio parecido', () => {
  for (const url of ['javascript:alert(1)', 'https://tecconcursos.com.br.evil.test/caderno',
    'https://evil.test/?tecconcursos.com.br', 'http://www.tecconcursos.com.br/caderno',
    'https://user:pass@www.tecconcursos.com.br/caderno', 'https://www.tecconcursos.com.br:8000/caderno', '', null]) {
    assert.equal(T.urlSegura(url), '', String(url));
  }
  assert.equal(T.urlSegura(' https://www.tecconcursos.com.br/s/Exemplo '), 'https://www.tecconcursos.com.br/s/Exemplo');
});
test('editar e remover vínculo preserva links de outras plataformas e não altera estudo', () => {
  const { state } = preparar();
  state.links.push({ id: 'gran', tipo: 'trilha', url: 'https://questoes.grancursosonline.com.br/questoes' });
  T.definirVinculo(state, 'ADM', 'https://www.tecconcursos.com.br/s/a', 'AOCP');
  const id = T.vinculo(state, 'ADM').id;
  T.definirVinculo(state, 'ADM', 'https://www.tecconcursos.com.br/s/b', 'FCC');
  assert.equal(T.vinculo(state, 'ADM').id, id);
  assert.equal(state.links.length, 2);
  T.definirVinculo(state, 'ADM', '', '');
  assert.equal(T.vinculo(state, 'ADM'), null);
  assert.equal(state.links.find(l => l.id === id).oculto, true);
  assert.equal(state.links[0].id, 'gran');
  assert.equal(state.sessoes.length, 0);
  assert.equal(state.agenda.length, 0);
  assert.equal(state.disciplinas[0].topicos[0].status, 'pendente');
});
test('mesma disciplina em dois planos mantém cadernos diferentes após salvar e recarregar', () => {
  const { S, state } = preparar();
  T.definirVinculo(state, 'ADM', 'https://www.tecconcursos.com.br/s/a', 'Plano A');
  S.ativarPlano(state, 'plano-b');
  assert.equal(T.vinculo(state, 'ADM'), null);
  T.definirVinculo(state, 'ADM', 'https://www.tecconcursos.com.br/s/b', 'Plano B');
  assert.notEqual(S.salvar(state).ok, false);
  const salvo = S.carregar();
  assert.equal(T.vinculo(salvo, 'ADM').nome, 'Plano B');
  S.ativarPlano(salvo, 'plano-a');
  assert.equal(T.vinculo(salvo, 'ADM').nome, 'Plano A');
});
test('vínculo inválido não substitui o existente nem aceita disciplina de outro plano', () => {
  const { state } = preparar();
  T.definirVinculo(state, 'ADM', 'https://www.tecconcursos.com.br/s/a', 'Meu caderno');
  const antes = JSON.stringify(state.links);
  assert.throws(() => T.definirVinculo(state, 'ADM', 'https://example.org', 'Outro'));
  assert.throws(() => T.definirVinculo(state, 'OUTRA', 'https://www.tecconcursos.com.br/s/b', 'Outro'));
  assert.equal(JSON.stringify(state.links), antes);
});
test('salvar outro campo em uma aba antiga não desfaz edição ou remoção do vínculo TEC', () => {
  const { S, state } = preparar();
  T.definirVinculo(state, 'ADM', 'https://www.tecconcursos.com.br/s/antigo', 'Antigo');
  S.salvar(state);
  const a = S.carregar(), b = S.carregar();
  T.definirVinculo(a, 'ADM', 'https://www.tecconcursos.com.br/s/novo', 'Novo'); S.salvar(a);
  b.config.nomeUsuario = 'Aluno'; S.salvar(b);
  assert.equal(T.vinculo(S.carregar(), 'ADM').nome, 'Novo');
  const antiga = S.carregar(), removendo = S.carregar();
  T.definirVinculo(removendo, 'ADM', '', ''); S.salvar(removendo);
  antiga.config.tema = 'escuro'; S.salvar(antiga);
  assert.equal(T.vinculo(S.carregar(), 'ADM'), null);
});
test('resultado exige questões e tempo real; zero acertos é válido, frações e acertos excedentes não', () => {
  assert.equal(T.validarResultado({ duracaoMin: '35', qFeitas: '20', qCertas: '0' }), '');
  for (const valores of [{ duracaoMin: '', qFeitas: 20, qCertas: 10 },
    { duracaoMin: 30, qFeitas: '', qCertas: 0 }, { duracaoMin: 30, qFeitas: 20, qCertas: '' },
    { duracaoMin: 30, qFeitas: 20, qCertas: 21 }, { duracaoMin: 30, qFeitas: 20.5, qCertas: 10 },
    { duracaoMin: 30.5, qFeitas: 20, qCertas: 10 }, { duracaoMin: 721, qFeitas: 20, qCertas: 10 },
    { duracaoMin: 30, qFeitas: -1, qCertas: 0 }]) assert.notEqual(T.validarResultado(valores), '');
});
test('registro TEC usa as mesmas métricas do plano e conserva a origem na persistência', () => {
  const D = loadDomain(), { S, state } = preparar();
  const hoje = D.hojeISO();
  state.sessoes.push({ id: 'tec-1', planoId: state.planoAtivoId, topicoId: 'ADM-01', data: hoje,
    tipo: 'questoes', duracaoMin: 35, qFeitas: 20, qCertas: 16, plataformaQuestoes: 'tec' });
  S.salvar(state);
  const salvo = S.carregar(), meta = D.metaSemanal(salvo, hoje);
  assert.equal(salvo.sessoes[0].plataformaQuestoes, 'tec');
  assert.equal(meta.qFeitas, 20);
  assert.equal(meta.minutos, 35);
  assert.equal(meta.pctAcertos, 80);
  assert.equal(D.desempenhoDisciplina(salvo, salvo.disciplinas[0]), 80);
});
test('HTML escapa os nomes e abre o TEC sem acesso ao contexto da aba original', () => {
  const { state } = preparar();
  T.definirVinculo(state, 'ADM', 'https://www.tecconcursos.com.br/s/a', '<img src=x onerror=alert(1)>');
  const html = T.renderCard(state, 'ADM');
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('target="_blank" rel="noopener noreferrer"'));
  assert.ok(html.includes('logo-tec-concursos.png'));
  assert.ok(html.includes('aria-label="Resolver no TEC:'));
  assert.ok(!html.includes('>Resolver no TEC'));
  assert.equal(T.renderAcoes(state, { disciplinaId: 'NAO-EXISTE' }), '');
});
