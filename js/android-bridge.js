/* Optional Android channel. Browsers continue to use the existing web timer. */
(function () {
  'use strict';
  let port = null;
  let ultimoPrazo = 0;
  let ultimoEnvio = 0;
  let atual = null;
  function enviar(data) { if (port) { try { port.postMessage(JSON.stringify(data)); } catch (_) { port = null; } } }
  window.GabariteiAndroid = {
    ativo: function () { return !!port; },
    atualizar: function (e) { atual = e; sincronizar(); },
    configuracoes: function () { enviar({ type: 'settings' }); }
  };
  window.addEventListener('message', function (event) {
    if (event.origin !== 'https://sg-devstudio.github.io' || event.data !== 'gabaritei-native-ready' || !event.ports || !event.ports[0]) return;
    port = event.ports[0]; ultimoPrazo = 0; enviar({ type: 'opened' });
    document.querySelectorAll('[data-notificacoes-android]').forEach(function (b) { b.hidden = false; });
    sincronizar();
  });
  function sincronizar() {
    if (!port) return;
    const e = atual;
    const restante = e && e.rodando ? (e.modo === 'pomodoro' ? e.pomoRestanteMs : (!e.limiteAvisado ? e.limiteRestanteMs : null)) : null;
    if (!(restante > 0)) {
      // A conclusão deixa o aviso entregue visível. Pausar/descartar cancela.
      if (ultimoPrazo && (!e || !e.rodando)) enviar({ type: 'cancelTimer' });
      ultimoPrazo = 0; return;
    }
    const prazo = Date.now() + restante;
    if (Math.abs(prazo - ultimoPrazo) < 1500 && Date.now() - ultimoEnvio < 10000) return;
    ultimoPrazo = prazo;
    ultimoEnvio = Date.now();
    enviar({ type: 'timer', at: Math.round(prazo), body: e.modo === 'pomodoro'
      ? (e.pomoFase === 'foco' ? 'Foco concluído. Reserve cinco minutos para uma pausa.' : 'Pausa encerrada. Seu próximo foco está pronto.')
      : 'O tempo planejado terminou. Você pode registrar o estudo quando estiver pronto.' });
  }
  document.addEventListener('click', function (event) {
    if (event.target.closest('[data-notificacoes-android]')) window.GabariteiAndroid.configuracoes();
  });
})();
