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
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
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

function temDados(state) {
  return window.Store && window.Store.temDados(state);
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

async function gravarRemoto(state) {
  if (!refEstado || !usuario || aplicandoRemoto) return;
  enviando = true;
  definirStatus('enviando', 'Enviando para a nuvem');
  try {
    const stateLimpo = JSON.parse(JSON.stringify(window.Store.normalizar(state)));
    await setDoc(refEstado, {
      state: stateLimpo,
      updatedAt: atualizadoEm(stateLimpo) || new Date().toISOString(),
      clientId: idDispositivo(),
      savedAt: serverTimestamp()
    });
    definirStatus('sincronizado', 'Sincronizado com Firebase');
  } catch (e) {
    console.error('Falha ao salvar no Firebase.', e);
    definirStatus('erro', 'Falha ao salvar no Firebase');
  } finally {
    enviando = false;
  }
}

async function reconciliarComRemoto(silencioso) {
  if (!refEstado || !opcoes) return;
  definirStatus('sincronizando', 'Sincronizando com Firebase');
  try {
    const local = opcoes.obterEstado();
    const snap = await getDoc(refEstado);
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

    if (!localTemDados && remotoTemDados && !apagouLocal) {
      aplicarRemoto(remoto.state, silencioso);
      definirStatus('sincronizado', 'Sincronizado com Firebase');
    } else if (localMs > remotoMs + FOLGA_RELOGIO_MS || apagouLocal) {
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
  }
}

function observarMudancas() {
  if (cancelarSnapshot) cancelarSnapshot();
  cancelarSnapshot = onSnapshot(refEstado, function (snap) {
    if (!snap.exists() || enviando || !opcoes) return;
    const remoto = normalizarRemoto(snap.data());
    if (!remoto || remoto.clientId === idDispositivo()) return;
    const local = opcoes.obterEstado();
    const remotoMs = dataMs(atualizadoEm(remoto.state) || remoto.updatedAt);
    const localMs = dataMs(atualizadoEm(local));
    const apagouLocal = local.config && local.config.apagadoEm &&
      dataMs(local.config.apagadoEm) > remotoMs + FOLGA_RELOGIO_MS;
    if (remotoMs > localMs + FOLGA_RELOGIO_MS && !apagouLocal) {
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

    const reg = await navigator.serviceWorker.register('firebase-messaging-sw.js');
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
    if (!token) return;

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

function agendarEnvio(state) {
  if (!usuario || !refEstado) return;
  clearTimeout(envioPendente);
  envioPendente = setTimeout(function () { gravarRemoto(state); }, 650);
}

function sincronizarAgora(opcoesSync) {
  return reconciliarComRemoto(!(opcoesSync && opcoesSync.silencioso === false));
}

function login() {
  definirStatus('entrando', 'Abrindo login do Google');
  return signInWithPopup(auth, provider);
}

function logout() {
  return signOut(auth);
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
  await setDoc(refCatalogo, {
    editais: Array.isArray(editais) ? editais : [],
    atualizadoEm: new Date().toISOString(),
    atualizadoPor: usuario.email,
    savedAt: serverTimestamp()
  }, { merge: true });
}

async function enviarPedidoEdital(pedido) {
  if (!usuario) throw new Error('Entre para pedir um edital.');
  const texto = String((pedido && pedido.texto) || '').trim();
  if (!texto) throw new Error('Descreva o edital desejado.');
  await addDoc(pedidosCollection, {
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
  carregarPedidosEdital, marcarPedidoAtendido, gerarFlashcardsIA, registrarPush
};
window.dispatchEvent(new CustomEvent('firebase-sync-ready'));
