(() => {
  function openTitle() {
    if (!document.querySelector('.app-frame-container iframe')) return '';
    const field = document.querySelector('input[aria-label="Título do artefato"], input[aria-label="Artifact title"]');
    return field?.value.trim() || '';
  }

  function quizCards() {
    return [...document.querySelectorAll('.artifact-button-content')].flatMap((card, index) => {
      const button = card.querySelector('button.artifact-stretched-button');
      const title = card.querySelector('.title-container')?.textContent.trim();
      const isQuiz = card.querySelector('mat-icon.artifact-icon')?.textContent.trim() === 'quiz';
      return button && isQuiz && title && button.getClientRects().length ? [{index, button, title}] : [];
    });
  }

  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (sender.id !== chrome.runtime.id) return;
    const title = openTitle();
    if (message.type === 'studio:list') {
      const items = title ? [{title, index: -1}] : quizCards().map(({index, title}) => ({index, title}));
      reply({items});
    } else if (message.type === 'studio:open') {
      if (title === message.title && title) return reply({ok: true});
      const chosen = quizCards().find(card => card.index === message.index && card.title === message.title);
      if (!chosen) return reply({ok: false, error: 'O Estúdio mudou. Atualize a lista de quizzes.'});
      chosen.button.click();
      reply({ok: true});
    }
  });
})();
