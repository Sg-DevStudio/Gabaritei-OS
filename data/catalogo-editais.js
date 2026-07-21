(function () {
  'use strict';

  function topicos(prefixo, itens) {
    return itens.map(function (item, i) {
      return {
        id: prefixo + '-' + String(i + 1).padStart(2, '0'),
        nome: item[0],
        incidencia_pct: item[1],
        prioridade: item[3] || (item[1] >= 15 ? 1 : (item[1] >= 8 ? 2 : 3)),
        horas_estimadas: item[2],
        semana_sugerida: item[4] == null ? null : item[4],
        status: 'pendente',
        reaberto: false,
        orfao: false
      };
    });
  }

  function disciplina(id, nome, cor, peso, itens) {
    return {
      id: id,
      nome: nome,
      cor: cor,
      peso: peso,
      base_teorica: 'pdf',
      topicos: topicos(id, itens)
    };
  }

  // Plano individual do concurso de Técnico do Seguro Social. A incidência foi
  // classificada item a item nas provas oficiais Cespe/Cebraspe de 2016 e 2022.
  // Dentro de cada disciplina, os percentuais fecham em 100%; a 5ª posição
  // preserva a ordem pedagógica da primeira passada.
  var portugues = [
    ['Interpretação, compreensão e inferência em textos', 31, 8, 1, 1],
    ['Tipologia textual, gêneros e finalidade comunicativa', 7, 4, 2, 2],
    ['Coesão, coerência, referenciação e conectivos', 17, 6, 1, 3],
    ['Significação, reescrita e relações semânticas', 11, 5, 2, 4],
    ['Classes de palavras e sintaxe da oração e do período', 10, 8, 2, 5],
    ['Concordância, regência e crase', 7, 7, 2, 6],
    ['Pontuação, ortografia e acentuação', 14, 7, 1, 7],
    ['Redação oficial — Manual da Presidência da República', 3, 4, 3, 8]
  ];

  var etica = [
    ['Decreto nº 1.171/1994 — regras, deveres e vedações éticas', 50, 6, 1, 1],
    ['Decreto nº 6.029/2007 — Sistema de Gestão da Ética e comissões', 33, 5, 1, 2],
    ['Apuração, denúncia, competência e sanções éticas', 17, 4, 2, 3]
  ];

  var constitucional = [
    ['Direitos e garantias individuais e coletivos', 38, 7, 1, 1],
    ['Direitos sociais e princípio da igualdade', 8, 4, 2, 2],
    ['Nacionalidade, cidadania e direitos políticos', 23, 5, 1, 3],
    ['Administração Pública na CF — artigos 37 a 41', 31, 7, 1, 4]
  ];

  var administrativo = [
    ['Estado, governo, Administração Pública, fontes e princípios', 24, 7, 1, 1],
    ['Organização administrativa da União: direta e indireta', 4, 5, 2, 2],
    ['Poderes administrativos, uso e abuso do poder', 4, 5, 2, 3],
    ['Atos administrativos: elementos, atributos, espécies e extinção', 16, 8, 1, 4],
    ['Serviços públicos e delegação', 12, 6, 2, 5],
    ['Lei nº 8.112/1990 — provimento, vacância e movimentação', 12, 7, 1, 6],
    ['Lei nº 8.112/1990 — direitos, vantagens, licenças e afastamentos', 8, 8, 2, 7],
    ['Lei nº 8.112/1990 — deveres, proibições e responsabilidades', 8, 7, 2, 8],
    ['Processo administrativo federal — Lei nº 9.784/1999', 4, 6, 2, 9],
    ['Controle da Administração e responsabilidade civil do Estado', 4, 6, 2, 10],
    ['Improbidade administrativa — Lei nº 8.429/1992', 4, 6, 2, 11]
  ];

  var informatica = [
    ['Internet, intranet, navegadores, cookies e correio eletrônico', 30, 6, 1, 1],
    ['LibreOffice Writer — edição e formatação de textos', 10, 5, 2, 2],
    ['LibreOffice Calc — células, fórmulas e planilhas', 10, 7, 2, 3],
    ['LibreOffice Impress — apresentações e hiperlinks', 10, 4, 2, 4],
    ['Windows 7 e 10, arquivos e recursos de nuvem', 10, 5, 2, 5],
    ['Segurança da informação, malware, phishing e criptografia', 30, 7, 1, 6]
  ];

  var raciocinio = [
    ['Proposições, conectivos e tabelas-verdade', 45, 7, 1, 1],
    ['Equivalências, negações e tautologias', 19, 6, 1, 2],
    ['Operações com conjuntos', 18, 5, 1, 3],
    ['Porcentagens e problemas proporcionais', 18, 5, 1, 4]
  ];

  var fundamentosCusteio = [
    ['Seguridade Social: evolução, conceito, organização e princípios', 17, 7, 1, 1],
    ['Legislação previdenciária: fontes, vigência, hierarquia e interpretação', 4, 4, 1, 2],
    ['RGPS: segurados obrigatórios e trabalhadores excluídos', 14, 8, 1, 3],
    ['Segurado especial e segurado facultativo', 7, 6, 1, 4],
    ['Filiação, inscrição, qualidade de segurado e CNIS', 10, 7, 1, 5],
    ['Empresa e empregador doméstico: conceito previdenciário', 7, 4, 2, 6],
    ['Financiamento da Seguridade e contribuições sociais', 17, 9, 1, 7],
    ['Salário de contribuição: parcelas, limites e complementação', 13, 8, 1, 8],
    ['Arrecadação e recolhimento: obrigações, prazos, juros e multa', 11, 7, 1, 9]
  ];

  var beneficiosAssistencia = [
    ['Beneficiários, dependentes, carência e qualidade de segurado', 8, 8, 1, 1],
    ['Plano de Benefícios: espécies, cálculo, renda e reajustamento', 8, 9, 1, 2],
    ['Serviço social e reabilitação profissional', 3, 4, 2, 3],
    ['LOAS e SUAS: organização, proteções e instâncias deliberativas', 16, 8, 1, 4],
    ['BPC/LOAS e auxílio-inclusão', 17, 8, 1, 5],
    ['Benefícios e pensões de legislações especiais', 8, 7, 2, 6],
    ['Seguro-defeso do pescador artesanal', 8, 5, 2, 7],
    ['RPPS, Certidão de Tempo de Contribuição e compensação', 6, 7, 2, 8],
    ['Emenda Constitucional nº 103/2019', 3, 6, 2, 9],
    ['Aposentadoria da pessoa com deficiência — LC nº 142/2013', 8, 6, 2, 10],
    ['Recursos administrativos, decadência e prescrição', 9, 6, 1, 11],
    ['Crimes contra a Seguridade Social', 6, 5, 2, 12]
  ];

  var inss = {
    id: 'edital-inss-tecnico-2022',
    tipo: 'edital_esquematizado',
    versao: 1,
    titulo: 'INSS — Técnico do Seguro Social (Edital 2022)',
    orgao: 'Instituto Nacional do Seguro Social',
    cargo: 'Técnico do Seguro Social',
    area: '',
    estado: 'BR',
    nivel: 'medio',
    banca: 'Cebraspe',
    foto: 'assets/carreiras/capa-inss-tecnico.png',
    // 80% é uma meta inicial editável, não uma nota de corte histórica.
    metaDesempenho: true,
    notaCorte: 80,
    tipoCorte: 'ampla',
    cortes: { ampla: 80, negros: null, pcd: null },
    janelaProva: { inicio: '', fim: '' },
    emAlta: true,
    atualizadoEm: '2026-07-21T00:00:00.000Z',
    fonte: 'Edital PRES/INSS nº 1/2022 e provas oficiais Cespe/Cebraspe de Técnico do Seguro Social de 2016 e 2022; 240 itens classificados por assunto.',
    observacoes: 'Plano individual baseado no último edital do cargo. Os 70 itens específicos foram divididos em dois módulos para equilibrar o ciclo sem perder a sequência pedagógica.',
    disciplinas: [
      disciplina('POR', 'Língua Portuguesa', '#3B82F6', 2, portugues),
      disciplina('ETI', 'Ética no Serviço Público', '#A855F7', 1, etica),
      disciplina('CON', 'Noções de Direito Constitucional', '#0EA5E9', 2, constitucional),
      disciplina('ADM', 'Noções de Direito Administrativo e Lei nº 8.112/1990', '#EF4444', 2, administrativo),
      disciplina('INF', 'Noções de Informática', '#6366F1', 1, informatica),
      disciplina('RLM', 'Raciocínio Lógico-Matemático', '#F59E0B', 1, raciocinio),
      disciplina('PRE', 'Previdenciário I — Fundamentos, RGPS e Custeio', '#009845', 5, fundamentosCusteio),
      disciplina('BEN', 'Previdenciário II — Benefícios, Assistência e Legislação Especial', '#005CB9', 5, beneficiosAssistencia)
    ]
  };

  // Catálogo remoto continua separado. Os modelos-base entram no catálogo como
  // planos comuns e podem ser personalizados pelo administrador em Configurações.
  window.CATALOGO_EDITAIS_GLOBAIS = [];
  window.CATALOGO_EDITAIS_BASE = [inss];
})();
