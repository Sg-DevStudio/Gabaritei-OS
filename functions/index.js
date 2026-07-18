/* ============================================================
   Cloud Functions — geração de flashcards com IA (Gemini).
   A chave da API fica como SECRET no servidor (GEMINI_API_KEY) e NUNCA
   é exposta no app estático do GitHub Pages. O app chama esta função
   autenticado (Firebase Auth) e recebe só as cartas geradas.
   ============================================================ */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret, defineString } = require('firebase-functions/params');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');

admin.initializeApp();

// Região fixa para casar com o cliente (getFunctions(app, 'us-central1')).
setGlobalOptions({ region: 'us-central1', maxInstances: 5 });

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
// Modelo configurável; o padrão é rápido e elegível ao free tier do Gemini.
const GEMINI_MODEL = defineString('GEMINI_MODEL', { default: 'gemini-2.0-flash' });

const LIMITE_MATERIAL = 20000; // ~caracteres; evita estourar custo/contexto
const MIN_MATERIAL = 30;
const LIMITE_IA_POR_MINUTO = 8;
const LIMITE_IA_POR_DIA = 40;

async function consumirCotaIA(uid) {
  const db = admin.firestore();
  const ref = db.collection('users').doc(uid).collection('usage').doc('flashcards');
  const agora = Date.now();
  const dia = new Date(agora).toISOString().slice(0, 10);

  await db.runTransaction(async function (tx) {
    const snap = await tx.get(ref);
    const uso = snap.exists ? (snap.data() || {}) : {};
    const mesmaJanela = Number.isFinite(uso.janelaInicioMs) && agora - uso.janelaInicioMs < 60000;
    const janelaInicioMs = mesmaJanela ? uso.janelaInicioMs : agora;
    const minuto = mesmaJanela ? (parseInt(uso.minuto, 10) || 0) : 0;
    const mesmoDia = uso.dia === dia;
    const diario = mesmoDia ? (parseInt(uso.diario, 10) || 0) : 0;

    if (minuto >= LIMITE_IA_POR_MINUTO) {
      throw new HttpsError('resource-exhausted', 'Muitas gerações em sequência. Aguarde um minuto e tente novamente.');
    }
    if (diario >= LIMITE_IA_POR_DIA) {
      throw new HttpsError('resource-exhausted', 'Seu limite diário de geração com IA foi atingido. Tente novamente amanhã.');
    }

    tx.set(ref, {
      dia: dia,
      diario: diario + 1,
      janelaInicioMs: janelaInicioMs,
      minuto: minuto + 1,
      atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });
}

function montarPrompt(material, disciplina, quantidade) {
  const contexto = disciplina
    ? 'As cartas são da disciplina "' + disciplina + '" de um concurso público brasileiro.'
    : 'As cartas são para um concurso público brasileiro.';
  return [
    'Você é um especialista em criar flashcards de memorização para concursos públicos.',
    contexto,
    'A partir do material de estudo abaixo, gere ' + quantidade + ' flashcards objetivos.',
    'Regras:',
    '- "frente": uma pergunta curta e direta (ou um termo a definir).',
    '- "verso": a resposta objetiva e correta, sem enrolação.',
    '- Cubra os pontos mais cobrados em prova; evite cartas redundantes.',
    '- Use apenas informação contida no material; não invente.',
    '- Escreva em português do Brasil.',
    '',
    'MATERIAL:',
    '"""',
    material,
    '"""'
  ].join('\n');
}

const SCHEMA_RESPOSTA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      frente: { type: 'STRING' },
      verso: { type: 'STRING' }
    },
    required: ['frente', 'verso']
  }
};

exports.gerarFlashcards = onCall({ secrets: [GEMINI_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Faça login para gerar flashcards com IA.');
  }
  const data = request.data || {};
  const material = String(data.material || '').trim();
  const disciplina = String(data.disciplina || '').trim().slice(0, 120);
  const quantidade = Math.min(30, Math.max(1, parseInt(data.quantidade, 10) || 10));

  if (material.length < MIN_MATERIAL) {
    throw new HttpsError('invalid-argument', 'Cole um material mais completo (mínimo ' + MIN_MATERIAL + ' caracteres).');
  }
  if (material.length > LIMITE_MATERIAL) {
    throw new HttpsError('invalid-argument', 'Material muito longo (máximo ~' + LIMITE_MATERIAL + ' caracteres). Divida em partes.');
  }

  await consumirCotaIA(request.auth.uid);

  const model = GEMINI_MODEL.value();
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
    encodeURIComponent(model) + ':generateContent?key=' + GEMINI_API_KEY.value();
  const body = {
    contents: [{ role: 'user', parts: [{ text: montarPrompt(material, disciplina, quantidade) }] }],
    generationConfig: {
      temperature: 0.4,
      responseMimeType: 'application/json',
      responseSchema: SCHEMA_RESPOSTA
    }
  };

  let resp;
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (e) {
    throw new HttpsError('unavailable', 'Não foi possível contatar a IA. Tente novamente.');
  }

  if (!resp.ok) {
    const detalhe = await resp.text().catch(function () { return ''; });
    if (resp.status === 429) {
      throw new HttpsError('resource-exhausted', 'Limite de uso da IA atingido por enquanto. Tente mais tarde.');
    }
    console.error('Gemini erro', resp.status, detalhe.slice(0, 500));
    throw new HttpsError('internal', 'A IA retornou um erro (' + resp.status + ').');
  }

  const json = await resp.json().catch(function () { return null; });
  const texto = json && json.candidates && json.candidates[0] &&
    json.candidates[0].content && json.candidates[0].content.parts &&
    json.candidates[0].content.parts[0] && json.candidates[0].content.parts[0].text;

  if (!texto) {
    throw new HttpsError('internal', 'A IA não retornou conteúdo. Tente com outro material.');
  }

  let cartas;
  try {
    cartas = JSON.parse(texto);
  } catch (e) {
    throw new HttpsError('internal', 'A IA retornou um formato inesperado. Tente novamente.');
  }

  const limpas = (Array.isArray(cartas) ? cartas : [])
    .map(function (c) {
      return {
        frente: String((c && c.frente) || '').trim().slice(0, 300),
        verso: String((c && c.verso) || '').trim().slice(0, 800)
      };
    })
    .filter(function (c) { return c.frente && c.verso; })
    .slice(0, quantidade);

  if (limpas.length === 0) {
    throw new HttpsError('internal', 'Não consegui extrair flashcards desse material. Tente um texto mais explicativo.');
  }

  return { cards: limpas, modelo: model };
});

/* ============================================================
   Lembretes de estudo (push) — quando o aluno não estuda.
   Uma vez por dia: para cada usuário com token de push salvo, se ele NÃO
   registrou sessão hoje, manda uma notificação motivacional. Os tokens ficam
   em users/{uid}/push/tokens (doc à parte, pra não ser sobrescrito pelo sync
   do estado). A data do app é o fuso de Brasília.
   ============================================================ */
const FUSO_APP = 'America/Sao_Paulo';
const APP_URL = 'https://samuelgomes01.github.io/App_Gestao_Estudos/';

// Mensagens para quem ficou um dia sem estudar (tom leve, no estilo do app).
const MENSAGENS_LEMBRETE = [
  { title: 'Bora estudar? 📚', body: 'Mais um dia, mais um tijolinho na sua aprovação.' },
  { title: 'Seu gráfico ficou triste sem você 📉', body: 'Bora animar ele de novo? 📈' },
  { title: 'A vaga não espera 🏁', body: 'Quem estuda hoje agradece amanhã. Bora pra cima!' },
  { title: 'Cadê você? 👀', body: 'Seu cronograma sentiu falta. 15 minutinhos já contam.' },
  { title: 'Constância vence talento 💪', body: 'Não precisa ser muito, precisa ser hoje.' },
  { title: 'Faltou um dia 📅', body: 'Não deixa virar dois. Abre o app e mata um tópico.' },
  { title: 'Sua aprovação tá te chamando 🎯', body: 'Um bloquinho de questões e o dia já valeu.' },
  { title: 'Disciplina > motivação 🔥', body: 'Senta, abre o material e começa. O resto vem.' },
  { title: 'Hoje é dia de avançar 🚀', body: 'Cada sessão te deixa mais perto da nomeação.' },
  { title: 'Revisão pendente te esperando 🔁', body: 'A curva do esquecimento não perdoa — bora revisar.' },
  { title: 'Tijolo por tijolo 🧱', body: 'É assim que se constrói uma aprovação. Bora colocar o de hoje.' },
  { title: 'Concurseiro raiz não para 🌱', body: 'Mesmo no cansaço, um pouquinho hoje faz diferença.' }
];

function escolherMensagem() {
  return MENSAGENS_LEMBRETE[Math.floor(Math.random() * MENSAGENS_LEMBRETE.length)];
}

// Data de hoje (YYYY-MM-DD) no fuso do app.
function hojeISO() {
  return new Date().toLocaleDateString('en-CA', { timeZone: FUSO_APP });
}

// Maior data de sessão registrada no estado do usuário (YYYY-MM-DD) ou ''.
function ultimaSessaoISO(state) {
  const sessoes = (state && Array.isArray(state.sessoes)) ? state.sessoes : [];
  let max = '';
  for (const s of sessoes) {
    const d = s && typeof s.data === 'string' ? s.data : '';
    if (d > max) max = d;
  }
  return max;
}

exports.lembreteEstudo = onSchedule(
  { schedule: 'every day 09:00', timeZone: FUSO_APP, maxInstances: 1 },
  async () => {
    const db = admin.firestore();
    const hoje = hojeISO();
    // listDocuments inclui "pais" de subcoleções mesmo sem doc próprio.
    const usuarios = await db.collection('users').listDocuments();
    let enviados = 0;

    for (const userRef of usuarios) {
      try {
        const tokensSnap = await userRef.collection('push').doc('tokens').get();
        if (!tokensSnap.exists) continue;
        const tokensMap = tokensSnap.data() || {};
        const tokens = Object.keys(tokensMap);
        if (tokens.length === 0) continue;

        const stateSnap = await userRef.collection('state').doc('current').get();
        const state = (stateSnap.exists && stateSnap.data() && stateSnap.data().state) || {};
        if (ultimaSessaoISO(state) === hoje) continue; // já estudou hoje

        const msg = escolherMensagem();
        const resp = await admin.messaging().sendEachForMulticast({
          tokens,
          notification: { title: msg.title, body: msg.body },
          webpush: {
            notification: { icon: APP_URL + 'icons/icone.svg', tag: 'lembrete-estudo' },
            fcmOptions: { link: APP_URL }
          }
        });
        enviados += resp.successCount;

        // Remove tokens inválidos para a base não acumular lixo.
        const remover = {};
        resp.responses.forEach(function (r, i) {
          const code = r.error && r.error.code;
          if (code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token') {
            remover[tokens[i]] = admin.firestore.FieldValue.delete();
          }
        });
        if (Object.keys(remover).length) {
          await userRef.collection('push').doc('tokens').set(remover, { merge: true });
        }
      } catch (e) {
        console.error('Lembrete falhou para', userRef.id, e);
      }
    }
    console.log('lembreteEstudo: notificações enviadas =', enviados);
  }
);
