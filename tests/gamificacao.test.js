'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const D = loadDomain();

test('streak: conta dias seguidos até hoje e o recorde', () => {
  const sessoes = [
    { data: '2026-06-17' }, { data: '2026-06-18' }, { data: '2026-06-19' },
  ];
  const s = D.streak(sessoes, '2026-06-19');
  assert.equal(s.atual, 3);
  assert.equal(s.recorde, 3);
});

test('streak: lacuna zera o atual mas mantém o recorde', () => {
  const sessoes = [
    { data: '2026-06-10' }, { data: '2026-06-11' }, { data: '2026-06-12' }, // recorde 3
    { data: '2026-06-19' }, // hoje isolado
  ];
  const s = D.streak(sessoes, '2026-06-19');
  assert.equal(s.atual, 1);
  assert.equal(s.recorde, 3);
});

test('streak: ontem conta se hoje ainda não estudou', () => {
  const s = D.streak([{ data: '2026-06-17' }, { data: '2026-06-18' }], '2026-06-19');
  assert.equal(s.atual, 2);
});

test('flashcard SM-2: "errei" reinicia e agenda para o dia seguinte', () => {
  const sr = D.revisarFlashcard({ facilidade: 2.5, repeticoes: 4, intervalo: 30 }, 'errei', '2026-06-19');
  assert.equal(sr.repeticoes, 0);
  assert.equal(sr.intervalo, 1);
  assert.equal(sr.lapsos, 1);
  assert.ok(sr.facilidade < 2.5);
  assert.equal(sr.proximaRevisao, '2026-06-20');
});

test('flashcard SM-2: "facil" espaça mais e a facilidade não colapsa', () => {
  const sr = D.revisarFlashcard({ facilidade: 1.3, repeticoes: 0, intervalo: 0 }, 'errei', '2026-06-19');
  assert.ok(sr.facilidade >= 1.3, 'facilidade nunca abaixo de 1.3');
});

test('flashcardDevido: novo ou vencido é devido', () => {
  assert.equal(D.flashcardDevido({}, '2026-06-19'), true); // sem sr
  assert.equal(D.flashcardDevido({ sr: { proximaRevisao: '2026-06-18' } }, '2026-06-19'), true);
  assert.equal(D.flashcardDevido({ sr: { proximaRevisao: '2026-06-25' } }, '2026-06-19'), false);
});
