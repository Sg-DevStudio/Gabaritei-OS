const NOTEBOOK_HOSTS = ['notebook.google.com', 'notebooklm.google.com'];
const SITE_PAGES = 'https://sg-devstudio.github.io';
const SITE_FIREBASE = 'https://app-gestao-estudos.web.app';
const running = new Set();

function notebookUrl(rawUrl) {
  const url = new URL(rawUrl || 'about:blank');
  return url.protocol === 'https:' && NOTEBOOK_HOSTS.includes(url.hostname) && /^\/notebook\/[a-f0-9-]+\/?$/i.test(url.pathname) ? url : null;
}

async function listQuizzes(windowId) {
  const tabs = await chrome.tabs.query({windowId, url: NOTEBOOK_HOSTS.map(host => `https://${host}/notebook/*`)});
  const results = await Promise.all(tabs.filter(tab => notebookUrl(tab.url)).map(async tab => {
    const response = await chrome.tabs.sendMessage(tab.id, {type: 'studio:list'}, {frameId: 0}).catch(() => null);
    const items = response?.items || [];
    if (items[0]?.index === -1) {
      const probe = await chrome.tabs.sendMessage(tab.id, {type: 'quiz:probe'}).catch(() => null);
      if (!probe?.quiz) return [];
    }
    return items.map(item => ({...item, tabId: tab.id, url: tab.url, notebook: tab.title || 'NotebookLM'}));
  }));
  return results.flat();
}

async function importQuiz(windowId, item) {
  if (!item || !Number.isInteger(item.tabId) || typeof item.title !== 'string' || !notebookUrl(item.url)) {
    throw Error('Escolha um quiz no NotebookLM.');
  }
  const tab = await chrome.tabs.get(item.tabId).catch(() => null);
  if (tab?.windowId !== windowId || tab.url !== item.url) throw Error('A aba do NotebookLM mudou. Atualize a lista.');
  if (running.has(tab.id)) throw Error('Já existe uma importação nessa aba.');
  running.add(tab.id);
  try {
    const opened = await chrome.tabs.sendMessage(tab.id, {type: 'studio:open', title: item.title, index: item.index}, {frameId: 0});
    if (!opened?.ok) throw Error(opened?.error || 'Não foi possível abrir o quiz.');
    for (let attempt = 0; attempt < 30; attempt++) {
      const response = await chrome.tabs.sendMessage(tab.id, {type: 'quiz:read'}).catch(() => null);
      if (response?.error) throw Error(response.error);
      if (response?.questions) return {title: item.title, questions: response.questions};
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    throw Error('O quiz ainda não abriu. Atualize a aba do NotebookLM e tente novamente.');
  } finally {
    running.delete(tab.id);
  }
}

chrome.runtime.onMessageExternal.addListener((message, sender, reply) => {
  const url = new URL(sender.url || 'about:blank');
  const allowed = (url.origin === SITE_PAGES && /^\/Gabaritei-OS\/(index\.html)?$/.test(url.pathname)) ||
    (url.origin === SITE_FIREBASE && /^\/(index\.html)?$/.test(url.pathname));
  if (!allowed || sender.frameId !== 0 || !Number.isInteger(sender.tab?.windowId)) return;

  let task;
  if (message?.type === 'notebooklm:list') task = listQuizzes(sender.tab.windowId);
  else if (message?.type === 'notebooklm:import') task = importQuiz(sender.tab.windowId, message.item);
  else return;
  task.then(data => reply({ok: true, data}), error => reply({ok: false, error: error.message}));
  return true;
});
