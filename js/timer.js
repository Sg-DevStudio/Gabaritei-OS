/* ============================================================
   timer.js — cronômetro e pomodoro com recuperação de sessão
   Persiste o estado a cada tick: fechar o navegador não perde
   o tempo (caminho infeliz do fluxo F1).
   ============================================================ */
(function () {
  'use strict';

  const CHAVE = 'estudos.timer';
  const POMO_FOCO_MIN = 25;
  const POMO_PAUSA_MIN = 5;

  let interno = null;     // {topicoId, modo, inicioEm, acumuladoMs, rodando, pomoFase, pomoCiclos, limiteMin}
  let intervalo = null;
  let aoTick = null;      // callback(estado)

  function persistir() {
    if (interno) localStorage.setItem(CHAVE, JSON.stringify(interno));
    else localStorage.removeItem(CHAVE);
  }

  function decorridoMs() {
    if (!interno) return 0;
    let ms = interno.acumuladoMs;
    if (interno.rodando) ms += Date.now() - interno.inicioEm;
    return ms;
  }

  function estado() {
    if (!interno) return null;
    const ms = decorridoMs();
    const e = {
      topicoId: interno.topicoId,
      blocoId: interno.blocoId || null,
      modo: interno.modo,
      rodando: interno.rodando,
      decorridoMs: ms,
      decorridoMin: Math.floor(ms / 60000)
    };
    if (interno.limiteMin) {
      const limiteMs = interno.limiteMin * 60000;
      e.limiteMin = interno.limiteMin;
      e.limiteMs = limiteMs;
      e.limiteRestanteMs = Math.max(0, limiteMs - ms);
      e.limiteAvisado = !!interno.limiteAvisadoEm;
      if (interno.rodando && ms >= limiteMs && !interno.limiteAvisadoEm) {
        interno.limiteAvisadoEm = Date.now();
        persistir();
        e.limiteAtingido = true;
        e.limiteAvisado = true;
      }
    }
    if (interno.modo === 'pomodoro') {
      const faseMs = (interno.pomoFase === 'foco' ? POMO_FOCO_MIN : POMO_PAUSA_MIN) * 60000;
      const nestaFase = ms - interno.pomoFaseInicioMs;
      e.pomoFase = interno.pomoFase;
      e.pomoCiclos = interno.pomoCiclos;
      e.pomoRestanteMs = Math.max(0, faseMs - nestaFase);
      if (nestaFase >= faseMs && interno.rodando) {
        // troca de fase automática
        interno.pomoFase = interno.pomoFase === 'foco' ? 'pausa' : 'foco';
        if (interno.pomoFase === 'foco') interno.pomoCiclos++;
        interno.pomoFaseInicioMs = ms;
        persistir();
        e.pomoTrocouFase = true;
        e.pomoFase = interno.pomoFase;
        e.pomoRestanteMs = (interno.pomoFase === 'foco' ? POMO_FOCO_MIN : POMO_PAUSA_MIN) * 60000;
      }
    }
    return e;
  }

  function ligarRelogio() {
    if (intervalo) clearInterval(intervalo);
    intervalo = setInterval(function () {
      // marca o último instante "vivo": se a luz/internet cair, sabemos até quando
      // o tempo realmente correu (a recuperação não conta o período offline).
      if (interno && interno.rodando) interno.ultimoTickEm = Date.now();
      persistir();
      if (aoTick) aoTick(estado());
    }, 1000);
  }

  function iniciar(topicoId, modo, opcoes) {
    opcoes = opcoes || {};
    const limiteMin = parseInt(opcoes.limiteMin, 10);
    interno = {
      topicoId: topicoId || null,
      blocoId: opcoes.blocoId || null,
      modo: modo || 'cronometro',
      inicioEm: Date.now(),
      ultimoTickEm: Date.now(),
      acumuladoMs: 0,
      rodando: true,
      pomoFase: 'foco',
      pomoCiclos: 0,
      pomoFaseInicioMs: 0,
      limiteMin: limiteMin > 0 ? limiteMin : null,
      limiteAvisadoEm: null
    };
    persistir();
    ligarRelogio();
    return estado();
  }

  function pausar() {
    if (!interno || !interno.rodando) return estado();
    interno.acumuladoMs += Date.now() - interno.inicioEm;
    interno.rodando = false;
    persistir();
    return estado();
  }

  function retomar() {
    if (!interno || interno.rodando) return estado();
    interno.inicioEm = Date.now();
    interno.ultimoTickEm = Date.now();
    interno.rodando = true;
    persistir();
    ligarRelogio();
    return estado();
  }

  function finalizar() {
    const e = estado();
    if (intervalo) { clearInterval(intervalo); intervalo = null; }
    interno = null;
    persistir();
    return e; // quem chama usa decorridoMin para o registro
  }

  function descartar() {
    if (intervalo) { clearInterval(intervalo); intervalo = null; }
    interno = null;
    persistir();
  }

  // Recuperação após fechar o navegador com timer rodando
  function recuperar() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return null;
      interno = JSON.parse(bruto);
      // Se estava rodando ao fechar/cair (luz, internet, navegador), NÃO conta o
      // tempo offline: volta PAUSADO no tempo do último tick conhecido, para a
      // pessoa retomar exatamente de onde parou.
      if (interno.rodando) {
        const ate = interno.ultimoTickEm || interno.inicioEm || Date.now();
        interno.acumuladoMs = (interno.acumuladoMs || 0) + Math.max(0, ate - (interno.inicioEm || ate));
        interno.rodando = false;
        interno.inicioEm = null;
        persistir();
      }
      return estado();
    } catch (e) {
      localStorage.removeItem(CHAVE);
      return null;
    }
  }

  function aoAtualizar(fn) { aoTick = fn; }

  function formatar(ms) {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return String(h) + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  window.Timer = { iniciar, pausar, retomar, finalizar, descartar, recuperar, estado, aoAtualizar, formatar, POMO_FOCO_MIN, POMO_PAUSA_MIN };
})();
