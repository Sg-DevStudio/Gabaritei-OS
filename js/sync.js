/* ============================================================
   sync.js - sincronizacao opcional entre aparelhos.
   Usa /api/sync quando o app roda pelo servidor local; se a API
   nao existir, o app continua usando apenas este navegador.
   ============================================================ */
(function () {
  'use strict';

  const CHAVE_DISPOSITIVO = 'estudos.sync.dispositivo';
  const INTERVALO_MS = 15000;
  const FOLGA_RELOGIO_MS = 1000;

  let opcoes = null;
  let endpoint = null;
  let envioPendente = null;
  let intervaloId = null;
  let verificacaoEmCurso = false;
  let envioEmCurso = false;
  let statusAtual = { estado: 'verificando', texto: 'Verificando sincronizacao', ultima: null, endpoint: null };

  function idDispositivo() {
    let id = localStorage.getItem(CHAVE_DISPOSITIVO);
    if (!id) {
      id = 'disp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(CHAVE_DISPOSITIVO, id);
    }
    return id;
  }

  function definirStatus(estado, texto) {
    statusAtual = { estado, texto, ultima: new Date().toISOString(), endpoint };
    if (opcoes && opcoes.aoStatus) opcoes.aoStatus(statusAtual);
  }

  function dataMs(valor) {
    const n = Date.parse(valor || '');
    return Number.isFinite(n) ? n : 0;
  }

  function atualizadoEm(state) {
    return state && state.config ? state.config.atualizadoEm : null;
  }

  function foiApagadoDepoisDoRemoto(local, remoto) {
    const apagadoEm = local && local.config ? local.config.apagadoEm : null;
    return apagadoEm && dataMs(apagadoEm) > dataMs(atualizadoEm(remoto)) + FOLGA_RELOGIO_MS;
  }

  function temDados(state) {
    return window.Store.temDados(state);
  }

  function normalizarEnvelope(dados) {
    if (!dados) return { state: null, updatedAt: null, clientId: null };
    if (Object.prototype.hasOwnProperty.call(dados, 'state')) return dados;
    return { state: dados, updatedAt: atualizadoEm(dados), clientId: null };
  }

  function erroIndisponivel() {
    const erro = new Error('sync indisponivel');
    erro.syncIndisponivel = true;
    return erro;
  }

  function desativarEndpoint() {
    if (intervaloId != null) {
      clearInterval(intervaloId);
      intervaloId = null;
    }
    if (envioPendente != null) {
      clearTimeout(envioPendente);
      envioPendente = null;
    }
    endpoint = null;
    definirStatus('local', 'Somente neste navegador');
  }

  async function lerRemoto() {
    const resp = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    });
    if (resp.status === 404 || resp.status === 405 || resp.status === 501) throw erroIndisponivel();
    if (!resp.ok) throw new Error('falha ao ler sync: ' + resp.status);
    try {
      return normalizarEnvelope(await resp.json());
    } catch (e) {
      // Hospedagens estáticas às vezes reescrevem /api/sync para index.html com
      // status 200. Isso não é uma API compatível e não deve continuar em polling.
      throw erroIndisponivel();
    }
  }

  async function gravarRemoto(state) {
    envioEmCurso = true;
    definirStatus('enviando', 'Enviando dados');
    try {
      const envelope = {
        ok: true,
        state,
        updatedAt: atualizadoEm(state) || new Date().toISOString(),
        clientId: idDispositivo()
      };
      const resp = await fetch(endpoint, {
        method: 'PUT',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(envelope)
      });
      if (!resp.ok) throw new Error('falha ao gravar sync: ' + resp.status);
      definirStatus('sincronizado', 'Sincronizado');
      return normalizarEnvelope(await resp.json());
    } finally {
      envioEmCurso = false;
    }
  }

  function aplicarRemoto(state, silencioso) {
    const normalizado = window.Store.normalizar(state);
    if (opcoes && opcoes.aplicarEstado) opcoes.aplicarEstado(normalizado, silencioso);
    definirStatus('sincronizado', 'Sincronizado');
  }

  async function sincronizarAgora(opcoesSync) {
    opcoesSync = opcoesSync || {};
    if (!endpoint || verificacaoEmCurso || envioEmCurso) return;
    verificacaoEmCurso = true;
    try {
      const local = opcoes.obterEstado();
      const remoto = await lerRemoto();
      const remotoState = remoto.state ? window.Store.normalizar(remoto.state) : null;

      if (!remotoState) {
        if (temDados(local) || (local.config && local.config.apagadoEm)) await gravarRemoto(local);
        else definirStatus('sincronizado', 'Sincronizado');
        verificacaoEmCurso = false;
        return;
      }

      const localTemDados = temDados(local);
      const remotoTemDados = temDados(remotoState);
      const localMs = dataMs(atualizadoEm(local));
      const remotoMs = dataMs(atualizadoEm(remotoState) || remoto.updatedAt);

      if (!localTemDados && remotoTemDados && !foiApagadoDepoisDoRemoto(local, remotoState)) {
        aplicarRemoto(remotoState, opcoesSync.silencioso);
      } else if (localMs > remotoMs + FOLGA_RELOGIO_MS) {
        await gravarRemoto(local);
      } else if (remotoMs > localMs + FOLGA_RELOGIO_MS) {
        aplicarRemoto(remotoState, opcoesSync.silencioso);
      } else {
        definirStatus('sincronizado', 'Sincronizado');
      }
    } catch (e) {
      envioEmCurso = false;
      if (e && e.syncIndisponivel) desativarEndpoint();
      else definirStatus('local', 'Somente neste navegador');
    } finally {
      verificacaoEmCurso = false;
    }
  }

  function agendarEnvio(state) {
    if (!endpoint) return;
    clearTimeout(envioPendente);
    envioPendente = setTimeout(function () {
      gravarRemoto(state).catch(function () {
        definirStatus('local', 'Somente neste navegador');
      });
    }, 450);
  }

  function iniciar(novasOpcoes) {
    opcoes = novasOpcoes || {};
    if (location.protocol === 'file:') {
      definirStatus('local', 'Somente neste navegador');
      return;
    }
    endpoint = location.origin + '/api/sync';
    definirStatus('verificando', 'Verificando sincronizacao');
    sincronizarAgora({ silencioso: true });
    if (intervaloId != null) clearInterval(intervaloId);
    intervaloId = setInterval(function () { sincronizarAgora({ silencioso: true }); }, INTERVALO_MS);
    window.addEventListener('online', function () { sincronizarAgora({ silencioso: true }); });
    window.addEventListener('focus', function () { sincronizarAgora({ silencioso: true }); });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) sincronizarAgora({ silencioso: true });
    });
  }

  function status() { return statusAtual; }

  window.Sync = { iniciar, agendarEnvio, sincronizarAgora, status };
})();
