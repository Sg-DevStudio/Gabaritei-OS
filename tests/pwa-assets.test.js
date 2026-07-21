'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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
