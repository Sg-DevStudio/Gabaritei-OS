/* Composição da Hoje: move os controles existentes sem perder suas ações. */
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function aplicar(raiz, state, D, api) {
    if (!state.plano) return;
    const card = (classe, html) => { const e = document.createElement('section'); e.className = 'card ' + classe; e.innerHTML = html; return e; };
    const dia = raiz.querySelector('.proximo-estudo') || card('proximo-estudo', '<h2>Planejamento do dia</h2><p class="sub">Nenhum estudo pendente agora.</p>');
    const fila = raiz.querySelector('.estudar-hoje-card');
    const outra = fila && fila.querySelector('.fila-item:not(.fila-feita)');
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
      conquistas.querySelector('h3').insertBefore(trofeu, conquistas.querySelector('.conquistas-contador'));
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
  }
  window.InicioLayout = {aplicar};
})();
