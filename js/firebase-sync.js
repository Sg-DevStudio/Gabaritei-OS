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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
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
  estado: 'deslogado',
  texto: 'Entre com Google para sincronizar',
  fonte: 'Firebase Firestore',
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

    if (!localTemDados && remotoTemDados) {
      aplicarRemoto(remoto.state, silencioso);
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
    if (remotoMs > localMs + FOLGA_RELOGIO_MS) {
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
  definirStatus('deslogado', 'Entre com Google para sincronizar');
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
  });
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
    throw new Error('Apenas o administrador pode publicar o catalogo global.');
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

window.FirebaseSync = {
  iniciar, agendarEnvio, sincronizarAgora, login, logout, status, ativo,
  carregarCatalogoGlobal, publicarCatalogoGlobal, enviarPedidoEdital,
  carregarPedidosEdital, marcarPedidoAtendido
};
window.dispatchEvent(new CustomEvent('firebase-sync-ready'));
