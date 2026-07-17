'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const regras = fs.readFileSync(path.join(raiz, 'firestore.rules'), 'utf8');
const firebaseSync = fs.readFileSync(path.join(raiz, 'js', 'firebase-sync.js'), 'utf8');
const app = fs.readFileSync(path.join(raiz, 'js', 'app.js'), 'utf8');

test('pedidos de edital usam um documento limitado por usuário e campos validados', () => {
  assert.match(regras, /pedidoId == request\.auth\.uid/);
  assert.match(regras, /data\.keys\(\)\.hasOnly\(\["texto", "status", "criadoEm", "usuario", "savedAt"\]\)/);
  assert.match(regras, /data\.texto\.size\(\) <= 500/);
  assert.match(regras, /data\.usuario\.keys\(\)\.hasOnly\(\["uid", "email", "nome"\]\)/);
  assert.match(firebaseSync, /setDoc\(doc\(db, 'pedidosEdital', usuario\.uid\)/);
  assert.doesNotMatch(firebaseSync, /addDoc\(pedidosCollection/);
});

test('Google Calendar recupera evento por propriedades privadas antes de inserir', () => {
  const inicioUpsert = app.indexOf('async function upsertEventoGoogleCalendar');
  const fimUpsert = app.indexOf('async function sincronizarGoogleCalendarSemana', inicioUpsert);
  const corpoUpsert = app.slice(inicioUpsert, fimUpsert);

  assert.ok(inicioUpsert >= 0 && fimUpsert > inicioUpsert);
  assert.match(app, /privateExtendedProperty=' \+ encodeURIComponent\(valor\)/);
  assert.match(app, /'localId=' \+ props\.localId/);
  assert.ok(
    corpoUpsert.indexOf('await buscarEventoGoogleCalendar(token, item)') <
      corpoUpsert.indexOf('await inserirEventoGoogleCalendar(token, item)'),
    'a busca remota deve acontecer antes do POST de inserção'
  );
});
