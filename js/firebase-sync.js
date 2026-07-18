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
  serverTimestamp,
  setDoc,
  updateDoc
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
const LIMITE_ESTADO_REMOTO_BYTES = 850 * 1024;
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
// true depois que esta sessão conseguiu LER a nuvem ao menos uma vez. Antes
// disso, nenhum envio direto (agendarEnvio/flush) pode subir: um aparelho com
// cópia local antiga que gravasse antes de reconciliar sobrescreveria (sem
// mescla) o plano atual dos outros aparelhos.
let reconciliadoOk = false;
let aplicandoRemoto = false;
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

function normalizarRemoto(dados) {
  if (!dados || !dados.state) return null;
  return {
    state: window.Store.normalizar(dados.state),
    updatedAt: dados.updatedAt || atualizadoEm(dados.state),
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
  if (bytes > LIMITE_ESTADO_REMOTO_BYTES) {
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
  validarTamanhoRemoto(limpo, 'Seu estado');
  return limpo;
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
    definirStatus('enviando', 'Enviando para a nuvem');
    try {
      while (estadoPendenteGravacao) {
        const proximo = estadoPendenteGravacao;
        estadoPendenteGravacao = null;
        const stateLimpo = prepararEstadoRemoto(proximo);
        await setDoc(refEstado, {
          state: stateLimpo,
          updatedAt: atualizadoEm(stateLimpo) || new Date().toISOString(),
          clientId: idDispositivo(),
          savedAt: serverTimestamp()
        });
        talvezSnapshotDiario(stateLimpo); // fire-and-forget: nunca atrasa nem quebra o save
      }
      definirStatus('sincronizado', 'Sincronizado com Firebase');
    } catch (e) {
      estadoPendenteGravacao = null;
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
  definirStatus('sincronizando', 'Sincronizando com Firebase');
  try {
    const local = opcoes.obterEstado();
    const snap = await getDoc(refEstado);
    reconciliadoOk = true; // leu a nuvem: envios diretos liberados nesta sessão
    if (!snap.exists()) {
      if (temDados(local) || (local.config && local.config.apagadoEm)) await gravarRemoto(local);
      else definirStatus('sincronizado', 'Conectado ao Firebase');
      return;
    }

    const remoto = normalizarRemoto(snap.data());
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
    console.error('Falha ao sincronizar com Firebase.', e);
    definirStatus('erro', 'Verifique Auth, Firestore e regras');
  } finally {
    reconciliando = false;
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
    if (enviando) {
      const duranteEnvio = snap.data() || {};
      if (duranteEnvio.clientId !== idDispositivo()) snapshotPendenteDuranteEnvio = true;
      return;
    }
    const remoto = normalizarRemoto(snap.data());
    if (!remoto || remoto.clientId === idDispositivo()) return;
    const local = opcoes.obterEstado();
    const remotoMs = dataMs(atualizadoEm(remoto.state) || remoto.updatedAt);
    const localMs = dataMs(atualizadoEm(local));
    const apagouLocal = local.config && local.config.apagadoEm &&
      dataMs(local.config.apagadoEm) > remotoMs + FOLGA_RELOGIO_MS;
    // Local sem dados (ex.: recém-aberto, atualizadoEm = agora) não deve "ganhar"
    // da nuvem por timestamp — adota o remoto que tem dados, como na reconciliação.
    const localVazioRemotoCheio = !temDados(local) && temDados(remoto.state) && !apagouLocal;
    if (apagouLocal) return;
    // rev decide (imune a relógio); com revs iguais, o timestamp com folga.
    const rR = revDe(remoto.state), rL = revDe(local);
    const remotoNovo = rR !== rL ? rR > rL : remotoMs > localMs + FOLGA_RELOGIO_MS;
    if (localVazioRemotoCheio && temLapides(local)) {
      const merged = window.Store.mesclarEstados(remoto.state, local);
      aplicarRemoto(merged, true);
      gravarRemoto(merged);
      definirStatus('sincronizado', 'Atualizado pela nuvem');
    } else if (localVazioRemotoCheio) {
      aplicarRemoto(remoto.state, true);
      definirStatus('sincronizado', 'Atualizado pela nuvem');
    } else if (remotoNovo && temDados(local)) {
      // Remoto mais novo, mas o local pode ter registros ainda não sincronizados:
      // mescla (remoto como base) para não perdê-los e reenvia se recuperou algo.
      const merged = window.Store.mesclarEstados(remoto.state, local);
      aplicarRemoto(merged, true);
      if (!window.Store.estadosEquivalentes(merged, remoto.state)) gravarRemoto(merged);
      definirStatus('sincronizado', 'Atualizado pela nuvem');
    } else if (remotoNovo) {
      aplicarRemoto(remoto.state, true);
      definirStatus('sincronizado', 'Atualizado pela nuvem');
    }
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
    if (localStorage.getItem(CHAVE_SNAPSHOT_DIA) === hoje) return;
    const diaSemana = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
    const slot = 'backup-' + (diaSemana[partes.weekday] == null ? 0 : diaSemana[partes.weekday]);
    await setDoc(doc(db, 'users', usuario.uid, 'state', slot), {
      state: stateLimpo,
      criadoEm: new Date().toISOString(),
      clientId: idDispositivo(),
      savedAt: serverTimestamp()
    });
    localStorage.setItem(CHAVE_SNAPSHOT_DIA, hoje);
  } catch (e) {
    console.warn('Backup diário na nuvem não gravado:', e && e.message ? e.message : e);
  }
}

// Lista os backups diários existentes (id, data e nº de registros de estudo).
async function listarBackupsNuvem() {
  if (!usuario) throw new Error('Entre para ver os backups na nuvem.');
  const snap = await getDocs(collection(db, 'users', usuario.uid, 'state'));
  const lista = [];
  snap.forEach(function (d) {
    if (d.id.indexOf('backup-') !== 0) return;
    const dados = d.data() || {};
    lista.push({
      id: d.id,
      criadoEm: dados.criadoEm || '',
      registros: dados.state ? window.Store.contarRegistros(dados.state) : 0,
      planos: dados.state && Array.isArray(dados.state.planos) ? dados.state.planos.length : 0
    });
  });
  return lista.sort(function (a, b) { return String(b.criadoEm).localeCompare(String(a.criadoEm)); });
}

// Devolve o estado salvo num backup diário (normalizado), para o app mesclar.
async function lerBackupNuvem(id) {
  if (!usuario) throw new Error('Entre para restaurar backups.');
  if (String(id).indexOf('backup-') !== 0) throw new Error('Backup inválido.');
  const snap = await getDoc(doc(db, 'users', usuario.uid, 'state', String(id)));
  if (!snap.exists() || !snap.data().state) throw new Error('Backup não encontrado.');
  return window.Store.normalizar(JSON.parse(JSON.stringify(snap.data().state)));
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

function logout() {
  return removerPushAtual().finally(function () { return signOut(auth); });
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
  listarBackupsNuvem, lerBackupNuvem
};
window.dispatchEvent(new CustomEvent('firebase-sync-ready'));
