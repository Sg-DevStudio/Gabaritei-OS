'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const raiz = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(raiz, 'sw.js'), 'utf8');

function recursosLocaisVersionadosDoHtml() {
  const encontrados = [];
  const regex = /(?:src|href)="((?:css|js|data)\/[^"]+\?v=[^"]+)"/g;
  let match;
  while ((match = regex.exec(indexHtml))) encontrados.push('./' + match[1]);
  return encontrados;
}

test('service worker pré-carrega as mesmas versões locais usadas pelo HTML', () => {
  const ausentes = recursosLocaisVersionadosDoHtml().filter(function (recurso) {
    return !serviceWorker.includes("'" + recurso + "'");
  });
  assert.deepEqual(ausentes, []);
});

test('arquivos críticos de sincronização são publicados na mesma versão da PWA', () => {
  const arquivos = ['css/styles.css', 'js/store.js', 'js/firebase-sync.js', 'js/app.js'];
  const versoes = arquivos.map(function (arquivo) {
    const match = indexHtml.match(new RegExp(arquivo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\?v=([^"\\s]+)'));
    assert.ok(match, arquivo + ' precisa ter versão explícita');
    return match[1];
  });
  assert.equal(new Set(versoes).size, 1, 'assets críticos não podem ficar em gerações diferentes');
  assert.match(serviceWorker, /const CACHE_PREFIXO = 'gabaritei-os-'/);
  assert.match(serviceWorker, /const CACHE = CACHE_PREFIXO \+ 'v\d+-[a-z0-9-]+'/);
});

test('service worker mantém disponíveis offline o plano de exemplo e os ícones do manifesto', () => {
  [
    './data/exemplo-trf3.json?v=20260718g-integridade-sync',
    './assets/carreiras/capa-inss-tecnico.png',
    './assets/carreiras/capa-trf-tjaa.jpg?v=20260721-real1',
    './assets/carreiras/capa-trt-tjaa.jpg?v=20260721-real1',
    './icons/icone.svg',
    './icons/icone-192.png',
    './icons/icone-512.png'
  ].forEach(function (recurso) {
    assert.ok(serviceWorker.includes("'" + recurso + "'"), recurso + ' não está no pré-cache');
  });
});


test('ativar a PWA remove só versões próprias e o cache legado conhecido', async () => {
  const handlers = {}, deleted = [];
  const context = {
    self: { addEventListener: (type, fn) => { handlers[type] = fn; }, clients: { claim: async () => {} } },
    importScripts() { throw new Error('Messaging opcional indisponível'); },
    console: { warn() {} },
    caches: {
      keys: async () => ['gabaritei-os-v181-sync-contas', 'gabaritei-os-v180-logos-ferramentas', 'gabaritei-os-v179-ferramentas', 'gabaritei-os-v178-integridade-geral', 'gabaritei-os-v177-cards-semana', 'gabaritei-os-v176-prioridades-ifrj-cpii', 'gabaritei-os-v175-pesos-ifrj', 'gabaritei-os-v174-plano-ifrj', 'estudos-v172-continuidade-disciplina', 'outro-app-v1', 'estudos-outro-app'],
      delete: async name => { deleted.push(name); }
    }
  };
  vm.runInNewContext(serviceWorker, context);
  let pending;
  handlers.activate({ waitUntil: promise => { pending = promise; } });
  await pending;
  assert.deepEqual(deleted.sort(), ['estudos-v172-continuidade-disciplina', 'gabaritei-os-v174-plano-ifrj', 'gabaritei-os-v175-pesos-ifrj', 'gabaritei-os-v176-prioridades-ifrj-cpii', 'gabaritei-os-v177-cards-semana', 'gabaritei-os-v178-integridade-geral', 'gabaritei-os-v179-ferramentas', 'gabaritei-os-v180-logos-ferramentas']);
});
