/* Links pessoais usam a persistência existente de cada plano. */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normal = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  function urlSegura(s) {
    try { const u = new URL(s); return /^https?:$/.test(u.protocol) && !u.username && !u.password ? u.href : ''; } catch (_) { return ''; }
  }
  function rotuloLink(link) {
    try { const u = new URL(link.url); if (u.hostname === 'questoes.grancursosonline.com.br') return u.pathname.replace(/\/$/,'') === '/questoes' ? 'Resolver no Gran' : 'Ver catálogo no Gran'; } catch (_) {}
    return link.nome;
  }
  let impressao = [];
  if (window.addEventListener) window.addEventListener('beforeprint', () => { impressao = Array.from(document.querySelectorAll('.caderno details')); impressao.forEach(d => { d.dataset.abertoAntesImprimir = String(d.open); d.open = true; }); });
  if (window.addEventListener) window.addEventListener('afterprint', () => { impressao.forEach(d => { d.open = d.dataset.abertoAntesImprimir === 'true'; delete d.dataset.abertoAntesImprimir; }); impressao = []; });
  const banca = '982,92';
  let edicaoPlano = null;
  const disciplinasAbertas = new Map();
  const chaveCaderno = s => s.cadernoConsulta ? '' : (s.planoAtivoId || s.plano && s.plano.concurso || '');
  const ehTrf2 = state => /(?:trf\s*2|carreira\s+trf\b)/i.test(state.plano && state.plano.concurso || '') && /t[eé]cnico/i.test(state.plano.concurso || '') && /administrativ/i.test(state.plano.concurso || '');
  function grupos(state) {
    const lista = (state.disciplinas || []).map(d => ({ nome: d.nome, topicos: (d.topicos || []).filter(t => !t.removidoDoEdital).map(t => ({ chave: (state.cadernoEstruturaId ? 'base:' + state.cadernoEstruturaId + ':' : 'plano:') + d.id + ':' + t.id, nome: t.nome || t.titulo || t.id, vinculos: ehTrf2(state) ? Object.values(window.TrilhaVinculosTRF2 || {}).find(v => normal(v.nome) === normal(t.nome || t.titulo)) : null })) }));
    return lista;
  }
  function padrao(t, state) {
    let ref = t.referencia;
    if (!ref && /(?:trf\s*2|carreira\s+trf\b)/i.test(state.plano && state.plano.concurso || '') && /t[eé]cnico/i.test(state.plano.concurso)) {
      const matches = (window.TrilhaReferencia || []).flatMap(d => d.topics).filter(x => normal(x.name) === normal(t.nome));
      if (matches.length === 1) ref = matches[0];
    }
    if (!ref) return null;
    if (ref.code == null) return { id: 'referencia', nome: 'Ver catálogo no Gran', url: ref.catalog, aviso: 'Sem código específico verificado; abre o catálogo, não um filtro.' };
    return { id: 'referencia', nome: 'Resolver no Gran', url: 'https://questoes.grancursosonline.com.br/questoes?desatualizada=0&anulada=0&assunto=' + encodeURIComponent(ref.code) + (banca ? '&banca=' + encodeURIComponent(banca) : '') + '&anos=2017,2018,2019,2020,2021,2022,2023,2024,2025,2026&nivel=1', aviso: ref.exact ? 'Correspondência específica indicada no arquivo' : 'Categoria ampla: pode incluir outros assuntos' };
  }
  function defaults(state,t) {
    if (t.vinculos) return t.vinculos.links.map((l,i) => {
      const u = new URL(l.url); if(l.code != null) { if(banca) u.searchParams.set('banca',banca); else u.searchParams.delete('banca'); }
      return {id:'referencia-' + t.chave + '-' + i,nome:(l.code == null ? 'Ver catálogo: ' : 'Resolver: ') + l.nome,url:u.href,aviso:l.code == null ? 'Catálogo; sem filtro específico' : l.exact ? '' : 'Categoria ampla'};
    });
    return [padrao(t,state)].filter(Boolean);
  }
  function links(state, t) {
    let pessoais = (state.links || []).filter(l => l.tipo === 'trilha' && l.topicoChave === t.chave);
    // Preserva os links pessoais da antiga seção de referência quando o tópico
    // tem correspondência única, sem duplicar disciplinas fora do edital.
    if (!pessoais.length && ehTrf2(state)) {
      const chaves = [];
      (window.TrilhaReferencia || []).forEach((d, i) => d.topics.forEach((r, j) => { if (normal(r.name) === normal(t.nome)) chaves.push('ref:trf2-2024:' + i + ':' + j); }));
      if (chaves.length === 1) pessoais = (state.links || []).filter(l => l.tipo === 'trilha' && l.topicoChave === chaves[0]);
    }
    return (pessoais.length ? pessoais : defaults(state,t)).filter(l => !l.oculto).sort((a, b) => Number(!!b.principal) - Number(!!a.principal));
  }
  function render(state) {
    if (!state.plano) return '<h1>Caderno de questões</h1><div class="card"><p>Escolha um plano para organizar seus cadernos.</p><a href="#planos">Escolher plano</a></div>';
    const gs = grupos(state);
    const disponivel = gs.some(g => g.topicos.some(t => defaults(state,t).length)) || (state.links || []).some(l => l.tipo === 'trilha');
    if (!disponivel) return '<section class="caderno-indisponivel" role="status"><div class="card caderno-aviso"><h1>Caderno de questões indisponível</h1><p class="sub">' + esc(state.plano.concurso) + '</p><p>Ainda não temos um caderno de questões para este plano.</p><p>Entre em contato se desejar solicitar a criação deste caderno.</p><div class="compact-actions"><button type="button" data-caderno-contato>Entrar em contato</button><a class="botao botao-secundario" href="#planos">Voltar aos planos</a></div></div></section>';
    const total = gs.reduce((n,g) => n + g.topicos.length, 0);
    return '<div class="caderno' + (edicaoPlano && edicaoPlano === chaveCaderno(state) ? ' editando' : '') + '"><header class="caderno-capa"><h1>Caderno de questões por subtópico</h1><p>' + esc(state.plano.concurso) + '</p><p>' + gs.length + ' disciplinas · ' + total + ' subtópicos' + (ehTrf2(state) ? ' · anos 2017–2026' : '') + '</p></header>' +
      '<div class="caderno-layout"><aside class="caderno-indice"><h2>Disciplinas</h2>' + gs.map((g,i) => '<button type="button" data-caderno-ir="' + i + '">' + esc(g.nome) + '<small>' + g.topicos.length + '</small></button>').join('') + '</aside><div class="caderno-corpo">' +
      '<section class="card caderno-intro"><strong>Como usar</strong><p>Abra as questões ao lado de cada subtópico. Você pode editar os links ou complementar com NotebookLM, TEC, Qconcursos e outras plataformas. Resolva quantas questões quiser, no seu ritmo.</p>' +
      (ehTrf2(state) ? '<p>Caderno-base TRF2 Administrativo, edital 2024, fornecido no arquivo (referência complementar para o plano de carreira): <b>AOCP + FCC</b>, nível superior, 2017–2026, sem questões anuladas e desatualizadas. FCC é treino complementar. Categorias amplas podem incluir outros assuntos; itens sem código abrem o catálogo. Quantidades dos filtros não foram validadas individualmente. Os filtros deste caderno usam somente AOCP e FCC. Seus links pessoais permanecem como você os salvou.</p>' : '<p>Complete os subtópicos sem link. O caderno segue a ordem do edital cadastrado.</p>') +
      (state.cadernoConsulta ? '<p><strong>Modo consulta:</strong> inicie este plano para salvar links pessoais.</p>' : '') + '</section>' +
      '<div class="card caderno-controles"><input id="trilha-busca" type="search" aria-label="Buscar disciplina ou subtópico" placeholder="Buscar disciplina ou subtópico…">' +
      (ehTrf2(state) ? '<span class="caderno-banca-fixa">Bancas: <strong>AOCP + FCC</strong></span>' : '') +
      '<button type="button" id="caderno-editar" class="botao-mini botao-secundario" aria-pressed="' + (edicaoPlano === chaveCaderno(state) && !!edicaoPlano) + '">' + (edicaoPlano === chaveCaderno(state) && edicaoPlano ? 'Concluir edição' : 'Editar caderno') + '</button><button type="button" id="caderno-imprimir" class="botao-mini botao-quieto">Imprimir / PDF</button></div>' +
      '<div id="trilha-grupos">' + gs.map((g,i) => '<details class="card trilha-grupo" id="caderno-disc-' + i + '"' + ((disciplinasAbertas.get(chaveCaderno(state)) || new Set()).has(i) ? ' open' : '') + '><summary class="caderno-sec-head"><div><small>' + String(i+1).padStart(2,'0') + ' / ' + gs.length + (g.tipo ? ' · ' + esc(g.tipo) : '') + '</small><h2>' + esc(g.nome) + ' <span class="caderno-contagem">(' + g.topicos.length + ' subtópicos)</span></h2></div></summary><p class="sub">Escolha o subtópico e resolva quantas questões quiser.</p>' + g.topicos.map(t => {
        const ls = links(state,t);
        return '<article class="trilha-topico" data-busca="' + esc(normal(g.nome+t.nome)) + '"><div class="caderno-tema"><h3>' + esc(t.nome) + '</h3><small>' + esc(t.referencia ? (t.referencia.code == null ? 'Sem código específico verificado' : (t.referencia.exact ? 'Categoria identificada no arquivo' : 'Categoria mais ampla') + ' · assunto ' + t.referencia.code) : (t.vinculos || defaults(state,t).length ? (t.vinculos && t.vinculos.links.every(l => l.code == null) ? 'Catálogo do Gran: filtro específico ainda pendente' : 'Filtro do Gran · AOCP + FCC') : ls.length ? 'Links adicionados por você' : 'Sem link de questões cadastrado para este subtópico')) + '</small></div><div class="caderno-acessos">' + ls.map(l => '<div class="trilha-link">' + (urlSegura(l.url) ? '<a href="' + esc(urlSegura(l.url)) + '" target="_blank" rel="noopener noreferrer" title="' + esc(l.nome) + '" aria-label="' + esc(rotuloLink(l) + ': ' + l.nome) + '">' + esc(rotuloLink(l)) + ' ↗</a>' : '<span>Link inválido</span>') + '<button class="botao-mini botao-quieto" data-trilha-editar="' + esc(t.chave) + '" data-link="' + esc(l.id) + '">Editar link</button></div>').join('') + '<button class="botao-mini botao-quieto caderno-adicionar" data-trilha-adicionar="' + esc(t.chave) + '">' + (ls.length ? '+ Adicionar link' : 'Adicionar questões') + '</button></div></article>';
      }).join('') + '</details>').join('') + '</div><p id="trilha-vazia" hidden>Nenhum subtópico encontrado.</p><footer class="caderno-rodape">Seus links pertencem a este caderno. Acertos e erros das plataformas externas não são importados automaticamente.</footer></div></div></div>';
  }
  function ligar(state, api) {
    const raiz = document.getElementById('conteudo');
    const contato = raiz.querySelector('[data-caderno-contato]');
    if (contato) contato.onclick = () => api.contato && api.contato();
    const busca = raiz.querySelector('#trilha-busca');
    if (!busca) return;
    function filtrar() {
      let total = 0;
      raiz.querySelectorAll('.trilha-grupo').forEach(g => {
        let n = 0;
        g.querySelectorAll('.trilha-topico').forEach(t => { t.hidden = !t.dataset.busca.includes(normal(busca.value)); if (!t.hidden) n++; });
        g.hidden = !n; if (busca.value.trim() && n) g.open = true; total += n;
      });
      raiz.querySelector('#trilha-vazia').hidden = total > 0;
    };
    busca.oninput = filtrar;
    raiz.querySelectorAll('.trilha-grupo').forEach((g,i) => g.addEventListener('toggle', () => {
      const abertos = disciplinasAbertas.get(chaveCaderno(state)) || new Set();
      if (g.open) abertos.add(i); else abertos.delete(i);
      disciplinasAbertas.set(chaveCaderno(state), abertos);
    }));
    raiz.querySelector('#caderno-editar').onclick = function () {
      if (state.cadernoConsulta) { api.toast('Inicie este plano para salvar seus links pessoais.', 'erro'); return; }
      const aberto = raiz.querySelector('.caderno').classList.toggle('editando');
      edicaoPlano = aberto ? chaveCaderno(state) : null;
      const botao = raiz.querySelector('#caderno-editar'); botao.textContent = aberto ? 'Concluir edição' : 'Editar caderno'; botao.setAttribute('aria-pressed', String(aberto));
    };
    raiz.querySelector('#caderno-imprimir').onclick = () => window.print();
    raiz.querySelectorAll('[data-caderno-ir]').forEach(b => b.onclick = e => { e.preventDefault(); busca.value = ''; filtrar(); const alvo = raiz.querySelector('#caderno-disc-' + b.dataset.cadernoIr); raiz.querySelectorAll('.trilha-grupo').forEach(g => { g.open = g === alvo; }); alvo.hidden = false; alvo.open = true; alvo.scrollIntoView({ behavior: 'smooth', block: 'start' }); });

    raiz.querySelectorAll('[data-trilha-editar],[data-trilha-adicionar]').forEach(b => b.onclick = function () {
      if (state.cadernoConsulta) { api.toast('Inicie este plano para salvar seus links pessoais.', 'erro'); return; }
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
          defaults(state,t).forEach(ref => state.links.push(Object.assign({},ref,{id:'trilha-' + Date.now() + '-' + Math.random().toString(36).slice(2,8),tipo:'trilha',topicoChave:chave})));
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
