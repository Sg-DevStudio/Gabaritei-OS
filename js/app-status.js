/* Shared header feedback for cloud sync and safe, automatic PWA updates. */
(function () {
  'use strict';
  let sincronizacao = null, versao = '', pendente = false, recarregando = false;
  let concluirEm = 0, ocultar = null, aplicar = null;
  const ocupados = new Set(['sincronizando', 'enviando', 'carregando', 'pendente']);
  function modelo() {
    if (versao === 'aplicando') return { tipo: 'ocupado', texto: 'Atualizando o Gabaritei…' };
    if (sincronizacao && sincronizacao.usuario) {
      if (navigator.onLine === false) return { tipo: 'pendente', texto: 'Sem conexão', detalhe: 'Seus registros continuam salvos neste aparelho. A sincronização retoma ao conectar.' };
      if (ocupados.has(sincronizacao.estado)) return { tipo: 'ocupado', texto: 'Sincronizando…' };
      if (sincronizacao.estado === 'erro') return { tipo: 'pendente', texto: 'Salvo neste aparelho', detalhe: 'Sincronização pendente. Abra o perfil para conferir a conexão e tentar novamente.' };
    }
    if (versao === 'baixando') return { tipo: 'ocupado', texto: 'Atualizando o Gabaritei…' };
    if (versao === 'aguardando') return { tipo: 'aguardando', texto: 'Atualização pronta', detalhe: 'Será aplicada automaticamente após o estudo, a sincronização e as edições abertas.' };
    if (concluirEm > Date.now()) return { tipo: 'concluido', texto: 'Tudo atualizado' };
    return null;
  }
  function pintar() {
    const el = document.getElementById('atividade-app'), m = modelo();
    if (!el) return;
    el.hidden = !m;
    if (!m) return;
    el.dataset.estado = m.tipo;
    el.title = m.detalhe || m.texto;
    el.setAttribute('aria-label', m.detalhe || m.texto);
    el.querySelector('.atividade-texto').textContent = m.texto;
    el.querySelector('.atividade-simbolo').textContent = m.tipo === 'concluido' ? '✓' : m.tipo === 'pendente' ? '!' : m.tipo === 'aguardando' ? '·' : '';
  }
  function concluir() {
    concluirEm = Date.now() + 2000;
    clearTimeout(ocultar);
    ocultar = setTimeout(pintar, 2050);
  }
  function sincronizar(status) {
    const antes = sincronizacao;
    sincronizacao = status;
    if (status && status.usuario && status.estado === 'sincronizado' && antes && (ocupados.has(antes.estado) || antes.estado === 'erro')) concluir();
    pintar();
    tentarAplicar();
  }
  function segura() {
    return !document.hidden && !!window.GabariteiAtualizacaoSegura && window.GabariteiAtualizacaoSegura();
  }
  function tentarAplicar() {
    if (!pendente || recarregando || aplicar || !segura()) return;
    versao = 'aplicando'; pintar();
    aplicar = setTimeout(function () {
      aplicar = null;
      // Recheck: the student may have opened an editor during this short transition.
      if (!segura()) { versao = 'aguardando'; pintar(); return; }
      recarregando = true;
      try { sessionStorage.setItem('gabaritei-atualizado', '1'); } catch (_) {}
      window.location.reload();
    }, 650);
  }
  function iniciar() {
    const el = document.getElementById('atividade-app');
    if (el) el.addEventListener('click', function () {
      const perfil = document.getElementById('botao-perfil');
      if (perfil) perfil.click();
    });
    try { if (sessionStorage.getItem('gabaritei-atualizado')) { sessionStorage.removeItem('gabaritei-atualizado'); concluir(); } } catch (_) {}
    pintar();
    window.addEventListener('offline', pintar);
    window.addEventListener('online', function () { pintar(); tentarAplicar(); });
    if (!('serviceWorker' in navigator)) return;
    let controlado = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!controlado) { controlado = true; return; }
      if (pendente || recarregando) return;
      pendente = true; versao = 'aguardando'; pintar(); tentarAplicar();
    });
    navigator.serviceWorker.register('sw.js').then(function (registro) {
      function observar(worker) {
        if (!worker || !controlado) return;
        versao = 'baixando'; pintar();
        worker.addEventListener('statechange', function () {
          if (worker.state === 'redundant' && !pendente) { versao = ''; pintar(); }
        });
      }
      observar(registro.installing);
      registro.addEventListener('updatefound', function () { observar(registro.installing); });
    }).catch(function () { versao = ''; pintar(); });
    setInterval(tentarAplicar, 2500);
    window.addEventListener('focus', tentarAplicar);
    document.addEventListener('visibilitychange', tentarAplicar);
  }
  window.GabariteiAtividade = { sincronizar };
  window.addEventListener('load', iniciar);
})();
