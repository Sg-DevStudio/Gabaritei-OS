'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadStore } = require('./helpers/load-store');

test('aba antiga preserva flashcard de outra aba e não propaga exclusão falsa', () => {
  const S = loadStore();
  const inicial = S.estadoVazio();
  inicial.flashcards = [{ id: 'deck', nome: 'Teste', cards: [] }];
  S.salvar(inicial);
  const a = S.carregar(), b = S.carregar();
  a.flashcards[0].cards.push({ id: 'novo', frente: 'Quem publica o edital?', verso: 'O servidor publica o edital.' });
  S.salvar(a);
  const remoto = JSON.parse(JSON.stringify(a));
  b.config.nomeUsuario = 'Aluno';
  S.salvar(b);
  const combinado = S.mesclarEstados(b, remoto);
  assert.equal(combinado.flashcards[0].cards.length, 1);
  assert.equal(S.carregar().flashcards[0].cards[0].frente, 'Quem publica o edital?');
  assert.deepEqual(b.config.entidadesExcluidas, {});
});

test('sessões offline de duas abas são mantidas ao recarregar', () => {
  const S = loadStore();
  const a = S.carregar(), b = S.carregar();
  a.sessoes.push({ id: 'a', data: '2026-09-09', duracaoMin: 25 });
  S.salvar(a);
  b.sessoes.push({ id: 'b', data: '2026-09-09', duracaoMin: 15 });
  S.salvar(b);
  assert.deepEqual(S.carregar().sessoes.map(s => s.id).sort(), ['a', 'b']);
});

test('exclusão intencional de uma carta conhecida permanece após mescla', () => {
  const S = loadStore();
  const inicial = S.estadoVazio();
  inicial.flashcards = [{ id: 'deck', cards: [{ id: 'c', frente: 'Pergunta', verso: 'Resposta' }] }];
  S.salvar(inicial);
  const a = S.carregar(), b = S.carregar();
  a.flashcards[0].cards = [];
  S.salvar(a);
  b.config.nomeUsuario = 'Aluno';
  S.salvar(b);
  assert.equal(S.carregar().flashcards[0].cards.length, 0);
});
