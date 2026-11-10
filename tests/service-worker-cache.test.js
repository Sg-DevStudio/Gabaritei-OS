const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../sw.js'), 'utf8');
function worker(saved = new Map(), network = async () => new Response('network')) {
  const handlers = {}, writes = [], opens = [], requests = [];
  const scope = 'https://example.test/Gabaritei-OS/';
  const context = { URL, Response, console: {warn() {}}, importScripts() {}, firebase: {initializeApp() {}, messaging() { return {onBackgroundMessage() {}}; }},
    self: {location: new URL(scope + 'sw.js'), addEventListener(type, callback) {handlers[type] = callback;}},
    caches: {async open(name) {opens.push(name);return {async match(key) {return saved.get(typeof key === 'string' ? key : key.url);}, async put(key, value) {writes.push([key, value]);}};}},
    fetch(request) {requests.push(request.url);return network(request);}
  };
  vm.runInNewContext(source, context);
  async function request(path, mode = 'same-origin') {
    let result;
    handlers.fetch({request: {url: new URL(path, scope).href, method: 'GET', mode}, respondWith(value) {result = value;}});
    return result;
  }
  return {request, requests, writes, opens, context};
}
test('saved home opens immediately even when the network never answers', async () => {
  const w = worker(new Map([['https://example.test/Gabaritei-OS/index.html', new Response('installed home')]]), () => new Promise(() => {}));
  assert.equal(await (await w.request('./?demo=1', 'navigate')).text(), 'installed home');
  assert.deepEqual(w.requests, []);
});
test('versioned scripts are read from the installed cache without another download', async () => {
  const path = source.match(/\.\/js\/app\.js\?v=[^']+/)[0];
  const w = worker(new Map([['https://example.test/Gabaritei-OS/' + path.slice(2), new Response('installed app')]]));
  assert.equal(await (await w.request(path)).text(), 'installed app');assert.deepEqual(w.requests, []);
});
test('a missing static asset is fetched and saved in the current version', async () => {
  const w = worker();assert.equal(await (await w.request('./icons/icone.svg')).text(), 'network');
  assert.equal(w.requests.length, 1);assert.equal(w.writes.length, 1);assert.match(w.opens[0], /^gabaritei-os-v/);
});
test('calculator navigation keeps its own HTML, including query parameters', async () => {
  const w = worker(new Map([['https://example.test/Gabaritei-OS/calc/judiciario-federal.html', new Response('calculator')]]));
  assert.equal(await (await w.request('./calc/judiciario-federal.html?cargo=tecnico', 'navigate')).text(), 'calculator');
  assert.deepEqual(w.requests, []);
});
test('cloud, API and unlisted requests never receive a cached static response', async () => {
  const w = worker();
  for (const url of ['https://firestore.googleapis.com/test', './api/sync', './not-a-static-file']) assert.equal(await w.request(url), undefined);
  assert.deepEqual(w.requests, []);assert.deepEqual(w.opens, []);
});
test('a failed uncached request remains an error instead of reporting stale success', async () => {
  const w = worker(new Map(), async () => {throw new Error('offline');});
  assert.equal((await w.request('./icons/icone.svg')).type, 'error');
});
