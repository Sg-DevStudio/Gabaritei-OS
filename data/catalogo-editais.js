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
  "notaCorte": 94,
  "tipoCorte": "ampla",
  "cortes": {
    "ampla": 94,
    "negros": null,
    "pcd": null
  },
  "janelaProva": {
    "inicio": "",
    "fim": ""
  },
  "emAlta": true,
  "atualizadoEm": "2026-10-02T12:00:00.000Z",
  "fonte": "Edital IFRJ nº 03/2022 retificado: https://selecon.org.br/wp-content/uploads/2022/01/Edital-No-03.2022-Concurso-Publico-TAE-RETIFICACAO1E2.pdf | Estatísticas TEC Concursos, prova de 2022: https://www.tecconcursos.com.br/guias/if-rj-2022/assistente-em-administracao-if-rj/-/- | Classificação final oficial: https://selecon.org.br/pdfs/IFRJTAE/RFCM2%20-%20Ampla%20Concorr%C3%AAncia%20-%20Ensino%20M%C3%A9dio_M%C3%A9dio%20T%C3%A9cnico%20-%20Assistente%20em%20Administra%C3%A7%C3%A3o.pdf | Pesquisa em 02/10/2026.",
  "observacoes": "Preparação pelo edital anterior de 2022; conteúdo, banca e pesos devem ser conferidos no próximo edital. Prova: 50 questões de 1 ponto, Português 8 (16%), Legislação e Ética 7 (14%), Informática 5 (10%) e Específicos 30 (60%). Mínimos eliminatórios: 3/3/2/12 pontos e 30/50 no total (60%). Na lista oficial de Ampla Concorrência de 2022: 1º 49/50 (98%), 10º 47/50 (94%), 25º 46/50 (92%), 50º 44/50 (88%) e 100º 43/50 (86%). São referências de posição na classificação, não notas do último nomeado nem cortes por modalidade; o último nomeado não foi confirmado. A meta inicial editável de 94% é uma escolha de treinamento apoiada no 10º colocado, sem garantia de aprovação. Incidência dos tópicos: cotas de planejamento com 80% proporcional à amostra histórica mapeada do TEC e 20% de cobertura uniforme; todos os tópicos permanecem. Mapeamento parcial: Informática 4/5 e Específicos 28/30; Português 8/8. Em Legislação, as cotas continuam estimativas equilibradas; Constituição recebe prioridade pela concentração observada, sem atribuir percentuais aos itens não mapeados. Uma prova não prevê a próxima. Horas e semanas são estimativas editáveis. A Lei nº 8.666/1993 é referência histórica expressa no edital; conferir a legislação exigida no próximo certame. Cópias pessoais e ciclos existentes dependem do fluxo de atualização do aluno.",
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
          "incidencia_pct": 41,
          "prioridade": 1,
          "horas_estimadas": 8,
          "semana_sugerida": 1,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 4
        },
        {
          "id": "IFRJ-POR-02",
          "nome": "Coesão, coerência, estrutura frasal e adequação textual",
          "incidencia_pct": 2,
          "prioridade": 3,
          "horas_estimadas": 5,
          "semana_sugerida": 2,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-POR-03",
          "nome": "Ortografia oficial, acentuação gráfica e crase",
          "incidencia_pct": 2,
          "prioridade": 3,
          "horas_estimadas": 6,
          "semana_sugerida": 3,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-POR-04",
          "nome": "Intertextualidade, interdiscursividade, perspectivas, paráfrases, paródias e estilizações",
          "incidencia_pct": 2,
          "prioridade": 3,
          "horas_estimadas": 5,
          "semana_sugerida": 4,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-POR-05",
          "nome": "Classes de palavras e formação de palavras",
          "incidencia_pct": 2,
          "prioridade": 3,
          "horas_estimadas": 6,
          "semana_sugerida": 5,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-POR-06",
          "nome": "Tempos e modos verbais; valor semântico de preposições, conjunções, locuções e advérbios",
          "incidencia_pct": 12,
          "prioridade": 2,
          "horas_estimadas": 6,
          "semana_sugerida": 6,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 1
        },
        {
          "id": "IFRJ-POR-07",
          "nome": "Sintaxe da oração e do período; orações coordenadas e subordinadas",
          "incidencia_pct": 11,
          "prioridade": 2,
          "horas_estimadas": 8,
          "semana_sugerida": 7,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 1
        },
        {
          "id": "IFRJ-POR-08",
          "nome": "Pontuação, recursos e variações linguísticas",
          "incidencia_pct": 11,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 8,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 1
        },
        {
          "id": "IFRJ-POR-09",
          "nome": "Pronomes e regras pronominais",
          "incidencia_pct": 2,
          "prioridade": 3,
          "horas_estimadas": 5,
          "semana_sugerida": 9,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-POR-10",
          "nome": "Concordância e regência nominal e verbal",
          "incidencia_pct": 11,
          "prioridade": 2,
          "horas_estimadas": 7,
          "semana_sugerida": 10,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 1
        },
        {
          "id": "IFRJ-POR-11",
          "nome": "Significação das palavras e normas de redação; adequação ao documento e ao gênero",
          "incidencia_pct": 2,
          "prioridade": 3,
          "horas_estimadas": 5,
          "semana_sugerida": 11,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-POR-12",
          "nome": "Práticas de linguagem: oralidade, leitura/escuta, produção escrita e multissemiótica e análise linguística/semiótica",
          "incidencia_pct": 2,
          "prioridade": 3,
          "horas_estimadas": 5,
          "semana_sugerida": 12,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        }
      ],
      "referenciaIncidencia": {
        "tipo": "amostra_historica_com_reserva",
        "fonte": "https://www.tecconcursos.com.br/guias/if-rj-2022/assistente-em-administracao-if-rj/-/-",
        "questoesNaAmostra": 8,
        "questoesMapeadas": 8,
        "reservaCoberturaPct": 20,
        "formula": "80% proporcional às questões mapeadas + 20% uniforme entre todos os tópicos; arredondamento pelo maior resto. Cota de planejamento, não frequência bruta nem probabilidade futura."
      }
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
          "prioridade": 1,
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
      ],
      "referenciaIncidencia": {
        "tipo": "estimativa_equilibrada",
        "fonte": "https://www.tecconcursos.com.br/guias/if-rj-2022/assistente-em-administracao-if-rj/-/-",
        "observacao": "TEC registra 5 questões de Direito Constitucional na prova de 2022; sem mapeamento integral dos 7 itens ao cadastro. Percentuais mantidos como estimativas de cobertura."
      }
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
          "incidencia_pct": 2,
          "prioridade": 3,
          "horas_estimadas": 4,
          "semana_sugerida": 1,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-INF-02",
          "nome": "Navegadores, correio eletrônico, grupos de discussão, busca, pesquisa e redes sociais",
          "incidencia_pct": 2,
          "prioridade": 3,
          "horas_estimadas": 5,
          "semana_sugerida": 2,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-INF-03",
          "nome": "Sistemas operacionais Linux e Windows; software e hardware",
          "incidencia_pct": 41,
          "prioridade": 1,
          "horas_estimadas": 6,
          "semana_sugerida": 3,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 2
        },
        {
          "id": "IFRJ-INF-04",
          "nome": "Acesso remoto, transferência de informações e arquivos; áudio, vídeo e multimídia",
          "incidencia_pct": 2,
          "prioridade": 3,
          "horas_estimadas": 4,
          "semana_sugerida": 4,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-INF-05",
          "nome": "Edição de textos — Microsoft Office e LibreOffice",
          "incidencia_pct": 2,
          "prioridade": 3,
          "horas_estimadas": 6,
          "semana_sugerida": 5,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-INF-06",
          "nome": "Planilhas — Microsoft Excel e LibreOffice Calc: elaboração, fórmulas e conceitos",
          "incidencia_pct": 22,
          "prioridade": 1,
          "horas_estimadas": 8,
          "semana_sugerida": 6,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 1
        },
        {
          "id": "IFRJ-INF-07",
          "nome": "Apresentações — PowerPoint e LibreOffice Impress: formatos, designs, comandos e conceitos",
          "incidencia_pct": 2,
          "prioridade": 3,
          "horas_estimadas": 5,
          "semana_sugerida": 7,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-INF-08",
          "nome": "Redes de computadores, redes de comunicação e telecomunicações",
          "incidencia_pct": 2,
          "prioridade": 3,
          "horas_estimadas": 5,
          "semana_sugerida": 8,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-INF-09",
          "nome": "Proteção e segurança; vírus, worms e pragas virtuais; antivírus, firewall e anti-spyware",
          "incidencia_pct": 1,
          "prioridade": 3,
          "horas_estimadas": 6,
          "semana_sugerida": 9,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-INF-10",
          "nome": "Computação na nuvem (cloud computing)",
          "incidencia_pct": 22,
          "prioridade": 1,
          "horas_estimadas": 3,
          "semana_sugerida": 10,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 1
        },
        {
          "id": "IFRJ-INF-11",
          "nome": "Informação, dados, representação de dados, conhecimentos, segurança e inteligência",
          "incidencia_pct": 1,
          "prioridade": 3,
          "horas_estimadas": 4,
          "semana_sugerida": 11,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-INF-12",
          "nome": "Banco de dados, base de dados, documentação e prototipação",
          "incidencia_pct": 1,
          "prioridade": 3,
          "horas_estimadas": 5,
          "semana_sugerida": 12,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        }
      ],
      "referenciaIncidencia": {
        "tipo": "amostra_historica_com_reserva",
        "fonte": "https://www.tecconcursos.com.br/guias/if-rj-2022/assistente-em-administracao-if-rj/-/-",
        "questoesNaAmostra": 5,
        "questoesMapeadas": 4,
        "reservaCoberturaPct": 20,
        "formula": "80% proporcional às questões mapeadas + 20% uniforme entre todos os tópicos; arredondamento pelo maior resto. Cota de planejamento, não frequência bruta nem probabilidade futura."
      }
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
          "incidencia_pct": 1,
          "prioridade": 3,
          "horas_estimadas": 6,
          "semana_sugerida": 1,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-ESP-02",
          "nome": "Administração estratégica",
          "incidencia_pct": 7,
          "prioridade": 2,
          "horas_estimadas": 6,
          "semana_sugerida": 2,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 2
        },
        {
          "id": "IFRJ-ESP-03",
          "nome": "Organização do Estado e da gestão; departamentalização, descentralização e desconcentração",
          "incidencia_pct": 4,
          "prioridade": 2,
          "horas_estimadas": 6,
          "semana_sugerida": 3,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 1
        },
        {
          "id": "IFRJ-ESP-04",
          "nome": "Agentes públicos e sua gestão; normas legais e constitucionais aplicáveis",
          "incidencia_pct": 4,
          "prioridade": 2,
          "horas_estimadas": 8,
          "semana_sugerida": 4,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 1
        },
        {
          "id": "IFRJ-ESP-05",
          "nome": "Serviço de atendimento ao cidadão",
          "incidencia_pct": 1,
          "prioridade": 3,
          "horas_estimadas": 4,
          "semana_sugerida": 5,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-ESP-06",
          "nome": "Comunicação interna e externa; relacionamento interpessoal e trabalho em equipe",
          "incidencia_pct": 1,
          "prioridade": 3,
          "horas_estimadas": 5,
          "semana_sugerida": 6,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-ESP-07",
          "nome": "Gestão de conflitos",
          "incidencia_pct": 1,
          "prioridade": 3,
          "horas_estimadas": 4,
          "semana_sugerida": 7,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-ESP-08",
          "nome": "Governança na gestão pública",
          "incidencia_pct": 7,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 8,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 2
        },
        {
          "id": "IFRJ-ESP-09",
          "nome": "Administração Pública: conceito, princípios, finalidade, administração direta e indireta, entidades e órgãos públicos",
          "incidencia_pct": 1,
          "prioridade": 3,
          "horas_estimadas": 8,
          "semana_sugerida": 9,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-ESP-10",
          "nome": "Poderes e deveres do administrador público",
          "incidencia_pct": 1,
          "prioridade": 3,
          "horas_estimadas": 5,
          "semana_sugerida": 10,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-ESP-11",
          "nome": "Ato administrativo: conceito, requisitos, atributos, classificação, espécies, motivação e invalidação",
          "incidencia_pct": 4,
          "prioridade": 2,
          "horas_estimadas": 8,
          "semana_sugerida": 11,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 1
        },
        {
          "id": "IFRJ-ESP-12",
          "nome": "Procedimento administrativo",
          "incidencia_pct": 1,
          "prioridade": 3,
          "horas_estimadas": 5,
          "semana_sugerida": 12,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-ESP-13",
          "nome": "Contratos administrativos: conceito, características, espécies, inexecução e extinção",
          "incidencia_pct": 10,
          "prioridade": 2,
          "horas_estimadas": 7,
          "semana_sugerida": 13,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 3
        },
        {
          "id": "IFRJ-ESP-14",
          "nome": "Licitações: conceito, finalidade, princípios, modalidades, dispensa, inexigibilidade, procedimento, anulação e revogação — Leis nº 8.666/1993 e nº 14.133/2021",
          "incidencia_pct": 18,
          "prioridade": 1,
          "horas_estimadas": 12,
          "semana_sugerida": 14,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 6
        },
        {
          "id": "IFRJ-ESP-15",
          "nome": "Comunicações oficiais",
          "incidencia_pct": 24,
          "prioridade": 1,
          "horas_estimadas": 5,
          "semana_sugerida": 15,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 8
        },
        {
          "id": "IFRJ-ESP-16",
          "nome": "Raciocínio verbal e lógica das situações; relações entre pessoas, lugares, objetos e eventos fictícios",
          "incidencia_pct": 1,
          "prioridade": 3,
          "horas_estimadas": 8,
          "semana_sugerida": 16,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        },
        {
          "id": "IFRJ-ESP-17",
          "nome": "Noções de matemática financeira",
          "incidencia_pct": 13,
          "prioridade": 1,
          "horas_estimadas": 6,
          "semana_sugerida": 17,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 4
        },
        {
          "id": "IFRJ-ESP-18",
          "nome": "Rotinas e processos administrativos",
          "incidencia_pct": 1,
          "prioridade": 3,
          "horas_estimadas": 6,
          "semana_sugerida": 18,
          "status": "pendente",
          "reaberto": false,
          "orfao": false,
          "questoes_referencia": 0
        }
      ],
      "referenciaIncidencia": {
        "tipo": "amostra_historica_com_reserva",
        "fonte": "https://www.tecconcursos.com.br/guias/if-rj-2022/assistente-em-administracao-if-rj/-/-",
        "questoesNaAmostra": 30,
        "questoesMapeadas": 28,
        "reservaCoberturaPct": 20,
        "formula": "80% proporcional às questões mapeadas + 20% uniforme entre todos os tópicos; arredondamento pelo maior resto. Cota de planejamento, não frequência bruta nem probabilidade futura."
      }
    }
  ],
  "referenciaClassificacao": {
    "ano": 2022,
    "lista": "Ampla Concorrência (inclui candidatos de cotas concorrendo nesta lista)",
    "escalaPontos": 50,
    "minimoEliminatorioPct": 60,
    "ultimoNomeado": null,
    "fonte": "https://selecon.org.br/pdfs/IFRJTAE/RFCM2%20-%20Ampla%20Concorr%C3%AAncia%20-%20Ensino%20M%C3%A9dio_M%C3%A9dio%20T%C3%A9cnico%20-%20Assistente%20em%20Administra%C3%A7%C3%A3o.pdf",
    "posicoes": [
      {
        "posicao": 1,
        "pontos": 49,
        "pct": 98
      },
      {
        "posicao": 10,
        "pontos": 47,
        "pct": 94
      },
      {
        "posicao": 25,
        "pontos": 46,
        "pct": 92
      },
      {
        "posicao": 50,
        "pontos": 44,
        "pct": 88
      },
      {
        "posicao": 100,
        "pontos": 43,
        "pct": 86
      }
    ]
  }
};

  var cpii = {
  "tipo": "edital_esquematizado",
  "versao": 1,
  "gerado_em": "2026-06-24",
  "titulo": "Colégio Pedro II — Assistente em Administração (Edital TAE nº 26/2023)",
  "banca": "Pró-Reitoria de Gestão de Pessoas do Colégio Pedro II",
  "cargo": "Assistente em Administração (Classe D / nível médio - PCCTAE)",
  "fonte": "Edital TAE nº 26/2023, Tabela 4 e Anexo 3: https://jcconcursos.com.br/media/uploads/anexos/concurso-colegio-pedro-ii-edital-26-2023.pdf | Prova aplicada em 04/02/2024: https://arquivos.qconcursos.com/prova/arquivo_prova/131585/colegio-pedro-ii-2024-colegio-pedro-ii-assistente-em-administracao-prova.pdf | Estatísticas TEC Concursos, filtro 2024: https://www.tecconcursos.com.br/guias/cp-ii-2023/assistente-em-administracao-cp-ii/-/- | Pesquisa em 02/10/2026.",
  "disciplinas": [
    {
      "id": "POR",
      "nome": "Língua Portuguesa",
      "cor": "#E67E22",
      "peso": 20,
      "base_teorica": "pdf",
      "topicos": [
        {
          "id": "POR-01",
          "nome": "Leitura, compreensão e interpretação de gêneros discursivos; condições de produção, estrutura composicional e função social",
          "incidencia_pct": 22,
          "prioridade": 1,
          "horas_estimadas": 14,
          "semana_sugerida": 1,
          "status": "pendente",
          "questoes_referencia": 5
        },
        {
          "id": "POR-02",
          "nome": "Sequências textuais (narração, argumentação, descrição, instrução)",
          "incidencia_pct": 3,
          "prioridade": 3,
          "horas_estimadas": 3,
          "semana_sugerida": 2,
          "status": "pendente",
          "questoes_referencia": 0
        },
        {
          "id": "POR-03",
          "nome": "Linguagem verbal e não verbal; variações linguísticas; funções da linguagem",
          "incidencia_pct": 3,
          "prioridade": 3,
          "horas_estimadas": 3,
          "semana_sugerida": 3,
          "status": "pendente",
          "questoes_referencia": 0
        },
        {
          "id": "POR-04",
          "nome": "Morfologia, formação e flexão de palavras; pronomes e colocação pronominal",
          "incidencia_pct": 14,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 4,
          "status": "pendente",
          "questoes_referencia": 3
        },
        {
          "id": "POR-05",
          "nome": "Coesão, coerência, argumentação, intertextualidade e reescrita",
          "incidencia_pct": 10,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 5,
          "status": "pendente",
          "questoes_referencia": 2
        },
        {
          "id": "POR-06",
          "nome": "Sintaxe — frase, oração, períodos simples e compostos; concordância verbal e nominal",
          "incidencia_pct": 14,
          "prioridade": 2,
          "horas_estimadas": 6,
          "semana_sugerida": 6,
          "status": "pendente",
          "questoes_referencia": 3
        },
        {
          "id": "POR-07",
          "nome": "Sintaxe — regência e crase",
          "incidencia_pct": 2,
          "prioridade": 3,
          "horas_estimadas": 5,
          "semana_sugerida": 7,
          "status": "pendente",
          "questoes_referencia": 0
        },
        {
          "id": "POR-08",
          "nome": "Semântica — denotação, conotação, figuras de linguagem",
          "incidencia_pct": 30,
          "prioridade": 1,
          "horas_estimadas": 3,
          "semana_sugerida": 8,
          "status": "pendente",
          "questoes_referencia": 7
        },
        {
          "id": "POR-09",
          "nome": "Ortografia, pontuação e acentuação; tipos e normas de composição da redação oficial",
          "incidencia_pct": 2,
          "prioridade": 3,
          "horas_estimadas": 5,
          "semana_sugerida": 9,
          "status": "pendente",
          "questoes_referencia": 0
        }
      ],
      "blocoProva": "POR",
      "tipoPeso": "pontos_oficiais",
      "referenciaIncidencia": {
        "tipo": "amostra_historica_com_reserva",
        "fonte": "https://www.tecconcursos.com.br/guias/cp-ii-2023/assistente-em-administracao-cp-ii/-/-",
        "questoesNaAmostra": 20,
        "questoesMapeadas": 20,
        "reservaCoberturaPct": 20,
        "formula": "80% proporcional às questões mapeadas + 20% uniforme entre todos os tópicos; arredondamento pelo maior resto. Cota de planejamento, não frequência bruta nem probabilidade futura."
      }
    },
    {
      "id": "INF",
      "nome": "Informática",
      "cor": "#2980B9",
      "peso": 10,
      "base_teorica": "video",
      "topicos": [
        {
          "id": "INF-01",
          "nome": "Hardware, software, periféricos e dispositivos de armazenamento",
          "incidencia_pct": 12,
          "prioridade": 1,
          "horas_estimadas": 4,
          "semana_sugerida": 1,
          "status": "pendente",
          "questoes_referencia": 1
        },
        {
          "id": "INF-02",
          "nome": "Sistema Operacional Microsoft Windows",
          "incidencia_pct": 20,
          "prioridade": 1,
          "horas_estimadas": 4,
          "semana_sugerida": 2,
          "status": "pendente",
          "questoes_referencia": 2
        },
        {
          "id": "INF-03",
          "nome": "Microsoft Word 2013",
          "incidencia_pct": 20,
          "prioridade": 1,
          "horas_estimadas": 4,
          "semana_sugerida": 3,
          "status": "pendente",
          "questoes_referencia": 2
        },
        {
          "id": "INF-04",
          "nome": "Microsoft Excel 2013",
          "incidencia_pct": 11,
          "prioridade": 1,
          "horas_estimadas": 6,
          "semana_sugerida": 4,
          "status": "pendente",
          "questoes_referencia": 1
        },
        {
          "id": "INF-05",
          "nome": "Microsoft PowerPoint 2013",
          "incidencia_pct": 3,
          "prioridade": 3,
          "horas_estimadas": 2,
          "semana_sugerida": 5,
          "status": "pendente",
          "questoes_referencia": 0
        },
        {
          "id": "INF-06",
          "nome": "Redes de computadores, Internet e navegadores (Edge, Firefox, Chrome)",
          "incidencia_pct": 20,
          "prioridade": 1,
          "horas_estimadas": 4,
          "semana_sugerida": 6,
          "status": "pendente",
          "questoes_referencia": 2
        },
        {
          "id": "INF-07",
          "nome": "Correio eletrônico e Google Meet",
          "incidencia_pct": 11,
          "prioridade": 1,
          "horas_estimadas": 2,
          "semana_sugerida": 7,
          "status": "pendente",
          "questoes_referencia": 1
        },
        {
          "id": "INF-08",
          "nome": "Segurança da informação (antivírus, firewall)",
          "incidencia_pct": 3,
          "prioridade": 3,
          "horas_estimadas": 3,
          "semana_sugerida": 8,
          "status": "pendente",
          "questoes_referencia": 0
        }
      ],
      "blocoProva": "INF",
      "tipoPeso": "pontos_oficiais",
      "referenciaIncidencia": {
        "tipo": "amostra_historica_com_reserva",
        "fonte": "https://www.tecconcursos.com.br/guias/cp-ii-2023/assistente-em-administracao-cp-ii/-/-",
        "questoesNaAmostra": 10,
        "questoesMapeadas": 9,
        "reservaCoberturaPct": 20,
        "formula": "80% proporcional às questões mapeadas + 20% uniforme entre todos os tópicos; arredondamento pelo maior resto. Cota de planejamento, não frequência bruta nem probabilidade futura."
      }
    },
    {
      "id": "RLM",
      "nome": "Raciocínio Lógico",
      "cor": "#8E44AD",
      "peso": 10,
      "base_teorica": "video",
      "topicos": [
        {
          "id": "RLM-01",
          "nome": "Lógica de argumentação, proposições, conectivos e tabelas-verdade",
          "incidencia_pct": 28,
          "prioridade": 1,
          "horas_estimadas": 10,
          "semana_sugerida": 1,
          "status": "pendente"
        },
        {
          "id": "RLM-02",
          "nome": "Diagramas lógicos e estrutura lógica de relações",
          "incidencia_pct": 16,
          "prioridade": 1,
          "horas_estimadas": 6,
          "semana_sugerida": 2,
          "status": "pendente"
        },
        {
          "id": "RLM-03",
          "nome": "Conjuntos e operações",
          "incidencia_pct": 14,
          "prioridade": 2,
          "horas_estimadas": 5,
          "semana_sugerida": 3,
          "status": "pendente"
        },
        {
          "id": "RLM-04",
          "nome": "Razão, proporção e porcentagem",
          "incidencia_pct": 24,
          "prioridade": 1,
          "horas_estimadas": 8,
          "semana_sugerida": 4,
          "status": "pendente"
        },
        {
          "id": "RLM-05",
          "nome": "Resolução de problemas (raciocínio quantitativo)",
          "incidencia_pct": 18,
          "prioridade": 2,
          "horas_estimadas": 7,
          "semana_sugerida": 5,
          "status": "pendente"
        }
      ],
      "blocoProva": "RLM",
      "tipoPeso": "pontos_oficiais",
      "referenciaIncidencia": {
        "tipo": "estimativa_de_planejamento",
        "observacao": "Sem mapeamento integral da incidência histórica; cota editável."
      }
    },
    {
      "id": "LEG",
      "nome": "Legislação",
      "cor": "#27AE60",
      "peso": 10,
      "base_teorica": "lei_seca",
      "topicos": [
        {
          "id": "LEG-01",
          "nome": "Constituição Federal — Títulos I e II; Título III, Cap. VII, Seções I e II; Título VIII, Caps. III e IV",
          "incidencia_pct": 18,
          "prioridade": 1,
          "horas_estimadas": 8,
          "semana_sugerida": 2,
          "status": "pendente"
        },
        {
          "id": "LEG-02",
          "nome": "Lei 8.112/1990 — regime jurídico, provimento, vacância, deveres, PAD",
          "incidencia_pct": 18,
          "prioridade": 1,
          "horas_estimadas": 9,
          "semana_sugerida": 4,
          "status": "pendente"
        },
        {
          "id": "LEG-03",
          "nome": "Decreto 1.171/1994 — Código de Ética do servidor público federal",
          "incidencia_pct": 9,
          "prioridade": 1,
          "horas_estimadas": 3,
          "semana_sugerida": 5,
          "status": "pendente"
        },
        {
          "id": "LEG-04",
          "nome": "Lei 11.091/2005 — Plano de Carreira dos Cargos TAE (PCCTAE); Lei 11.892/2008 — Rede Federal de Educação",
          "incidencia_pct": 10,
          "prioridade": 1,
          "horas_estimadas": 4,
          "semana_sugerida": 6,
          "status": "pendente"
        },
        {
          "id": "LEG-05",
          "nome": "Lei 9.784/1999 — Processo Administrativo Federal",
          "incidencia_pct": 9,
          "prioridade": 2,
          "horas_estimadas": 4,
          "semana_sugerida": 7,
          "status": "pendente"
        },
        {
          "id": "LEG-06",
          "nome": "Lei 8.429/1992 — Improbidade Administrativa (c/ Lei 14.230/2021)",
          "incidencia_pct": 9,
          "prioridade": 2,
          "horas_estimadas": 4,
          "semana_sugerida": 8,
          "status": "pendente"
        },
        {
          "id": "LEG-07",
          "nome": "Lei 12.527/2011 — Acesso à Informação; Decreto 7.724/2012 — regulamentação da LAI",
          "incidencia_pct": 9,
          "prioridade": 2,
          "horas_estimadas": 3,
          "semana_sugerida": 9,
          "status": "pendente"
        },
        {
          "id": "LEG-08",
          "nome": "Lei 13.709/2018 — LGPD",
          "incidencia_pct": 8,
          "prioridade": 2,
          "horas_estimadas": 3,
          "semana_sugerida": 10,
          "status": "pendente"
        },
        {
          "id": "LEG-09",
          "nome": "Lei 13.146/2015 — Estatuto da Pessoa com Deficiência",
          "incidencia_pct": 5,
          "prioridade": 3,
          "horas_estimadas": 3,
          "semana_sugerida": 11,
          "status": "pendente"
        },
        {
          "id": "LEG-10",
          "nome": "Lei 13.185/2015 — Programa de Combate ao Bullying",
          "incidencia_pct": 5,
          "prioridade": 3,
          "horas_estimadas": 2,
          "semana_sugerida": 12,
          "status": "pendente"
        }
      ],
      "blocoProva": "LEG",
      "tipoPeso": "pontos_oficiais",
      "referenciaIncidencia": {
        "tipo": "estimativa_de_planejamento",
        "observacao": "Sem mapeamento integral da incidência histórica; cota editável."
      }
    },
    {
      "id": "DAD",
      "nome": "Direito Administrativo",
      "cor": "#16A085",
      "peso": 8,
      "base_teorica": "pdf",
      "topicos": [
        {
          "id": "DAD-01",
          "nome": "Princípios da Administração Pública",
          "incidencia_pct": 4,
          "prioridade": 3,
          "horas_estimadas": 5,
          "semana_sugerida": 1,
          "status": "pendente",
          "questoes_referencia": 0
        },
        {
          "id": "DAD-02",
          "nome": "Poderes da Administração",
          "incidencia_pct": 3,
          "prioridade": 3,
          "horas_estimadas": 4,
          "semana_sugerida": 2,
          "status": "pendente",
          "questoes_referencia": 0
        },
        {
          "id": "DAD-03",
          "nome": "Atos administrativos — conceito, atributos, espécies, vícios",
          "incidencia_pct": 44,
          "prioridade": 1,
          "horas_estimadas": 7,
          "semana_sugerida": 3,
          "status": "pendente",
          "questoes_referencia": 2
        },
        {
          "id": "DAD-04",
          "nome": "Organização administrativa — direta e indireta",
          "incidencia_pct": 3,
          "prioridade": 3,
          "horas_estimadas": 4,
          "semana_sugerida": 4,
          "status": "pendente",
          "questoes_referencia": 0
        },
        {
          "id": "DAD-05",
          "nome": "Licitação — Lei 14.133/2021 e Lei 8.666/1993 (referência histórica do edital)",
          "incidencia_pct": 23,
          "prioridade": 1,
          "horas_estimadas": 8,
          "semana_sugerida": 5,
          "status": "pendente",
          "questoes_referencia": 1
        },
        {
          "id": "DAD-06",
          "nome": "Processo administrativo federal (Lei 9.784/1999 — aplicação)",
          "incidencia_pct": 23,
          "prioridade": 1,
          "horas_estimadas": 3,
          "semana_sugerida": 6,
          "status": "pendente",
          "questoes_referencia": 1
        }
      ],
      "blocoProva": "ESP",
      "tipoPeso": "cota_estimada_no_bloco_especifico",
      "referenciaIncidencia": {
        "tipo": "amostra_historica_com_reserva",
        "fonte": "https://arquivos.qconcursos.com/prova/arquivo_prova/131585/colegio-pedro-ii-2024-colegio-pedro-ii-assistente-em-administracao-prova.pdf",
        "questoesNaAmostra": 4,
        "questoesMapeadas": 4,
        "reservaCoberturaPct": 20,
        "formula": "80% proporcional às questões mapeadas + 20% uniforme entre todos os tópicos; arredondamento pelo maior resto. Cota de planejamento, não frequência bruta nem probabilidade futura."
      }
    },
    {
      "id": "ADM",
      "nome": "Administração Geral",
      "cor": "#34495E",
      "peso": 34,
      "base_teorica": "pdf",
      "topicos": [
        {
          "id": "ADM-01",
          "nome": "Abordagem neoclássica e funções administrativas; características, princípios e níveis da administração",
          "incidencia_pct": 22,
          "prioridade": 1,
          "horas_estimadas": 4,
          "semana_sugerida": 1,
          "status": "pendente",
          "questoes_referencia": 4
        },
        {
          "id": "ADM-02",
          "nome": "Planejamento estratégico e análise SWOT; conceito e tipos de planejamento",
          "incidencia_pct": 17,
          "prioridade": 1,
          "horas_estimadas": 6,
          "semana_sugerida": 2,
          "status": "pendente",
          "questoes_referencia": 3
        },
        {
          "id": "ADM-03",
          "nome": "Tipos de organização e estrutura organizacional",
          "incidencia_pct": 17,
          "prioridade": 1,
          "horas_estimadas": 4,
          "semana_sugerida": 3,
          "status": "pendente",
          "questoes_referencia": 3
        },
        {
          "id": "ADM-04",
          "nome": "Motivação e liderança; comunicação e negociação",
          "incidencia_pct": 22,
          "prioridade": 1,
          "horas_estimadas": 5,
          "semana_sugerida": 4,
          "status": "pendente",
          "questoes_referencia": 4
        },
        {
          "id": "ADM-05",
          "nome": "Cultura organizacional; organizações formais e informais; ética profissional",
          "incidencia_pct": 22,
          "prioridade": 1,
          "horas_estimadas": 4,
          "semana_sugerida": 5,
          "status": "pendente",
          "questoes_referencia": 4
        }
      ],
      "blocoProva": "ESP",
      "tipoPeso": "cota_estimada_no_bloco_especifico",
      "referenciaIncidencia": {
        "tipo": "amostra_historica_com_reserva",
        "fonte": "https://arquivos.qconcursos.com/prova/arquivo_prova/131585/colegio-pedro-ii-2024-colegio-pedro-ii-assistente-em-administracao-prova.pdf",
        "questoesNaAmostra": 18,
        "questoesMapeadas": 18,
        "reservaCoberturaPct": 20,
        "formula": "80% proporcional às questões mapeadas + 20% uniforme entre todos os tópicos; arredondamento pelo maior resto. Cota de planejamento, não frequência bruta nem probabilidade futura."
      }
    },
    {
      "id": "ARQ",
      "nome": "Arquivologia",
      "cor": "#7F8C8D",
      "peso": 4,
      "base_teorica": "pdf",
      "topicos": [
        {
          "id": "ARQ-01",
          "nome": "Conceituação de arquivos e documentos de arquivo",
          "incidencia_pct": 4,
          "prioridade": 3,
          "horas_estimadas": 3,
          "semana_sugerida": 1,
          "status": "pendente",
          "questoes_referencia": 0
        },
        {
          "id": "ARQ-02",
          "nome": "Princípios arquivísticos",
          "incidencia_pct": 4,
          "prioridade": 3,
          "horas_estimadas": 3,
          "semana_sugerida": 2,
          "status": "pendente",
          "questoes_referencia": 0
        },
        {
          "id": "ARQ-03",
          "nome": "Teoria das três idades",
          "incidencia_pct": 44,
          "prioridade": 1,
          "horas_estimadas": 3,
          "semana_sugerida": 3,
          "status": "pendente",
          "questoes_referencia": 1
        },
        {
          "id": "ARQ-04",
          "nome": "Gestão de documentos — conceitos, objetivos e fases",
          "incidencia_pct": 44,
          "prioridade": 1,
          "horas_estimadas": 4,
          "semana_sugerida": 4,
          "status": "pendente",
          "questoes_referencia": 1
        },
        {
          "id": "ARQ-05",
          "nome": "Tabela de temporalidade e destinação de documentos",
          "incidencia_pct": 4,
          "prioridade": 3,
          "horas_estimadas": 4,
          "semana_sugerida": 5,
          "status": "pendente",
          "questoes_referencia": 0
        }
      ],
      "blocoProva": "ESP",
      "tipoPeso": "cota_estimada_no_bloco_especifico",
      "referenciaIncidencia": {
        "tipo": "amostra_historica_com_reserva",
        "fonte": "https://arquivos.qconcursos.com/prova/arquivo_prova/131585/colegio-pedro-ii-2024-colegio-pedro-ii-assistente-em-administracao-prova.pdf",
        "questoesNaAmostra": 2,
        "questoesMapeadas": 2,
        "reservaCoberturaPct": 20,
        "formula": "80% proporcional às questões mapeadas + 20% uniforme entre todos os tópicos; arredondamento pelo maior resto. Cota de planejamento, não frequência bruta nem probabilidade futura."
      }
    },
    {
      "id": "RED",
      "nome": "Redação Oficial",
      "cor": "#C0392B",
      "peso": 2,
      "base_teorica": "pdf",
      "topicos": [
        {
          "id": "RED-01",
          "nome": "Manual de Redação da Presidência da República — princípios e padrão ofício",
          "incidencia_pct": 55,
          "prioridade": 1,
          "horas_estimadas": 5,
          "semana_sugerida": 1,
          "status": "pendente"
        },
        {
          "id": "RED-02",
          "nome": "Tipos de documentos oficiais (ofício, memorando, e-mail institucional)",
          "incidencia_pct": 45,
          "prioridade": 1,
          "horas_estimadas": 5,
          "semana_sugerida": 2,
          "status": "pendente"
        }
      ],
      "blocoProva": "ESP",
      "tipoPeso": "cota_estimada_no_bloco_especifico",
      "referenciaIncidencia": {
        "tipo": "estimativa_de_planejamento",
        "observacao": "Sem mapeamento integral da incidência histórica; cota editável."
      }
    },
    {
      "id": "ECA",
      "nome": "Estatuto da Criança e do Adolescente",
      "cor": "#F39C12",
      "peso": 2,
      "base_teorica": "lei_seca",
      "topicos": [
        {
          "id": "ECA-01",
          "nome": "Lei 8.069/1990 — disposições preliminares e direitos fundamentais",
          "incidencia_pct": 7,
          "prioridade": 3,
          "horas_estimadas": 3,
          "semana_sugerida": 1,
          "status": "pendente",
          "questoes_referencia": 0
        },
        {
          "id": "ECA-02",
          "nome": "Direito à educação, cultura, esporte e lazer",
          "incidencia_pct": 87,
          "prioridade": 1,
          "horas_estimadas": 3,
          "semana_sugerida": 2,
          "status": "pendente",
          "questoes_referencia": 1
        },
        {
          "id": "ECA-03",
          "nome": "Prevenção",
          "incidencia_pct": 6,
          "prioridade": 3,
          "horas_estimadas": 2,
          "semana_sugerida": 3,
          "status": "pendente",
          "questoes_referencia": 0
        }
      ],
      "blocoProva": "ESP",
      "tipoPeso": "cota_estimada_no_bloco_especifico",
      "referenciaIncidencia": {
        "tipo": "amostra_historica_com_reserva",
        "fonte": "https://arquivos.qconcursos.com/prova/arquivo_prova/131585/colegio-pedro-ii-2024-colegio-pedro-ii-assistente-em-administracao-prova.pdf",
        "questoesNaAmostra": 1,
        "questoesMapeadas": 1,
        "reservaCoberturaPct": 20,
        "formula": "80% proporcional às questões mapeadas + 20% uniforme entre todos os tópicos; arredondamento pelo maior resto. Cota de planejamento, não frequência bruta nem probabilidade futura."
      }
    }
  ],
  "id": "edital-cpii-assistente-administracao-2023",
  "atualizadoEm": "2026-10-02T12:00:00.000Z",
  "orgao": "Colégio Pedro II",
  "estado": "RJ",
  "nivel": "medio",
  "area": "",
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
  "observacoes": "Modelo histórico do edital de 2023, prova de 2024, organizada pelo próprio Colégio Pedro II. Prova objetiva: 75 questões, 100 pontos; Português 20×1, Informática 10×1, Raciocínio Lógico 10×1, Legislação 10×1 e Específicos 25×2. Mínimo eliminatório de 60 pontos e nenhuma disciplina oficial zerada; não há prova discursiva neste modelo. Específicos representam 50% dos pontos. Para organizar o estudo, esse bloco foi dividido em Administração 34, Direito Administrativo 8, Arquivologia 4, ECA 2 e Redação Oficial 2: cotas estimadas, não pesos oficiais de cinco disciplinas independentes. A prova específica teve 18/4/2/1/0 questões nesses grupos; a reserva de 2 pontos para Redação foi retirada da cota de Administração para manter cobertura do edital. Percentuais internos: 80% da amostra mapeada + 20% uniforme; Informática mapeada 9/10. Legislação, Raciocínio Lógico e Redação mantêm estimativas, sem incidência integral apurada. Uma prova não prevê a próxima; horas e semanas são estimativas editáveis. A meta de 80% é apenas meta inicial de treinamento; não há nota de último nomeado confirmada, inclusive por cotas. Windows e Office seguem as versões do edital, ainda que o TEC classifique questões por outras versões. Referências legais históricas deverão ser revistas no próximo edital.",
  "estruturaProva": {
    "totalQuestoes": 75,
    "totalPontos": 100,
    "minimoPontos": 60,
    "naoZerarDisciplina": true,
    "blocos": [
      {
        "id": "POR",
        "questoes": 20,
        "pontosPorQuestao": 1
      },
      {
        "id": "INF",
        "questoes": 10,
        "pontosPorQuestao": 1
      },
      {
        "id": "RLM",
        "questoes": 10,
        "pontosPorQuestao": 1
      },
      {
        "id": "LEG",
        "questoes": 10,
        "pontosPorQuestao": 1
      },
      {
        "id": "ESP",
        "questoes": 25,
        "pontosPorQuestao": 2
      }
    ]
  }
};

  // Catálogo remoto continua separado. Os modelos-base entram no catálogo como
  // planos comuns e podem ser personalizados pelo administrador em Configurações.
  window.CATALOGO_EDITAIS_GLOBAIS = [];
  window.CATALOGO_EDITAIS_BASE = [inss, ifrj, cpii];
})();

