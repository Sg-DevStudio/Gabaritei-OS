/* ============================================================
   Service worker do Firebase Cloud Messaging (lembretes de estudo).
   Recebe as notificações push em segundo plano. A mensagem é enviada pela
   Cloud Function `lembreteEstudo` com payload `notification`, então o próprio
   FCM exibe; aqui tratamos o clique para abrir/focar o app.
   ============================================================ */
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

const messaging = firebase.messaging();

// Mensagens só de dados (sem payload notification) caem aqui — exibimos manualmente.
messaging.onBackgroundMessage(function (payload) {
  const n = (payload && payload.notification) || (payload && payload.data) || {};
  if (!n.title) return;
  self.registration.showNotification(n.title, {
    body: n.body || '',
    icon: n.icon || './icons/icone.svg',
    tag: 'lembrete-estudo'
  });
});

// Toque na notificação: foca uma aba aberta ou abre o app.
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  const destino = (e.notification.data && e.notification.data.link) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (lista) {
      for (const c of lista) {
        if ('focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(destino);
    })
  );
});
