/* Links pessoais usam a persistência existente de cada plano. */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normal = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  function urlSegura(s) {
    try { const u = new URL(s); return /^https?:$/.test(u.protocol) && !u.username && !u.password ? u.href : ''; } catch (_) { return ''; }
  }
  function provedor(link) {
    try {
      const u = new URL(link.url);
      if (u.protocol !== 'https:') return '';
      if (u.hostname === 'questoes.grancursosonline.com.br') return 'gran';
      if (['www.qconcursos.com','qconcursos.com'].includes(u.hostname)) return 'qconcursos';
      if (['www.tecconcursos.com.br','tecconcursos.com.br'].includes(u.hostname)) return 'tec';
    } catch (_) {}
    return '';
  }
  function rotuloLink(link) {
    try { const u = new URL(link.url); if (u.hostname === 'questoes.grancursosonline.com.br') return u.pathname.replace(/\/$/,'') === '/questoes' ? (link.semResultadosNoRecorte ? 'Consultar no Gran' : 'Resolver no Gran') : 'Ver catálogo no Gran'; } catch (_) {}
    if (provedor(link) === 'tec') return 'Resolver no TEC';
    if (provedor(link) === 'qconcursos') return 'Resolver no Qconcursos';
    return link.nome;
  }
  function dicaLink(link) {
    const p = provedor(link), nome = {gran:'Gran', qconcursos:'Qconcursos', tec:'TEC Concursos'}[p];
    const catalogo = p === 'gran' && new URL(link.url).pathname.replace(/\/$/,'') !== '/questoes';
    const texto = nome && !catalogo ? 'Resolva as questões desse assunto no ' + nome : rotuloLink(link);
    return texto + (link.aviso ? ' — ' + link.aviso : '');
  }
  let impressao = [];
  if (window.addEventListener) window.addEventListener('beforeprint', () => { impressao = Array.from(document.querySelectorAll('.caderno details')); impressao.forEach(d => { d.dataset.abertoAntesImprimir = String(d.open); d.open = true; }); });
  if (window.addEventListener) window.addEventListener('afterprint', () => { impressao.forEach(d => { d.open = d.dataset.abertoAntesImprimir === 'true'; delete d.dataset.abertoAntesImprimir; }); impressao = []; });
  const banca = '982,92';
  let edicaoPlano = null;
  const disciplinasAbertas = new Map();
  const chaveCaderno = s => s.cadernoConsulta ? '' : (s.planoAtivoId || s.plano && s.plano.concurso || '');
  const origemCompativel = (s, id) => !s.plano.origemEditalId || s.plano.origemEditalId === id;
  const ehTrf2 = state => /(?:trf\s*2|carreira\s+trf\b)/i.test(state.plano && state.plano.concurso || '') && /t[eé]cnico/i.test(state.plano.concurso || '') && /administrativ/i.test(state.plano.concurso || '') && (origemCompativel(state,'carreira-trf2-tjaa-2024') || /^carreira\s+trf\b/i.test(state.plano.concurso));
  const ehTJSP = s => /tjsp/.test(normal(s.plano && s.plano.concurso)) && /escrevente/.test(normal(s.plano.concurso)) && /2026/.test(s.plano.concurso) && origemCompativel(s,'edt-mqifhb2v-yh9ym');
  const ehTRT4 = s => /trt4/.test(normal(s.plano && s.plano.concurso)) && /tecnico/.test(normal(s.plano.concurso)) && /administrativ/.test(normal(s.plano.concurso)) && !/policia/.test(normal(s.plano.concurso)) && /2026/.test(s.plano.concurso) && origemCompativel(s,'edt-mqhyvmmq-v1pj6');
  const ehTRT4Analista = s => /trt4/.test(normal(s.plano && s.plano.concurso)) && /analistajudiciarioareajudiciaria(?:edital)?2026$/.test(normal(s.plano.concurso)) && origemCompativel(s,'edital-trt4-analista-judiciaria-2026');
  const bancasCaderno = s => ehTRT4(s) || ehTRT4Analista(s) ? '92' : ehTJSP(s) ? '252,982,102' : '982,92';
  const rotuloBancas = s => ehTRT4(s) || ehTRT4Analista(s) ? 'FCC' : ehTJSP(s) ? 'Vunesp + AOCP + FGV' : 'AOCP + FCC';
  function rotuloFiltroGran(state,t) {
    const ls=t.vinculos && t.vinculos.links || [];
    if(ls.some(l=>l.semResultadosNoRecorte)) return 'Sem questões no recorte selecionado';
    if(ls.some(l=>l.verificadoEm)) {
      if(ls.some(l=>l.coberturaParcial)) return 'Filtro parcial do Gran';
      return ls.some(l=>l.filtroAmplo) ? 'Filtro amplo do Gran' : 'Filtro específico do Gran';
    }
    return ehTJSP(state) ? 'Filtro amplo do Gran' : 'Filtro do Gran';
  }
  function conteudoLink(l) {
    if (/^https:\/\/questoes\.grancursosonline\.com\.br\//.test(l.url || '')) return '<img class="gran-logo" src="assets/ferramentas/logo-gran-questoes.webp" alt="" aria-hidden="true"><span class="gran-texto">' + esc(rotuloLink(l)) + ' ↗</span>';
    try { if (['www.tecconcursos.com.br','tecconcursos.com.br'].includes(new URL(l.url).hostname)) return '<img class="tec-logo" src="assets/ferramentas/logo-tec-concursos.png" alt="" aria-hidden="true">'; } catch (_) {}
    if (provedor(l) === 'qconcursos') return '<img class="qconcursos-logo" src="assets/ferramentas/logo-qconcursos.svg" alt="" aria-hidden="true">';
    return esc(rotuloLink(l)) + ' ↗';
  }
  function classeLink(l) {
    if (/^https:\/\/questoes\.grancursosonline\.com\.br\//.test(l.url || '')) return 'gran-link banco-logo-link';
    try { if (['www.tecconcursos.com.br','tecconcursos.com.br'].includes(new URL(l.url).hostname)) return 'tec-link banco-logo-link'; } catch (_) {}
    if (provedor(l) === 'qconcursos') return 'qconcursos-link banco-logo-link';
    return '';
  }
  function grupos(state) {
    const caderno = ehTRT4Analista(state) ? 'TrilhaVinculosTRT4Analista' : ehTRT4(state) ? 'TrilhaVinculosTRT4' : ehTJSP(state) ? 'TrilhaVinculosTJSP' : ehTrf2(state) ? 'TrilhaVinculosTRF2' : '';
    const vinculos = Object.entries(window[caderno] || {});
    const mapa = state.plano && state.plano.mapaEdital || {};
    return (state.disciplinas || []).filter(d => !d.removidoDoEdital).map(d => ({ nome: d.nome, topicos: (d.topicos || []).filter(t => !t.removidoDoEdital).map(t => {
      const chave = (state.cadernoEstruturaId ? 'base:' + state.cadernoEstruturaId + ':' : 'plano:') + d.id + ':' + t.id;
      const alternativas = [chave];
      const discLocal = (mapa.disciplinas || {})[d.id], topLocal = (mapa.topicos || {})[d.id + ':' + t.id];
      if (discLocal && topLocal) alternativas.push('plano:' + discLocal + ':' + topLocal);
      const ds = (state.cadernoDisciplinasSalvas || []).find(x => x.id === d.id);
      if (ds && (ds.topicos || []).some(x => x.id === t.id && normal(x.nome) === normal(t.nome))) alternativas.push('plano:' + d.id + ':' + t.id);
      const matches = vinculos.filter(([,v]) => normal(v.nome) === normal(t.nome || t.titulo));
      const q = matches.length === 1 && window.CadernoQconcursos && (window.CadernoQconcursos.cadernos[caderno] || {})[matches[0][0]];
      const tec = matches.length === 1 && window.CadernoTEC && (window.CadernoTEC.cadernos[caderno] || {})[matches[0][0]];
      return { chave, alternativas: Array.from(new Set(alternativas)), nome: t.nome || t.titulo || t.id, vinculos: matches.length === 1 ? matches[0][1] : null, qconcursos: q && normal(q.nome) === normal(t.nome || t.titulo) ? q : null, tec: tec && normal(tec.nome) === normal(t.nome || t.titulo) ? tec : null };
    }) }));
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
    const gran = t.vinculos ? t.vinculos.links.map((l,i) => {
      const u = new URL(l.url); u.searchParams.set('banca',bancasCaderno(state));
      return {id:'referencia-' + t.chave + '-' + i,nome:(l.code == null && !l.filtroAmplo ? 'Ver catálogo: ' : 'Resolver: ') + l.nome,url:u.href,semResultadosNoRecorte:!!l.semResultadosNoRecorte,aviso:l.aviso || (l.code == null && !l.filtroAmplo ? 'Catálogo; sem filtro específico' : l.exact ? '' : 'Categoria ampla')};
    }) : [padrao(t,state)].filter(Boolean);
    const categoria = t.qconcursos && window.CadernoQconcursos && window.CadernoQconcursos.categorias[t.qconcursos.categoria];
    if (categoria && urlSegura(categoria.url)) gran.push({id:'qconcursos-' + t.chave,nome:categoria.nome,url:categoria.url,provedorOriginal:'qconcursos',aviso:'Categoria: ' + categoria.nome + '. ' + (t.qconcursos.cobertura === 'assunto' ? '' : 'Recorte relacionado: confira as partes do subtópico contempladas. ') + 'Todas as bancas e anos.'});
    const assuntosTEC = t.tec && window.CadernoTEC && t.tec.assuntos.map(id => window.CadernoTEC.assuntos[id]);
    if (assuntosTEC && assuntosTEC.length && assuntosTEC.every(Boolean)) {
      // Tipos e IDs lidos nos links oficiais. A seleção composta foi conferida
      // no próprio filtro; nenhum ID do Gran/Qconcursos é reaproveitado aqui.
      const url = new URL('https://www.tecconcursos.com.br/questoes/filtrar');
      url.searchParams.set('formato','OBJETIVA');
      t.tec.assuntos.forEach((id,i) => { url.searchParams.set('f['+i+'].tipo','ASSUNTO'); url.searchParams.set('f['+i+'].id',id); });
      const nomes = assuntosTEC.map(a => a.nome).join('; ');
      gran.push({id:'tec-' + t.chave,nome:nomes,url:url.href,provedorOriginal:'tec',aviso:'Assuntos: ' + nomes + '. ' + (t.tec.cobertura === 'assunto' ? '' : 'Recorte relacionado: confira o conteúdo contemplado. ') + 'Questões objetivas, todas as bancas e anos.'});
    }
    return gran;
  }
  function links(state, t) {
    let pessoais = (state.links || []).filter(l => l.tipo === 'trilha' && l.topicoChave === t.chave);
    if (!pessoais.length && t.alternativas) pessoais = (state.links || []).filter(l => l.tipo === 'trilha' && t.alternativas.includes(l.topicoChave));
    // Preserva os links pessoais da antiga seção de referência quando o tópico
    // tem correspondência única, sem duplicar disciplinas fora do edital.
    if (!pessoais.length && ehTrf2(state)) {
      const chaves = [];
      (window.TrilhaReferencia || []).forEach((d, i) => d.topics.forEach((r, j) => { if (normal(r.name) === normal(t.nome)) chaves.push('ref:trf2-2024:' + i + ':' + j); }));
      if (chaves.length === 1) pessoais = (state.links || []).filter(l => l.tipo === 'trilha' && l.topicoChave === chaves[0]);
    }
    const base = defaults(state,t);
    // Novas plataformas chegam também a quem tem links pessoais. A edição
    // ou remoção explícita de um provedor impede a restauração do seu padrão.
    const tocados = new Set(pessoais.map(l => l.provedorOriginal || provedor(l)));
    const novos = base.filter(l => ['qconcursos','tec'].includes(provedor(l)) && !tocados.has(provedor(l)));
    const lista = pessoais.length ? pessoais.map(l => Object.assign({},l,{pessoal:true,semResultadosNoRecorte:false})).concat(novos) : base;
    return lista.filter(l => !l.oculto).sort((a, b) => Number(!!b.principal) - Number(!!a.principal));
  }
  function renderAcessos(t, ls) {
    const html = ls.map(l => '<div class="trilha-link">' + (urlSegura(l.url) ? '<a class="' + classeLink(l) + '" href="' + esc(urlSegura(l.url)) + '" target="_blank" rel="noopener noreferrer" title="' + esc(dicaLink(l)) + '" aria-label="' + esc(dicaLink(l) + ': ' + t.nome) + '">' + conteudoLink(l) + '</a>' : '<span>Link inválido</span>') + '<button class="botao-mini botao-quieto" data-trilha-editar="' + esc(t.chave) + '" data-link="' + esc(l.id) + '">Editar link</button></div>').join('');
    const pendente = t.vinculos && !t.qconcursos && !ls.some(l => provedor(l) === 'qconcursos');
    const pendenteTEC = window.CadernoTEC && t.vinculos && !t.tec && !ls.some(l => provedor(l) === 'tec');
    return html + (pendente ? '<span class="banco-logo-link banco-pendente" role="img" title="Qconcursos: filtro deste subtópico ainda não verificado" aria-label="Qconcursos: filtro deste subtópico ainda não verificado"><img class="qconcursos-logo" src="assets/ferramentas/logo-qconcursos.svg" alt="" aria-hidden="true"></span>' : '') + (pendenteTEC ? '<span class="banco-logo-link banco-pendente" role="img" title="TEC Concursos: filtro deste subtópico ainda não verificado" aria-label="TEC Concursos: filtro deste subtópico ainda não verificado"><img class="tec-logo" src="assets/ferramentas/logo-tec-concursos.png" alt="" aria-hidden="true"></span>' : '');
  }
  function render(state) {
    if (!state.plano) return '<h1>Caderno de questões</h1><div class="card"><p>Escolha um plano para organizar seus cadernos.</p><a href="#planos">Escolher plano</a></div>';
    const gs = grupos(state);
    const disponivel = gs.some(g => g.topicos.some(t => defaults(state,t).length)) || (state.links || []).some(l => l.tipo === 'trilha');
    if (!disponivel) return '<section class="caderno-indisponivel" role="status"><div class="card caderno-aviso"><h1>Caderno de questões indisponível</h1><p class="sub">' + esc(state.plano.concurso) + '</p><p>Ainda não temos um caderno de questões para este plano.</p><p>Entre em contato se desejar solicitar a criação deste caderno.</p><div class="compact-actions"><button type="button" data-caderno-contato>Entrar em contato</button><a class="botao botao-secundario" href="#planos">Voltar aos planos</a></div></div></section>';
    const total = gs.reduce((n,g) => n + g.topicos.length, 0);
    return '<div class="caderno' + (edicaoPlano && edicaoPlano === chaveCaderno(state) ? ' editando' : '') + '"><header class="caderno-capa">' + (state.plano.foto ? '<img class="caderno-logo" src="' + esc(state.plano.foto) + '" alt="Imagem do órgão do plano" onerror="this.hidden=true">' : '') + '<div class="caderno-capa-texto"><h1>Caderno de questões por subtópico</h1><p>' + esc(state.plano.concurso) + '</p><p>' + gs.length + ' disciplinas · ' + total + ' subtópicos' + (ehTrf2(state) ? ' · Gran: anos 2017–2026' : ehTJSP(state) ? ' · referência do plano: edital 2026' : '') + '</p></div></header>' +
      '<div class="caderno-layout"><aside class="caderno-indice"><h2>Disciplinas</h2>' + gs.map((g,i) => '<button type="button" data-caderno-ir="' + i + '">' + esc(g.nome) + '<small>' + g.topicos.length + '</small></button>').join('') + '</aside><div class="caderno-corpo">' +
      '<section class="card caderno-intro"><strong>Como usar</strong><p>Abra as questões de cada subtópico. Em <b>Editar caderno</b>, adicione links do NotebookLM ou de outras plataformas.</p><p>Passe o mouse nas logos para identificar a plataforma e o recorte. No celular, toque na logo para abrir. TEC e Qconcursos abrem por assunto; banca, período e outros critérios podem ser ajustados na plataforma.</p>' +
      (state.cadernoConsulta ? '<p>Para salvar seus links, inicie este plano.</p>' : '') + '</section>' +
      '<div class="card caderno-controles"><input id="trilha-busca" type="search" aria-label="Buscar disciplina ou subtópico" placeholder="Buscar disciplina ou subtópico…">' +
      (ehTrf2(state) || ehTJSP(state) || ehTRT4(state) || ehTRT4Analista(state) ? '<span class="caderno-banca-fixa">Gran: <strong>' + rotuloBancas(state) + '</strong> · TEC e Qconcursos: por assunto</span>' : '') +
      '<button type="button" id="caderno-editar" class="botao-mini botao-secundario" aria-pressed="' + (edicaoPlano === chaveCaderno(state) && !!edicaoPlano) + '">' + (edicaoPlano === chaveCaderno(state) && edicaoPlano ? 'Concluir edição' : 'Editar caderno') + '</button><button type="button" id="caderno-imprimir" class="botao-mini botao-quieto">Imprimir / PDF</button></div>' +
      '<div id="trilha-grupos">' + gs.map((g,i) => '<details class="card trilha-grupo" id="caderno-disc-' + i + '"' + ((disciplinasAbertas.get(chaveCaderno(state)) || new Set()).has(i) ? ' open' : '') + '><summary class="caderno-sec-head"><div><small>' + String(i+1).padStart(2,'0') + ' / ' + gs.length + (g.tipo ? ' · ' + esc(g.tipo) : '') + '</small><h2>' + esc(g.nome) + ' <span class="caderno-contagem">(' + g.topicos.length + ' subtópicos)</span></h2></div></summary><p class="sub">Escolha o subtópico e resolva quantas questões quiser.</p>' + g.topicos.map(t => {
        const ls = links(state,t);
        const pessoal = ls.some(l => l.pessoal);
        return '<article class="trilha-topico" data-busca="' + esc(normal(g.nome+t.nome)) + '"><div class="caderno-tema"><h3>' + esc(t.nome) + '</h3><small title="' + esc((t.vinculos && t.vinculos.links || []).map(l => l.aviso || '').filter(Boolean).join(' ')) + '">' + esc(pessoal ? 'Links adicionados por você' : t.referencia ? (t.referencia.code == null ? 'Sem código específico verificado' : (t.referencia.exact ? 'Categoria identificada no arquivo' : 'Categoria mais ampla') + ' · assunto ' + t.referencia.code) : (defaults(state,t).length ? (t.vinculos && t.vinculos.links.length && t.vinculos.links.every(l => l.code == null && !l.filtroAmplo) ? 'Catálogo do Gran: filtro específico ainda pendente' : rotuloFiltroGran(state,t)) : ls.length ? 'Links adicionados por você' : t.vinculos && t.vinculos.pendencia || 'Sem link de questões cadastrado para este subtópico')) + '</small></div><div class="caderno-acessos">' + renderAcessos(t,ls) + '<button class="botao-mini botao-quieto caderno-adicionar" data-trilha-adicionar="' + esc(t.chave) + '">' + (ls.length ? '+ Adicionar link' : 'Adicionar questões') + '</button></div></article>';
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
      function manterOutrosLinks() {
        if (!atual || atual.pessoal) return;
        links(state,t).filter(l => !l.pessoal && !(atual.id === 'referencia' && l.id === 'referencia')).forEach(l => { if (!state.links.some(x => x.id === l.id)) state.links.push(Object.assign({},l,{tipo:'trilha',topicoChave:chave})); });
      }
      if (atual) {
        const remover = document.createElement('button'); remover.type = 'button'; remover.className = 'botao-quieto'; remover.textContent = 'Remover link';
        m.querySelector('.modal-acoes').prepend(remover);
        remover.onclick = function () {
          const antes = state.links.slice();
          manterOutrosLinks();
          const id = atual.id === 'referencia' ? 'trilha-removido-' + Date.now() : atual.id;
          const i = state.links.findIndex(l => l.id === id);
          const item = { id: id, tipo: 'trilha', topicoChave: chave, provedorOriginal: atual.provedorOriginal || provedor(atual), oculto: true, atualizadoEm: new Date().toISOString() };
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
        manterOutrosLinks();
        // Mantém o link de referência quando o aluno adiciona uma alternativa.
        if (!atual && !state.links.some(l => l.tipo === 'trilha' && l.topicoChave === chave)) {
          defaults(state,t).forEach(ref => state.links.push(Object.assign({},ref,{id:'trilha-' + Date.now() + '-' + Math.random().toString(36).slice(2,8),tipo:'trilha',topicoChave:chave})));
        }
        const id = atual && atual.id !== 'referencia' ? atual.id : 'trilha-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        const item = { id: id, tipo: 'trilha', topicoChave: chave, nome: nome, url: url, provedorOriginal: atual && (atual.provedorOriginal || provedor(atual)) || provedor({url:url}), principal: f.elements.principal.checked, atualizadoEm: new Date().toISOString() };
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
