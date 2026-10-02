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

  // Plano público baseado no PDF retificado de 2022. Estimativas de estudo
  // estão explicitadas em observacoes; o conteúdo não usa a previsão IFPA/IDECAN.
  var ifrj = {
  "id": "edital-ifrj-assistente-administracao-2022",
  "tipo": "edital_esquematizado",
  "versao": 1,
  "titulo": "IFRJ — Assistente em Administração (base: Edital 2022)",
  "orgao": "Instituto Federal de Educação, Ciência e Tecnologia do Rio de Janeiro",
  "cargo": "Assistente em Administração",
  "area": "",
  "estado": "RJ",
  "nivel": "medio",
  "banca": "Instituto SELECON",
  "foto": "assets/carreiras/capa-ifrj-assistente.svg",
  "fotoAlt": "Símbolo dos Institutos Federais, identificando o plano do IFRJ",
  "fotoCredito": "Símbolo dos Institutos Federais — imagem localizada no projeto Mede1ro/TCC",
  "fotoFonte": "https://github.com/Mede1ro/TCC/blob/46ca43cc06edf964bb4fe902d2acab2ad377f378/assets/logo.svg",
  "metaDesempenho": true,
  "notaCorte": 80,
  "tipoCorte": "ampla",
  "cortes": {
    "ampla": 80,
    "negros": null,
    "pcd": null
  },
  "janelaProva": {
    "inicio": "",
    "fim": ""
  },
  "emAlta": true,
  "atualizadoEm": "2026-10-02T00:00:00.000Z",
  "fonte": "Edital Retificado IFRJ nº 03/2022, fornecido em PDF: Anexo III (p. 30), Anexo IV (p. 31) e Anexo VIII (p. 36 e p. 41). Conteúdo do cargo Assistente em Administração, nível D, organizado a partir do documento.",
  "observacoes": "Base de preparação pelo edital anterior do IFRJ, sem previsão de data ou garantia do conteúdo de um próximo concurso. Prova de referência: 50 questões de 1 ponto, sendo 8 de Português, 7 de Legislação e Ética, 5 de Informática e 30 de Conhecimentos Específicos. Mínimos do edital: 3, 3, 2 e 12 pontos por disciplina e 30 pontos no total; não são notas de corte de aprovação. A meta de 80% é editável. Os percentuais dos tópicos são uma distribuição inicial equilibrada para planejamento, sem análise de incidência em provas; os pesos 8/7/5/30 correspondem aos pontos de cada disciplina no edital (16%/14%/10%/60%). Horas e semanas são estimativas editáveis. O sistema ajusta a distribuição conforme o conteúdo pendente, o desempenho e os limites dos blocos. A Lei nº 8.666/1993 permanece como referência histórica expressa no edital de 2022; foi revogada e deverá ser revista à luz do próximo edital. Cada aluno pode personalizar sua cópia sem alterar o modelo público.",
  "disciplinas": [
    {
      "id": "IFRJ-POR",
      "nome": "Língua Portuguesa",
      "cor": "#3B82F6",
      "peso": 8,
      "base_teorica": "pdf",
      "carater": "eliminatorio_classificatorio",
      "nota_minima_pct": 37.5,
      "questoes": 8,
      "pontos_por_questao": 1,
      "minimo_pontos": 3,
      "topicos": [
        {
          "id": "IFRJ-POR-01",
          "nome": "Compreensão e interpretação de textos atuais e clássicos; tipologia textual",
          "incidencia_pct": 9,
          "prioridade": 2,
          "horas_estimadas": 8,
          "semana_sugerida": 1,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-POR-02",
          "nome": "Coesão, coerência, estrutura frasal e adequação textual",
          "incidencia_pct": 9,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 2,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-POR-03",
          "nome": "Ortografia oficial, acentuação gráfica e crase",
          "incidencia_pct": 9,
          "prioridade": 2,
          "horas_estimadas": 6,
          "semana_sugerida": 3,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-POR-04",
          "nome": "Intertextualidade, interdiscursividade, perspectivas, paráfrases, paródias e estilizações",
          "incidencia_pct": 9,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 4,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-POR-05",
          "nome": "Classes de palavras e formação de palavras",
          "incidencia_pct": 8,
          "prioridade": 2,
          "horas_estimadas": 6,
          "semana_sugerida": 5,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-POR-06",
          "nome": "Tempos e modos verbais; valor semântico de preposições, conjunções, locuções e advérbios",
          "incidencia_pct": 8,
          "prioridade": 2,
          "horas_estimadas": 6,
          "semana_sugerida": 6,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-POR-07",
          "nome": "Sintaxe da oração e do período; orações coordenadas e subordinadas",
          "incidencia_pct": 8,
          "prioridade": 2,
          "horas_estimadas": 8,
          "semana_sugerida": 7,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-POR-08",
          "nome": "Pontuação, recursos e variações linguísticas",
          "incidencia_pct": 8,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 8,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-POR-09",
          "nome": "Pronomes e regras pronominais",
          "incidencia_pct": 8,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 9,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-POR-10",
          "nome": "Concordância e regência nominal e verbal",
          "incidencia_pct": 8,
          "prioridade": 2,
          "horas_estimadas": 7,
          "semana_sugerida": 10,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-POR-11",
          "nome": "Significação das palavras e normas de redação; adequação ao documento e ao gênero",
          "incidencia_pct": 8,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 11,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-POR-12",
          "nome": "Práticas de linguagem: oralidade, leitura/escuta, produção escrita e multissemiótica e análise linguística/semiótica",
          "incidencia_pct": 8,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 12,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        }
      ]
    },
    {
      "id": "IFRJ-LEG",
      "nome": "Legislação e Ética",
      "cor": "#A855F7",
      "peso": 7,
      "base_teorica": "lei_seca",
      "carater": "eliminatorio_classificatorio",
      "nota_minima_pct": 42.857142857142854,
      "questoes": 7,
      "pontos_por_questao": 1,
      "minimo_pontos": 3,
      "topicos": [
        {
          "id": "IFRJ-LEG-01",
          "nome": "Constituição Federal — artigos 1º a 15",
          "incidencia_pct": 12,
          "prioridade": 2,
          "horas_estimadas": 8,
          "semana_sugerida": 1,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-LEG-02",
          "nome": "Lei nº 8.112/1990 — regime jurídico dos servidores públicos federais",
          "incidencia_pct": 11,
          "prioridade": 2,
          "horas_estimadas": 12,
          "semana_sugerida": 2,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-LEG-03",
          "nome": "Lei nº 9.394/1996 — Lei de Diretrizes e Bases da Educação",
          "incidencia_pct": 11,
          "prioridade": 2,
          "horas_estimadas": 8,
          "semana_sugerida": 3,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-LEG-04",
          "nome": "Lei nº 8.069/1990 — Estatuto da Criança e do Adolescente",
          "incidencia_pct": 11,
          "prioridade": 2,
          "horas_estimadas": 8,
          "semana_sugerida": 4,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-LEG-05",
          "nome": "Lei nº 13.185/2015 — Programa de Combate à Intimidação Sistemática (Bullying)",
          "incidencia_pct": 11,
          "prioridade": 2,
          "horas_estimadas": 3,
          "semana_sugerida": 5,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-LEG-06",
          "nome": "Resolução CONSUP/IFRJ nº 16/2011 — Regimento Geral do IFRJ",
          "incidencia_pct": 11,
          "prioridade": 2,
          "horas_estimadas": 6,
          "semana_sugerida": 6,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-LEG-07",
          "nome": "Lei nº 8.027/1990 — normas de conduta dos servidores públicos",
          "incidencia_pct": 11,
          "prioridade": 2,
          "horas_estimadas": 4,
          "semana_sugerida": 7,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-LEG-08",
          "nome": "Ética e moral; princípios e valores; democracia, cidadania e função pública",
          "incidencia_pct": 11,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 8,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-LEG-09",
          "nome": "Princípios do Direito Administrativo",
          "incidencia_pct": 11,
          "prioridade": 2,
          "horas_estimadas": 4,
          "semana_sugerida": 9,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        }
      ]
    },
    {
      "id": "IFRJ-INF",
      "nome": "Informática",
      "cor": "#6366F1",
      "peso": 5,
      "base_teorica": "pdf",
      "carater": "eliminatorio_classificatorio",
      "nota_minima_pct": 40.0,
      "questoes": 5,
      "pontos_por_questao": 1,
      "minimo_pontos": 2,
      "topicos": [
        {
          "id": "IFRJ-INF-01",
          "nome": "Internet e intranet: conceitos, tecnologias, ferramentas, aplicativos e procedimentos",
          "incidencia_pct": 9,
          "prioridade": 2,
          "horas_estimadas": 4,
          "semana_sugerida": 1,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-INF-02",
          "nome": "Navegadores, correio eletrônico, grupos de discussão, busca, pesquisa e redes sociais",
          "incidencia_pct": 9,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 2,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-INF-03",
          "nome": "Sistemas operacionais Linux e Windows; software e hardware",
          "incidencia_pct": 9,
          "prioridade": 2,
          "horas_estimadas": 6,
          "semana_sugerida": 3,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-INF-04",
          "nome": "Acesso remoto, transferência de informações e arquivos; áudio, vídeo e multimídia",
          "incidencia_pct": 9,
          "prioridade": 2,
          "horas_estimadas": 4,
          "semana_sugerida": 4,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-INF-05",
          "nome": "Edição de textos — Microsoft Office e LibreOffice",
          "incidencia_pct": 8,
          "prioridade": 2,
          "horas_estimadas": 6,
          "semana_sugerida": 5,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-INF-06",
          "nome": "Planilhas — Microsoft Excel e LibreOffice Calc: elaboração, fórmulas e conceitos",
          "incidencia_pct": 8,
          "prioridade": 2,
          "horas_estimadas": 8,
          "semana_sugerida": 6,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-INF-07",
          "nome": "Apresentações — PowerPoint e LibreOffice Impress: formatos, designs, comandos e conceitos",
          "incidencia_pct": 8,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 7,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-INF-08",
          "nome": "Redes de computadores, redes de comunicação e telecomunicações",
          "incidencia_pct": 8,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 8,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-INF-09",
          "nome": "Proteção e segurança; vírus, worms e pragas virtuais; antivírus, firewall e anti-spyware",
          "incidencia_pct": 8,
          "prioridade": 2,
          "horas_estimadas": 6,
          "semana_sugerida": 9,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-INF-10",
          "nome": "Computação na nuvem (cloud computing)",
          "incidencia_pct": 8,
          "prioridade": 2,
          "horas_estimadas": 3,
          "semana_sugerida": 10,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-INF-11",
          "nome": "Informação, dados, representação de dados, conhecimentos, segurança e inteligência",
          "incidencia_pct": 8,
          "prioridade": 2,
          "horas_estimadas": 4,
          "semana_sugerida": 11,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-INF-12",
          "nome": "Banco de dados, base de dados, documentação e prototipação",
          "incidencia_pct": 8,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 12,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        }
      ]
    },
    {
      "id": "IFRJ-ESP",
      "nome": "Conhecimentos Específicos — Assistente em Administração",
      "cor": "#009845",
      "peso": 30,
      "base_teorica": "pdf",
      "carater": "eliminatorio_classificatorio",
      "nota_minima_pct": 40.0,
      "questoes": 30,
      "pontos_por_questao": 1,
      "minimo_pontos": 12,
      "topicos": [
        {
          "id": "IFRJ-ESP-01",
          "nome": "Estado, Governo e Sociedade: Estado contemporâneo, formação do Estado brasileiro e formas e sistemas de governo",
          "incidencia_pct": 6,
          "prioridade": 2,
          "horas_estimadas": 6,
          "semana_sugerida": 1,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-ESP-02",
          "nome": "Administração estratégica",
          "incidencia_pct": 6,
          "prioridade": 2,
          "horas_estimadas": 6,
          "semana_sugerida": 2,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-ESP-03",
          "nome": "Organização do Estado e da gestão; departamentalização, descentralização e desconcentração",
          "incidencia_pct": 6,
          "prioridade": 2,
          "horas_estimadas": 6,
          "semana_sugerida": 3,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-ESP-04",
          "nome": "Agentes públicos e sua gestão; normas legais e constitucionais aplicáveis",
          "incidencia_pct": 6,
          "prioridade": 2,
          "horas_estimadas": 8,
          "semana_sugerida": 4,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-ESP-05",
          "nome": "Serviço de atendimento ao cidadão",
          "incidencia_pct": 6,
          "prioridade": 2,
          "horas_estimadas": 4,
          "semana_sugerida": 5,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-ESP-06",
          "nome": "Comunicação interna e externa; relacionamento interpessoal e trabalho em equipe",
          "incidencia_pct": 6,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 6,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-ESP-07",
          "nome": "Gestão de conflitos",
          "incidencia_pct": 6,
          "prioridade": 2,
          "horas_estimadas": 4,
          "semana_sugerida": 7,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-ESP-08",
          "nome": "Governança na gestão pública",
          "incidencia_pct": 6,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 8,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-ESP-09",
          "nome": "Administração Pública: conceito, princípios, finalidade, administração direta e indireta, entidades e órgãos públicos",
          "incidencia_pct": 6,
          "prioridade": 2,
          "horas_estimadas": 8,
          "semana_sugerida": 9,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-ESP-10",
          "nome": "Poderes e deveres do administrador público",
          "incidencia_pct": 6,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 10,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-ESP-11",
          "nome": "Ato administrativo: conceito, requisitos, atributos, classificação, espécies, motivação e invalidação",
          "incidencia_pct": 5,
          "prioridade": 2,
          "horas_estimadas": 8,
          "semana_sugerida": 11,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-ESP-12",
          "nome": "Procedimento administrativo",
          "incidencia_pct": 5,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 12,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-ESP-13",
          "nome": "Contratos administrativos: conceito, características, espécies, inexecução e extinção",
          "incidencia_pct": 5,
          "prioridade": 2,
          "horas_estimadas": 7,
          "semana_sugerida": 13,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-ESP-14",
          "nome": "Licitações: conceito, finalidade, princípios, modalidades, dispensa, inexigibilidade, procedimento, anulação e revogação — Leis nº 8.666/1993 e nº 14.133/2021",
          "incidencia_pct": 5,
          "prioridade": 2,
          "horas_estimadas": 12,
          "semana_sugerida": 14,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-ESP-15",
          "nome": "Comunicações oficiais",
          "incidencia_pct": 5,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 15,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-ESP-16",
          "nome": "Raciocínio verbal e lógica das situações; relações entre pessoas, lugares, objetos e eventos fictícios",
          "incidencia_pct": 5,
          "prioridade": 2,
          "horas_estimadas": 8,
          "semana_sugerida": 16,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-ESP-17",
          "nome": "Noções de matemática financeira",
          "incidencia_pct": 5,
          "prioridade": 2,
          "horas_estimadas": 6,
          "semana_sugerida": 17,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        },
        {
          "id": "IFRJ-ESP-18",
          "nome": "Rotinas e processos administrativos",
          "incidencia_pct": 5,
          "prioridade": 2,
          "horas_estimadas": 6,
          "semana_sugerida": 18,
          "status": "pendente",
          "reaberto": false,
          "orfao": false
        }
      ]
    }
  ]
};

  // Catálogo remoto continua separado. Os modelos-base entram no catálogo como
  // planos comuns e podem ser personalizados pelo administrador em Configurações.
  window.CATALOGO_EDITAIS_GLOBAIS = [];
  window.CATALOGO_EDITAIS_BASE = [inss, ifrj];
})();

