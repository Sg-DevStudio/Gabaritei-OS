/* ============================================================
   firebase-sync.js - sincronizacao real via Firebase.
   Mantem o app estatico no GitHub Pages usando o SDK modular via CDN.
   ============================================================ */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  deleteField,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import {
  getFunctions,
  httpsCallable
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js';
import {
  getMessaging,
  getToken,
  deleteToken,
  isSupported as isMessagingSupported
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBAxmw7gFkMk0aPwIGHQblo5nLFz8fKKnU',
  authDomain: 'app-gestao-estudos.firebaseapp.com',
  projectId: 'app-gestao-estudos',
  storageBucket: 'app-gestao-estudos.firebasestorage.app',
  messagingSenderId: '450464644014',
  appId: '1:450464644014:web:150b9f8683842de10c663f',
  measurementId: 'G-91KNPS0E1R'
};

const CHAVE_DISPOSITIVO = 'estudos.firebase.dispositivo';
const FOLGA_RELOGIO_MS = 1000;
const LIMITE_DOCUMENTO_REMOTO_BYTES = 850 * 1024;
const FUSO_APP = 'America/Sao_Paulo';

// Chave VAPID do Web Push (Firebase Console → Cloud Messaging → "Web Push
// certificates"). Enquanto estiver vazia, os lembretes push ficam DESLIGADOS
// e o app funciona normalmente — basta colar a chave aqui para ativar.
const VAPID_KEY = '';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Região fixa, igual à definida na Cloud Function (setGlobalOptions).
const functions = getFunctions(app, 'us-central1');
const provider = new GoogleAuthProvider();
const refCatalogo = doc(db, 'public', 'catalogo');
const pedidosCollection = collection(db, 'pedidosEdital');

let opcoes = null;
let usuario = null;
let refEstado = null;
let cancelarSnapshot = null;
let envioPendente = null;
let enviando = false;
let estadoPendenteGravacao = null;
let promessaGravacao = null;
let snapshotPendenteDuranteEnvio = false;
let reconciliando = false;
let reconciliarDepois = false;
let tokenPushAtual = null;
let tokenPushUid = null;
let numeroChunksAtuais = 0;
let ultimoErroGravacao = null;
// true depois que esta sessão conseguiu LER a nuvem ao menos uma vez. Antes
// disso, nenhum envio direto (agendarEnvio/flush) pode subir: um aparelho com
// cópia local antiga que gravasse antes de reconciliar sobrescreveria (sem
// mescla) o plano atual dos outros aparelhos.
let reconciliadoOk = false;
let aplicandoRemoto = false;
let retryReconciliacao = null;
let tentativasReconciliacao = 0;
let statusAtual = {
  // 'autenticando' = ainda nao sabemos se ha sessao salva; evita piscar a tela de login
  estado: 'autenticando',
  texto: 'Verificando sua sessão…',
  fonte: 'Firebase',
  usuario: null
};

function idDispositivo() {
  let id = localStorage.getItem(CHAVE_DISPOSITIVO);
  if (!id) {
    id = 'fb-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(CHAVE_DISPOSITIVO, id);
  }
  return id;
}

function dataMs(valor) {
  const n = Date.parse(valor || '');
  return Number.isFinite(n) ? n : 0;
}

function atualizadoEm(state) {
  return state && state.config ? state.config.atualizadoEm : null;
}

function revDe(state) {
  return (state && state.config && parseInt(state.config.rev, 10)) || 0;
}

// Decide quem é a base da mescla: rev (contador de edições, monotônico e imune
// a relógio errado) manda; timestamps só desempatam revs iguais (estados antigos
// sem rev caem nos timestamps, como antes). Empate total → remoto ganha.
function remotoEhMaisNovo(remotoState, localState, remotoMs, localMs) {
  const rR = revDe(remotoState), rL = revDe(localState);
  if (rR !== rL) return rR > rL;
  return remotoMs >= localMs;
}

function temDados(state) {
  return window.Store && window.Store.temDados(state);
}

function temLapides(state) {
  const config = state && state.config;
  if (!config) return false;
  return !!config.apagadoEm ||
    (Array.isArray(config.removidos) && config.removidos.length > 0) ||
    (config.planosExcluidos && Object.keys(config.planosExcluidos).length > 0);
}

function definirStatus(estado, texto, extra) {
  statusAtual = Object.assign({
    estado,
    texto,
    fonte: usuario ? 'Firebase Firestore' : 'Firebase',
    usuario: usuario ? { email: usuario.email, nome: usuario.displayName, uid: usuario.uid } : null,
    ultima: new Date().toISOString()
  }, extra || {});
  if (opcoes && opcoes.aoStatus) opcoes.aoStatus(statusAtual);
}

function codecRemoto() {
  if (!window.RemoteStateCodec) throw new Error('Codec de sincronização não carregado.');
  return window.RemoteStateCodec;
}

function refParteEstado(prefixo, indice) {
  return doc(db, 'users', usuario.uid, 'state', codecRemoto().idParte(prefixo, indice));
}

async function lerEstadoDoDocumento(dados, prefixo, lerDocumento) {
  if (!dados) return null;
  if (dados.formato === codecRemoto().FORMATO) {
    const quantidade = parseInt(dados.chunks, 10);
    if (!Number.isFinite(quantidade) || quantidade < 1 || quantidade > codecRemoto().MAX_PARTES) {
      throw new Error('Metadados do estado remoto são inválidos.');
    }
    const ler = typeof lerDocumento === 'function' ? lerDocumento : getDoc;
    const snaps = await Promise.all(Array.from({ length: quantidade }, function (_, indice) {
      return ler(refParteEstado(prefixo, indice));
    }));
    const partes = snaps.map(function (snap, indice) {
      const parte = snap.exists() ? (snap.data() || {}) : {};
      if (typeof parte.payload !== 'string' ||
          parseInt(parte.index, 10) !== indice ||
          parseInt(parte.rev, 10) !== parseInt(dados.rev, 10)) {
        throw new Error('Uma parte do estado remoto está ausente ou corrompida.');
      }
      return parte.payload;
    });
    return codecRemoto().decodificar(partes);
  }
  return dados.state || null; // formato legado (documento único)
}

async function normalizarRemoto(dados, prefixo, lerDocumento) {
  const estado = await lerEstadoDoDocumento(dados, prefixo || 'current', lerDocumento);
  if (!estado) return null;
  return {
    state: window.Store.normalizar(estado),
    updatedAt: dados.updatedAt || atualizadoEm(estado),
    clientId: dados.clientId || null
  };
}

function aplicarRemoto(remoteState, silencioso) {
  aplicandoRemoto = true;
  try {
    if (opcoes && opcoes.aplicarEstado) opcoes.aplicarEstado(remoteState, silencioso);
  } finally {
    aplicandoRemoto = false;
  }
}

function tamanhoUtf8(valor) {
  const texto = JSON.stringify(valor);
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(texto).length;
  return unescape(encodeURIComponent(texto)).length;
}

function validarTamanhoRemoto(valor, rotulo) {
  const bytes = tamanhoUtf8(valor);
  if (bytes > LIMITE_DOCUMENTO_REMOTO_BYTES) {
    throw new Error((rotulo || 'Dados') + ' ocupam ' + Math.ceil(bytes / 1024) +
      ' KB e ultrapassam o limite seguro de sincronização. Remova imagens grandes ou exporte um backup.');
  }
  return bytes;
}

function prepararEstadoRemoto(state) {
  const limpo = window.Store.paraPersistencia
    ? window.Store.paraPersistencia(state)
    : JSON.parse(JSON.stringify(window.Store.normalizar(state)));
  delete limpo.plano;
  delete limpo.disciplinas;
  delete limpo.cronogramas;
  delete limpo.links;
  return limpo;
}

function resumoEstado(state) {
  return {
    registros: window.Store.contarRegistros(state),
    planos: Array.isArray(state && state.planos) ? state.planos.length : 0
  };
}

// Resolve o estado que uma gravação pode publicar sem apagar o trabalho de outro
// aparelho. Esta decisão roda DENTRO da transação, depois de reler a versão mais
// recente do Firestore; portanto dois envios simultâneos são serializados e o
// segundo sempre incorpora o primeiro antes de confirmar.
function estadoCanonicoParaGravacao(localState, remoto) {
  const local = window.Store.normalizar(JSON.parse(JSON.stringify(localState)));
  if (!remoto || !remoto.state) return local;

  const remotoState = remoto.state;
  const localMs = dataMs(atualizadoEm(local));
  const remotoMs = dataMs(atualizadoEm(remotoState) || remoto.updatedAt);
  const apagadoLocalMs = dataMs(local.config && local.config.apagadoEm);
  const apagadoRemotoMs = dataMs(remotoState.config && remotoState.config.apagadoEm);

  // Exclusão total explícita vence uma cópia anterior, mas nunca um trabalho
  // comprovadamente posterior feito em outro aparelho.
  if (apagadoLocalMs && apagadoLocalMs > remotoMs + FOLGA_RELOGIO_MS &&
      apagadoLocalMs >= apagadoRemotoMs) {
    return local;
  }
  if (apagadoRemotoMs && apagadoRemotoMs > localMs + FOLGA_RELOGIO_MS &&
      apagadoRemotoMs > apagadoLocalMs) {
    return remotoState;
  }

  const localTemDados = temDados(local);
  const remotoTemDados = temDados(remotoState);
  if (!localTemDados && remotoTemDados && !temLapides(local)) return remotoState;
  if (localTemDados && !remotoTemDados && !temLapides(remotoState)) return local;

  const remotoGanha = remotoEhMaisNovo(remotoState, local, remotoMs, localMs);
  return window.Store.mesclarEstados(
    remotoGanha ? remotoState : local,
    remotoGanha ? local : remotoState
  );
}

function gravarPartesNoLote(lote, prefixo, estadoLimpo, apagarAte) {
  const codificado = codecRemoto().codificar(estadoLimpo);
  codificado.partes.forEach(function (payload, indice) {
    lote.set(refParteEstado(prefixo, indice), {
      payload,
      index: indice,
      rev: revDe(estadoLimpo),
      savedAt: serverTimestamp()
    });
  });
  const limiteLimpeza = Math.min(
    codecRemoto().MAX_PARTES,
    Math.max(codificado.partes.length, parseInt(apagarAte, 10) || 0)
  );
  for (let indice = codificado.partes.length; indice < limiteLimpeza; indice++) {
    lote.delete(refParteEstado(prefixo, indice));
  }
  return codificado;
}

async function gravarEstadoTransacional(stateLimpo) {
  return runTransaction(db, async function (transacao) {
    const snap = await transacao.get(refEstado);
    const dadosRemotos = snap.exists() ? (snap.data() || {}) : null;
    const chunksAnteriores = dadosRemotos && dadosRemotos.formato === codecRemoto().FORMATO
      ? (parseInt(dadosRemotos.chunks, 10) || 0)
      : 0;
    const remoto = dadosRemotos
      ? await normalizarRemoto(dadosRemotos, 'current', function (referencia) {
        return transacao.get(referencia);
      })
      : null;

    const canonico = estadoCanonicoParaGravacao(stateLimpo, remoto);
    if (!canonico.config) canonico.config = {};
    canonico.config.rev = Math.max(revDe(stateLimpo), revDe(remoto && remoto.state)) + 1;
    canonico.config.atualizadoEm = new Date().toISOString();
    const canonicoLimpo = prepararEstadoRemoto(canonico);
    const codificado = gravarPartesNoLote(
      transacao,
      'current',
      canonicoLimpo,
      chunksAnteriores
    );
    transacao.set(refEstado, {
      formato: codificado.formato,
      chunks: codificado.partes.length,
      updatedAt: atualizadoEm(canonicoLimpo),
      clientId: idDispositivo(),
      rev: revDe(canonicoLimpo),
      resumo: resumoEstado(canonicoLimpo),
      savedAt: serverTimestamp()
    });
    return {
      state: canonicoLimpo,
      chunks: codificado.partes.length
    };
  }, { maxAttempts: 5 });
}

function gravarRemoto(state) {
  if (!refEstado || !usuario || aplicandoRemoto) return Promise.resolve();
  // Salvaguarda contra perda de dados multi-dispositivo: um estado local SEM
  // dados (recém-carregado/cache limpo tem atualizadoEm = agora, logo "mais
  // novo" que a nuvem) NÃO pode sobrescrever uma nuvem que tem dados. A única
  // exceção é uma exclusão explícita do usuário, marcada por config.apagadoEm
  // — aí o vazio deve mesmo propagar. Sem isso, um aparelho zerado apagava o
  // plano de todos os outros.
  if (!temDados(state) && !temLapides(state)) return Promise.resolve();
  // Coalesce gravações concorrentes: enquanto uma está em voo, guardamos somente
  // o estado mais recente para o próximo ciclo. Isso impede uma requisição antiga,
  // mais lenta, de terminar por último e regredir o documento inteiro.
  estadoPendenteGravacao = state;
  if (promessaGravacao) return promessaGravacao;
  promessaGravacao = (async function () {
    enviando = true;
    ultimoErroGravacao = null;
    definirStatus('enviando', 'Enviando para a nuvem');
    try {
      while (estadoPendenteGravacao) {
        const proximo = estadoPendenteGravacao;
        estadoPendenteGravacao = null;
        const stateLimpo = prepararEstadoRemoto(proximo);
        const resultado = await gravarEstadoTransacional(stateLimpo);
        numeroChunksAtuais = resultado.chunks;

        // A transação pode ter encontrado registros enviados por outro aparelho.
        // Trazemos o estado canônico de volta para este dispositivo. Se o usuário
        // editou algo enquanto a transação estava em voo, essa edição fica como
        // base da mescla e entra imediatamente no próximo ciclo de gravação.
        const atual = opcoes && opcoes.obterEstado ? opcoes.obterEstado() : stateLimpo;
        const mudouDuranteEnvio = !window.Store.estadosEquivalentes(atual, stateLimpo);
        const canonicoLocal = mudouDuranteEnvio
          ? window.Store.mesclarEstados(atual, resultado.state)
          : resultado.state;
        if (!window.Store.estadosEquivalentes(canonicoLocal, atual)) {
          aplicarRemoto(canonicoLocal, true);
        }
        if (!window.Store.estadosEquivalentes(canonicoLocal, resultado.state)) {
          estadoPendenteGravacao = canonicoLocal;
        }
        talvezSnapshotDiario(resultado.state); // fire-and-forget: nunca atrasa nem quebra o save
      }
      definirStatus('sincronizado', 'Sincronizado com Firebase');
    } catch (e) {
      estadoPendenteGravacao = null;
      ultimoErroGravacao = e;
      console.error('Falha ao salvar no Firebase.', e);
      definirStatus('erro', e && e.message ? e.message : 'Falha ao salvar no Firebase');
    } finally {
      enviando = false;
      promessaGravacao = null;
      if (snapshotPendenteDuranteEnvio) {
        snapshotPendenteDuranteEnvio = false;
        setTimeout(function () { reconciliarComRemoto(true); }, 0);
      }
    }
  })();
  return promessaGravacao;
}

async function reconciliarComRemoto(silencioso) {
  if (!refEstado || !opcoes) return;
  if (reconciliando) {
    reconciliarDepois = true;
    return;
  }
  reconciliando = true;
  if (retryReconciliacao) { clearTimeout(retryReconciliacao); retryReconciliacao = null; }
  definirStatus('sincronizando', 'Sincronizando com Firebase');
  let reconciliou = true;
  try {
    const local = opcoes.obterEstado();
    const snap = await getDoc(refEstado);
    if (!snap.exists()) {
      reconciliadoOk = true; // confirmou que não há cópia remota
      numeroChunksAtuais = 0;
      if (temDados(local) || (local.config && local.config.apagadoEm)) await gravarRemoto(local);
      else definirStatus('sincronizado', 'Conectado ao Firebase');
      return;
    }

    const dadosRemotos = snap.data() || {};
    numeroChunksAtuais = dadosRemotos.formato === codecRemoto().FORMATO
      ? (parseInt(dadosRemotos.chunks, 10) || 0)
      : 0;
    const remoto = await normalizarRemoto(dadosRemotos, 'current');
    // Só libera envios depois de ler também todas as partes. Metadados sem um
    // chunk íntegro não contam como reconciliação concluída.
    reconciliadoOk = true;
    if (!remoto) {
      await gravarRemoto(local);
      return;
    }

    const localMs = dataMs(atualizadoEm(local));
    const remotoMs = dataMs(atualizadoEm(remoto.state) || remoto.updatedAt);
    const localTemDados = temDados(local);
    const remotoTemDados = temDados(remoto.state);
    // Exclusão local recente (plano/dados apagados): não deixa a nuvem
    // ressuscitar os dados — neste caso o estado local (vazio) é que vale.
    const apagouLocal = local.config && local.config.apagadoEm &&
      dataMs(local.config.apagadoEm) > remotoMs + FOLGA_RELOGIO_MS;

    if (!localTemDados && remotoTemDados && temLapides(local)) {
      // Mesmo vazio, o estado local pode carregar exclusões explícitas. Mesclar
      // aplica as lápides antes de adotar a nuvem e evita ressuscitar registros.
      const merged = window.Store.mesclarEstados(remoto.state, local);
      aplicarRemoto(merged, silencioso);
      await gravarRemoto(merged);
      definirStatus('sincronizado', 'Sincronizado com Firebase');
    } else if (!localTemDados && remotoTemDados && !apagouLocal) {
      aplicarRemoto(remoto.state, silencioso);
      definirStatus('sincronizado', 'Sincronizado com Firebase');
    } else if (apagouLocal) {
      await gravarRemoto(local);
    } else if (localTemDados && remotoTemDados) {
      // Ambos têm dados: mescla por id para não perder registros de estudo que só
      // existem em um dos lados (correção do last-write-wins). O mais recente é a
      // base (vence config e empates; a estrutura de cada plano tem carimbo
      // próprio na mescla). "Mais recente" = rev maior (contador monotônico,
      // imune a relógio de aparelho errado); timestamps só desempatam.
      const remotoGanha = remotoEhMaisNovo(remoto.state, local, remotoMs, localMs);
      const base = remotoGanha ? remoto.state : local;
      const outro = remotoGanha ? local : remoto.state;
      const merged = window.Store.mesclarEstados(base, outro);
      const mudouLocal = !window.Store.estadosEquivalentes(merged, local);
      const mudouRemoto = !window.Store.estadosEquivalentes(merged, remoto.state);
      if (remotoGanha || mudouLocal) aplicarRemoto(merged, silencioso);
      if (mudouRemoto) await gravarRemoto(merged);
      definirStatus('sincronizado', 'Sincronizado com Firebase');
    } else if (localMs > remotoMs + FOLGA_RELOGIO_MS) {
      await gravarRemoto(local);
    } else if (remotoMs > localMs + FOLGA_RELOGIO_MS) {
      aplicarRemoto(remoto.state, silencioso);
      definirStatus('sincronizado', 'Sincronizado com Firebase');
    } else {
      definirStatus('sincronizado', 'Sincronizado com Firebase');
    }
  } catch (e) {
    reconciliou = false;
    console.error('Falha ao sincronizar com Firebase.', e);
    definirStatus('erro', 'Verifique Auth, Firestore e regras');
  } finally {
    reconciliando = false;
    if (reconciliou) {
      tentativasReconciliacao = 0;
    } else {
      // Sem retry, uma falha aqui (rede instável, leitura das partes cruzando com
      // a gravação de outro aparelho) deixava a sessão presa nos dados locais até
      // o próximo foco/snapshot — era o "PC mostra dados diferentes do celular".
      // Backoff exponencial 5s → 10s → 20s → ... (teto de 5 min), zerado no sucesso.
      tentativasReconciliacao++;
      const atraso = Math.min(300000, 5000 * Math.pow(2, tentativasReconciliacao - 1));
      clearTimeout(retryReconciliacao);
      retryReconciliacao = setTimeout(function () {
        retryReconciliacao = null;
        if (refEstado) reconciliarComRemoto(true).then(observarMudancas);
      }, atraso);
    }
    if (reconciliarDepois) {
      reconciliarDepois = false;
      setTimeout(function () { reconciliarComRemoto(true); }, 0);
    }
  }
}

function observarMudancas() {
  if (cancelarSnapshot) cancelarSnapshot();
  cancelarSnapshot = onSnapshot(refEstado, function (snap) {
    if (!snap.exists() || !opcoes) return;
    const dados = snap.data() || {};
    if (enviando) {
      if (dados.clientId !== idDispositivo()) snapshotPendenteDuranteEnvio = true;
      return;
    }
    if (dados.clientId === idDispositivo()) return;
    // O documento principal é apenas o gatilho/metadado no formato particionado.
    // A reconciliação central lê todas as partes atomicamente e reaproveita as
    // mesmas regras de mescla usadas no foco, reconexão e abertura do app.
    reconciliarComRemoto(true);
  }, function (e) {
    console.error('Snapshot Firebase falhou.', e);
    definirStatus('erro', 'Verifique as regras do Firestore');
  });
}

function iniciar(novasOpcoes) {
  opcoes = novasOpcoes || {};
  // Mantem 'autenticando' ate o onAuthStateChanged confirmar se ha sessao salva,
  // assim quem ja esta logado entra direto sem ver a tela de login piscar.
  definirStatus('autenticando', 'Verificando sua sessão…');
  onAuthStateChanged(auth, function (user) {
    usuario = user;
    reconciliadoOk = false; // nova sessão/usuário: exige nova leitura da nuvem
    numeroChunksAtuais = 0;
    tentativasReconciliacao = 0;
    if (retryReconciliacao) { clearTimeout(retryReconciliacao); retryReconciliacao = null; }
    if (cancelarSnapshot) { cancelarSnapshot(); cancelarSnapshot = null; }
    if (!user) {
      refEstado = null;
      definirStatus('deslogado', 'Entre com Google para sincronizar');
      return;
    }
    refEstado = doc(db, 'users', user.uid, 'state', 'current');
    definirStatus('sincronizando', 'Conectando ao Firebase');
    reconciliarComRemoto(true).then(observarMudancas);
    registrarPush(user); // lembretes de estudo (defensivo; só ativa com VAPID + permissão)
  });
  registrarReSyncPrimeiroPlano();
}

// O onSnapshot ao vivo morre silenciosamente quando o navegador congela/descarta
// a aba em segundo plano (comum em PWA no celular). Ao voltar ao primeiro plano,
// o app ficava preso nos dados locais antigos e não buscava as novidades da
// nuvem — daí "nenhum estudo registrado hoje" ao abrir no outro aparelho. Aqui
// reconciliamos (busca fresca + reata o ouvinte) a cada foco/volta/reconexão, e
// damos flush no envio pendente ao sair. Espelha o que o sync.js já fazia.
let reSyncRegistrado = false;
function registrarReSyncPrimeiroPlano() {
  if (reSyncRegistrado) return;
  reSyncRegistrado = true;

  function reconciliarFresco() {
    if (!refEstado) return;
    reconciliarComRemoto(true).then(observarMudancas);
  }

  window.addEventListener('online', reconciliarFresco);
  window.addEventListener('focus', reconciliarFresco);
  window.addEventListener('pagehide', flushEnvio);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) flushEnvio();
    else reconciliarFresco();
  });
  // Rede de segurança para o onSnapshot que morre em silêncio (aba aberta o dia
  // todo no desktop, sem trocar de janela): a cada 5 min com a aba visível,
  // busca fresca + reata o ouvinte. Ocioso e sem mudanças, custa só uma leitura.
  setInterval(function () {
    if (document.hidden || !refEstado || reconciliando || enviando) return;
    reconciliarFresco();
  }, 5 * 60 * 1000);
}

// Registra o token de push do dispositivo (lembretes de estudo). Tudo aqui é
// defensivo: qualquer falta de suporte/permissão/chave apenas pula, sem quebrar
// o app. O token vai para users/{uid}/push/tokens (doc separado do estado, para
// o sync não sobrescrever).
async function registrarPush(user) {
  try {
    user = user || usuario;
    if (!VAPID_KEY) return;                                   // push não configurado
    if (!user || !('serviceWorker' in navigator)) return;
    const estado = opcoes && opcoes.obterEstado ? opcoes.obterEstado() : null;
    if (!(estado && estado.config && estado.config.lembretesPush === true)) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (!(await isMessagingSupported().catch(function () { return false; }))) return;

    // Reutiliza o service worker principal. Registrar outro worker no mesmo escopo
    // raiz substituiria o cache/offline da PWA.
    const reg = await navigator.serviceWorker.ready;
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    if (!token) return;
    tokenPushAtual = token;
    tokenPushUid = user.uid;

    await setDoc(doc(db, 'users', user.uid, 'push', 'tokens'), {
      [token]: {
        criadoEm: new Date().toISOString(),
        ua: (navigator.userAgent || '').slice(0, 200)
      }
    }, { merge: true });
  } catch (e) {
    console.warn('Push não ativado (lembretes):', e && e.message ? e.message : e);
  }
}

function pushConfigurado() {
  return !!VAPID_KEY;
}

async function desativarPushAtual() {
  await removerPushAtual();
}

async function removerPushAtual() {
  const uid = tokenPushUid || (usuario && usuario.uid);
  const token = tokenPushAtual;
  tokenPushAtual = null;
  tokenPushUid = null;
  if (!uid || !token) return;
  try {
    await setDoc(doc(db, 'users', uid, 'push', 'tokens'), {
      [token]: deleteField()
    }, { merge: true });
  } catch (e) {
    console.warn('Não consegui remover o token push do perfil:', e && e.message ? e.message : e);
  }
  try {
    if (await isMessagingSupported().catch(function () { return false; })) {
      await deleteToken(getMessaging(app));
    }
  } catch (e) {
    console.warn('Não consegui remover o token push deste navegador:', e && e.message ? e.message : e);
  }
}

// ---------- Backups diários na nuvem (rotação de 7 dias) ----------
// Um snapshot por dia em users/{uid}/state/backup-<diaDaSemana> (0..6): o slot
// do mesmo dia da semana seguinte sobrescreve o antigo — sempre os últimos ~7
// dias, sem precisar listar/limpar. É a rede de segurança contra corrupção ou
// perda no doc principal. Tudo defensivo: falha (ex.: regra ainda não
// publicada) apenas loga e segue.
const CHAVE_SNAPSHOT_DIA = 'estudos.firebase.snapshotDia';

function chaveSnapshotUsuario(uid) {
  return CHAVE_SNAPSHOT_DIA + '.' + String(uid || '');
}

async function talvezSnapshotDiario(stateLimpo) {
  try {
    if (!usuario || !temDados(stateLimpo)) return;
    const agora = new Date();
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: FUSO_APP, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short'
    }).formatToParts(agora).reduce(function (acc, parte) {
      acc[parte.type] = parte.value;
      return acc;
    }, {});
    const hoje = partes.year + '-' + partes.month + '-' + partes.day;
    const chaveSnapshot = chaveSnapshotUsuario(usuario.uid);
    if (localStorage.getItem(chaveSnapshot) === hoje) return;
    const diaSemana = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
    const slot = 'backup-' + (diaSemana[partes.weekday] == null ? 0 : diaSemana[partes.weekday]);
    const slotRef = doc(db, 'users', usuario.uid, 'state', slot);
    const anterior = await getDoc(slotRef);
    const dadosAnteriores = anterior.exists() ? (anterior.data() || {}) : {};
    const lote = writeBatch(db);
    const codificado = gravarPartesNoLote(lote, slot, stateLimpo, dadosAnteriores.chunks);
    lote.set(slotRef, {
      formato: codificado.formato,
      chunks: codificado.partes.length,
      criadoEm: new Date().toISOString(),
      clientId: idDispositivo(),
      rev: revDe(stateLimpo),
      resumo: resumoEstado(stateLimpo),
      savedAt: serverTimestamp()
    });
    await lote.commit();
    localStorage.setItem(chaveSnapshot, hoje);
  } catch (e) {
    console.warn('Backup diário na nuvem não gravado:', e && e.message ? e.message : e);
  }
}

// Lista os backups diários existentes (id, data e nº de registros de estudo).
async function listarBackupsNuvem() {
  if (!usuario) throw new Error('Entre para ver os backups na nuvem.');
  const snaps = await Promise.all(Array.from({ length: 7 }, function (_, dia) {
    const id = 'backup-' + dia;
    return getDoc(doc(db, 'users', usuario.uid, 'state', id)).then(function (snap) {
      return { id, snap };
    });
  }));
  const lista = [];
  snaps.forEach(function (item) {
    if (!item.snap.exists()) return;
    const dados = item.snap.data() || {};
    const resumo = dados.resumo || {};
    lista.push({
      id: item.id,
      criadoEm: dados.criadoEm || '',
      registros: Number.isFinite(resumo.registros)
        ? resumo.registros
        : (dados.state ? window.Store.contarRegistros(dados.state) : 0),
      planos: Number.isFinite(resumo.planos)
        ? resumo.planos
        : (dados.state && Array.isArray(dados.state.planos) ? dados.state.planos.length : 0)
    });
  });
  return lista.sort(function (a, b) { return String(b.criadoEm).localeCompare(String(a.criadoEm)); });
}

// Devolve o estado salvo num backup diário (normalizado), para o app mesclar.
async function lerBackupNuvem(id) {
  if (!usuario) throw new Error('Entre para restaurar backups.');
  if (!/^backup-[0-6]$/.test(String(id))) throw new Error('Backup inválido.');
  const snap = await getDoc(doc(db, 'users', usuario.uid, 'state', String(id)));
  if (!snap.exists()) throw new Error('Backup não encontrado.');
  const estado = await lerEstadoDoDocumento(snap.data() || {}, String(id));
  if (!estado) throw new Error('Backup não encontrado.');
  return window.Store.normalizar(JSON.parse(JSON.stringify(estado)));
}

function agendarEnvio(state) {
  if (!usuario || !refEstado) return;
  clearTimeout(envioPendente);
  envioPendente = null;
  envioPendente = setTimeout(function () {
    envioPendente = null;
    // Ainda não leu a nuvem nesta sessão (reconciliação falhou/pendente):
    // reconcilia em vez de gravar direto — a mescla decide e envia o resultado.
    if (!reconciliadoOk) { reconciliarComRemoto(true); return; }
    gravarRemoto(state);
  }, 650);
}

// Antecipa, em melhor esforço, o último envio agendado antes de a aba ser
// congelada/fechada. O dado já está seguro no localStorage; se o navegador não
// der tempo ao Firestore, ele será reconciliado na próxima abertura.
function flushEnvio() {
  if (!envioPendente) return;
  clearTimeout(envioPendente);
  envioPendente = null;
  if (!reconciliadoOk) return; // nunca sobrescrever a nuvem sem tê-la lido antes
  if (opcoes && opcoes.obterEstado) gravarRemoto(opcoes.obterEstado());
}

function sincronizarAgora(opcoesSync) {
  return reconciliarComRemoto(!(opcoesSync && opcoesSync.silencioso === false));
}

function login() {
  definirStatus('entrando', 'Abrindo login do Google');
  return signInWithPopup(auth, provider);
}

async function logout(opcoesLogout) {
  opcoesLogout = opcoesLogout || {};
  if (opcoesLogout.sincronizarAntes !== false && usuario) {
    if (!reconciliadoOk) await reconciliarComRemoto(true);
    if (!reconciliadoOk || statusAtual.estado === 'erro') {
      throw new Error('Não foi possível confirmar a sincronização. Conecte-se à internet antes de sair.');
    }
    if (envioPendente) {
      clearTimeout(envioPendente);
      envioPendente = null;
    }
    ultimoErroGravacao = null;
    if (opcoes && opcoes.obterEstado) await gravarRemoto(opcoes.obterEstado());
    if (ultimoErroGravacao) {
      throw new Error('Não foi possível salvar as alterações antes de sair. Tente novamente.');
    }
  }
  await removerPushAtual();
  if (usuario) localStorage.removeItem(chaveSnapshotUsuario(usuario.uid));
  // A aplicação limpa estado e timer neste ponto: depois da última gravação
  // confirmada, mas antes de o Auth anunciar a sessão como deslogada.
  if (typeof opcoesLogout.antesDeSair === 'function') {
    await opcoesLogout.antesDeSair();
  }
  await signOut(auth);
  return { sincronizado: true };
}

function status() { return statusAtual; }
function ativo() { return !!usuario; }

async function carregarCatalogoGlobal() {
  const snap = await getDoc(refCatalogo);
  if (!snap.exists()) return [];
  const dados = snap.data();
  return Array.isArray(dados.editais) ? dados.editais : [];
}

async function publicarCatalogoGlobal(editais) {
  if (!usuario || String(usuario.email || '').toLowerCase() !== 'casar70@gmail.com') {
    throw new Error('Apenas o administrador pode publicar o catálogo global.');
  }
  const catalogo = {
    editais: Array.isArray(editais) ? editais : [],
    atualizadoEm: new Date().toISOString(),
    atualizadoPor: usuario.email
  };
  validarTamanhoRemoto(catalogo, 'O catálogo');
  await setDoc(refCatalogo, Object.assign(catalogo, {
    savedAt: serverTimestamp()
  }), { merge: true });
}

async function enviarPedidoEdital(pedido) {
  if (!usuario) throw new Error('Entre para pedir um edital.');
  const texto = String((pedido && pedido.texto) || '').trim();
  if (!texto) throw new Error('Descreva o edital desejado.');
  if (texto.length > 500) throw new Error('O pedido deve ter no máximo 500 caracteres.');
  await setDoc(doc(db, 'pedidosEdital', usuario.uid), {
    texto,
    status: 'novo',
    criadoEm: new Date().toISOString(),
    usuario: {
      uid: usuario.uid,
      email: usuario.email || '',
      nome: usuario.displayName || ''
    },
    savedAt: serverTimestamp()
  });
}

async function carregarPedidosEdital() {
  if (!usuario || String(usuario.email || '').toLowerCase() !== 'casar70@gmail.com') {
    throw new Error('Apenas o administrador pode ler pedidos.');
  }
  const snap = await getDocs(pedidosCollection);
  const pedidos = [];
  snap.forEach(function (d) {
    const dados = d.data() || {};
    if (dados.status !== 'atendido') pedidos.push(Object.assign({ id: d.id }, dados));
  });
  return pedidos.sort(function (a, b) { return String(b.criadoEm || '').localeCompare(String(a.criadoEm || '')); });
}

async function marcarPedidoAtendido(id) {
  if (!usuario || String(usuario.email || '').toLowerCase() !== 'casar70@gmail.com') {
    throw new Error('Apenas o administrador pode atualizar pedidos.');
  }
  await updateDoc(doc(db, 'pedidosEdital', id), { status: 'atendido', atendidoEm: new Date().toISOString() });
}

// Gera flashcards via Cloud Function (a chave do Gemini fica no servidor).
// Exige usuário autenticado; devolve { cards: [{frente, verso}], modelo }.
async function gerarFlashcardsIA(payload) {
  if (!usuario) throw new Error('Faça login para gerar flashcards com IA.');
  const fn = httpsCallable(functions, 'gerarFlashcards');
  const res = await fn({
    material: (payload && payload.material) || '',
    disciplina: (payload && payload.disciplina) || '',
    quantidade: (payload && payload.quantidade) || 10
  });
  return res.data;
}

window.FirebaseSync = {
  iniciar, agendarEnvio, sincronizarAgora, login, logout, status, ativo,
  carregarCatalogoGlobal, publicarCatalogoGlobal, enviarPedidoEdital,
  carregarPedidosEdital, marcarPedidoAtendido, gerarFlashcardsIA, registrarPush,
  desativarPushAtual, pushConfigurado,
  listarBackupsNuvem, lerBackupNuvem
};
window.dispatchEvent(new CustomEvent('firebase-sync-ready'));
