'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const codec = require('../js/remote-state.js');

test('codec remoto preserva estados pequenos', () => {
  const estado = { versao: 2, config: { nomeUsuario: 'Samuel' }, planos: [] };
  const codificado = codec.codificar(estado);
  assert.equal(codificado.formato, 2);
  assert.equal(codificado.partes.length, 1);
  assert.deepEqual(codec.decodificar(codificado.partes), estado);
});

test('codec divide e recompõe estados maiores que um documento', () => {
  const estado = {
    versao: 2,
    flashcards: Array.from({ length: 16 }, (_, i) => ({
      id: 'deck-' + i,
      cards: [{ frente: 'Pergunta ' + i, verso: 'x'.repeat(20000) }]
    }))
  };
  const codificado = codec.codificar(estado);
  assert.ok(codificado.partes.length > 1);
  codificado.partes.forEach((parte) => {
    assert.ok(codec.tamanhoUtf8(parte) <= codec.LIMITE_PARTE_BYTES);
  });
  assert.deepEqual(codec.decodificar(codificado.partes), estado);
});

test('divisão não rompe pares UTF-16 de emojis', () => {
  const prefixo = 'a'.repeat(codec.MAX_UNIDADES_PARTE - 1);
  const texto = prefixo + '🧠' + 'fim';
  const partes = codec.dividirTexto(texto);
  assert.equal(partes.join(''), texto);
  assert.equal(partes[0], prefixo);
  assert.equal(partes[1].startsWith('🧠'), true);
});

test('codec limita a quantidade máxima de documentos', () => {
  const texto = 'x'.repeat(codec.MAX_UNIDADES_PARTE * codec.MAX_PARTES + 1);
  assert.throws(() => codec.dividirTexto(texto), /capacidade atual/);
});

test('ids de partes aceitam somente current e sete backups', () => {
  assert.equal(codec.idParte('current', 0), 'current-chunk-00');
  assert.equal(codec.idParte('backup-6', 23), 'backup-6-chunk-23');
  assert.throws(() => codec.idParte('backup-7', 0), /Prefixo/);
  assert.throws(() => codec.idParte('current', 24), /Índice/);
  assert.throws(() => codec.idParte('current', '1x'), /Índice/);
});
