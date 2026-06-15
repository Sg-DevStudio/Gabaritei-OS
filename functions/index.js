/* ============================================================
   Cloud Functions — geração de flashcards com IA (Gemini).
   A chave da API fica como SECRET no servidor (GEMINI_API_KEY) e NUNCA
   é exposta no app estático do GitHub Pages. O app chama esta função
   autenticado (Firebase Auth) e recebe só as cartas geradas.
   ============================================================ */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret, defineString } = require('firebase-functions/params');
const { setGlobalOptions } = require('firebase-functions/v2');

// Região fixa para casar com o cliente (getFunctions(app, 'us-central1')).
setGlobalOptions({ region: 'us-central1', maxInstances: 5 });

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
// Modelo configurável; o padrão é rápido e elegível ao free tier do Gemini.
const GEMINI_MODEL = defineString('GEMINI_MODEL', { default: 'gemini-2.0-flash' });

const LIMITE_MATERIAL = 20000; // ~caracteres; evita estourar custo/contexto
const MIN_MATERIAL = 30;

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
