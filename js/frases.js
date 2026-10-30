/* Trechos curtos com autoria e fonte; traduções identificadas na interface. */
(function () {
  'use strict';
  const FRASES = [
    { t: 'Põe quanto és no mínimo que fazes.', a: 'Ricardo Reis · Fernando Pessoa', s: 'https://pt.wikisource.org/wiki/Para_ser_grande,_s%C3%AA_inteiro' },
    { t: 'O que não consigo criar, não compreendo.', a: 'Richard Feynman', s: 'https://calteches.library.caltech.edu/684/1/ES65.2.2002.pdf#page=21', tr: true },
    { t: 'A inspiração nasce de um contínuo ‘não sei’.', a: 'Wisława Szymborska', s: 'https://newrepublic.com/article/100368/i-dont-know', tr: true }
  ];
  function fraseDoDia(data) {
    const d = data || new Date();
    const day = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
    return FRASES[((day % FRASES.length) + FRASES.length) % FRASES.length];
  }
  window.Frases = { fraseDoDia };
})();
