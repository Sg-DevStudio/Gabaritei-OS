/* ============================================================
   frases.js — frase do dia (curadoria própria, foco concurso)
   Determinística: índice = dia do ano % n → mesma frase o dia
   todo, em qualquer dispositivo.
   ============================================================ */
(function () {
  'use strict';

  const FRASES = [
    { t: 'O que você faz hoje pode melhorar todos os seus amanhãs.', a: 'Ralph Marston' },
    { t: 'Não é que tenhamos pouco tempo, mas que perdemos muito.', a: 'Sêneca' },
    { t: 'Não importa quão devagar você vá, desde que não pare.', a: 'Confúcio' },
    { t: 'A jornada de mil milhas começa com um passo.', a: 'Lao-Tsé' },
    { t: 'Investir em conhecimento rende sempre os melhores juros.', a: 'Benjamin Franklin' },
    { t: 'Tudo parece impossível até que seja feito.', a: 'Nelson Mandela' },
    { t: 'Nada na vida deve ser temido, apenas compreendido.', a: 'Marie Curie' },
    { t: 'Disciplina é a ponte entre metas e realizações.', a: 'Jim Rohn' },
    { t: 'Comece onde você está. Use o que você tem. Faça o que puder.', a: 'Arthur Ashe' },
    { t: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.', a: 'Robert Collier' },
    { t: 'Conhecimento é poder.', a: 'Francis Bacon' },
    { t: 'A educação tem raízes amargas, mas os seus frutos são doces.', a: 'Aristóteles' },
    { t: 'A persistência realiza o impossível.', a: 'Provérbio chinês' },
    { t: 'A ação é a chave fundamental para todo sucesso.', a: 'Pablo Picasso' },
    { t: 'A sorte favorece a mente preparada.', a: 'Louis Pasteur' },
    { t: 'Aquilo que não me destrói me fortalece.', a: 'Friedrich Nietzsche' },
    { t: 'A excelência é um hábito.', a: 'Will Durant' },
    { t: 'Saber não basta; devemos aplicar.', a: 'Goethe' },
    { t: 'A aprovação não é dos mais inteligentes; é dos que continuam quando cansa.', a: null },
    { t: 'Questão errada hoje é questão certa na prova, se você voltar nela.', a: null },
    { t: 'O edital não pergunta se você estava motivado. Pergunta se você estudou.', a: null },
    { t: 'Constância vence intensidade: duas horas todo dia batem uma promessa grandiosa.', a: null },
    { t: 'A banca repete. Quem faz prova antiga estuda com o gabarito do futuro.', a: null },
    { t: 'Revisar não é voltar atrás. É impedir que o estudo de ontem evapore.', a: null },
    { t: 'Enquanto o edital não sai, quem estuda acumula vantagem silenciosa.', a: null },
    { t: 'A teoria te apresenta o assunto. A questão te apresenta a banca.', a: null },
    { t: 'Cada bolha preenchida no cartão é uma decisão tomada antes, na mesa de estudos.', a: null },
    { t: 'Simulado ruim antes da prova é presente: mostra onde perder pontos ainda é de graça.', a: null },
    { t: 'Você não está atrasado. Está na semana em que decidiu não parar mais.', a: null },
    { t: 'Estudar cansado vale menos, mas vale. Zero é o único número que não soma.', a: null },
    { t: 'Quem controla o que erra, controla a própria aprovação.', a: null },
    { t: 'A diferença entre sonho e meta é um cronograma.', a: null },
    { t: 'Hoje a meta não é a posse. É terminar os blocos de hoje.', a: null },
    { t: 'Nota de corte não é teto. É o chão de quem entra.', a: null },
    { t: 'Errar no caderno de questões é treino. Repetir o erro é escolha.', a: null },
    { t: 'O tempo vai passar de qualquer jeito. A questão é se ele passa com você estudando.', a: null }
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
