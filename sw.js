/* Service worker — cache de estáticos (o app funciona 100% sem ele) */
const CACHE = 'estudos-v75-loopfix';
const ESTATICOS = [
  './',
  './index.html',
  './manifest.json',
  './js/frases.js',
  './css/styles.css?v=20260620e-simresp',
  './js/domain.js?v=20260620a-metas',
  './js/store.js?v=20260620a-metas',
  './js/sync.js',
  './js/firebase-sync.js?v=20260619y-sync-fix',
  './js/timer.js?v=20260619w-bloco',
  './js/charts.js',
  './data/catalogo-editais.js?v=20260616v-acentos',
  './js/app.js?v=20260620f-update-loop',
  './icons/icone.svg'
];

// NÃO chamamos skipWaiting() aqui: o SW novo fica em "espera" e a página avisa
// o usuário ("Nova versão disponível"). Só ativa quando ele toca em Atualizar
// (mensagem SKIP_WAITING abaixo) — evita troca abrupta no meio do uso.
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ESTATICOS)));
});

// A página manda esta mensagem ao tocar em "Atualizar": ativa o SW em espera.
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
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

/* Toque na notificação do cronômetro: foca a aba aberta ou abre o app no Timer */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const c of lista) {
        if ('focus' in c) { c.focus(); if ('navigate' in c) c.navigate(c.url.split('#')[0] + '#timer').catch(() => {}); return; }
      }
      if (self.clients.openWindow) return self.clients.openWindow('./#timer');
    })
  );
});
