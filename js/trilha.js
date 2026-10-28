/* Links pessoais usam a persistência existente de cada plano. */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normal = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  function urlSegura(s) {
    try { const u = new URL(s); return /^https?:$/.test(u.protocol) && !u.username && !u.password ? u.href : ''; } catch (_) { return ''; }
  }
  function grupos(state) {
    const lista = (state.disciplinas || []).map(d => ({ nome: d.nome, topicos: (d.topicos || []).filter(t => !t.removidoDoEdital).map(t => ({ chave: 'plano:' + d.id + ':' + t.id, nome: t.nome || t.titulo || t.id })) }));
    if (/trf\s*2/i.test(state.plano && state.plano.concurso || '') && /t[eé]cnico/i.test(state.plano.concurso)) {
      (window.TrilhaReferencia || []).forEach((d, i) => lista.push({ nome: d.name + ' · referência TRF2', referencia: true, topicos: d.topics.map((t, j) => ({ chave: 'ref:trf2-2024:' + i + ':' + j, nome: t.name, referencia: t })) }));
    }
    return lista;
  }
  function padrao(t, state) {
    let ref = t.referencia;
    if (!ref && /trf\s*2/i.test(state.plano && state.plano.concurso || '') && /t[eé]cnico/i.test(state.plano.concurso)) {
      const matches = (window.TrilhaReferencia || []).flatMap(d => d.topics).filter(x => normal(x.name) === normal(t.nome));
      if (matches.length === 1) ref = matches[0];
    }
    if (!ref || ref.code == null) return null;
    return { id: 'referencia', nome: 'Resolver no Gran · AOCP + FCC', url: 'https://questoes.grancursosonline.com.br/questoes?desatualizada=0&anulada=0&assunto=' + encodeURIComponent(ref.code) + '&banca=982%2C92&anos=2017,2018,2019,2020,2021,2022,2023,2024,2025,2026&nivel=1', aviso: ref.exact ? 'Correspondência específica indicada no arquivo' : 'Categoria ampla: pode incluir outros assuntos' };
  }
  function links(state, t) {
    const pessoais = (state.links || []).filter(l => l.tipo === 'trilha' && l.topicoChave === t.chave);
    return (pessoais.length ? pessoais : [padrao(t, state)].filter(Boolean)).filter(l => !l.oculto).sort((a, b) => Number(!!b.principal) - Number(!!a.principal));
  }
  function render(state) {
    if (!state.plano) return '<h1>Trilha de questões</h1><div class="card"><p>Escolha um plano para organizar seus cadernos.</p><a href="#planos">Escolher plano</a></div>';
    return '<h1>Trilha de questões</h1><p class="sub">Caderno do plano: ' + esc(state.plano.concurso) + '. Seus links pessoais ficam neste plano.</p>' +
      '<div class="card trilha-intro"><p>Abra questões por assunto ou adicione links do Gran, NotebookLM, TEC e outras plataformas. Resolver fora do Gabaritei não importa acertos automaticamente.</p>' + (/trf\s*2/i.test(state.plano.concurso || '') && /t[eé]cnico/i.test(state.plano.concurso || '') ? '<p>Referência TRF2: edital-base 2024, AOCP e FCC complementar, 2017–2026. Filtros e quantidades ainda precisam de conferência no Gran. Os tópicos de referência não são adicionados ao seu edital.</p>' : '') + '</div>' +
      '<label class="trilha-busca">Buscar disciplina ou subtópico<input id="trilha-busca" type="search" placeholder="Ex.: Crase"></label><div id="trilha-grupos">' + grupos(state).map(g => '<details class="card trilha-grupo"' + (g.referencia ? '' : ' open') + '><summary>' + esc(g.nome) + ' <small>(' + g.topicos.length + ')</small></summary>' + g.topicos.map(t => {
        const ls = links(state, t);
        return '<article class="trilha-topico" data-busca="' + esc(normal(g.nome + t.nome)) + '"><h3>' + esc(t.nome) + '</h3>' + (!ls.length ? '<p class="sub">Precisa de link específico.</p>' : '') + ls.map(l => '<div class="trilha-link">' + (urlSegura(l.url) ? '<a href="' + esc(urlSegura(l.url)) + '" target="_blank" rel="noopener noreferrer">' + esc(l.nome) + ' ↗</a>' : '<span>Link inválido: edite para corrigir.</span>') + (l.aviso ? '<small>' + esc(l.aviso) + '</small>' : '') + (l.principal ? '<small>Principal</small>' : '') + '<button class="botao-mini botao-quieto" data-trilha-editar="' + esc(t.chave) + '" data-link="' + esc(l.id) + '">Editar link</button></div>').join('') + '<button class="botao-mini botao-quieto" data-trilha-adicionar="' + esc(t.chave) + '">Adicionar link</button></article>';
      }).join('') + '</details>').join('') + '</div><p id="trilha-vazia" hidden>Nenhum subtópico encontrado.</p>';
  }
  function ligar(state, api) {
    const raiz = document.getElementById('conteudo');
    const busca = raiz.querySelector('#trilha-busca');
    if (!busca) return;
    busca.oninput = function () {
      let total = 0;
      raiz.querySelectorAll('.trilha-grupo').forEach(g => {
        let n = 0;
        g.querySelectorAll('.trilha-topico').forEach(t => { t.hidden = !t.dataset.busca.includes(normal(busca.value)); if (!t.hidden) n++; });
        g.hidden = !n; if (busca.value) g.open = true; total += n;
      });
      raiz.querySelector('#trilha-vazia').hidden = total > 0;
    };
    raiz.querySelectorAll('[data-trilha-editar],[data-trilha-adicionar]').forEach(b => b.onclick = function () {
      const chave = b.dataset.trilhaEditar || b.dataset.trilhaAdicionar;
      const t = grupos(state).flatMap(g => g.topicos).find(x => x.chave === chave);
      const atual = b.dataset.link ? links(state, t).find(l => l.id === b.dataset.link) : null;
      const m = api.abrirModal('<h2>' + (atual ? 'Editar link' : 'Adicionar link') + '</h2><p>' + esc(t.nome) + '</p><form id="trilha-form"><label>Nome do material<input name="nome" required maxlength="160" value="' + esc(atual && atual.nome || '') + '"></label><label>Endereço do material<input name="url" type="url" required value="' + esc(atual && atual.url || '') + '" placeholder="https://…"></label><label><span><input name="principal" type="checkbox"> Link principal deste subtópico</span></label><p id="trilha-erro" role="alert"></p><div class="modal-acoes"><button type="button" id="trilha-cancelar" class="botao-quieto">Cancelar</button><button type="submit">Salvar link</button></div></form>');
      m.querySelector('#trilha-cancelar').onclick = api.fecharModal;
      m.querySelector('[name=principal]').checked = !!(atual && atual.principal);
      if (atual) {
        const remover = document.createElement('button'); remover.type = 'button'; remover.className = 'botao-quieto'; remover.textContent = 'Remover link';
        m.querySelector('.modal-acoes').prepend(remover);
        remover.onclick = function () {
          const antes = state.links.slice();
          const id = atual.id === 'referencia' ? 'trilha-removido-' + Date.now() : atual.id;
          const i = state.links.findIndex(l => l.id === id);
          const item = { id: id, tipo: 'trilha', topicoChave: chave, oculto: true, atualizadoEm: new Date().toISOString() };
          if (i < 0) state.links.push(item); else state.links[i] = item;
          if (api.salvar() === false) { state.links.splice(0, state.links.length, ...antes); m.querySelector('#trilha-erro').textContent = 'Não foi possível salvar a remoção.'; return; }
          api.fecharModal(); api.render(); api.toast('Link removido', 'sucesso');
        };
      }
      m.querySelector('form').onsubmit = function (e) {
        e.preventDefault();
        const f = e.currentTarget, url = urlSegura(f.elements.url.value.trim()), nome = f.elements.nome.value.trim();
        if (!url || !nome) { m.querySelector('#trilha-erro').textContent = 'Informe um nome e um endereço HTTP ou HTTPS válido, sem credenciais.'; return; }
        const antes = state.links.slice();
        // Mantém o link de referência quando o aluno adiciona uma alternativa.
        if (!atual && !state.links.some(l => l.tipo === 'trilha' && l.topicoChave === chave)) {
          const ref = padrao(t, state);
          if (ref) state.links.push(Object.assign({}, ref, { id: 'trilha-' + Date.now() + '-base-' + Math.random().toString(36).slice(2, 8), tipo: 'trilha', topicoChave: chave }));
        }
        const id = atual && atual.id !== 'referencia' ? atual.id : 'trilha-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        const item = { id: id, tipo: 'trilha', topicoChave: chave, nome: nome, url: url, principal: f.elements.principal.checked, atualizadoEm: new Date().toISOString() };
        if (item.principal) state.links.splice(0, state.links.length, ...state.links.map(l => l.tipo === 'trilha' && l.topicoChave === chave ? Object.assign({}, l, { principal: false }) : l));
        const ativo = state.planos.find(p => p.id === state.planoAtivoId); if (ativo) ativo.links = state.links;
        const i = state.links.findIndex(l => l.id === id);
        if (i < 0) state.links.push(item); else state.links[i] = item;
        try { const resultado = api.salvar(); if (resultado === false || (resultado && resultado.ok === false)) throw new Error('persistencia'); }
        catch (_) { state.links.splice(0, state.links.length, ...antes); m.querySelector('#trilha-erro').textContent = 'Não foi possível salvar. Tente novamente.'; return; }
        api.fecharModal(); api.render(); api.toast('Link salvo', 'sucesso');
      };
    });
  }
  window.Trilha = { render: render, ligar: ligar, urlSegura: urlSegura };
})();
