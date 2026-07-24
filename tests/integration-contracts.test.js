'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const regras = fs.readFileSync(path.join(raiz, 'firestore.rules'), 'utf8');
const firebaseSync = fs.readFileSync(path.join(raiz, 'js', 'firebase-sync.js'), 'utf8');
const app = fs.readFileSync(path.join(raiz, 'js', 'app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(raiz, 'sw.js'), 'utf8');
const functionsIndex = fs.readFileSync(path.join(raiz, 'functions', 'index.js'), 'utf8');
const store = fs.readFileSync(path.join(raiz, 'js', 'store.js'), 'utf8');
const sync = fs.readFileSync(path.join(raiz, 'js', 'sync.js'), 'utf8');

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

test('IA não configurada aparece como recurso em breve e fica desativada', () => {
  assert.match(app, /const IA_FLASHCARDS_DISPONIVEL = false/);
  assert.match(app, /id="fc-gerar-ia"[^>]*disabled/);
  assert.match(app, /IA em breve/);
});

test('menu deixa o Instagram apenas dentro dos modais de contato', () => {
  assert.match(indexHtml, /id="sidebar-feedback"/);
  assert.match(indexHtml, /Feedback, erros e sugestões/);
  assert.doesNotMatch(indexHtml, /class="sidebar-instagram"/);
  assert.doesNotMatch(app, /class="mais-item mais-instagram"/);
  assert.match(app, /const INSTAGRAM_DIRECT_URL = 'https:\/\/ig\.me\/m\/samuel_g\.silva'/);
  assert.match(app, /Abrir Direct/);
  assert.match(app, /target="_blank" rel="noopener noreferrer"/);
});

test('pedido de edital copia a mensagem antes de abrir o Direct e mantém o registro no painel', () => {
  assert.doesNotMatch(app, /INSTAGRAM_DIRECT_URL \+ .*encodeURIComponent/);
  assert.match(app, /Gostaria de pedir este edital no Gabaritei OS/);
  assert.match(app, /Instagram não permite preencher essa mensagem automaticamente/);
  assert.match(app, /id="pedido-copiar">Copiar mensagem/);
  assert.match(app, /id="pedido-abrir-direct"/);
  assert.match(app, /copiarTextoParaTransferencia\(mensagem\)/);
  assert.match(app, /FirebaseSync\.enviarPedidoEdital\(\{ texto: txt \}\)/);
});

test('push reutiliza o service worker principal sem substituir o cache da PWA', () => {
  assert.doesNotMatch(firebaseSync, /serviceWorker\.register\('firebase-messaging-sw\.js'\)/);
  assert.match(firebaseSync, /navigator\.serviceWorker\.ready/);
  assert.match(serviceWorker, /firebase\.messaging\(\)\.onBackgroundMessage/);
  assert.match(functionsIndex, /https:\/\/sg-devstudio\.github\.io\/Gabaritei-OS\//);
});

test('notificação do timer usa o service worker compatível com navegadores móveis', () => {
  assert.doesNotMatch(app, /new Notification\(/);
  assert.match(app, /mostrarNotificacaoTimer\(e, true\)/);
  assert.match(app, /reg\.showNotification/);
});

test('gravação remota remove o espelho hidratado e particiona estados grandes', () => {
  assert.match(firebaseSync, /window\.Store\.paraPersistencia/);
  assert.match(firebaseSync, /window\.RemoteStateCodec/);
  assert.match(firebaseSync, /writeBatch\(db\)/);
  assert.match(firebaseSync, /runTransaction\(db/);
  assert.match(firebaseSync, /transacao\.get\(refEstado\)/);
  assert.match(firebaseSync, /estadoCanonicoParaGravacao/);
  assert.match(firebaseSync, /Math\.max\(revDe\(stateLimpo\), revDe\(remoto && remoto\.state\)\) \+ 1/);
  assert.match(firebaseSync, /formato: codificado\.formato/);
  assert.match(firebaseSync, /chunks: codificado\.partes\.length/);
  assert.match(indexHtml, /js\/remote-state\.js/);
});

test('logout confirma a nuvem e limpa dados pessoais deste aparelho', () => {
  assert.match(firebaseSync, /opcoesLogout\.antesDeSair/);
  assert.match(app, /sincronizarAntes: true/);
  assert.match(app, /window\.Store\.limparLocal\(\)/);
  assert.match(app, /localStorage\.removeItem\(CHAVE_ULTIMO_USUARIO\)/);
  assert.match(store, /function limparLocal\(\)/);
  assert.match(app, /window\.Sync\.parar\(\)/);
});

test('lembretes push exigem consentimento separado da notificação do timer', () => {
  const inicio = app.indexOf('function pedirPermissaoNotificacao');
  const fim = app.indexOf('const TAG_NOTIF_TIMER', inicio);
  const corpoPermissaoTimer = app.slice(inicio, fim);
  assert.doesNotMatch(corpoPermissaoTimer, /registrarPush/);
  assert.match(app, /id="pf-lembretes-push"/);
  assert.match(firebaseSync, /config\.lembretesPush === true/);
});

test('regras limitam ids de estado, partes e documento de push', () => {
  assert.match(regras, /isStateChunkId/);
  assert.match(regras, /current\|backup-\[0-6\]/);
  assert.match(regras, /request\.resource\.data\.payload\.size\(\) <= 180000/);
  assert.match(regras, /docId == "tokens"/);
  assert.match(regras, /request\.resource\.data\.size\(\) <= 20/);
});

test('importação XLSX usa versão corrigida e integridade do arquivo externo', () => {
  assert.doesNotMatch(indexHtml, /xlsx@0\.18\.5/);
  assert.match(indexHtml, /xlsx-0\.20\.3/);
  assert.match(indexHtml, /integrity="sha384-[^"]+"/);
  assert.match(indexHtml, /crossorigin="anonymous"/);
});

test('gráficos usam Chart.js atual e com integridade do arquivo externo', () => {
  assert.match(indexHtml, /chart\.js@4\.5\.1/);
  assert.match(indexHtml, /chart\.umd\.min\.js"[\s\S]*?integrity="sha384-[^"]+"/);
});

test('sync local sem autenticação exige opt-in e pode ser interrompido', () => {
  assert.match(app, /get\('syncLocal'\) === '1'/);
  assert.match(sync, /function parar\(\)/);
  assert.match(sync, /window\.Sync = \{ iniciar, parar,/);
});
