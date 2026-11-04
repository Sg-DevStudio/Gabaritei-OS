/* Links pessoais para o TEC. Não lê questões, conta ou resultados da plataforma. */
(function () {
  'use strict';
  const TIPO = 'tec-questoes';
  const ligados = new WeakSet();
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function urlSegura(value) {
    try {
      if (typeof value !== 'string' || value.length > 2048) return '';
      const u = new URL(value.trim());
      return u.protocol === 'https:' && ['tecconcursos.com.br', 'www.tecconcursos.com.br'].includes(u.hostname) && !u.username && !u.password && !u.port ? u.href : '';
    } catch (_) { return ''; }
  }
  function disciplina(state, id) {
    return (state.disciplinas || []).find(d => d.id === id && d.id !== 'ORF');
  }
  function vinculo(state, id) {
    const item = (state.links || []).filter(l => l && l.tipo === TIPO && l.disciplinaId === id)
      .sort((a, b) => (Number(b.revVinculo) || 0) - (Number(a.revVinculo) || 0) || String(b.atualizadoEm || '').localeCompare(String(a.atualizadoEm || '')))[0];
    return item && !item.oculto && urlSegura(item.url) ? item : null;
  }
  function definirVinculo(state, id, url, nome) {
    if (!state.planoAtivoId || !disciplina(state, id)) throw new Error('Escolha uma disciplina do plano atual.');
    if (url !== '' && !urlSegura(url)) throw new Error('Use um link HTTPS de tecconcursos.com.br, sem usuário ou senha no endereço.');
    if (!Array.isArray(state.links)) state.links = [];
    const anterior = state.links.find(l => l && l.tipo === TIPO && l.disciplinaId === id);
    const item = { id: anterior ? anterior.id : TIPO + '-' + encodeURIComponent(id), tipo: TIPO,
      disciplinaId: id, nome: String(nome || 'Caderno do TEC').trim().slice(0, 160) || 'Caderno do TEC',
      url: url ? urlSegura(url) : '', oculto: !url, revVinculo: (Number(anterior && anterior.revVinculo) || 0) + 1,
      atualizadoEm: new Date().toISOString() };
    // Mantém uma lápide ao remover o vínculo: uma cópia antiga não vira fallback.
    state.links.splice(0, state.links.length, ...state.links.filter(l => !l || l.tipo !== TIPO || l.disciplinaId !== id), item);
    const plano = (state.planos || []).find(p => p.id === state.planoAtivoId);
    if (plano) plano.links = state.links;
    return item;
  }
  function validarResultado(valores) {
    const duracaoMin = Number(valores.duracaoMin), qFeitas = Number(valores.qFeitas), qCertas = Number(valores.qCertas);
    if (!Number.isInteger(duracaoMin) || duracaoMin < 1 || duracaoMin > 720) return 'Informe o tempo real de estudo, entre 1 e 720 minutos.';
    if (!Number.isInteger(qFeitas) || qFeitas < 1 || qFeitas > 999) return 'Informe entre 1 e 999 questões feitas.';
    if (String(valores.qCertas).trim() === '' || !Number.isInteger(qCertas) || qCertas < 0 || qCertas > qFeitas) return 'Informe os acertos, de zero até a quantidade de questões feitas.';
    return '';
  }
  function atributos(state, opcoes) {
    return ' data-tec-plano="' + esc(state.planoAtivoId) + '" data-tec-disc="' + esc(opcoes.disciplinaId) + '"' +
      ' data-tec-topico="' + esc(opcoes.topicoId || '') + '" data-tec-bloco="' + esc(opcoes.blocoId || '') + '" data-tec-data="' + esc(opcoes.data || '') + '"';
  }
  function renderAcoes(state, opcoes) {
    if (!disciplina(state, opcoes.disciplinaId) || !state.planoAtivoId) return '';
    const item = vinculo(state, opcoes.disciplinaId), attrs = atributos(state, opcoes);
    if (!item) return '<button type="button" class="botao-mini botao-secundario tec-atalho" data-tec-acao="editar"' + attrs + '>Vincular TEC</button>';
    return '<span class="tec-acoes">' +
      '<a class="botao botao-mini botao-secundario tec-atalho banco-logo-link" href="' + esc(urlSegura(item.url)) + '" target="_blank" rel="noopener noreferrer" title="Resolver no TEC — ' + esc(item.nome) + '" aria-label="Resolver no TEC: ' + esc(item.nome) + '"><img class="tec-logo" src="assets/ferramentas/logo-tec-concursos.png" alt="" aria-hidden="true"></a>' +
      '<button type="button" class="botao-mini botao-quieto" data-tec-acao="registrar"' + attrs + '>Registrar resultado</button>' +
      (opcoes.editar ? '<button type="button" class="botao-mini botao-quieto" data-tec-acao="editar"' + attrs + '>Editar vínculo</button>' : '') + '</span>';
  }
  function renderCard(state, id) {
    if (!disciplina(state, id) || !state.planoAtivoId) return '';
    const item = vinculo(state, id);
    return '<section class="card tec-card"><div class="tec-card-info"><h2>Questões no TEC</h2><p class="sub">' +
      (item ? esc(item.nome) : 'Vincule o caderno ou filtro que você usa nesta disciplina.') +
      '</p><p class="tec-ajuda">Resolva no TEC e registre aqui questões, acertos e tempo. O resultado é informado por você.</p></div>' +
      renderAcoes(state, { disciplinaId: id, editar: true }) + '</section>';
  }
  function editar(state, opcoes, api) {
    const disc = disciplina(state, opcoes.disciplinaId), item = vinculo(state, opcoes.disciplinaId);
    if (!disc) return;
    const planoId = state.planoAtivoId;
    const versaoAntes = JSON.stringify((state.links || []).filter(l => l && l.tipo === TIPO && l.disciplinaId === disc.id));
    const m = api.abrirModal('<h3>' + (item ? 'Editar vínculo com o TEC' : 'Vincular caderno do TEC') + '</h3><p class="sub">' + esc(disc.nome) + '</p>' +
      '<form id="tec-form"><label for="tec-nome">Nome do caderno (opcional)</label><input id="tec-nome" maxlength="160" value="' + esc(item && item.nome || '') + '" placeholder="Ex.: Administrativo — AOCP e FCC">' +
      '<label for="tec-url">Link do caderno ou filtro no TEC</label><input id="tec-url" type="url" required maxlength="2048" value="' + esc(item && item.url || '') + '" placeholder="https://www.tecconcursos.com.br/…" aria-describedby="tec-orientacao tec-erro">' +
      '<p id="tec-orientacao" class="tec-ajuda">Abra o caderno no TEC, copie o endereço do navegador e cole aqui. Você fará login diretamente no TEC. Este vínculo vale só para esta disciplina neste plano.</p>' +
      '<p id="tec-erro" class="msg-erro oculto" role="alert"></p><div class="modal-acoes">' +
      (item ? '<button type="button" id="tec-remover" class="botao-perigo botao-mini">Remover vínculo</button>' : '') +
      '<button type="button" id="tec-cancelar" class="botao-quieto">Cancelar</button><button type="submit">Salvar vínculo</button></div></form>');
    m.querySelector('#tec-cancelar').onclick = api.fecharModal;
    const erro = mensagem => { const e = m.querySelector('#tec-erro'); e.textContent = mensagem; e.classList.remove('oculto'); };
    function gravar(remover) {
      if (state.planoAtivoId !== planoId || (api.contextoValido && !api.contextoValido(state))) { erro('O plano ou a conta mudou. Feche e reabra este formulário.'); return; }
      const versaoAtual = JSON.stringify((state.links || []).filter(l => l && l.tipo === TIPO && l.disciplinaId === disc.id));
      if (versaoAtual !== versaoAntes) { erro('Este vínculo foi alterado em outra tela. Feche e reabra para conferir a versão atual.'); return; }
      const antes = (state.links || []).slice();
      try {
        const url = remover ? '' : m.querySelector('#tec-url').value.trim();
        if (!remover && !url) throw new Error('Cole o link do seu caderno no TEC.');
        definirVinculo(state, disc.id, url, m.querySelector('#tec-nome').value);
        const salvo = api.salvar();
        if (salvo === false || (salvo && salvo.ok === false)) throw new Error('Não foi possível salvar o vínculo. Tente novamente.');
      } catch (e) {
        state.links.splice(0, state.links.length, ...antes);
        erro(e.message || 'Não foi possível salvar o vínculo.'); return;
      }
      api.fecharModal(); api.render(); api.toast(remover ? 'Vínculo com o TEC removido.' : 'Vínculo com o TEC salvo.', 'sucesso');
    }
    m.querySelector('form').onsubmit = e => { e.preventDefault(); gravar(false); };
    const remover = m.querySelector('#tec-remover');
    if (remover) remover.onclick = () => gravar(true);
  }
  function ligar(raiz, state, api) {
    raiz.querySelectorAll('[data-tec-acao]').forEach(b => {
      if (ligados.has(b)) return;
      ligados.add(b);
      b.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        if (b.dataset.tecPlano !== state.planoAtivoId || (api.contextoValido && !api.contextoValido(state))) {
          api.toast('O plano mudou. Reabra esta tela.', 'erro'); return;
        }
        const opcoes = { disciplinaId: b.dataset.tecDisc, topicoId: b.dataset.tecTopico || null,
          blocoId: b.dataset.tecBloco || null, data: b.dataset.tecData || null };
        if (b.dataset.tecAcao === 'editar') editar(state, opcoes, api);
        else if (b.dataset.tecAcao === 'registrar') api.registrar(opcoes);
      });
    });
  }
  window.TecQuestoes = { urlSegura, vinculo, definirVinculo, validarResultado, renderAcoes, renderCard, ligar };
})();
