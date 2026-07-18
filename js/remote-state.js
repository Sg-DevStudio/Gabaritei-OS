/* ============================================================
   remote-state.js — codec puro para dividir o estado do Firestore.

   O Firestore limita cada documento a 1 MiB. O estado local continua sendo
   um único objeto, mas a cópia remota é serializada em partes menores e
   reconstruída de forma transparente. O módulo também funciona no Node para
   testes de regressão.
   ============================================================ */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RemoteStateCodec = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const FORMATO = 2;
  const MAX_PARTES = 24;
  // No pior caso UTF-8, 180 mil unidades UTF-16 ficam bem abaixo de 700 KiB.
  const MAX_UNIDADES_PARTE = 180000;
  const LIMITE_PARTE_BYTES = 700 * 1024;

  function tamanhoUtf8(texto) {
    texto = String(texto || '');
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(texto).length;
    if (typeof Buffer !== 'undefined') return Buffer.byteLength(texto, 'utf8');
    return unescape(encodeURIComponent(texto)).length;
  }

  function dividirTexto(texto) {
    texto = String(texto || '');
    const partes = [];
    let inicio = 0;
    while (inicio < texto.length) {
      let fim = Math.min(texto.length, inicio + MAX_UNIDADES_PARTE);
      // Não separe um par substituto UTF-16; alguns backends normalizam um
      // substituto órfão e a concatenação deixaria de reproduzir o JSON original.
      if (fim < texto.length) {
        const anterior = texto.charCodeAt(fim - 1);
        const proximo = texto.charCodeAt(fim);
        if (anterior >= 0xD800 && anterior <= 0xDBFF &&
            proximo >= 0xDC00 && proximo <= 0xDFFF) fim -= 1;
      }
      const parte = texto.slice(inicio, fim);
      if (tamanhoUtf8(parte) > LIMITE_PARTE_BYTES) {
        throw new Error('Uma parte do estado ultrapassou o limite seguro do Firestore.');
      }
      partes.push(parte);
      if (partes.length > MAX_PARTES) {
        throw new Error('Seus dados ultrapassaram a capacidade atual de sincronização. Exporte um backup e contate o suporte.');
      }
      inicio = fim;
    }
    return partes.length ? partes : [''];
  }

  function codificar(valor) {
    const json = JSON.stringify(valor);
    if (typeof json !== 'string') throw new Error('Não foi possível serializar o estado para sincronização.');
    const partes = dividirTexto(json);
    return {
      formato: FORMATO,
      partes,
      bytes: tamanhoUtf8(json)
    };
  }

  function decodificar(partes) {
    if (!Array.isArray(partes) || partes.length < 1 || partes.length > MAX_PARTES ||
        partes.some(function (parte) { return typeof parte !== 'string'; })) {
      throw new Error('As partes do estado remoto são inválidas.');
    }
    return JSON.parse(partes.join(''));
  }

  function idParte(prefixo, indice) {
    if (!/^(current|backup-[0-6])$/.test(String(prefixo || ''))) {
      throw new Error('Prefixo de estado remoto inválido.');
    }
    const n = Number(indice);
    if (!Number.isInteger(n) || n < 0 || n >= MAX_PARTES) {
      throw new Error('Índice de parte remoto inválido.');
    }
    return prefixo + '-chunk-' + String(n).padStart(2, '0');
  }

  return {
    FORMATO,
    MAX_PARTES,
    MAX_UNIDADES_PARTE,
    LIMITE_PARTE_BYTES,
    tamanhoUtf8,
    dividirTexto,
    codificar,
    decodificar,
    idParte
  };
});
