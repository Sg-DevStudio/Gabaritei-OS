/* ============================================================
   app.js — roteamento por hash + renderização das telas
   Telas: #hoje #timer #revisoes #edital #simulados #stats
          #historico #ajustes #mais (atalhos no celular)
   ============================================================ */
(function () {
  'use strict';

  const D = window.Dominio;
  const TITULO_PADRAO = document.title;
  let state = window.Store.carregar();
  let timerPreselecao = null;     // tópico vindo de "Estudar" na fila
  let editalAbertas = new Set();  // disciplinas expandidas no edital
  let syncStatus = window.Sync ? window.Sync.status() : { estado: 'local', texto: 'Somente neste navegador' };
  let firebaseStatus = window.FirebaseSync ? window.FirebaseSync.status() : { estado: 'carregando', texto: 'Preparando Firebase', fonte: 'Firebase' };
  let pintarTimerAtual = null;
  let audioCtx = null;

  // ---------------- utilidades de UI ----------------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function salvar(opcoes) {
    opcoes = opcoes || {};
    window.Store.salvar(state, opcoes);
    if (window.Sync && opcoes.sincronizar !== false) window.Sync.agendarEnvio(state);
    if (window.FirebaseSync && opcoes.sincronizar !== false) window.FirebaseSync.agendarEnvio(state);
  }

  function statusSincronizacao() {
    if (firebaseStatus && firebaseStatus.estado !== 'carregando') return firebaseStatus;
    return syncStatus;
  }

  function toast(msg, tipo) {
    const raiz = document.getElementById('toast-raiz');
    const el = document.createElement('div');
    el.className = 'toast' + (tipo ? ' toast-' + tipo : '');
    el.textContent = msg;
    raiz.appendChild(el);
    setTimeout(function () { el.remove(); }, 3200);
  }

  function abrirModal(html) {
    const raiz = document.getElementById('modal-raiz');
    raiz.innerHTML = '<div class="modal-fundo"><div class="modal" role="dialog" aria-modal="true">' + html + '</div></div>';
    raiz.querySelector('.modal-fundo').addEventListener('click', function (e) {
      if (e.target === e.currentTarget) fecharModal();
    });
    return raiz.querySelector('.modal');
  }

  function fecharModal() { document.getElementById('modal-raiz').innerHTML = ''; }

  function prepararAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) {}
  }

  function tocarAlarme() {
    prepararAudio();
    if (navigator.vibrate) navigator.vibrate([180, 80, 180]);
    if (!audioCtx) return;
    const agora = audioCtx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = audioCtx.createOscillator();
      const ganho = audioCtx.createGain();
      const t = agora + i * 0.28;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      ganho.gain.setValueAtTime(0.001, t);
      ganho.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      ganho.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(ganho).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  }

  function pedirNotificacaoSePossivel(limiteMin) {
    if (!limiteMin || !('Notification' in window) || Notification.permission !== 'default') return;
    Notification.requestPermission().catch(function () {});
  }

  function atualizarTituloTimer(e) {
    if (!e) {
      document.title = TITULO_PADRAO;
      return;
    }
    if (e.limiteAvisado && e.limiteRestanteMs === 0) {
      document.title = 'Tempo maximo atingido · Estudos';
      return;
    }
    const ms = e.modo === 'pomodoro' ? e.pomoRestanteMs : e.decorridoMs;
    document.title = window.Timer.formatar(ms) + (e.rodando ? ' · Estudos' : ' pausado · Estudos');
  }

  function avisarLimiteTimer(e) {
    tocarAlarme();
    toast('Tempo máximo atingido: ' + e.limiteMin + ' min.', 'sucesso');
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Tempo máximo atingido', {
        body: nomeTopicoCompleto(e.topicoId),
        icon: 'icons/icone-192.png'
      });
    }
  }

  function tratarTickTimer(e) {
    atualizarTituloTimer(e);
    if (e && e.limiteAtingido) avisarLimiteTimer(e);
    if (pintarTimerAtual && location.hash.replace('#', '') === 'timer') pintarTimerAtual(e);
  }

  function confete() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cores = ['#2148C0', '#1E7D46', '#C03B2B', '#9A6B00'];
    for (let i = 0; i < 22; i++) {
      const c = document.createElement('div');
      c.className = 'confete';
      c.style.background = cores[i % cores.length];
      c.style.left = (35 + Math.random() * 30) + 'vw';
      c.style.bottom = (20 + Math.random() * 20) + 'vh';
      c.style.animationDelay = (Math.random() * 0.25) + 's';
      document.body.appendChild(c);
      setTimeout(function () { c.remove(); }, 1400);
    }
  }

  function tagDisc(disc) {
    return '<span class="tag-disc" style="background:' + esc(disc.cor) + '">' + esc(disc.id) + '</span>';
  }

  function bolha(status, extra) {
    return '<span class="bolha bolha-' + esc(status) + (extra ? ' ' + extra : '') + '" aria-hidden="true"></span>';
  }

  function semaforoHtml(pct, meta) {
    if (pct === null || pct === undefined) return '<span class="semaforo" style="color:var(--grafite)">—</span>';
    const cor = D.semaforo(pct, meta);
    const simbolo = cor === 'verde' ? ' ✓' : cor === 'amarelo' ? ' ⚠' : ' ✗';
    return '<span class="semaforo semaforo-' + cor + '">' + pct + '%' + simbolo + '</span>';
  }

  function nomeTopicoCompleto(topicoId) {
    const t = D.topicoPorId(state, topicoId);
    const d = D.disciplinaDoTopico(state, topicoId);
    if (!t) return topicoId;
    return (d ? d.id + ' · ' : '') + t.nome;
  }

  // ---------------- revisões: agendar/cancelar coerente ----------------
  function agendarRevisoesSeNecessario(topicoId) {
    const tem = state.revisoes.some(function (r) { return r.topicoId === topicoId; });
    if (!tem) {
      state.revisoes = state.revisoes.concat(D.agendarRevisoes(topicoId, D.hojeISO()));
      return true;
    }
    return false;
  }

  function removerRevisoesPendentes(topicoId) {
    state.revisoes = state.revisoes.filter(function (r) {
      return r.topicoId !== topicoId || r.dataConcluida;
    });
  }

  // ---------------- registro de sessão (F1, ≤3 toques) ----------------
  function abrirRegistro(opcoes) {
    opcoes = opcoes || {};
    if (state.disciplinas.length === 0) {
      toast('Importe um plano antes de registrar sessões.', 'erro');
      location.hash = '#ajustes';
      return;
    }
    const topicoIni = opcoes.topicoId || null;
    const discIni = topicoIni ? D.disciplinaDoTopico(state, topicoIni) : state.disciplinas[0];

    const optsDisc = state.disciplinas.map(function (d) {
      return '<option value="' + esc(d.id) + '"' + (discIni && d.id === discIni.id ? ' selected' : '') + '>' + esc(d.id + ' — ' + d.nome) + '</option>';
    }).join('');

    const m = abrirModal(
      '<h3>Registrar sessão</h3>' +
      '<form id="form-registro">' +
      '<label for="reg-disc">Disciplina</label><select id="reg-disc">' + optsDisc + '</select>' +
      '<label for="reg-topico">Tópico</label><select id="reg-topico"></select>' +
      '<div class="grade-2">' +
      '<div><label for="reg-tipo">Tipo</label><select id="reg-tipo">' +
      '<option value="teoria"' + (opcoes.tipo === 'teoria' ? ' selected' : '') + '>Teoria</option>' +
      '<option value="questoes"' + (opcoes.tipo === 'questoes' ? ' selected' : '') + '>Questões</option>' +
      '<option value="revisao"' + (opcoes.tipo === 'revisao' ? ' selected' : '') + '>Revisão</option>' +
      '</select></div>' +
      '<div><label for="reg-dur">Duração (min)</label><input id="reg-dur" type="number" min="1" max="720" value="' + (opcoes.duracaoMin || 30) + '"></div>' +
      '</div>' +
      '<div class="grade-2">' +
      '<div><label for="reg-feitas">Questões feitas</label><input id="reg-feitas" type="number" min="0" max="999" value="0"></div>' +
      '<div><label for="reg-certas">Acertos</label><input id="reg-certas" type="number" min="0" max="999" value="0"></div>' +
      '</div>' +
      '<div class="msg-erro oculto" id="reg-erro"></div>' +
      '<label for="reg-obs">Observação (opcional)</label><textarea id="reg-obs" placeholder="Ex.: travei em prazos de recurso"></textarea>' +
      '<label style="display:flex;align-items:center;gap:0.5rem;font-weight:400">' +
      '<input type="checkbox" id="reg-teoria-ok" style="width:auto;min-height:0"> Marcar teoria deste tópico como concluída (agenda revisões 24h · 7d · 30d)</label>' +
      '<div class="modal-acoes">' +
      '<button type="button" class="botao-quieto" id="reg-cancelar">Cancelar</button>' +
      '<button type="submit">Registrar sessão</button>' +
      '</div></form>'
    );

    const selDisc = m.querySelector('#reg-disc');
    const selTop = m.querySelector('#reg-topico');

    function preencherTopicos() {
      const d = D.disciplinaPorId(state, selDisc.value);
      selTop.innerHTML = d.topicos.map(function (t) {
        return '<option value="' + esc(t.id) + '"' + (t.id === topicoIni ? ' selected' : '') + '>' + esc(t.id + ' — ' + t.nome) + '</option>';
      }).join('');
    }
    preencherTopicos();
    selDisc.addEventListener('change', preencherTopicos);
    m.querySelector('#reg-cancelar').addEventListener('click', fecharModal);

    m.querySelector('#form-registro').addEventListener('submit', function (e) {
      e.preventDefault();
      const erroEl = m.querySelector('#reg-erro');
      const dur = parseInt(m.querySelector('#reg-dur').value, 10);
      const feitas = parseInt(m.querySelector('#reg-feitas').value, 10) || 0;
      const certas = parseInt(m.querySelector('#reg-certas').value, 10) || 0;

      if (!dur || dur < 1) { erroEl.textContent = 'Informe a duração em minutos (mínimo 1).'; erroEl.classList.remove('oculto'); return; }
      if (certas > feitas) { erroEl.textContent = 'Acertos (' + certas + ') não podem superar as questões feitas (' + feitas + ').'; erroEl.classList.remove('oculto'); return; }

      const dados = {
        topicoId: selTop.value,
        tipo: m.querySelector('#reg-tipo').value,
        duracaoMin: dur, qFeitas: feitas, qCertas: certas,
        obs: m.querySelector('#reg-obs').value.trim(),
        teoriaOk: m.querySelector('#reg-teoria-ok').checked
      };

      // caminho infeliz F1: registro duplicado no mesmo dia/tópico/tipo → confirmar
      const hoje = D.hojeISO();
      const duplicada = state.sessoes.some(function (s) {
        return s.data === hoje && s.topicoId === dados.topicoId && s.tipo === dados.tipo;
      });
      if (duplicada && !opcoes.confirmouDuplicada) {
        erroEl.innerHTML = 'Você já registrou <strong>' + esc(dados.tipo) + '</strong> deste tópico hoje. Clique em "Registrar sessão" de novo para confirmar como sessão adicional.';
        erroEl.classList.remove('oculto');
        opcoes.confirmouDuplicada = true;
        return;
      }

      fecharModal();
      concluirRegistro(dados);
      if (opcoes.aoSalvar) opcoes.aoSalvar();
    });
  }

  function concluirRegistro(dados) {
    const hoje = D.hojeISO();
    const metaAntes = D.metaSemanal(state, hoje);

    state.sessoes.push({
      id: window.Store.novoId('ses'), data: hoje,
      topicoId: dados.topicoId, tipo: dados.tipo,
      duracaoMin: dados.duracaoMin, qFeitas: dados.qFeitas, qCertas: dados.qCertas,
      obs: dados.obs || ''
    });

    const topico = D.topicoPorId(state, dados.topicoId);
    if (topico) {
      if (dados.teoriaOk && topico.status !== 'dominado') {
        topico.status = 'teoria_concluida';
        if (agendarRevisoesSeNecessario(dados.topicoId)) {
          toast('Revisões agendadas: 24h · 7d · 30d', 'sucesso');
        }
      } else if (topico.status === 'pendente') {
        topico.status = 'em_curso';
      }
      if (topico.reaberto && dados.qFeitas > 0 && !D.sugerirReestudo(dados.qFeitas, dados.qCertas)) {
        topico.reaberto = false; // desempenho recuperado tira o tópico da fila de reabertos
      }
    }

    salvar();
    toast('Sessão registrada', 'sucesso');

    // RN07 — sugestão de reestudo (o usuário decide)
    if (D.sugerirReestudo(dados.qFeitas, dados.qCertas)) {
      const m = abrirModal(
        '<h3>Mais erros que acertos</h3>' +
        '<p>Você errou mais da metade das questões de <strong>' + esc(nomeTopicoCompleto(dados.topicoId)) + '</strong> (' +
        (dados.qFeitas - dados.qCertas) + ' de ' + dados.qFeitas + ').</p>' +
        '<p>Quer mandar o tópico de volta para a fila desta semana?</p>' +
        '<div class="modal-acoes">' +
        '<button type="button" class="botao-quieto" id="rn7-nao">Agora não</button>' +
        '<button type="button" id="rn7-sim">Mandar para a fila</button></div>'
      );
      m.querySelector('#rn7-nao').addEventListener('click', fecharModal);
      m.querySelector('#rn7-sim').addEventListener('click', function () {
        const t = D.topicoPorId(state, dados.topicoId);
        if (t) { t.reaberto = true; if (t.status === 'teoria_concluida') t.status = 'em_curso'; }
        salvar(); fecharModal(); render();
        toast('Tópico na fila da semana', 'sucesso');
      });
    }

    // micro-celebração: bateu a meta de horas da semana agora
    const metaDepois = D.metaSemanal(state, hoje);
    if (metaDepois.horasAlvo > 0 &&
        metaAntes.minutos < metaDepois.horasAlvo * 60 &&
        metaDepois.minutos >= metaDepois.horasAlvo * 60) {
      confete();
      toast('Meta semanal de horas batida! 🎯', 'sucesso');
    }
    render();
  }

  // ---------------- TELA: Hoje ----------------
  function telaHoje() {
    const hoje = D.hojeISO();
    const hora = new Date().getHours();
    const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
    const frase = window.Frases.fraseDoDia();

    if (!state.plano) {
      return '<div class="cab-pagina"><div><h1>' + saudacao + '</h1></div></div>' +
        '<div class="card"><div class="estado-vazio">' +
        '<span class="bolha bolha-pendente"></span>' +
        '<strong>Nenhum plano ainda</strong>' +
        'Importe o JSON gerado pelo Claude (skill treinador-concursos) para carregar disciplinas, tópicos e cronograma.' +
        '<p style="margin-top:1rem"><a class="botao" href="#ajustes">Importar plano</a></p>' +
        '</div></div>';
    }

    const fila = D.filaHoje(state, hoje);
    const meta = D.metaSemanal(state, hoje);
    const st = D.streak(state.sessoes, hoje);
    const sem = D.semanaCorrente(state, hoje);

    const pendentes = fila.filter(function (i) { return !(i.categoria === 'bloco' && i.feito); });
    const nRev = fila.filter(function (i) { return i.categoria === 'revisao'; }).length;
    const nBlocos = fila.filter(function (i) { return i.categoria === 'bloco' && !i.feito; }).length;
    const resumoDia = pendentes.length === 0 ? 'Tudo em dia por hoje.' :
      nBlocos + (nBlocos === 1 ? ' bloco' : ' blocos') + ' e ' + nRev + (nRev === 1 ? ' revisão te esperam' : ' revisões te esperam') + '.';

    let html = '<div class="cab-pagina cab-home"><div><span class="rotulo-pagina">' + D.formatarDataBR(hoje) + '</span><h1>' + saudacao + '</h1>' +
      '<p class="sub">' + resumoDia + '</p></div>' +
      '<button class="botao-secundario" id="btn-registrar-livre">Registrar sessão</button></div>';

    // aviso de backup (risco localStorage)
    const diasBackup = window.Store.diasDesdeBackup(state);
    if (window.Store.temDados(state) && (diasBackup === null || diasBackup > 7)) {
      const syncOk = syncStatus && syncStatus.estado === 'sincronizado';
      html += '<div class="aviso aviso-alerta">' +
        (diasBackup === null ? 'Você ainda não fez nenhum backup.' : 'Seu último backup foi há ' + diasBackup + ' dias.') +
        (syncOk ? ' Sincronização ativa, mas o backup ainda é sua cópia de segurança — ' : ' Os dados ainda estão só neste navegador — ') +
        '<a href="#ajustes">exporte um backup</a>.</div>';
    }

    html += '<div class="frase-dia">“' + esc(frase.t) + '”' + (frase.a ? '<span class="autor">— ' + esc(frase.a) + '</span>' : '') + '</div>';

    // cards: countdown/janela + meta semanal + streak
    html += '<div class="linha-cards">';
    if (state.plano.radar && state.plano.radar.janela_prova) {
      const jp = state.plano.radar.janela_prova;
      html += '<div class="card card-kpi"><div class="card-kpi-rotulo">Prova estimada (radar)</div>' +
        '<div class="card-kpi-valor" style="font-size:1.1rem">' + D.formatarMesBR(jp[0]) + ' – ' + D.formatarMesBR(jp[1]) + '</div>' +
        '<div class="card-kpi-extra">confiança ' + esc(state.plano.radar.confianca || '—') +
        (state.plano.radar.reavaliar_em ? ' · reavaliar em ' + D.formatarDataBR(state.plano.radar.reavaliar_em) : '') + '</div></div>';
    }
    const pctHoras = meta.horasAlvo > 0 ? Math.min(100, Math.round((meta.minutos / 60 / meta.horasAlvo) * 100)) : 0;
    html += '<div class="card card-kpi"><div class="card-kpi-rotulo">Horas na semana</div>' +
      '<div class="card-kpi-valor">' + D.formatarMin(meta.minutos) + '<span style="font-size:0.85rem;color:var(--grafite)"> / ' + meta.horasAlvo + 'h</span></div>' +
      '<div class="barra' + (pctHoras >= 100 ? ' barra-verde' : '') + '" style="margin-top:0.4rem"><span style="width:' + pctHoras + '%"></span></div></div>';
    const pctQ = meta.questoesAlvo > 0 ? Math.min(100, Math.round((meta.qFeitas / meta.questoesAlvo) * 100)) : 0;
    html += '<div class="card card-kpi"><div class="card-kpi-rotulo">Questões na semana</div>' +
      '<div class="card-kpi-valor">' + meta.qFeitas + '<span style="font-size:0.85rem;color:var(--grafite)"> / ' + meta.questoesAlvo + '</span></div>' +
      '<div class="barra' + (pctQ >= 100 ? ' barra-verde' : '') + '" style="margin-top:0.4rem"><span style="width:' + pctQ + '%"></span></div></div>';
    html += '<div class="card card-kpi"><div class="card-kpi-rotulo">Constância</div>' +
      '<div class="card-kpi-valor">' + st.atual + '<span style="font-size:0.85rem;color:var(--grafite)"> ' + (st.atual === 1 ? 'dia' : 'dias') + '</span></div>' +
      '<div class="card-kpi-extra">recorde: ' + st.recorde + '</div></div>';
    html += '</div>';

    // fila do dia (RN06)
    html += '<div class="card"><h3 style="margin-bottom:0.25rem">O que estudar hoje</h3>';
    if (sem && sem.futura) {
      html += '<p class="sub" style="color:var(--grafite);font-size:0.85rem">O cronograma começa em ' + D.formatarDataBR(sem.proxima.inicio) + ' (semana 1). Revisões e tópicos reabertos já aparecem aqui.</p>';
    } else if (sem && sem.encerrado) {
      html += '<p class="sub" style="color:var(--grafite);font-size:0.85rem">O cronograma planejado terminou — reimporte um plano atualizado ou siga pelas revisões e simulados.</p>';
    } else if (sem) {
      html += '<p class="sub" style="color:var(--grafite);font-size:0.85rem">Semana ' + sem.semana + ' do plano (' + esc(state.plano.ritmoAtivo) + ')' +
        (sem.marcos && sem.marcos.length ? ' · ' + esc(sem.marcos.join(' · ')) : '') + '</p>';
    }

    if (fila.length === 0) {
      html += '<div class="estado-vazio"><span class="bolha bolha-teoria_concluida"></span>' +
        '<strong>Nada pendente</strong>Sem revisões vencidas nem blocos para hoje. Adiante um tópico pelo Edital, se quiser.</div>';
    } else {
      for (let i = 0; i < fila.length; i++) {
        const item = fila[i];
        const t = D.topicoPorId(state, item.topicoId);
        const d = D.disciplinaDoTopico(state, item.topicoId);
        let etiqueta, sub, acoes;
        if (item.categoria === 'revisao') {
          const atraso = D.diffDias(item.revisao.dataAgendada, hoje);
          etiqueta = '<span class="etiqueta etiqueta-revisao">Revisão ' + esc(item.revisao.tipo) + '</span>';
          sub = atraso > 0 ? 'vencida há ' + atraso + (atraso === 1 ? ' dia' : ' dias') : 'vence hoje';
          acoes = '<button class="botao-mini" data-acao="concluir-revisao" data-id="' + esc(item.revisao.id) + '">Concluir</button>';
        } else if (item.categoria === 'bloco') {
          etiqueta = item.feito
            ? '<span class="etiqueta etiqueta-feito">Feito ✓</span>'
            : '<span class="etiqueta etiqueta-bloco">' + (item.tipoBloco === 'teoria' ? 'Teoria' : 'Questões') + '</span>';
          sub = 'bloco da semana ' + item.semana;
          acoes = item.feito ? '' :
            '<button class="botao-mini botao-quieto" data-acao="estudar" data-id="' + esc(item.topicoId) + '">Timer</button>' +
            '<button class="botao-mini" data-acao="registrar" data-id="' + esc(item.topicoId) + '" data-tipo="' + esc(item.tipoBloco) + '">Registrar</button>';
        } else {
          etiqueta = '<span class="etiqueta etiqueta-reaberto">Reaberto</span>';
          sub = 'voltou para a fila (desempenho baixo)';
          acoes = '<button class="botao-mini botao-quieto" data-acao="estudar" data-id="' + esc(item.topicoId) + '">Timer</button>' +
            '<button class="botao-mini" data-acao="registrar" data-id="' + esc(item.topicoId) + '" data-tipo="questoes">Registrar</button>';
        }
        html += '<div class="fila-item">' +
          bolha(t ? t.status : 'pendente') +
          '<div class="fila-info"><div class="fila-titulo">' + (d ? tagDisc(d) + ' ' : '') + esc(t ? t.nome : item.topicoId) + '</div>' +
          '<div class="fila-sub">' + sub + '</div></div>' +
          etiqueta +
          '<div style="display:flex;gap:0.35rem">' + acoes + '</div></div>';
      }
    }
    html += '</div>';
    return html;
  }

  function ligarHoje(raiz) {
    const btn = raiz.querySelector('#btn-registrar-livre');
    if (btn) btn.addEventListener('click', function () { abrirRegistro({}); });
    raiz.querySelectorAll('[data-acao]').forEach(function (el) {
      el.addEventListener('click', function () {
        const acao = el.getAttribute('data-acao');
        if (acao === 'estudar') {
          timerPreselecao = el.getAttribute('data-id');
          location.hash = '#timer';
        } else if (acao === 'registrar') {
          abrirRegistro({ topicoId: el.getAttribute('data-id'), tipo: el.getAttribute('data-tipo') || 'teoria' });
        } else if (acao === 'concluir-revisao') {
          abrirConcluirRevisao(el.getAttribute('data-id'));
        }
      });
    });
  }

  // ---------------- TELA: Timer ----------------
  function telaTimer() {
    if (state.disciplinas.length === 0) {
      return '<h1>Timer</h1><div class="card"><div class="estado-vazio">' +
        '<span class="bolha bolha-pendente"></span><strong>Nenhum plano ainda</strong>' +
        'Importe o plano para escolher um tópico e cronometrar o estudo.' +
        '<p style="margin-top:1rem"><a class="botao" href="#ajustes">Importar plano</a></p></div></div>';
    }

    const ativo = window.Timer.estado();
    let selecao = '';
    if (!ativo) {
      const discIni = timerPreselecao ? D.disciplinaDoTopico(state, timerPreselecao) : state.disciplinas[0];
      const optsDisc = state.disciplinas.map(function (d) {
        return '<option value="' + esc(d.id) + '"' + (discIni && d.id === discIni.id ? ' selected' : '') + '>' + esc(d.id + ' — ' + d.nome) + '</option>';
      }).join('');
      selecao =
        '<div class="grade-2" style="text-align:left;max-width:560px;margin:0 auto">' +
        '<div><label for="timer-disc">Disciplina</label><select id="timer-disc">' + optsDisc + '</select></div>' +
        '<div><label for="timer-topico">Tópico</label><select id="timer-topico"></select></div></div>' +
        '<div style="margin-top:1rem"><span class="seletor-modo">' +
        '<button type="button" data-modo="cronometro" class="ativo">Cronômetro</button>' +
        '<button type="button" data-modo="pomodoro">Pomodoro 25/5</button></span></div>' +
        '<div class="timer-limite"><label for="timer-limite">Tempo máximo (min)</label>' +
        '<input id="timer-limite" type="number" min="1" max="720" placeholder="Sem limite"></div>';
    } else {
      selecao = '<p style="color:#B9BBC1;font-size:0.92rem">' + esc(nomeTopicoCompleto(ativo.topicoId)) + '</p>';
    }

    return '<h1>Timer</h1><div class="tela-timer">' +
      selecao +
      '<div class="timer-display" id="timer-display">' + (ativo ? window.Timer.formatar(ativo.modo === 'pomodoro' ? ativo.pomoRestanteMs : ativo.decorridoMs) : '00:00') + '</div>' +
      '<div class="timer-modo-info" id="timer-info"></div>' +
      '<div class="timer-acoes" id="timer-acoes"></div>' +
      '</div>';
  }

  function ligarTimer(raiz) {
    const display = raiz.querySelector('#timer-display');
    const info = raiz.querySelector('#timer-info');
    const acoes = raiz.querySelector('#timer-acoes');
    const limiteInput = raiz.querySelector('#timer-limite');
    let modoEscolhido = 'cronometro';

    const selDisc = raiz.querySelector('#timer-disc');
    const selTop = raiz.querySelector('#timer-topico');
    if (selDisc) {
      const preencher = function () {
        const d = D.disciplinaPorId(state, selDisc.value);
        selTop.innerHTML = d.topicos.filter(function (t) { return !t.orfao; }).map(function (t) {
          return '<option value="' + esc(t.id) + '"' + (t.id === timerPreselecao ? ' selected' : '') + '>' + esc(t.id + ' — ' + t.nome) + '</option>';
        }).join('');
      };
      preencher();
      selDisc.addEventListener('change', preencher);
      raiz.querySelectorAll('[data-modo]').forEach(function (b) {
        b.addEventListener('click', function () {
          modoEscolhido = b.getAttribute('data-modo');
          raiz.querySelectorAll('[data-modo]').forEach(function (x) { x.classList.toggle('ativo', x === b); });
        });
      });
    }

    function pintar(e) {
      if (!e) return;
      if (display) {
        display.textContent = window.Timer.formatar(e.modo === 'pomodoro' ? e.pomoRestanteMs : e.decorridoMs);
      }
      if (info) {
        if (e.modo === 'pomodoro') {
          info.textContent = (e.pomoFase === 'foco' ? 'Foco' : 'Pausa') + ' · ciclo ' + (e.pomoCiclos + 1) + ' · total ' + window.Timer.formatar(e.decorridoMs);
        } else {
          info.textContent = e.rodando ? 'Estudando' : 'Pausado';
        }
        if (e.limiteMin) {
          info.textContent += e.limiteRestanteMs > 0
            ? ' · limite em ' + window.Timer.formatar(e.limiteRestanteMs)
            : ' · limite atingido';
        }
      }
      if (e.pomoTrocouFase) toast(e.pomoFase === 'foco' ? 'Pausa encerrada — de volta ao foco' : 'Foco concluído — 5 min de pausa', 'sucesso');
      atualizarTituloTimer(e);
    }

    function botoes() {
      const e = window.Timer.estado();
      if (!e) {
        acoes.innerHTML = '<button id="t-iniciar">Iniciar estudo</button>';
        acoes.querySelector('#t-iniciar').addEventListener('click', function () {
          if (!selTop || !selTop.value) { toast('Escolha um tópico antes de iniciar.', 'erro'); return; }
          const limiteMin = limiteInput && limiteInput.value ? parseInt(limiteInput.value, 10) : null;
          if (limiteInput && limiteInput.value && (!limiteMin || limiteMin < 1 || limiteMin > 720)) {
            toast('Informe um tempo máximo entre 1 e 720 minutos.', 'erro');
            return;
          }
          prepararAudio();
          pedirNotificacaoSePossivel(limiteMin);
          window.Timer.iniciar(selTop.value, modoEscolhido, { limiteMin });
          timerPreselecao = null;
          render();
        });
        if (info) info.textContent = '';
        return;
      }
      acoes.innerHTML =
        (e.rodando
          ? '<button class="botao-quieto" id="t-pausar" style="border-color:#3A3D45;color:#F7F8F6">Pausar</button>'
          : '<button class="botao-quieto" id="t-retomar" style="border-color:#3A3D45;color:#F7F8F6">Retomar</button>') +
        '<button id="t-finalizar">Encerrar e registrar</button>' +
        '<button class="botao-quieto" id="t-descartar" style="border-color:#3A3D45;color:#9A9DA3">Descartar</button>';
      const bp = acoes.querySelector('#t-pausar');
      if (bp) bp.addEventListener('click', function () { window.Timer.pausar(); botoes(); pintar(window.Timer.estado()); });
      const br = acoes.querySelector('#t-retomar');
      if (br) br.addEventListener('click', function () { prepararAudio(); window.Timer.retomar(); botoes(); pintar(window.Timer.estado()); });
      acoes.querySelector('#t-finalizar').addEventListener('click', function () {
        const fim = window.Timer.finalizar();
        atualizarTituloTimer(null);
        abrirRegistro({
          topicoId: fim.topicoId,
          duracaoMin: Math.max(1, fim.decorridoMin),
          tipo: 'teoria',
          aoSalvar: function () { render(); }
        });
        render();
      });
      acoes.querySelector('#t-descartar').addEventListener('click', function () {
        if (confirm('Descartar o tempo cronometrado sem registrar?')) { window.Timer.descartar(); atualizarTituloTimer(null); render(); }
      });
    }

    pintarTimerAtual = pintar;
    botoes();
    pintar(window.Timer.estado());
  }

  // ---------------- TELA: Revisões (F4) ----------------
  function abrirConcluirRevisao(revisaoId) {
    const rev = state.revisoes.find(function (r) { return r.id === revisaoId; });
    if (!rev) return;
    const m = abrirModal(
      '<h3>Concluir revisão ' + esc(rev.tipo) + '</h3>' +
      '<p>' + esc(nomeTopicoCompleto(rev.topicoId)) + '</p>' +
      '<form id="form-rev">' +
      '<div class="grade-2">' +
      '<div><label for="rev-feitas">Questões feitas (opcional)</label><input id="rev-feitas" type="number" min="0" max="999" value="0"></div>' +
      '<div><label for="rev-certas">Acertos</label><input id="rev-certas" type="number" min="0" max="999" value="0"></div>' +
      '</div>' +
      '<div class="grade-2"><div><label for="rev-dur">Tempo (min)</label><input id="rev-dur" type="number" min="1" max="300" value="15"></div></div>' +
      '<div class="msg-erro oculto" id="rev-erro"></div>' +
      '<div class="modal-acoes">' +
      '<button type="button" class="botao-quieto" id="rev-cancelar">Cancelar</button>' +
      '<button type="submit">Preencher a bolha</button></div></form>'
    );
    m.querySelector('#rev-cancelar').addEventListener('click', fecharModal);
    m.querySelector('#form-rev').addEventListener('submit', function (e) {
      e.preventDefault();
      const feitas = parseInt(m.querySelector('#rev-feitas').value, 10) || 0;
      const certas = parseInt(m.querySelector('#rev-certas').value, 10) || 0;
      const dur = parseInt(m.querySelector('#rev-dur').value, 10) || 15;
      const erroEl = m.querySelector('#rev-erro');
      if (certas > feitas) { erroEl.textContent = 'Acertos não podem superar as questões feitas.'; erroEl.classList.remove('oculto'); return; }

      rev.dataConcluida = D.hojeISO();
      rev.resultadoPct = feitas > 0 ? Math.round((certas / feitas) * 100) : null;

      state.sessoes.push({
        id: window.Store.novoId('ses'), data: rev.dataConcluida, topicoId: rev.topicoId,
        tipo: 'revisao', duracaoMin: dur, qFeitas: feitas, qCertas: certas, obs: 'Revisão ' + rev.tipo
      });

      // RN03 — revisão de 30d com <70% reabre o tópico
      if (D.revisaoReabreTopico(rev, rev.resultadoPct)) {
        const t = D.topicoPorId(state, rev.topicoId);
        if (t) { t.status = 'em_curso'; t.reaberto = true; }
        toast('Abaixo de 70% na revisão de 30 dias — tópico reaberto e na fila da semana.', 'erro');
      } else {
        toast('Revisão concluída — bolha preenchida ●', 'sucesso');
      }
      salvar(); fecharModal(); render();
    });
  }

  function telaRevisoes() {
    const hoje = D.hojeISO();
    const pendentes = state.revisoes
      .filter(function (r) { return !r.dataConcluida && D.topicoPorId(state, r.topicoId); })
      .sort(function (a, b) { return a.dataAgendada.localeCompare(b.dataAgendada); });

    let html = '<div class="cab-pagina"><div><h1>Revisões</h1>' +
      '<p class="sub">Agendadas automaticamente: 24h, 7 dias e 30 dias após concluir a teoria.</p></div></div>';

    if (pendentes.length === 0) {
      return html + '<div class="card"><div class="estado-vazio"><span class="bolha bolha-teoria_concluida"></span>' +
        '<strong>Nenhuma revisão pendente</strong>Conclua a teoria de um tópico (no registro de sessão ou no Edital) para agendar o ciclo 24h · 7d · 30d.</div></div>';
    }

    const grupos = [
      { titulo: 'Vencidas', filtro: function (r) { return r.dataAgendada < hoje; }, classe: 'etiqueta-revisao' },
      { titulo: 'Hoje', filtro: function (r) { return r.dataAgendada === hoje; }, classe: 'etiqueta-bloco' },
      { titulo: 'Próximas (7 dias)', filtro: function (r) { return r.dataAgendada > hoje && r.dataAgendada <= D.addDias(hoje, 7); }, classe: 'etiqueta-feito' },
      { titulo: 'Mais adiante', filtro: function (r) { return r.dataAgendada > D.addDias(hoje, 7); }, classe: 'etiqueta-feito' }
    ];

    grupos.forEach(function (g) {
      const itens = pendentes.filter(g.filtro);
      if (itens.length === 0) return;
      html += '<div class="card"><h3>' + g.titulo + ' <span style="color:var(--grafite);font-weight:400">(' + itens.length + ')</span></h3>';
      itens.forEach(function (r) {
        const t = D.topicoPorId(state, r.topicoId);
        const d = D.disciplinaDoTopico(state, r.topicoId);
        const podeConcluir = r.dataAgendada <= hoje;
        html += '<div class="fila-item">' + bolha(t.status) +
          '<div class="fila-info"><div class="fila-titulo">' + (d ? tagDisc(d) + ' ' : '') + esc(t.nome) + '</div>' +
          '<div class="fila-sub">agendada para ' + D.formatarDataBR(r.dataAgendada) + '</div></div>' +
          '<span class="etiqueta ' + g.classe + '">' + esc(r.tipo) + '</span>' +
          (podeConcluir ? '<button class="botao-mini" data-rev="' + esc(r.id) + '">Concluir</button>' : '') +
          '</div>';
      });
      html += '</div>';
    });
    return html;
  }

  function ligarRevisoes(raiz) {
    raiz.querySelectorAll('[data-rev]').forEach(function (b) {
      b.addEventListener('click', function () { abrirConcluirRevisao(b.getAttribute('data-rev')); });
    });
  }

  // ---------------- TELA: Edital verticalizado ----------------
  function telaEdital() {
    if (state.disciplinas.length === 0) {
      return '<h1>Edital</h1><div class="card"><div class="estado-vazio">' +
        '<span class="bolha bolha-pendente"></span><strong>Nenhum plano ainda</strong>' +
        'O edital verticalizado aparece aqui depois de importar o plano.' +
        '<p style="margin-top:1rem"><a class="botao" href="#ajustes">Importar plano</a></p></div></div>';
    }

    const prog = D.progressoEdital(state);
    const meta = state.plano.meta ? state.plano.meta.corte_pct : 70;
    let html = '<div class="cab-pagina"><div><h1>Edital verticalizado</h1>' +
      '<p class="sub">' + prog.concluidos + ' de ' + prog.total + ' tópicos com teoria concluída (' + prog.pct + '%) · % = incidência nas últimas provas</p></div></div>';

    html += '<div class="card card-quieto" style="padding:0.5rem 1rem">';
    state.disciplinas.forEach(function (d) {
      const aberta = editalAbertas.has(d.id);
      const pd = D.progressoDisciplina(d);
      const desemp = D.desempenhoDisciplina(state, d);
      html += '<button class="disc-cab" data-disc="' + esc(d.id) + '" aria-expanded="' + aberta + '">' +
        '<span style="font-family:var(--fonte-mono);color:var(--grafite)">' + (aberta ? '▾' : '▸') + '</span>' +
        tagDisc(d) + ' ' + esc(d.nome) +
        '<span class="disc-prog">' + pd.concluidos + '/' + pd.total + ' · ' + semaforoHtml(desemp, meta) + '</span></button>';
      if (aberta) {
        d.topicos.forEach(function (t) {
          const dt = D.desempenhoTopico(state.sessoes, t.id);
          html += '<div class="topico-linha' + (t.orfao ? ' topico-orfao' : '') + '" data-topico="' + esc(t.id) + '" role="button" tabindex="0">' +
            bolha(t.status) +
            '<span class="topico-nome">' + esc(t.nome) + (t.orfao ? ' <em>(órfão — fora do plano atual)</em>' : '') + (t.reaberto ? ' <span class="etiqueta etiqueta-reaberto">reaberto</span>' : '') + '</span>' +
            '<span class="topico-meta">' + (t.incidencia_pct ? t.incidencia_pct + '%' : '—') +
            (dt.pct !== null ? ' · ' + dt.certas + '/' + dt.feitas : '') + '</span></div>';
        });
      }
    });
    html += '</div>';
    return html;
  }

  function abrirTopico(topicoId) {
    const t = D.topicoPorId(state, topicoId);
    const d = D.disciplinaDoTopico(state, topicoId);
    if (!t) return;
    const dt = D.desempenhoTopico(state.sessoes, t.id);
    const statusOpcoes = [
      ['pendente', '○ Pendente'], ['em_curso', '◐ Em curso'],
      ['teoria_concluida', '● Teoria concluída'], ['dominado', '● Dominado']
    ];
    const m = abrirModal(
      '<h3>' + (d ? tagDisc(d) + ' ' : '') + esc(t.nome) + '</h3>' +
      '<p style="font-size:0.85rem;color:var(--grafite)">Incidência: ' + (t.incidencia_pct || 0) + '% · ' +
      (t.horas_estimadas ? '~' + t.horas_estimadas + 'h estimadas · ' : '') +
      'Desempenho: ' + (dt.pct !== null ? dt.certas + '/' + dt.feitas + ' (' + dt.pct + '%)' : 'sem questões ainda') + '</p>' +
      '<label for="top-status">Status</label><select id="top-status">' +
      statusOpcoes.map(function (o) { return '<option value="' + o[0] + '"' + (t.status === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') +
      '</select>' +
      '<div class="modal-acoes">' +
      '<button type="button" class="botao-quieto" id="top-fechar">Fechar</button>' +
      '<button type="button" class="botao-secundario" id="top-estudar">Estudar agora</button>' +
      '<button type="button" id="top-salvar">Salvar status</button></div>'
    );
    m.querySelector('#top-fechar').addEventListener('click', fecharModal);
    m.querySelector('#top-estudar').addEventListener('click', function () {
      timerPreselecao = t.id; fecharModal(); location.hash = '#timer';
    });
    m.querySelector('#top-salvar').addEventListener('click', function () {
      const novo = m.querySelector('#top-status').value;
      const antes = t.status;
      t.status = novo;
      if ((novo === 'teoria_concluida' || novo === 'dominado') && antes !== 'teoria_concluida' && antes !== 'dominado') {
        if (agendarRevisoesSeNecessario(t.id)) toast('Revisões agendadas: 24h · 7d · 30d', 'sucesso');
      }
      if ((novo === 'pendente' || novo === 'em_curso') && (antes === 'teoria_concluida' || antes === 'dominado')) {
        removerRevisoesPendentes(t.id);
      }
      if (novo === 'dominado') t.reaberto = false;
      salvar(); fecharModal(); render();
      toast('Status salvo', 'sucesso');
    });
  }

  function ligarEdital(raiz) {
    raiz.querySelectorAll('[data-disc]').forEach(function (b) {
      b.addEventListener('click', function () {
        const id = b.getAttribute('data-disc');
        if (editalAbertas.has(id)) editalAbertas.delete(id); else editalAbertas.add(id);
        render();
      });
    });
    raiz.querySelectorAll('[data-topico]').forEach(function (linha) {
      const abrir = function () { abrirTopico(linha.getAttribute('data-topico')); };
      linha.addEventListener('click', abrir);
      linha.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); } });
    });
  }

  // ---------------- TELA: Simulados (F3) ----------------
  function telaSimulados() {
    if (!state.plano) {
      return '<h1>Simulados</h1><div class="card"><div class="estado-vazio">' +
        '<span class="bolha bolha-pendente"></span><strong>Nenhum plano ainda</strong>' +
        'Importe o plano para registrar simulados e comparar com a meta de corte.' +
        '<p style="margin-top:1rem"><a class="botao" href="#ajustes">Importar plano</a></p></div></div>';
    }
    const meta = state.plano.meta.corte_pct;
    let html = '<div class="cab-pagina"><div><h1>Simulados</h1>' +
      '<p class="sub">Meta: ' + meta + '% (' + esc(state.plano.meta.corte_fonte || 'nota de corte estimada') + ')</p></div>' +
      '<button id="btn-novo-simulado">Preencher gabarito</button></div>';

    if (state.simulados.length === 0) {
      html += '<div class="card"><div class="estado-vazio"><span class="bolha bolha-pendente"></span>' +
        '<strong>Nenhum simulado registrado</strong>Registre o resultado por disciplina e veja a distância até a zona de nomeação.</div></div>';
      return html;
    }

    const ordenados = [...state.simulados].sort(function (a, b) { return b.data.localeCompare(a.data); });
    ordenados.forEach(function (sim) {
      let totalC = 0, totalQ = 0;
      sim.acertos.forEach(function (a) { totalC += a.certas; totalQ += a.total; });
      const pctGeral = totalQ > 0 ? Math.round((totalC / totalQ) * 100) : null;
      html += '<div class="card"><h3>' + (sim.tipo === 'total' ? 'Simulado total' : 'Simulado parcial') +
        ' — ' + D.formatarDataBR(sim.data) + ' · geral: ' + semaforoHtml(pctGeral, meta) + '</h3>' +
        '<table><thead><tr><th>Disciplina</th><th class="num">Acertos</th><th class="num">%</th><th class="num">vs. meta ' + meta + '%</th></tr></thead><tbody>';
      sim.acertos.forEach(function (a) {
        const d = D.disciplinaPorId(state, a.disciplinaId);
        const pct = a.total > 0 ? Math.round((a.certas / a.total) * 100) : null;
        html += '<tr><td>' + (d ? tagDisc(d) + ' ' + esc(d.nome) : esc(a.disciplinaId)) + '</td>' +
          '<td class="num">' + a.certas + '/' + a.total + '</td>' +
          '<td class="num">' + (pct === null ? '—' : pct + '%') + '</td>' +
          '<td class="num">' + semaforoHtml(pct, meta) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    });

    // 3 piores tópicos com dados (para realimentar a fila)
    const piores = D.pioresTopicos(state, 3);
    if (piores.length > 0) {
      html += '<div class="card"><h3>Piores tópicos com registro (mín. 5 questões)</h3>';
      piores.forEach(function (p) {
        html += '<div class="fila-item">' + bolha(p.topico.status) +
          '<div class="fila-info"><div class="fila-titulo">' + tagDisc(p.disciplina) + ' ' + esc(p.topico.nome) + '</div>' +
          '<div class="fila-sub">' + p.pct + '% de acerto em ' + p.feitas + ' questões</div></div>' +
          (p.topico.reaberto
            ? '<span class="etiqueta etiqueta-reaberto">na fila</span>'
            : '<button class="botao-mini" data-fila="' + esc(p.topico.id) + '">Mandar para a fila</button>') +
          '</div>';
      });
      html += '</div>';
    }
    return html;
  }

  function abrirNovoSimulado() {
    const discs = state.disciplinas.filter(function (d) { return d.id !== 'ORF'; });
    const m = abrirModal(
      '<h3>Preencher gabarito</h3>' +
      '<form id="form-sim">' +
      '<div class="grade-2"><div><label for="sim-tipo">Tipo</label><select id="sim-tipo">' +
      '<option value="parcial">Parcial</option><option value="total">Total</option></select></div>' +
      '<div><label for="sim-data">Data</label><input id="sim-data" type="date" value="' + D.hojeISO() + '"></div></div>' +
      '<p style="font-size:0.82rem;color:var(--grafite);margin-top:0.75rem">Preencha só as disciplinas que caíram no simulado.</p>' +
      '<table><thead><tr><th>Disciplina</th><th class="num">Acertos</th><th class="num">Questões</th></tr></thead><tbody>' +
      discs.map(function (d) {
        return '<tr><td>' + tagDisc(d) + ' ' + esc(d.nome) + '</td>' +
          '<td class="num"><input type="number" min="0" max="200" data-sim-certas="' + esc(d.id) + '" style="width:70px;min-height:36px;padding:0.2rem 0.4rem"></td>' +
          '<td class="num"><input type="number" min="0" max="200" data-sim-total="' + esc(d.id) + '" style="width:70px;min-height:36px;padding:0.2rem 0.4rem"></td></tr>';
      }).join('') +
      '</tbody></table>' +
      '<div class="msg-erro oculto" id="sim-erro"></div>' +
      '<div class="modal-acoes"><button type="button" class="botao-quieto" id="sim-cancelar">Cancelar</button>' +
      '<button type="submit">Registrar simulado</button></div></form>'
    );
    m.querySelector('#sim-cancelar').addEventListener('click', fecharModal);
    m.querySelector('#form-sim').addEventListener('submit', function (e) {
      e.preventDefault();
      const erroEl = m.querySelector('#sim-erro');
      const acertos = [];
      let problema = null;
      state.disciplinas.forEach(function (d) {
        const inC = m.querySelector('[data-sim-certas="' + d.id + '"]');
        if (!inC) return;
        const inT = m.querySelector('[data-sim-total="' + d.id + '"]');
        const c = inC.value === '' ? null : parseInt(inC.value, 10);
        const t = inT.value === '' ? null : parseInt(inT.value, 10);
        if (c === null && t === null) return;
        if (c === null || t === null || t === 0) { problema = d.id + ': preencha acertos E total de questões.'; return; }
        if (c > t) { problema = d.id + ': acertos (' + c + ') maiores que o total (' + t + ').'; return; }
        acertos.push({ disciplinaId: d.id, certas: c, total: t });
      });
      if (problema) { erroEl.textContent = problema; erroEl.classList.remove('oculto'); return; }
      if (acertos.length === 0) { erroEl.textContent = 'Preencha ao menos uma disciplina.'; erroEl.classList.remove('oculto'); return; }

      state.simulados.push({
        id: window.Store.novoId('sim'),
        data: m.querySelector('#sim-data').value || D.hojeISO(),
        tipo: m.querySelector('#sim-tipo').value,
        acertos
      });
      salvar(); fecharModal(); render();
      toast('Simulado registrado', 'sucesso');
    });
  }

  function ligarSimulados(raiz) {
    const btn = raiz.querySelector('#btn-novo-simulado');
    if (btn) btn.addEventListener('click', abrirNovoSimulado);
    raiz.querySelectorAll('[data-fila]').forEach(function (b) {
      b.addEventListener('click', function () {
        const t = D.topicoPorId(state, b.getAttribute('data-fila'));
        if (t) { t.reaberto = true; if (t.status === 'teoria_concluida') t.status = 'em_curso'; }
        salvar(); render();
        toast('Tópico na fila da semana', 'sucesso');
      });
    });
  }

  // ---------------- TELA: Estatísticas ----------------
  function telaStats() {
    const hoje = D.hojeISO();
    if (state.sessoes.length === 0) {
      return '<h1>Estatísticas</h1><div class="card"><div class="estado-vazio">' +
        '<span class="bolha bolha-pendente"></span><strong>Sem dados ainda</strong>' +
        'Registre a primeira sessão de estudo e os números aparecem aqui.</div></div>';
    }
    const st = D.streak(state.sessoes, hoje);
    const meta = D.metaSemanal(state, hoje);
    const prog = D.progressoEdital(state);
    const geral = D.desempenhoGeral(state);
    const metaPct = state.plano && state.plano.meta ? state.plano.meta.corte_pct : 70;
    let totalMin = 0, totalQ = 0, totalC = 0;
    state.sessoes.forEach(function (s) { totalMin += s.duracaoMin || 0; totalQ += s.qFeitas || 0; totalC += s.qCertas || 0; });

    let html = '<h1>Estatísticas</h1><div class="linha-cards">' +
      '<div class="card card-kpi"><div class="card-kpi-rotulo">Tempo total</div><div class="card-kpi-valor">' + D.formatarMin(totalMin) + '</div>' +
      '<div class="card-kpi-extra">' + D.formatarMin(meta.minutos) + ' nesta semana</div></div>' +
      '<div class="card card-kpi"><div class="card-kpi-rotulo">Questões</div><div class="card-kpi-valor">' + totalQ + '</div>' +
      '<div class="card-kpi-extra">' + (totalQ > 0 ? Math.round((totalC / totalQ) * 100) + '% de acerto' : '—') + '</div></div>' +
      '<div class="card card-kpi"><div class="card-kpi-rotulo">Desempenho × meta</div><div class="card-kpi-valor">' + semaforoHtml(geral, metaPct) + '</div>' +
      '<div class="card-kpi-extra">meta de corte: ' + metaPct + '%</div></div>' +
      '<div class="card card-kpi"><div class="card-kpi-rotulo">Constância</div><div class="card-kpi-valor">' + st.atual + ' ' + (st.atual === 1 ? 'dia' : 'dias') + '</div>' +
      '<div class="card-kpi-extra">recorde: ' + st.recorde + ' · edital: ' + prog.pct + '%</div></div>' +
      '</div>';

    // heatmap de constância — fileira de bolhas (12 semanas)
    const dias = D.heatmapDias(state.sessoes, hoje, 84);
    html += '<div class="card"><h3>Constância (12 semanas)</h3><div class="heatmap">' +
      dias.map(function (d) {
        const n = d.minutos === 0 ? 0 : d.minutos < 30 ? 1 : d.minutos < 90 ? 2 : 3;
        return '<span class="heatmap-celula' + (n > 0 ? ' heatmap-n' + n : '') + '" title="' + D.formatarDataBR(d.data) + ' — ' + D.formatarMin(d.minutos) + '"></span>';
      }).join('') +
      '</div><div class="heatmap-legenda" style="font-size:0.72rem;color:var(--grafite)">○ nada · azul claro &lt;30min · médio &lt;1h30 · cheio ≥1h30</div></div>';

    html += '<div class="card"><h3>Evolução semanal</h3><div style="height:260px"><canvas class="grafico" id="graf-evolucao"></canvas></div></div>';
    html += '<div class="card"><h3>Desempenho por disciplina × meta de corte</h3><div style="height:260px"><canvas class="grafico" id="graf-meta"></canvas></div></div>';
    if (!window.Graficos.disponivel()) {
      html += '<div class="aviso aviso-info">Os gráficos precisam de internet na primeira carga (Chart.js via CDN). Os demais números continuam funcionando offline.</div>';
    }
    return html;
  }

  function ligarStats(raiz) {
    if (!window.Graficos.disponivel()) return;
    const hoje = D.hojeISO();
    const c1 = raiz.querySelector('#graf-evolucao');
    if (c1) window.Graficos.evolucaoSemanal(c1, D.serieSemanal(state, hoje, 8));
    const c2 = raiz.querySelector('#graf-meta');
    if (c2 && state.disciplinas.length > 0) {
      const metaPct = state.plano && state.plano.meta ? state.plano.meta.corte_pct : 70;
      const dados = state.disciplinas.filter(function (d) { return d.id !== 'ORF'; }).map(function (d) {
        return { sigla: d.id, pct: D.desempenhoDisciplina(state, d) };
      });
      window.Graficos.desempenhoVsMeta(c2, dados, metaPct);
    }
  }

  // ---------------- TELA: Histórico ----------------
  let historicoLimite = 50;
  function telaHistorico() {
    if (state.sessoes.length === 0) {
      return '<h1>Histórico</h1><div class="card"><div class="estado-vazio">' +
        '<span class="bolha bolha-pendente"></span><strong>Nenhuma sessão registrada</strong>' +
        'Cada sessão registrada (timer ou manual) aparece aqui.</div></div>';
    }
    const ordenadas = [...state.sessoes].sort(function (a, b) { return b.data.localeCompare(a.data) || b.id.localeCompare(a.id); });
    const visiveis = ordenadas.slice(0, historicoLimite);
    let html = '<div class="cab-pagina"><div><h1>Histórico</h1><p class="sub">' + state.sessoes.length + ' sessões registradas</p></div></div>' +
      '<div class="card" style="overflow-x:auto"><table><thead><tr>' +
      '<th>Data</th><th>Tópico</th><th>Tipo</th><th class="num">Tempo</th><th class="num">Questões</th><th></th></tr></thead><tbody>';
    visiveis.forEach(function (s) {
      const d = D.disciplinaDoTopico(state, s.topicoId);
      const t = D.topicoPorId(state, s.topicoId);
      html += '<tr><td class="num" style="white-space:nowrap">' + D.formatarDataBR(s.data) + '</td>' +
        '<td>' + (d ? tagDisc(d) + ' ' : '') + esc(t ? t.nome : s.topicoId) + (s.obs ? '<div style="font-size:0.75rem;color:var(--grafite)">' + esc(s.obs) + '</div>' : '') + '</td>' +
        '<td>' + esc(s.tipo) + '</td>' +
        '<td class="num">' + D.formatarMin(s.duracaoMin || 0) + '</td>' +
        '<td class="num">' + (s.qFeitas > 0 ? s.qCertas + '/' + s.qFeitas : '—') + '</td>' +
        '<td><button class="botao-mini botao-quieto" data-excluir="' + esc(s.id) + '" title="Excluir sessão">✕</button></td></tr>';
    });
    html += '</tbody></table>';
    if (ordenadas.length > historicoLimite) {
      html += '<p style="text-align:center;margin-top:0.75rem"><button class="botao-quieto" id="hist-mais">Mostrar mais (' + (ordenadas.length - historicoLimite) + ' restantes)</button></p>';
    }
    html += '</div>';
    return html;
  }

  function ligarHistorico(raiz) {
    const mais = raiz.querySelector('#hist-mais');
    if (mais) mais.addEventListener('click', function () { historicoLimite += 50; render(); });
    raiz.querySelectorAll('[data-excluir]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm('Excluir esta sessão? Os percentuais de desempenho serão recalculados.')) return;
        state.sessoes = state.sessoes.filter(function (s) { return s.id !== b.getAttribute('data-excluir'); });
        salvar(); render();
        toast('Sessão excluída');
      });
    });
  }

  // ---------------- TELA: Plano e backup (F2) ----------------
  function telaAjustes() {
    let html = '<h1>Plano e backup</h1>';

    if (state.plano) {
      const p = state.plano;
      html += '<div class="card"><h3>Plano atual</h3>' +
        '<p><strong>' + esc(p.concurso) + '</strong></p>' +
        '<p style="font-size:0.88rem;color:var(--grafite)">Banca ' + esc(p.banca || '—') +
        (p.cota ? ' · cota: ' + esc(p.cota) : '') +
        ' · meta de corte: ' + p.meta.corte_pct + '%' +
        (p.gerado_em ? ' · gerado em ' + D.formatarDataBR(p.gerado_em) : '') + '</p>' +
        (p.radar ? '<p style="font-size:0.88rem;color:var(--grafite)">Radar: edital entre ' + D.formatarMesBR(p.radar.janela_edital[0]) + ' e ' + D.formatarMesBR(p.radar.janela_edital[1]) +
          ' · confiança ' + esc(p.radar.confianca) + '</p>' : '') +
        '<label for="aj-ritmo">Ritmo do cronograma</label>' +
        '<select id="aj-ritmo" style="max-width:320px">' +
        '<option value="sustentavel"' + (p.ritmoAtivo === 'sustentavel' ? ' selected' : '') + '>Sustentável' +
        (p.ritmos && p.ritmos.sustentavel ? ' — ' + p.ritmos.sustentavel.h_semana + 'h/semana' : '') + '</option>' +
        '<option value="hardcore"' + (p.ritmoAtivo === 'hardcore' ? ' selected' : '') + '>Hardcore 120 dias' +
        (p.ritmos && p.ritmos.hardcore ? ' — ' + p.ritmos.hardcore.h_semana_exigidas + 'h/semana' : '') + '</option></select>' +
        '<label for="aj-meta-q">Meta de questões por semana</label>' +
        '<input id="aj-meta-q" type="number" min="0" max="2000" value="' + (state.config.metaQuestoesSemana || 100) + '" style="max-width:160px">' +
        '</div>';

      if (state.links && state.links.length > 0) {
        html += '<div class="card"><h3>Links do plano</h3><ul class="lista-limpa">' +
          state.links.map(function (l) {
            return '<li style="padding:0.25rem 0"><a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.titulo) + '</a>' +
              (l.custo ? ' <span style="font-size:0.75rem;color:var(--grafite)">(' + esc(l.custo) + ')</span>' : '') + '</li>';
          }).join('') + '</ul></div>';
      }
    }

    html += '<div class="card"><h3>' + (state.plano ? 'Atualizar plano' : 'Importar plano') + '</h3>' +
      '<p style="font-size:0.88rem;color:var(--grafite)">Cole o JSON gerado pela skill treinador-concursos ou envie o arquivo .json. ' +
      (state.plano ? 'Reimportar <strong>preserva todo o histórico</strong> de sessões, revisões e simulados (os tópicos são casados pelo ID).' : '') + '</p>' +
      '<input type="file" id="imp-arquivo" accept=".json,application/json" style="margin-top:0.5rem">' +
      '<label for="imp-texto">ou cole o JSON aqui</label>' +
      '<textarea id="imp-texto" placeholder=\'{"versao": 1, "plano": { ... }}\'></textarea>' +
      '<div class="modal-acoes" style="justify-content:flex-start"><button id="imp-validar">Validar e visualizar</button></div>' +
      '<div id="imp-preview"></div></div>';

    html += '<h2>Ferramentas gratuitas de apoio</h2><div class="linha-cards">' +
      '<a class="card ferramenta-card" href="https://www.notion.com/" target="_blank" rel="noopener">' +
      '<strong>Notion</strong><span>Criação, organização e revisão das suas próprias anotações.</span><span class="ferramenta-acao">Abrir Notion</span></a>' +
      '<a class="card ferramenta-card" href="https://notebooklm.google.com/" target="_blank" rel="noopener">' +
      '<strong>NotebookLM</strong><span>Converse com PDFs, aulas, questões e resumos do curso.</span><span class="ferramenta-acao">Abrir NotebookLM</span></a>' +
      '</div>';

    const syncAtual = statusSincronizacao();
    const syncTexto = syncAtual && syncAtual.texto ? syncAtual.texto : 'Verificando sincronização';
    const syncFonte = syncAtual && syncAtual.fonte ? syncAtual.fonte : (syncStatus && syncStatus.endpoint ? syncStatus.endpoint : 'servidor local não detectado');
    const contaSync = firebaseStatus && firebaseStatus.usuario && firebaseStatus.usuario.email
      ? '<p style="font-size:0.78rem;color:var(--grafite)">Conta: <strong id="sync-conta">' + esc(firebaseStatus.usuario.email) + '</strong></p>'
      : '<p style="font-size:0.78rem;color:var(--grafite)">Conta: <strong id="sync-conta">não conectada</strong></p>';
    html += '<div class="card"><h3>Sincronização entre aparelhos</h3>' +
      '<p style="font-size:0.88rem;color:var(--grafite)">Status: <strong id="sync-status">' + esc(syncTexto) + '</strong></p>' +
      '<p style="font-size:0.78rem;color:var(--grafite)">Fonte: <span id="sync-endpoint">' + esc(syncFonte) + '</span></p>' +
      contaSync +
      '<div class="modal-acoes" style="justify-content:flex-start">' +
      '<button id="fb-login">Entrar com Google</button>' +
      '<button class="botao-secundario" id="sync-agora">Sincronizar agora</button>' +
      '<button class="botao-quieto" id="fb-logout">Sair</button>' +
      '</div></div>';

    const diasBackup = window.Store.diasDesdeBackup(state);
    html += '<div class="card"><h3>Backup dos dados</h3>' +
      '<p style="font-size:0.88rem;color:var(--grafite)">Exporte um arquivo .json por segurança' +
      (diasBackup !== null ? ' — último backup: há ' + diasBackup + ' dia(s)' : ' — nenhum backup feito ainda') + '.</p>' +
      '<div class="modal-acoes" style="justify-content:flex-start">' +
      '<button id="bk-exportar">Exportar backup</button>' +
      '<label class="botao botao-quieto" style="margin:0">Restaurar backup<input type="file" id="bk-importar" accept=".json" style="display:none"></label>' +
      '</div></div>';

    html += '<div class="card card-quieto"><h3 style="color:var(--errado)">Zona de risco</h3>' +
      '<button class="botao-perigo botao-mini" id="zr-limpar">Apagar todos os dados</button></div>';
    return html;
  }

  function mostrarPreviewImportacao(raiz, json) {
    const prev = raiz.querySelector('#imp-preview');
    const v = D.validarPlano(json);
    if (!v.ok) {
      prev.innerHTML = '<div class="aviso aviso-erro" style="margin-top:1rem"><strong>O JSON tem problemas:</strong><ul>' +
        v.erros.slice(0, 8).map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') +
        (v.erros.length > 8 ? '<li>… e mais ' + (v.erros.length - 8) + ' erro(s)</li>' : '') + '</ul></div>';
      return;
    }
    prev.innerHTML = '<div class="aviso aviso-info" style="margin-top:1rem">' +
      '<strong>Pronto para importar:</strong> ' + esc(v.resumo.concurso) + ' (' + esc(v.resumo.banca || 'banca não informada') + ') — ' +
      v.resumo.disciplinas + ' disciplinas, ' + v.resumo.topicos + ' tópicos, ' + v.resumo.semanas + ' semanas de cronograma.' +
      (window.Store.temDados(state) ? '<br>Seu histórico (' + state.sessoes.length + ' sessões, ' + state.revisoes.length + ' revisões, ' + state.simulados.length + ' simulados) será preservado.' : '') +
      '</div><div class="modal-acoes" style="justify-content:flex-start"><button id="imp-confirmar">Confirmar importação</button></div>';
    prev.querySelector('#imp-confirmar').addEventListener('click', function () {
      state = D.mesclarPlano(state, json);
      salvar();
      editalAbertas = new Set();
      toast('Plano importado: ' + v.resumo.topicos + ' tópicos carregados', 'sucesso');
      location.hash = '#hoje';
      render();
    });
  }

  function ligarAjustes(raiz) {
    const ritmo = raiz.querySelector('#aj-ritmo');
    if (ritmo) ritmo.addEventListener('change', function () {
      state.plano.ritmoAtivo = ritmo.value;
      salvar(); render();
      toast('Ritmo alterado para ' + (ritmo.value === 'hardcore' ? 'hardcore 120 dias' : 'sustentável'), 'sucesso');
    });
    const metaQ = raiz.querySelector('#aj-meta-q');
    if (metaQ) metaQ.addEventListener('change', function () {
      state.config.metaQuestoesSemana = Math.max(0, parseInt(metaQ.value, 10) || 0);
      salvar();
      toast('Meta de questões atualizada', 'sucesso');
    });
    const syncAgora = raiz.querySelector('#sync-agora');
    if (syncAgora) syncAgora.addEventListener('click', function () {
      if (window.FirebaseSync && window.FirebaseSync.ativo()) {
        syncAgora.disabled = true;
        window.FirebaseSync.sincronizarAgora({ silencioso: false }).finally(function () {
          syncAgora.disabled = false;
          firebaseStatus = window.FirebaseSync.status();
          atualizarSyncUi();
        });
        return;
      }
      if (!window.Sync) { toast('Sincronização indisponível neste navegador.', 'erro'); return; }
      syncAgora.disabled = true;
      window.Sync.sincronizarAgora({ silencioso: false }).finally(function () {
        syncAgora.disabled = false;
        syncStatus = window.Sync.status();
        atualizarSyncUi();
      });
    });
    const fbLogin = raiz.querySelector('#fb-login');
    if (fbLogin) fbLogin.addEventListener('click', function () {
      if (!window.FirebaseSync) { toast('Firebase ainda está carregando. Tente de novo em alguns segundos.', 'erro'); return; }
      fbLogin.disabled = true;
      window.FirebaseSync.login().catch(function () {
        toast('Não consegui entrar com Google. Confira Auth e domínio autorizado no Firebase.', 'erro');
      }).finally(function () {
        fbLogin.disabled = false;
      });
    });
    const fbLogout = raiz.querySelector('#fb-logout');
    if (fbLogout) fbLogout.addEventListener('click', function () {
      if (!window.FirebaseSync) return;
      window.FirebaseSync.logout().catch(function () {
        toast('Não consegui sair do Firebase.', 'erro');
      });
    });

    raiz.querySelector('#imp-validar').addEventListener('click', function () {
      const texto = raiz.querySelector('#imp-texto').value.trim();
      if (!texto) {
        raiz.querySelector('#imp-preview').innerHTML = '<div class="aviso aviso-erro" style="margin-top:1rem">Cole o JSON ou escolha um arquivo primeiro.</div>';
        return;
      }
      let json;
      try { json = JSON.parse(texto); }
      catch (e) {
        raiz.querySelector('#imp-preview').innerHTML = '<div class="aviso aviso-erro" style="margin-top:1rem">JSON inválido: ' + esc(e.message) + '</div>';
        return;
      }
      mostrarPreviewImportacao(raiz, json);
    });

    raiz.querySelector('#imp-arquivo').addEventListener('change', function (e) {
      const arq = e.target.files[0];
      if (!arq) return;
      const leitor = new FileReader();
      leitor.onload = function () {
        raiz.querySelector('#imp-texto').value = leitor.result;
        let json;
        try { json = JSON.parse(leitor.result); }
        catch (err) {
          raiz.querySelector('#imp-preview').innerHTML = '<div class="aviso aviso-erro" style="margin-top:1rem">O arquivo não é um JSON válido: ' + esc(err.message) + '</div>';
          return;
        }
        mostrarPreviewImportacao(raiz, json);
      };
      leitor.readAsText(arq);
    });

    raiz.querySelector('#bk-exportar').addEventListener('click', function () {
      window.Store.exportarBackup(state);
      if (window.Sync) window.Sync.agendarEnvio(state);
      if (window.FirebaseSync) window.FirebaseSync.agendarEnvio(state);
      toast('Backup exportado', 'sucesso');
      render();
    });

    raiz.querySelector('#bk-importar').addEventListener('change', function (e) {
      const arq = e.target.files[0];
      if (!arq) return;
      const leitor = new FileReader();
      leitor.onload = function () {
        const r = window.Store.importarBackup(leitor.result);
        if (r.ok) {
          state = r.state;
          if (window.Sync) window.Sync.agendarEnvio(state);
          if (window.FirebaseSync) window.FirebaseSync.agendarEnvio(state);
          toast('Backup restaurado', 'sucesso');
          render();
        }
        else toast(r.erro, 'erro');
      };
      leitor.readAsText(arq);
    });

    raiz.querySelector('#zr-limpar').addEventListener('click', function () {
      if (!confirm('Apagar TODOS os dados (plano, sessões, revisões, simulados)? Esta ação não tem volta.')) return;
      if (!confirm('Última confirmação: você exportou um backup antes?')) return;
      state = window.Store.estadoVazio();
      state.config.apagadoEm = new Date().toISOString();
      salvar(); render();
      toast('Dados apagados');
    });
  }

  // ---------------- TELA: Mais (atalhos no celular) ----------------
  function telaMais() {
    const itens = [
      ['#edital', 'Edital verticalizado', 'progresso ○◐● e incidência por tópico'],
      ['#simulados', 'Simulados', 'gabarito × meta de corte'],
      ['#historico', 'Histórico', 'todas as sessões registradas'],
      ['#ajustes', 'Ferramentas de apoio', 'Notion e NotebookLM para estudar melhor'],
      ['#ajustes', 'Plano e backup', 'importar plano, exportar dados']
    ];
    return '<h1>Mais</h1><div class="card card-quieto">' +
      itens.map(function (i) {
        return '<a href="' + i[0] + '" style="display:block;padding:0.85rem 0.25rem;border-bottom:1px solid var(--grafite-claro);text-decoration:none;color:var(--tinta)">' +
          '<strong style="color:var(--caneta)">' + i[1] + '</strong><br><span style="font-size:0.82rem;color:var(--grafite)">' + i[2] + '</span></a>';
      }).join('') + '</div>';
  }

  // ---------------- roteador ----------------
  const telas = {
    hoje: { render: telaHoje, ligar: ligarHoje },
    timer: { render: telaTimer, ligar: ligarTimer },
    revisoes: { render: telaRevisoes, ligar: ligarRevisoes },
    edital: { render: telaEdital, ligar: ligarEdital },
    simulados: { render: telaSimulados, ligar: ligarSimulados },
    stats: { render: telaStats, ligar: ligarStats },
    historico: { render: telaHistorico, ligar: ligarHistorico },
    ajustes: { render: telaAjustes, ligar: ligarAjustes },
    mais: { render: telaMais, ligar: function () {} }
  };

  function rotaAtual() {
    const r = location.hash.replace('#', '') || 'hoje';
    return telas[r] ? r : 'hoje';
  }

  function atualizarNav(rota) {
    document.querySelectorAll('[data-rota]').forEach(function (el) {
      el.classList.toggle('ativo', el.getAttribute('data-rota') === rota);
    });
    const concurso = document.getElementById('sidebar-concurso');
    if (concurso) concurso.textContent = state.plano ? state.plano.concurso : 'Nenhum plano importado';

    const nVencidas = state.revisoes.filter(function (r) {
      return !r.dataConcluida && r.dataAgendada <= D.hojeISO() && D.topicoPorId(state, r.topicoId);
    }).length;
    const badge = document.getElementById('badge-revisoes');
    const badgeM = document.getElementById('badge-revisoes-m');
    if (badge) { badge.textContent = nVencidas; badge.classList.toggle('oculto', nVencidas === 0); }
    if (badgeM) badgeM.classList.toggle('oculto', nVencidas === 0);
  }

  function atualizarSyncUi() {
    const atual = statusSincronizacao();
    const el = document.getElementById('sync-status');
    if (el && atual) el.textContent = atual.texto;
    const ep = document.getElementById('sync-endpoint');
    if (ep && atual) ep.textContent = atual.fonte || atual.endpoint || 'servidor local não detectado';
    const conta = document.getElementById('sync-conta');
    if (conta && atual) conta.textContent = atual.usuario && atual.usuario.email ? atual.usuario.email : 'não conectada';
    const login = document.getElementById('fb-login');
    const logout = document.getElementById('fb-logout');
    const conectado = !!(atual && atual.usuario);
    if (login) login.classList.toggle('oculto', conectado);
    if (logout) logout.classList.toggle('oculto', !conectado);
  }

  function render() {
    const rota = rotaAtual();
    const tela = telas[rota];
    const conteudo = document.getElementById('conteudo');
    if (rota !== 'timer') pintarTimerAtual = null;
    conteudo.innerHTML = tela.render();
    tela.ligar(conteudo);
    atualizarNav(rota);
    atualizarSyncUi();
  }

  // ---------------- inicialização ----------------
  window.addEventListener('hashchange', function () { fecharModal(); render(); });

  window.Timer.aoAtualizar(tratarTickTimer);

  const recuperado = window.Timer.recuperar();
  if (recuperado) {
    toast('Timer recuperado — sua sessão de ' + window.Timer.formatar(recuperado.decorridoMs) + ' continua valendo.', 'sucesso');
    if (!location.hash || location.hash === '#hoje') location.hash = '#timer';
  }
  const estadoInicialTimer = window.Timer.estado();
  atualizarTituloTimer(estadoInicialTimer);
  if (estadoInicialTimer && estadoInicialTimer.limiteAtingido) avisarLimiteTimer(estadoInicialTimer);

  render();

  const opcoesSyncBase = {
    obterEstado: function () { return state; },
    aplicarEstado: function (novoState, silencioso) {
      state = novoState;
      window.Store.salvar(state, { marcarAlterado: false });
      render();
      if (!silencioso) toast('Dados sincronizados', 'sucesso');
    }
  };

  if (window.Sync) {
    window.Sync.iniciar(Object.assign({}, opcoesSyncBase, {
      aoStatus: function (novoStatus) {
        syncStatus = novoStatus;
        atualizarSyncUi();
      }
    }));
  }

  function iniciarFirebaseSync() {
    if (!window.FirebaseSync || iniciarFirebaseSync.iniciado) return;
    iniciarFirebaseSync.iniciado = true;
    firebaseStatus = window.FirebaseSync.status();
    window.FirebaseSync.iniciar(Object.assign({}, opcoesSyncBase, {
      aoStatus: function (novoStatus) {
        const usuarioAntes = firebaseStatus && firebaseStatus.usuario ? firebaseStatus.usuario.email : null;
        const usuarioDepois = novoStatus && novoStatus.usuario ? novoStatus.usuario.email : null;
        firebaseStatus = novoStatus;
        atualizarSyncUi();
        if (rotaAtual() === 'ajustes' && usuarioAntes !== usuarioDepois) render();
      }
    }));
  }
  window.addEventListener('firebase-sync-ready', iniciarFirebaseSync);
  iniciarFirebaseSync();
})();
