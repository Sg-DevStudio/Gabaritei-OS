'use strict';

// O leitor recebe uma transação para não misturar partes de revisões distintas.
async function lerEstadoEstudo(userRef, transacao) {
  const colecao = userRef.collection('state');
  const principal = await transacao.get(colecao.doc('current'));
  if (!principal.exists) return {};
  const dados = principal.data() || {};
  if (dados.formato !== 2) return dados.state || {};
  if (!Number.isInteger(dados.chunks) || dados.chunks < 1 || dados.chunks > 24) {
    throw new Error('Quantidade de partes do estado inválida.');
  }
  const partes = [];
  for (let i = 0; i < dados.chunks; i++) {
    const snap = await transacao.get(colecao.doc('current-chunk-' + String(i).padStart(2, '0')));
    const parte = snap.exists && snap.data();
    if (!parte || parte.index !== i || parte.rev !== dados.rev || typeof parte.payload !== 'string') {
      throw new Error('Estado incompleto: lembrete adiado.');
    }
    partes.push(parte.payload);
  }
  return JSON.parse(partes.join(''));
}

module.exports = { lerEstadoEstudo };
