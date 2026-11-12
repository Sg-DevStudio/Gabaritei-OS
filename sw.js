/* Service worker — cache de estáticos (o app funciona 100% sem ele) */
const CACHE_PREFIXO = 'gabaritei-os-';
const CACHE = CACHE_PREFIXO + 'v275-selection-focus';
// Nome exato da versão anterior: migração sem apagar caches de outras PWAs.
const CACHE_LEGADO = 'estudos-v172-continuidade-disciplina';

/* Toque na notificação: timer abre a tela do cronômetro; lembrete abre o app. */
self.addEventListener('notificationclick', (e) => {
  // Este handler precisa existir antes de carregar o SDK do Firebase para não ser
  // substituído pelo listener padrão do Messaging.
  e.stopImmediatePropagation();
  e.notification.close();
  const timer = e.notification.tag === 'estudos-timer';
  const destinoPush = e.notification.data && e.notification.data.link;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const c of lista) {
        if ('focus' in c) {
          c.focus();
          if ('navigate' in c) {
            const destino = timer ? c.url.split('#')[0] + '#timer' : (destinoPush || c.url);
            c.navigate(destino).catch(() => {});
          }
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(timer ? './#timer' : (destinoPush || './'));
    })
  );
});
// O Firebase Messaging usa o MESMO service worker da PWA. Manter cache/offline e
// push no mesmo registro evita que um worker substitua o outro no escopo raiz.
try {
  importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');
  firebase.initializeApp({
    apiKey: 'AIzaSyBAxmw7gFkMk0aPwIGHQblo5nLFz8fKKnU',
    authDomain: 'app-gestao-estudos.firebaseapp.com',
    projectId: 'app-gestao-estudos',
    storageBucket: 'app-gestao-estudos.firebasestorage.app',
    messagingSenderId: '450464644014',
    appId: '1:450464644014:web:150b9f8683842de10c663f'
  });
  firebase.messaging().onBackgroundMessage((payload) => {
    const n = (payload && payload.data) || (payload && payload.notification) || {};
    if (!n.title) return;
    self.registration.showNotification(n.title, {
      body: n.body || '',
      icon: n.icon || './icons/icone.svg',
      tag: 'lembrete-estudo',
      data: { link: n.link || './' }
    });
  });
} catch (e) {
  // Firebase/push é opcional. Uma falha da CDN não pode impedir o app offline.
  console.warn('Firebase Messaging indisponível no service worker.', e);
}
const ESTATICOS = [
  './js/foco-ui.js?v=20261112-selection-focus',
  './data/cadernos-exemplos.json',
  './data/ia-config.js?v=20261112-selection-focus',
  './js/questoes-ia.js?v=20261112-selection-focus',
  './js/questoes-ia-ui.js?v=20261112-selection-focus',
  './js/estudo-dialogos.js?v=20261112-selection-focus',
  './js/redacoes.js?v=20261112-selection-focus',
  './js/redacoes-ui.js?v=20261112-selection-focus',
  './js/questoes-ia-provider.js?v=20261112-selection-focus',
  './data/caderno-tec.js?v=20261112-selection-focus',
  './data/caderno-qconcursos.js?v=20261112-selection-focus',
  './assets/ferramentas/logo-qconcursos.svg',
  './assets/carreiras/logo-ufrj.png',
  './assets/ferramentas/logo-tec-concursos.png',
  './assets/carreiras/logo-tjsp.jpg',
  './js/planos-atualizacao.js?v=20261112-selection-focus',
  './js/tec-questoes.js?v=20261112-selection-focus',
  './data/caderno-trt4-analista.js?v=20261112-selection-focus',
  './assets/carreiras/logo-trt4.jpg',
  './data/edital-tjsp-2026.js?v=20261112-selection-focus',
  './data/edital-trt4-2026.js?v=20261112-selection-focus',
  './data/edital-trt4-analista-2026.js?v=20261112-selection-focus',
  './data/caderno-trt4.js?v=20261112-selection-focus',
  './data/caderno-tjsp.js?v=20261112-selection-focus',
  './assets/ferramentas/logo-gran-questoes.webp',
  './js/ajuda.js?v=20261112-selection-focus',
  './js/trilha.js?v=20261112-selection-focus',
  './js/demo.js',
  './data/trilha-trf2.js',
  './data/trilha-vinculos-trf2.js?v=20261112-selection-focus',
  './assets/android/qr-download.png?v=android-native-v0150',
  './js/android-bridge.js?v=20261112-selection-focus',
  './',
  './index.html',
  './manifest.json',
  './calc/petrobras.html',
  './calc/judiciario-federal.html',
  './js/frases.js?v=20261112-selection-focus',
  './css/styles.css?v=20261112-selection-focus',
  './js/domain.js?v=20261112-selection-focus',
  './js/store.js?v=20261112-selection-focus',
  './js/sync.js?v=20260718h-seguranca-escala',
  './js/remote-state.js?v=20260718h-seguranca-escala',
  './js/firebase-sync.js?v=20261112-selection-focus',
  './js/timer.js?v=20261112-selection-focus',
  './js/charts.js?v=20261112-selection-focus',
  './data/catalogo-editais.js?v=20261112-selection-focus',
  './data/carreiras.js?v=20261112-selection-focus',
  './assets/carreiras/capa-inss-tecnico.png',
  './assets/carreiras/capa-ifrj-assistente.svg',
  './assets/carreiras/capa-trf2-tjaa.svg',
  './assets/carreiras/capa-trf-tjaa.jpg?v=20260721-real1',
  './assets/carreiras/capa-trt-tjaa.jpg?v=20260721-real1',
  './data/exemplo-trf3.json?v=20261028-demo-imagem',
  './assets/carreiras/logo-trf3.png',
  './data/ferramentas.js?v=20261112-selection-focus',
  './assets/ferramentas/logo-anki.png',
  './assets/ferramentas/logo-notebooklm.svg',
  './assets/ferramentas/logo-notion.svg',
  './assets/ferramentas/logo-scielo.svg',
  './assets/ferramentas/logo-trello.svg',
  './assets/ferramentas/logo-zlibrary.png',
  './js/inicio-layout.js?v=20261112-selection-focus',
  './js/profile-photo.js?v=20261112-selection-focus',
  './js/app-status.js?v=20261112-selection-focus',
  './js/app.js?v=20261112-selection-focus',
  './icons/icone.svg',
  './icons/icone-192.png',
  './icons/icone-512.png'
];

// O worker assume o cache novo; a página só recarrega em um estado seguro,
// sem timer, formulário ou diálogo em aberto.
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ESTATICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) =>
        k !== CACHE && (k.startsWith(CACHE_PREFIXO) || k === CACHE_LEGADO)
      ).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Each installed version has a complete static cache. Checking the network for
// every script delayed startup on slow connections, even with an offline copy.
// New releases still install in the background and reload only in a safe state.
const URLS_ESTATICOS = new Set(ESTATICOS.map((path) => new URL(path, self.location.href).href));
URLS_ESTATICOS.add(new URL('./assets/vendor/pdf-lib-1.17.1.min.js',self.location.href).href);
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || url.pathname.includes('/api/')) return;
  const inicio = e.request.mode === 'navigate' &&
    [new URL('./', self.location.href).pathname, new URL('./index.html', self.location.href).pathname].includes(url.pathname);
  const semConsulta = url.origin + url.pathname;
  const chave = inicio ? new URL('./index.html', self.location.href).href :
    URLS_ESTATICOS.has(url.href) ? e.request : URLS_ESTATICOS.has(semConsulta) ? semConsulta : null;
  if (!chave) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const salvo = await cache.match(chave);
    if (salvo) return salvo;
    try {
      const resposta = await fetch(e.request);
      if (resposta.ok) { try { await cache.put(chave, resposta.clone()); } catch (_) {} }
      return resposta;
    } catch (_) {
      return Response.error();
    }
  })());
});
