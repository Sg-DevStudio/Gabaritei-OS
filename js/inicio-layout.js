/* Composição da Hoje: move os controles existentes sem perder suas ações. */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels = {
    achievements: 'Conquistas', study: 'Planejamento do dia', exam: 'Próxima prova', goals: 'Metas semanais',
    performance: 'Desempenho', syllabus: 'Progresso no edital', quote: 'Frase do dia',
    week: 'Sua semana', subjects: 'Disciplinas do plano', reviews: 'Revisões'
  };
  const ids = Object.keys(labels);
  const antigos = { conquistas: ['achievements'], estudos: ['study', 'exam', 'goals'], resumos: ['performance', 'syllabus', 'quote'], apoio: ['week', 'subjects', 'reviews'] };
  function strings(value) { return Array.isArray(value) ? [...new Set(value.filter(v => typeof v === 'string' && v.length < 80))].slice(0, 40) : []; }
  function expandir(value) { return strings(value).flatMap(id => antigos[id] || [id]); }
  function ler(value) {
    value = value || {};
    return { ordem: [...new Set(expandir(value.ordem).filter(id => ids.includes(id)).concat(ids))], ocultos: expandir(value.ocultos).filter(id => ids.includes(id)) };
  }
  function preparar(previous, draft) {
    previous = previous && typeof previous === 'object' ? previous : {};
    const next = ler(draft);
    const futuros = values => strings(values).filter(id => !ids.includes(id) && !antigos[id]);
    return Object.assign({}, previous, {
      versao: 2, ordem: next.ordem.concat(futuros(previous.ordem)), ocultos: next.ocultos.concat(futuros(previous.ocultos)),
      rev: Math.max(0, Number(previous.rev) || 0) + 1, em: new Date().toISOString()
    });
  }
  function editor(root, config, save, cancel) {
    let draft = ler(config.inicioLayoutWeb);
    function draw(focus) {
      root.innerHTML = '<ol class="inicio-layout-lista">' + draft.ordem.map((id, i) =>
        '<li data-layout-row="' + id + '"><label class="inicio-layout-visibilidade"><input type="checkbox" data-layout-show="' + id + '"' + (draft.ocultos.includes(id) ? '' : ' checked') + '><span>' + labels[id] + '<small>' + (draft.ocultos.includes(id) ? 'Oculto' : 'Visível') + '</small></span></label>' +
        '<div class="inicio-layout-setas"><button type="button" class="botao-quieto" data-layout-move="' + id + '" data-step="-1" aria-label="Mover ' + labels[id] + ' para cima"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
        '<button type="button" class="botao-quieto" data-layout-move="' + id + '" data-step="1" aria-label="Mover ' + labels[id] + ' para baixo"' + (i === draft.ordem.length - 1 ? ' disabled' : '') + '>↓</button></div></li>'
      ).join('') + '</ol><p class="inicio-layout-erro" role="status"></p><div class="inicio-layout-acoes"><button type="button" class="botao-quieto" data-layout-reset>Restaurar padrão</button><div><button type="button" class="botao-quieto" data-layout-cancel>Cancelar</button><button type="button" data-layout-save>Salvar layout</button></div></div>';
      root.querySelectorAll('[data-layout-show]').forEach(input => input.onchange = () => {
        draft.ocultos = draft.ocultos.filter(id => id !== input.dataset.layoutShow);
        if (!input.checked) draft.ocultos.push(input.dataset.layoutShow);
        input.nextElementSibling.querySelector('small').textContent = input.checked ? 'Visível' : 'Oculto';
      });
      root.querySelectorAll('[data-layout-move]').forEach(button => button.onclick = () => {
        const i = draft.ordem.indexOf(button.dataset.layoutMove), j = i + Number(button.dataset.step);
        if (j < 0 || j >= draft.ordem.length) return;
        [draft.ordem[i], draft.ordem[j]] = [draft.ordem[j], draft.ordem[i]];
        draw(button.dataset.layoutMove);
      });
      root.querySelector('[data-layout-reset]').onclick = () => { draft = ler(); draw(); root.querySelector('[role="status"]').textContent = 'Prévia restaurada. Salve para aplicar.'; root.querySelector('[data-layout-save]').focus(); };
      root.querySelector('[data-layout-cancel]').onclick = cancel;
      root.querySelector('[data-layout-save]').onclick = () => { const error = save(draft); if (error) root.querySelector('[role="status"]').textContent = error; };
      if (focus) root.querySelector('[data-layout-show="' + focus + '"]').focus();
    }
    draw();
  }
  function compor(raiz, config, nodes, wrappers) {
    const pref = ler(config.inicioLayoutWeb);
    const visiveis = pref.ordem.filter(id => !pref.ocultos.includes(id) && nodes[id]);
    const corpo = document.createElement('div'); corpo.className = 'inicio-layout-corpo';
    const primeira = nodes.achievements || wrappers[0]; primeira.before(corpo);
    Object.values(nodes).filter(Boolean).forEach(node => { node.remove(); node.hidden = false; });
    wrappers.forEach(e => e.remove());
    const grupo = (cls, items) => { const e = document.createElement('div'); e.className = cls; e.style.setProperty('--inicio-colunas', Math.min(items.length, 3)); items.forEach(id => e.append(nodes[id])); corpo.append(e); return e; };
    const compactos = ['performance', 'syllabus', 'quote'];
    for (let i = 0; i < visiveis.length;) {
      const id = visiveis[i++];
      if (id === 'study') {
        const extras = [];
        while (['exam', 'goals'].includes(visiveis[i])) extras.push(visiveis[i++]);
        const panel = grupo('hoje-painel' + (extras.length ? '' : ' inicio-layout-sem-lateral'), ['study']);
        if (extras.length) { const aside = document.createElement('aside'); aside.className = 'hoje-painel-lateral'; extras.forEach(key => aside.append(nodes[key])); panel.append(aside); }
      } else if (compactos.includes(id)) {
        const items = [id]; while (compactos.includes(visiveis[i]) && items.length < 3) items.push(visiveis[i++]);
        if (items.length === 1 && id === 'quote') corpo.append(nodes.quote);
        else grupo('hoje-resumos inicio-layout-resumos', items);
      } else if (['week', 'subjects', 'reviews'].includes(id)) {
        const items = [id]; while (['week', 'subjects', 'reviews'].includes(visiveis[i]) && items.length < 2) items.push(visiveis[i++]);
        grupo('hoje-secundarios inicio-layout-secundarios', items);
      } else if (['exam', 'goals'].includes(id)) {
        const items = [id]; while (['exam', 'goals'].includes(visiveis[i])) items.push(visiveis[i++]);
        grupo('inicio-layout-apoio', items);
      } else corpo.append(nodes[id]);
    }
    if (!visiveis.length) corpo.innerHTML = '<div class="card inicio-layout-vazio"><h2>Sua tela, do seu jeito</h2><p>Todos os cards estão ocultos. Use a personalização para escolher o que ver.</p><a href="#planejamento">Abrir planejamento</a></div>';
    const tools = document.createElement('div'); tools.className = 'inicio-layout-ferramentas';
    tools.innerHTML = '<button type="button" class="botao-quieto" data-settings-home>Personalizar tela inicial</button>';
    corpo.append(tools);
  }
  function aplicar(raiz, state, D, api) {
    if (!state.plano) return;
    const card = (classe, html) => { const e = document.createElement('section'); e.className = 'card ' + classe; e.innerHTML = html; return e; };
    const dia = raiz.querySelector('.proximo-estudo') || card('proximo-estudo', '<h2>Planejamento do dia</h2><p class="sub">Nenhum estudo pendente agora.</p>');
    const fila = raiz.querySelector('.estudar-hoje-card');
    const pendentes = fila ? Array.from(fila.querySelectorAll('.fila-item:not(.fila-feita)')) : [];
    const atual = dia.querySelector('.fila-item');
    const outra = pendentes.find(e => atual && e.dataset.filaDisc !== atual.dataset.filaDisc) || pendentes[0];
    const rodape = document.createElement('div'); rodape.className = 'hoje-ainda';
    rodape.innerHTML = '<div class="hoje-ainda-cab"><span>Ainda hoje</span><a href="#planejamento">Ver planejamento completo →</a></div>';
    if (outra) {
      const tag = outra.querySelector('.tag-disc');
      const disc = tag && state.disciplinas.find(d => d.id === tag.textContent.trim());
      if (disc) { const nome = document.createElement('strong'); nome.className='disciplina-destaque'; nome.textContent=disc.nome; outra.querySelector('.fila-info').prepend(nome); }
      rodape.append(outra);
    }
    else rodape.insertAdjacentHTML('beforeend', '<p class="sub">Nenhum outro estudo pendente para hoje.</p>');
    dia.append(rodape);
    if (fila) fila.remove();
    dia.querySelectorAll('.fila-item').forEach(item => {
      const b=item.querySelector('[data-acao="timer-agenda"],[data-acao="ciclo-timer"]');
      const a=b && b.dataset.acao==='timer-agenda' && (state.agenda||[]).find(a=>a.id===b.dataset.id);
      const min=a ? Number(a.duracaoMin) : b ? Number(b.dataset.dur) : 0;
      if(min>0) { const tempo=document.createElement('span'); tempo.className='hoje-tempo'; tempo.textContent=D.formatarMin(min); item.querySelector('.fila-acoes').prepend(tempo); }
    });
    const titulo = dia.querySelector('h2');
    if (titulo) titulo.innerHTML = 'Planejamento do dia <span>' + esc(D.formatarDataBR(D.hojeISO())) + '</span>';
    const painel = document.createElement('div'); painel.className = 'hoje-painel';
    const lateral = document.createElement('aside'); lateral.className = 'hoje-painel-lateral';
    painel.append(dia, lateral);
    const meta = D.metaSemanal(state, D.hojeISO());
    const metas = card('hoje-metas', '<div class="hoje-card-cab"><h2>Metas semanais</h2><button type="button" class="botao-quieto hoje-engrenagem" aria-label="Editar metas semanais"><svg aria-hidden="true"><use href="#ic-engrenagem"/></svg></button></div>');
    const antigos = raiz.querySelector('.home-kpis');
    if (antigos) {
      Array.from(antigos.children).slice(0,2).forEach(e => { e.classList.remove('card'); e.classList.add('hoje-meta-item'); metas.append(e); });
      antigos.remove();
    }
    metas.querySelectorAll('[data-editar-meta]').forEach(b => { const e = document.createElement('span'); e.className='hoje-meta-alvo'; e.textContent=' / ' + meta.questoesAlvo; b.replaceWith(e); });
    metas.querySelectorAll('.hoje-meta-item').forEach((e,i) => {
      const p=i===0 ? (meta.horasAlvo>0?Math.round(meta.minutos/60/meta.horasAlvo*100):0) : (meta.questoesAlvo>0?Math.round(meta.qFeitas/meta.questoesAlvo*100):0);
      const valor=document.createElement('span'); valor.className='hoje-meta-percent'; valor.textContent=p+'%'; e.querySelector('.card-kpi-rotulo').append(valor);
    });
    metas.querySelector('.hoje-engrenagem').onclick = api.metas;
    const janela = state.plano.radar && state.plano.radar.janela_prova;
    const alvo = janela && janela[0];
    const mensal = alvo && /^\d{4}-\d{2}$/.test(alvo);
    const iso = alvo && (mensal ? alvo + '-01' : alvo);
    const dias = iso ? D.diffDias(D.hojeISO(), iso) : null;
    const android = /Android/i.test(navigator.userAgent) || (window.GabariteiAndroid && window.GabariteiAndroid.ativo());
    if (!android) {
      const prova = card('hoje-prova', '<div><h2>' + esc(alvo ? state.plano.concurso.replace(/\s*\((?:base|edital)\s+\d{4}\)/gi,'') : 'Qual é o seu próximo desafio?') + '</h2><p class="sub">' + esc(alvo ? (mensal ? D.formatarMesBR(alvo) + ' · previsão' : D.formatarDataBR(alvo)) : 'Defina a data ou a previsão da sua prova.') + '</p></div><div class="hoje-prova-dias">' + (dias === null ? '' : '<strong>' + Math.max(0,dias) + '</strong><small>' + (dias < 0 ? 'data ultrapassada' : mensal ? 'dias até a previsão' : 'dias para a prova') + '</small>') + '<button type="button" class="botao-quieto" aria-label="Editar data da prova">' + (alvo ? 'Editar' : 'Adicionar prova') + '</button></div>');
      prova.querySelector('button').onclick = api.prova;
      lateral.append(prova);
    }
    lateral.append(metas);
    const resumo = document.createElement('div'); resumo.className = 'hoje-resumos';
    const totais = D.totaisEstudo(state), prog = D.progressoEdital(state);
    const pct = totais.qFeitas ? Math.round(totais.qCertas/totais.qFeitas*100) : null;
    resumo.append(card('hoje-resumo', '<h2>Desempenho</h2><strong class="hoje-numero">' + (pct === null ? '—' : pct + '%') + '</strong><span> ' + totais.qFeitas + ' questões</span><p class="sub">Nesta semana: ' + (meta.pctAcertos === null ? 'sem questões registradas' : meta.pctAcertos + '% de acerto') + '</p><a href="#stats">Ver desempenho →</a>'));
    resumo.append(card('hoje-resumo', '<h2>Progresso no edital</h2><strong class="hoje-numero">' + prog.pct + '%</strong><span> ' + prog.concluidos + ' de ' + prog.total + ' tópicos</span><div class="barra"><span style="width:' + prog.pct + '%"></span></div><a href="#edital">Ver edital →</a>'));
    const frase = raiz.querySelector('.frase-dia');
    const fraseCard = card('hoje-resumo hoje-frase', '<span aria-hidden="true" class="hoje-aspas">“</span>');
    if (frase) fraseCard.append(frase);
    resumo.append(fraseCard);
    const semana = raiz.querySelector('.inicio-semana');
    const secundarios = document.createElement('div'); secundarios.className = 'hoje-secundarios';
    if (semana) secundarios.append(semana);
    ['.painel-disciplinas-card','.revisoes-hoje-card','.inicio-revisoes'].forEach(sel => { const e = raiz.querySelector(sel); if(e) secundarios.append(e); });
    const conquistas = raiz.querySelector('.conquistas-card');
    if (conquistas) {
      conquistas.classList.remove('conquistas-compactas');
      conquistas.classList.add('hoje-conquistas-topo');
      const expandir=conquistas.querySelector('.conquistas-expandir'); if(expandir) expandir.remove();
      const dica = conquistas.querySelector('.conquistas-dica'); if(dica) dica.remove();
      const trofeu=document.createElement('span'); trofeu.className='conquistas-trofeu'; trofeu.textContent='🏆'; trofeu.setAttribute('aria-hidden','true');
      conquistas.querySelector('h3').prepend(trofeu);
      conquistas.querySelectorAll('.medalha').forEach((b,i) => {
        const status=document.createElement('small'); status.textContent=b.classList.contains('ganha')?'Concluído':'Em progresso'; b.append(status);
      });
    }
    secundarios.querySelectorAll('.revisoes-hoje-card .fila-item').forEach((e,i)=>{if(i>1)e.remove();});
    const antigo = raiz.querySelector('.inicio-grade'), cab = raiz.querySelector('.home-cab');
    const fragmento=document.createDocumentFragment();
    if(conquistas) fragmento.append(conquistas);
    fragmento.append(painel,resumo,secundarios);
    if (antigo) antigo.before(fragmento); else raiz.prepend(fragmento);
    raiz.classList.add('hoje-integrada');
    const disciplinas = secundarios.querySelector('.painel-disciplinas-card');
    if(disciplinas) {
      const tabela=disciplinas.querySelector('.painel-scroll'); if(tabela) tabela.remove();
      const lista=disciplinas.querySelector('.painel-disciplinas-mobile');
      if(lista) lista.querySelectorAll('[data-disc-detalhe]').forEach(b=>{
        const d=state.disciplinas.find(d=>d.id===b.dataset.discDetalhe); if(!d) return;
        const p=D.progressoDisciplina(d);
        b.innerHTML='<span class="hoje-disc-nome">'+esc(d.nome)+'</span><span class="barra"><span style="width:'+p.pct+'%"></span></span><small>'+p.pct+'%</small>';
      });
    }
    if (antigo) antigo.remove();
    if(cab) cab.remove();
    raiz.classList.add('hoje-refinada');
    compor(raiz, state.config, {
      achievements: conquistas, study: dia, exam: lateral.querySelector('.hoje-prova'), goals: metas,
      performance: resumo.children[0], syllabus: resumo.children[1], quote: fraseCard,
      week: semana, subjects: disciplinas, reviews: secundarios.querySelector('.revisoes-hoje-card, .inicio-revisoes')
    }, [painel, resumo, secundarios]);

  }
  window.InicioLayout = {aplicar, ler, preparar, editor, labels};
})();
