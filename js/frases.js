/* ============================================================
   frases.js — frase do dia (curadoria própria, foco concurso)
   Determinística: índice = dia do ano % n → mesma frase o dia
   todo, em qualquer dispositivo.
   ============================================================ */
(function () {
  'use strict';

  const FRASES = [
    { t: 'A aprovação não é dos mais inteligentes — é dos que ainda estavam estudando quando os outros desistiram.', a: null },
    { t: 'Você não precisa acertar tudo. Precisa acertar um ponto a mais que o último nomeado.', a: null },
    { t: 'Questão errada hoje é questão certa na prova — se você voltar nela.', a: null },
    { t: 'O edital não pergunta se você estava motivado. Pergunta se você estudou.', a: null },
    { t: 'Constância vence intensidade: 2 horas todo dia batem 14 horas no domingo.', a: null },
    { t: 'A banca repete. Quem faz prova antiga estuda com o gabarito do futuro.', a: null },
    { t: 'Revisar não é voltar atrás. É impedir que o estudo de ontem evapore.', a: null },
    { t: 'O concorrente que te assusta também tem dia ruim. A diferença é o que ele faz no dia seguinte.', a: null },
    { t: 'Disciplina é escolher entre o que você quer agora e o que você quer mais.', a: 'Augusto Cury' },
    { t: 'Enquanto o edital não sai, quem estuda acumula vantagem que nenhum cursinho vende.', a: null },
    { t: 'Não estude até dar certo. Estude até não ter como dar errado.', a: null },
    { t: 'A teoria te apresenta o assunto. A questão te apresenta a banca.', a: null },
    { t: 'Seu cérebro esquece com método. Vença-o revisando com método: 24 horas, 7 dias, 30 dias.', a: null },
    { t: 'Cada bolha preenchida no cartão é uma decisão tomada meses antes, na mesa de estudos.', a: null },
    { t: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.', a: 'Robert Collier' },
    { t: 'Simulado ruim antes da prova é presente: mostra onde perder pontos ainda é de graça.', a: null },
    { t: 'Você não está atrasado. Está exatamente na semana em que decidiu não parar mais.', a: null },
    { t: 'Decoreba também é técnica: lei seca em bloco curto, todo dia, vence qualquer memória boa.', a: null },
    { t: 'A vaga já existe. O concurso só decide o nome que vão escrever nela.', a: null },
    { t: 'Estudar cansado vale menos — mas vale. Zero é o único número que não soma.', a: null },
    { t: 'Quem controla o que erra, controla a própria aprovação.', a: null },
    { t: 'A diferença entre sonho e meta é um cronograma.', a: null },
    { t: 'Hoje a meta não é a posse. É terminar os blocos de hoje.', a: null },
    { t: 'Nota de corte não é teto. É o chão de quem entra.', a: null },
    { t: 'Errar no caderno de questões é treino. Repetir o erro é escolha.', a: null },
    { t: 'O tempo vai passar de qualquer jeito. A questão é se ele passa com você estudando.', a: null },
    { t: 'Pomodoro terminado vale mais que madrugada planejada.', a: null },
    { t: 'Ninguém lembra da posição do aprovado. Lembram que ele passou.', a: null }
  ];

  function diaDoAno(data) {
    const inicio = new Date(data.getFullYear(), 0, 0);
    return Math.floor((data - inicio) / 86400000);
  }

  function fraseDoDia(data) {
    const d = data || new Date();
    return FRASES[diaDoAno(d) % FRASES.length];
  }

  window.Frases = { fraseDoDia };
})();
