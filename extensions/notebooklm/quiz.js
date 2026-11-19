(() => {
  const editor = 'textarea.question-text.edit-textarea';
  const back = 'button.back-btn';
  const next = 'button.next-btn';
  const menu = 'button.mat-mdc-menu-trigger.menu-icon';
  const visible = element => !!element?.getClientRects().length;
  const pause = () => new Promise(resolve => setTimeout(resolve, 50));
  let reading = false;

  function position() {
    const match = /^(?:Pergunta|Question)\s+(\d+)\s+(?:de|of)\s+(\d+)$/i.exec(document.title.trim());
    return match ? {number: Number(match[1]), total: Number(match[2])} : null;
  }

  async function waitFor(read, error) {
    const timeout = Date.now() + 2500;
    do {
      const result = read();
      if (result) return result;
      await pause();
    } while (Date.now() < timeout);
    throw Error(error);
  }

  function named(selector, names) {
    return [...document.querySelectorAll(selector)].find(element => visible(element) && names.includes(element.textContent.trim()));
  }

  async function move(selector, target) {
    const button = document.querySelector(selector);
    if (!visible(button) || button.disabled) throw Error('A navegação do quiz mudou. Abra o quiz e tente novamente.');
    button.click();
    await waitFor(() => position()?.number === target, 'O NotebookLM não abriu a próxima questão.');
  }

  async function readQuestion(anchor) {
    document.querySelector(menu).click();
    const edit = await waitFor(() => named('[role="menuitem"]', ['Editar pergunta', 'Edit question']), 'O NotebookLM não disponibilizou o editor deste quiz.');
    edit.click();
    const question = await waitFor(() => {
      const element = document.querySelector(editor);
      return visible(element) && element.value;
    }, 'O enunciado da questão não ficou disponível.');
    try {
      const answerOptions = [...document.querySelectorAll('.answer-edit-container')].map(row => ({
        text: row.querySelector('textarea.answer-text')?.value,
        rationale: row.querySelector('textarea.rationale')?.value || '',
        isCorrect: row.querySelector('input[name="correctAnswer"]')?.checked === true
      }));
      if (position()?.number !== anchor || answerOptions.length < 2 || answerOptions.length > 8 ||
          answerOptions.some(option => !option.text?.trim()) || answerOptions.filter(option => option.isCorrect).length !== 1) {
        throw Error(`A questão ${anchor} não tem uma única alternativa correta disponível para importar.`);
      }
      return {question, answerOptions};
    } finally {
      const cancel = named('button', ['Cancel', 'Cancelar']);
      if (!cancel) throw Error('Não foi possível fechar o editor da questão.');
      cancel.click();
      await waitFor(() => !document.querySelector(editor), 'Feche o editor do NotebookLM e tente novamente.');
    }
  }

  async function readQuiz(start) {
    if (start.total < 1 || start.total > 100 || start.number < 1 || start.number > start.total) throw Error('Importe um quiz de até 100 questões.');
    if (document.querySelector(editor)) throw Error('Feche a edição em andamento no NotebookLM antes de importar.');
    const questions = [];
    try {
      for (let current = start.number; current > 1; current--) await move(back, current - 1);
      for (let current = 1; current <= start.total; current++) {
        questions.push(await readQuestion(current));
        if (current < start.total) await move(next, current + 1);
      }
      return questions;
    } finally {
      // Restore the reader's original position when the quiz is still open.
      if (!document.querySelector(editor)) {
        const current = position()?.number;
        if (current && current !== start.number) {
          const step = current > start.number ? -1 : 1;
          for (let n = current; n !== start.number; n += step) {
            if (!await move(step < 0 ? back : next, n + step).then(() => true, () => false)) break;
          }
        }
      }
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (sender.id !== chrome.runtime.id || !['quiz:probe', 'quiz:read'].includes(message.type)) return;
    const start = position();
    if (!start || !document.querySelector(menu)) return;
    if (message.type === 'quiz:probe') return reply({quiz: true});
    if (reading) return reply({error: 'A importação desse quiz já está em andamento.'});
    reading = true;
    readQuiz(start).then(questions => reply({questions}), error => reply({error: error.message})).finally(() => {reading = false;});
    return true;
  });
})();
