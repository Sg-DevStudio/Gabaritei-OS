/* Service worker — cache de estáticos (o app funciona 100% sem ele) */
const CACHE = 'estudos-v12';
const ESTATICOS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css?v=20260613-refatora',
  './js/frases.js',
  './js/domain.js',
  './js/store.js',
  './js/sync.js',
  './js/firebase-sync.js',
  './js/timer.js',
  './js/charts.js',
  './js/app.js?v=20260613-refatora',
  './icons/icone.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ESTATICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Estratégia: rede primeiro com fallback para cache (estáticos sempre frescos online, app abre offline) */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.pathname.endsWith('/api/sync')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copia = resp.clone();
        if (resp.ok && e.request.url.startsWith(self.location.origin)) {
          caches.open(CACHE).then((c) => c.put(e.request, copia));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
