/* Guias e identidades visuais consultados em 03/10/2026. Fontes em assets/ferramentas/README.md. */
(function () {
  'use strict';
  window.FERRAMENTAS_ESTUDANTE = [
    {
      nome: 'Notion', categoria: 'Organização', foco: 'Seu caderno digital',
      descricao: 'Reúne anotações, páginas e tarefas em um espaço pesquisável. Útil para conectar seus resumos ao conteúdo de cada disciplina.',
      passos: ['Crie uma página para cada disciplina do edital.', 'Organize resumos, referências e dúvidas por tópico.', 'Revise suas anotações após resolver questões.'],
      dica: 'Comece com uma estrutura simples: disciplina → tópico → resumo e dúvidas.',
      url: 'https://www.notion.com/', guia: 'https://www.notion.com/help/guides/get-organized-for-a-new-semester-with-notion', imagem: 'assets/ferramentas/logo-notion.svg', marca: 'notion'
    },
    {
      nome: 'NotebookLM', nomeAtual: 'Gemini Notebook', categoria: 'Pesquisa', foco: 'Converse com seus materiais',
      descricao: 'Ajuda a explorar fontes que você adiciona, com respostas referenciadas e resumos em áudio. Use para entender e comparar seus materiais de estudo.',
      passos: ['Crie um notebook e adicione suas fontes de estudo.', 'Peça explicações e compare pontos entre as fontes.', 'Confira as referências e ouça um resumo em áudio.'],
      dica: 'Confira a resposta na fonte original, especialmente em legislação e conteúdos sujeitos a mudanças.',
      url: 'https://notebook.google/', guia: 'https://support.google.com/notebooklm/?hl=pt-BR', imagem: 'assets/ferramentas/logo-notebooklm.svg', marca: 'notebooklm'
    },
    {
      nome: 'Trello', categoria: 'Organização', foco: 'Visualize o próximo passo',
      descricao: 'Organiza tarefas em quadros, listas e cartões. Ajuda a acompanhar o que falta estudar, o que está em andamento e o que já foi concluído.',
      passos: ['Monte listas: A estudar, Em estudo e Concluído.', 'Crie um cartão por tarefa, com checklist e prazo.', 'Mova os cartões conforme avança na semana.'],
      dica: 'Prefira tarefas pequenas e concretas, como resolver 20 questões de crase.',
      url: 'https://trello.com/', guia: 'https://trello.com/guide/trello-101', imagem: 'assets/ferramentas/logo-trello.svg', marca: 'trello'
    },
    {
      nome: 'Anki', categoria: 'Memorização', foco: 'Revisões que voltam na hora certa',
      descricao: 'Usa flashcards com recuperação ativa e repetição espaçada. Você tenta lembrar a resposta antes de revelá-la e avalia como foi a lembrança.',
      passos: ['Crie cartões curtos a partir de erros e conceitos importantes.', 'Tente responder antes de virar cada cartão.', 'Avalie sua lembrança e faça as revisões programadas.'],
      dica: 'Um conceito por cartão. Priorize qualidade e revisão diária, em vez de acumular cartões.',
      url: 'https://apps.ankiweb.net/', guia: 'https://docs.ankiweb.net/getting-started.html', imagem: 'assets/ferramentas/logo-anki.png', marca: 'anki'
    },
    {
      nome: 'SciELO Livros', categoria: 'Livros', foco: 'Leitura acadêmica',
      descricao: 'Catálogo de livros e capítulos acadêmicos, com obras em acesso aberto e obras comerciais. Pode apoiar o aprofundamento de temas do edital.',
      passos: ['Pesquise pelo tema ou autor.', 'Filtre por Acesso Aberto para encontrar leitura disponível.', 'Selecione capítulos relevantes e registre a referência.'],
      dica: 'Use a bibliografia para aprofundar dúvidas que apareceram nas questões.',
      url: 'https://books.scielo.org/?lang=pt', guia: 'https://search.livros.scielo.org/?lang=pt', imagem: 'assets/ferramentas/logo-scielo.svg', marca: 'scielo'
    },
    {
      nome: 'Project Gutenberg', categoria: 'Livros', foco: 'Clássicos para ampliar seu repertório',
      descricao: 'Biblioteca de ebooks, especialmente obras antigas em domínio público nos Estados Unidos. Oferece leitura online e arquivos em formatos como EPUB.',
      passos: ['Busque um autor, título ou idioma.', 'Escolha leitura no navegador ou um formato para seu leitor.', 'Registre ideias e vocabulário durante a leitura.'],
      dica: 'Confira a situação dos direitos da obra no seu país antes de reutilizar ou distribuir o texto.',
      url: 'https://www.gutenberg.org/', guia: 'https://www.gutenberg.org/help/', imagem: 'assets/ferramentas/logo-gutenberg.jpg', marca: 'gutenberg'
    },
    {
      nome: 'Z-Library', categoria: 'Livros', foco: 'Link indicado pela comunidade',
      descricao: 'Endereço sugerido para esta seleção. A disponibilidade e o conteúdo deste domínio não puderam ser confirmados na consulta.',
      passos: ['Abra o endereço para consultar sua disponibilidade.', 'Confira a origem e as condições de acesso de cada obra.', 'Registre autor, edição e referência do material escolhido.'],
      dica: 'Link indicado por você; não foi validado como domínio oficial do serviço.',
      url: 'https://zlibrary.pt/', imagem: 'assets/ferramentas/logo-zlibrary.png', marca: 'zlibrary', naoVerificado: true
    }
  ];
})();
