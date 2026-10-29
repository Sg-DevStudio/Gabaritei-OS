/* Ajuda sob demanda. Move os nós existentes, preservando suas ações. */
(function () {
  'use strict';
  let sequencia = 0;
  const seletores = '.caderno-intro,.carreira-metodologia,.guia-planos,.conquistas-dica,.modo-plan-dica,.paleta-dica,.editor-carreira-intro,.carreira-intro,[data-ajuda]';
  function preparar(origem) {
    if (origem.dataset.ajudaPronta) return;
    if (origem.tagName === 'DETAILS') {
      const div = document.createElement('div');
      while (origem.firstChild) div.append(origem.firstChild);
      origem.replaceWith(div); origem = div;
      const summary = origem.querySelector('summary'); if (summary) summary.remove();
    }
    origem.dataset.ajudaPronta = 'true';
    origem.classList.add('ajuda-compacta');
    const painel = document.createElement('div');
    painel.className = 'ajuda-painel'; painel.id = 'ajuda-painel-' + (++sequencia);
    painel.setAttribute('popover', 'auto'); painel.setAttribute('role', 'dialog'); painel.setAttribute('aria-label', 'Como usar?');
    const corpo = document.createElement('div'); corpo.className = 'ajuda-corpo';
    while (origem.firstChild) corpo.append(origem.firstChild);
    const botao = document.createElement('button');
    botao.type = 'button'; botao.className = 'ajuda-botao'; botao.textContent = 'Como usar?';
    botao.setAttribute('aria-expanded', 'false'); botao.setAttribute('aria-controls', painel.id);
    const fechar = document.createElement('button');
    fechar.type = 'button'; fechar.className = 'ajuda-fechar'; fechar.textContent = 'Fechar';
    painel.append(corpo, fechar); origem.append(botao, painel);
    let fixado = false, timer;
    function aberto() { return painel.matches(':popover-open'); }
    function mostrar() { clearTimeout(timer); if (!aberto() && painel.isConnected) painel.showPopover(); }
    function esconder() { clearTimeout(timer); fixado = false; if (aberto()) painel.hidePopover(); }
    function adiarFecho() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!fixado && !painel.matches(':hover') && !botao.matches(':hover') && !origem.contains(document.activeElement)) esconder();
      }, 220);
    }
    botao.onclick = () => { if (fixado && aberto()) esconder(); else { fixado = true; mostrar(); } };
    botao.onpointerenter = e => { if (e.pointerType === 'mouse') mostrar(); };
    botao.onpointerleave = adiarFecho;
    botao.onblur = adiarFecho;
    painel.onpointerenter = () => clearTimeout(timer);
    painel.onpointerleave = adiarFecho; painel.onfocusout = adiarFecho;
    fechar.onclick = () => { esconder(); botao.focus({ preventScroll: true }); };
    painel.addEventListener('toggle', () => {
      botao.setAttribute('aria-expanded', String(aberto()));
      if (!aberto()) fixado = false;
    });
  }
  function atualizar() {
    document.querySelectorAll(seletores).forEach(preparar);
    document.querySelectorAll('details').forEach(d => {
      const summary = d.querySelector(':scope > summary');
      if (summary && /^como (usar|funciona)/i.test(summary.textContent.trim())) preparar(d);
    });
  }
  // Contadores do timer alteram só texto: não precisam varrer todas as ajudas.
  new MutationObserver(registros => {
    if (registros.some(r => Array.from(r.addedNodes).some(n => n.nodeType === 1 &&
      (n.matches(seletores + ',details') || n.querySelector(seletores + ',details'))))) atualizar();
  }).observe(document.body, { childList: true, subtree: true });
  atualizar();
})();
