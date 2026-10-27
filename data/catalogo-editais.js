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

  var trf2 = {
    "id": "carreira-trf2-tjaa-2024",
    "tipoCatalogo": "concurso",
    "titulo": "TRF2 — Técnico Judiciário · Área Administrativa (base 2024)",
    "orgao": "Tribunal Regional Federal da 2ª Região — TRF2",
    "cargo": "Técnico Judiciário — Área Administrativa, sem especialidade",
    "area": "Administrativa",
    "estado": "RJ",
    "nivel": "superior",
    "banca": "Instituto AOCP · referência 2024",
    "foto": "assets/carreiras/capa-trf2-tjaa.svg",
    "fotoAlt": "Logotipo do Tribunal Regional Federal da 2ª Região — TRF2",
    "fotoCredito": "TRF2 · assinatura institucional monocromática",
    "fotoFonte": "https://gratis.estrategiaconcursos.com.br/wp-content/uploads/2024/03/TRF2-Logo-st2024.webp",
    "notaCorte": 85,
    "tipoCorte": "meta",
    "cortes": {
      "ampla": 85,
      "negros": null,
      "pcd": null
    },
    "metaDesempenho": true,
    "janelaProva": {
      "inicio": "",
      "fim": ""
    },
    "emAlta": false,
    "descricaoPreparacao": "Preparação para o próximo concurso do TRF2, com base no edital de 2024.",
    "cobertura": "Foco RJ · conteúdo comum RJ/ES",
    "atualizadoEm": "2026-10-27",
    "baseEditais": [
      "TRF2 · Edital 1/2024 · Anexo II · gerais da página 1 e específicos dos cargos 421.1/421.2"
    ],
    "metodologia": "Preparação específica para Técnico Judiciário, Área Administrativa, SEM especialidade, com foco em lotação no RJ. Referência: concurso TRF2 2024, Instituto AOCP, cargos 421.1/421.2; conteúdo geral da página 1 e específico das páginas 19–20 do Anexo II. O edital foi reorganizado em 12 disciplinas de conteúdo e uma trilha de treino de redação. Os temas de projetos, processos e estratégia aparecem em mais de uma disciplina porque o edital os repete em blocos distintos; reaproveitar o estudo comum. Esta é uma trilha de preparação baseada em edital anterior, sem anúncio de novo concurso, vagas, banca futura ou data de prova. As normas e ciclos estratégicos são os citados no edital de referência; conferir alterações, vigência e eventuais substituições antes de usar em um futuro concurso. Percentuais são prioridades pedagógicas estimadas por volume e relevância para organizar o estudo, NÃO incidência estatística de questões. Pesos e horas são estimativas pedagógicas, não a distribuição oficial de pontos. Prioridade 1 identifica o núcleo da preparação; prioridade 2, complementos. Ordem é sequência de primeira passagem dentro da disciplina, não semana de calendário. Meta inicial de 85% é objetivo de treino, NÃO nota de corte: notas dos últimos nomeados por modalidade não foram verificadas. Teoria Geral do Processo corresponde ao bloco próprio do edital; não acrescentar programas inteiros de Processo Civil ou Processo Penal do TRF3. Informática e Lei 14.133/2021 não figuram como disciplinas autônomas deste cargo na referência; a Resolução CNJ 347/2020 permanece no bloco de Governança.",
    "fontesResumo": "Fontes oficiais TRF2, consultadas em 27/10/2026: https://www.trf2.jus.br/trf2/consultas-e-servicos/concurso-de-servidores-2024 | Conteúdo: https://static.trf2.jus.br/nas-internet/documento/transparencia/gestao-de-pessoas/concursos-e-estagios/concurso-2024/anexo-ii-dos-conteudos-programaticos-edital-de-concurso-publico-n-1-2024.pdf | Provas: https://www.trf2.jus.br/trf2/artigo/sgp/provas-gabaritos-2024",
    "disciplinas": [
      {
        "id": "POR",
        "nome": "Língua Portuguesa",
        "peso": 5,
        "cor": "#315CB8",
        "dificuldade": "media",
        "base_teorica": "pdf",
        "topicos": [
          {
            "id": "POR-01",
            "nome": "Compreensão e interpretação de textos",
            "incidencia_pct": 12,
            "prioridade": 1,
            "semana_sugerida": 1,
            "horas_estimadas": 6
          },
          {
            "id": "POR-02",
            "nome": "Tipologias e gêneros textuais",
            "incidencia_pct": 4,
            "prioridade": 2,
            "semana_sugerida": 2,
            "horas_estimadas": 3
          },
          {
            "id": "POR-03",
            "nome": "Ortografia oficial",
            "incidencia_pct": 4,
            "prioridade": 2,
            "semana_sugerida": 3,
            "horas_estimadas": 3
          },
          {
            "id": "POR-04",
            "nome": "Coesão e coerência: referenciação, substituição, repetição, conectores e sequenciação",
            "incidencia_pct": 8,
            "prioridade": 1,
            "semana_sugerida": 4,
            "horas_estimadas": 4
          },
          {
            "id": "POR-05",
            "nome": "Classes de palavras e emprego na oração",
            "incidencia_pct": 10,
            "prioridade": 1,
            "semana_sugerida": 5,
            "horas_estimadas": 5
          },
          {
            "id": "POR-06",
            "nome": "Emprego de tempos e modos verbais",
            "incidencia_pct": 8,
            "prioridade": 1,
            "semana_sugerida": 6,
            "horas_estimadas": 4
          },
          {
            "id": "POR-07",
            "nome": "Sintaxe: termos da oração e relações de coordenação e subordinação",
            "incidencia_pct": 12,
            "prioridade": 1,
            "semana_sugerida": 7,
            "horas_estimadas": 6
          },
          {
            "id": "POR-08",
            "nome": "Pontuação",
            "incidencia_pct": 8,
            "prioridade": 1,
            "semana_sugerida": 8,
            "horas_estimadas": 4
          },
          {
            "id": "POR-09",
            "nome": "Concordância verbal e nominal",
            "incidencia_pct": 8,
            "prioridade": 1,
            "semana_sugerida": 9,
            "horas_estimadas": 4
          },
          {
            "id": "POR-10",
            "nome": "Regência verbal e nominal e emprego da crase",
            "incidencia_pct": 10,
            "prioridade": 1,
            "semana_sugerida": 10,
            "horas_estimadas": 5
          },
          {
            "id": "POR-11",
            "nome": "Colocação dos pronomes átonos",
            "incidencia_pct": 4,
            "prioridade": 2,
            "semana_sugerida": 11,
            "horas_estimadas": 3
          },
          {
            "id": "POR-12",
            "nome": "Semântica e estilística: figuras, sinonímia, antonímia, polissemia, denotação e conotação",
            "incidencia_pct": 6,
            "prioridade": 2,
            "semana_sugerida": 12,
            "horas_estimadas": 4
          },
          {
            "id": "POR-13",
            "nome": "Redação oficial: Manual da Presidência, 3ª edição (2018), expedientes, linguagem e formato",
            "incidencia_pct": 6,
            "prioridade": 2,
            "semana_sugerida": 13,
            "horas_estimadas": 4
          }
        ]
      },
      {
        "id": "RLM",
        "nome": "Raciocínio Lógico e Matemático",
        "peso": 2,
        "cor": "#AF671D",
        "dificuldade": "media",
        "base_teorica": "pdf",
        "topicos": [
          {
            "id": "RLM-01",
            "nome": "Relações lógicas entre pessoas, tempo, características, lugares, objetos e eventos",
            "incidencia_pct": 13,
            "prioridade": 1,
            "semana_sugerida": 1,
            "horas_estimadas": 5
          },
          {
            "id": "RLM-02",
            "nome": "Dedução de informações e condições de validade de argumentos a partir de hipóteses",
            "incidencia_pct": 10,
            "prioridade": 1,
            "semana_sugerida": 2,
            "horas_estimadas": 4
          },
          {
            "id": "RLM-03",
            "nome": "Raciocínio verbal, formação de conceitos e discriminação de elementos",
            "incidencia_pct": 5,
            "prioridade": 2,
            "semana_sugerida": 3,
            "horas_estimadas": 3
          },
          {
            "id": "RLM-04",
            "nome": "Equivalências lógicas e utilização de quantificadores",
            "incidencia_pct": 13,
            "prioridade": 1,
            "semana_sugerida": 4,
            "horas_estimadas": 5
          },
          {
            "id": "RLM-05",
            "nome": "Raciocínio sequencial e orientação espacial e temporal",
            "incidencia_pct": 7,
            "prioridade": 2,
            "semana_sugerida": 5,
            "horas_estimadas": 4
          },
          {
            "id": "RLM-06",
            "nome": "Operações, potenciação, radiciação e números racionais: frações e decimais",
            "incidencia_pct": 10,
            "prioridade": 1,
            "semana_sugerida": 6,
            "horas_estimadas": 4
          },
          {
            "id": "RLM-07",
            "nome": "Razão, proporção e regra de três simples e composta",
            "incidencia_pct": 10,
            "prioridade": 1,
            "semana_sugerida": 7,
            "horas_estimadas": 4
          },
          {
            "id": "RLM-08",
            "nome": "Porcentagem e aplicações",
            "incidencia_pct": 10,
            "prioridade": 1,
            "semana_sugerida": 8,
            "horas_estimadas": 4
          },
          {
            "id": "RLM-09",
            "nome": "Juros simples e compostos",
            "incidencia_pct": 7,
            "prioridade": 2,
            "semana_sugerida": 9,
            "horas_estimadas": 4
          },
          {
            "id": "RLM-10",
            "nome": "Grandezas e medidas: quantidade, tempo, comprimento, superfície, capacidade e massa",
            "incidencia_pct": 5,
            "prioridade": 2,
            "semana_sugerida": 10,
            "horas_estimadas": 3
          },
          {
            "id": "RLM-11",
            "nome": "Estatística básica: médias simples e ponderadas, tabelas e gráficos",
            "incidencia_pct": 10,
            "prioridade": 1,
            "semana_sugerida": 11,
            "horas_estimadas": 4
          }
        ]
      },
      {
        "id": "CON",
        "nome": "Noções de Direito Constitucional",
        "peso": 3,
        "cor": "#376F9B",
        "dificuldade": "media",
        "base_teorica": "pdf",
        "topicos": [
          {
            "id": "CON-01",
            "nome": "Princípios fundamentais",
            "incidencia_pct": 7,
            "prioridade": 1,
            "semana_sugerida": 1,
            "horas_estimadas": 3
          },
          {
            "id": "CON-02",
            "nome": "Direitos e deveres individuais e coletivos",
            "incidencia_pct": 14,
            "prioridade": 1,
            "semana_sugerida": 2,
            "horas_estimadas": 6
          },
          {
            "id": "CON-03",
            "nome": "Direitos sociais",
            "incidencia_pct": 9,
            "prioridade": 1,
            "semana_sugerida": 3,
            "horas_estimadas": 4
          },
          {
            "id": "CON-04",
            "nome": "Nacionalidade e direitos políticos",
            "incidencia_pct": 9,
            "prioridade": 1,
            "semana_sugerida": 4,
            "horas_estimadas": 4
          },
          {
            "id": "CON-05",
            "nome": "Organização político-administrativa: União, Estados, Municípios, DF e Territórios",
            "incidencia_pct": 12,
            "prioridade": 1,
            "semana_sugerida": 5,
            "horas_estimadas": 5
          },
          {
            "id": "CON-06",
            "nome": "Administração Pública: disposições gerais e servidores públicos",
            "incidencia_pct": 11,
            "prioridade": 1,
            "semana_sugerida": 6,
            "horas_estimadas": 5
          },
          {
            "id": "CON-07",
            "nome": "Organização dos Poderes: Legislativo e Executivo",
            "incidencia_pct": 10,
            "prioridade": 2,
            "semana_sugerida": 7,
            "horas_estimadas": 6
          },
          {
            "id": "CON-08",
            "nome": "Poder Judiciário: organização e competências",
            "incidencia_pct": 14,
            "prioridade": 1,
            "semana_sugerida": 8,
            "horas_estimadas": 6
          },
          {
            "id": "CON-09",
            "nome": "Funções essenciais à Justiça",
            "incidencia_pct": 7,
            "prioridade": 2,
            "semana_sugerida": 9,
            "horas_estimadas": 4
          },
          {
            "id": "CON-10",
            "nome": "Ordem social: disposições gerais da seguridade e previdência social",
            "incidencia_pct": 7,
            "prioridade": 2,
            "semana_sugerida": 10,
            "horas_estimadas": 4
          }
        ]
      },
      {
        "id": "ADM",
        "nome": "Noções de Direito Administrativo",
        "peso": 4,
        "cor": "#16764A",
        "dificuldade": "media",
        "base_teorica": "pdf",
        "topicos": [
          {
            "id": "ADM-01",
            "nome": "Princípios básicos, supremacia do interesse público e indisponibilidade",
            "incidencia_pct": 7,
            "prioridade": 1,
            "semana_sugerida": 1,
            "horas_estimadas": 4
          },
          {
            "id": "ADM-02",
            "nome": "Administração direta e indireta: conceitos e características",
            "incidencia_pct": 7,
            "prioridade": 1,
            "semana_sugerida": 2,
            "horas_estimadas": 4
          },
          {
            "id": "ADM-03",
            "nome": "Atos administrativos: conceito, elementos, atributos, classificação e espécies",
            "incidencia_pct": 9,
            "prioridade": 1,
            "semana_sugerida": 3,
            "horas_estimadas": 5
          },
          {
            "id": "ADM-04",
            "nome": "Atos administrativos: revogação, anulação e convalidação",
            "incidencia_pct": 5,
            "prioridade": 1,
            "semana_sugerida": 4,
            "horas_estimadas": 3
          },
          {
            "id": "ADM-05",
            "nome": "Poderes vinculados, discricionário, hierárquico, disciplinar, regulamentar e de polícia",
            "incidencia_pct": 9,
            "prioridade": 1,
            "semana_sugerida": 5,
            "horas_estimadas": 5
          },
          {
            "id": "ADM-06",
            "nome": "Deveres dos administradores, uso e abuso do poder",
            "incidencia_pct": 5,
            "prioridade": 1,
            "semana_sugerida": 6,
            "horas_estimadas": 3
          },
          {
            "id": "ADM-07",
            "nome": "Agentes públicos: conceito, classificação, cargo, emprego e função",
            "incidencia_pct": 5,
            "prioridade": 1,
            "semana_sugerida": 7,
            "horas_estimadas": 3
          },
          {
            "id": "ADM-08",
            "nome": "Lei 8.112/1990: direitos, vantagens e direito de petição",
            "incidencia_pct": 10,
            "prioridade": 1,
            "semana_sugerida": 8,
            "horas_estimadas": 6
          },
          {
            "id": "ADM-09",
            "nome": "Lei 8.112/1990: deveres, proibições, acumulação, responsabilidades e penalidades",
            "incidencia_pct": 9,
            "prioridade": 1,
            "semana_sugerida": 9,
            "horas_estimadas": 5
          },
          {
            "id": "ADM-10",
            "nome": "Processo administrativo disciplinar e revisão",
            "incidencia_pct": 7,
            "prioridade": 1,
            "semana_sugerida": 10,
            "horas_estimadas": 4
          },
          {
            "id": "ADM-11",
            "nome": "Seguridade do servidor e previdência complementar: Lei 12.618/2012",
            "incidencia_pct": 5,
            "prioridade": 2,
            "semana_sugerida": 11,
            "horas_estimadas": 4
          },
          {
            "id": "ADM-12",
            "nome": "Improbidade administrativa: Lei 8.429/1992 e alterações vigentes",
            "incidencia_pct": 9,
            "prioridade": 1,
            "semana_sugerida": 12,
            "horas_estimadas": 5
          },
          {
            "id": "ADM-13",
            "nome": "Processo administrativo federal: Lei 9.784/1999",
            "incidencia_pct": 9,
            "prioridade": 1,
            "semana_sugerida": 13,
            "horas_estimadas": 5
          },
          {
            "id": "ADM-14",
            "nome": "Código de Conduta da Justiça Federal: Resolução CJF 147/2011",
            "incidencia_pct": 4,
            "prioridade": 2,
            "semana_sugerida": 14,
            "horas_estimadas": 3
          }
        ]
      },
      {
        "id": "TGP",
        "nome": "Teoria Geral do Processo",
        "peso": 2,
        "cor": "#754BA0",
        "dificuldade": "media",
        "base_teorica": "pdf",
        "topicos": [
          {
            "id": "TGP-01",
            "nome": "Princípios constitucionais processuais e princípios gerais do processo",
            "incidencia_pct": 15,
            "prioridade": 1,
            "semana_sugerida": 1,
            "horas_estimadas": 4
          },
          {
            "id": "TGP-02",
            "nome": "Normas processuais e materiais",
            "incidencia_pct": 5,
            "prioridade": 2,
            "semana_sugerida": 2,
            "horas_estimadas": 2
          },
          {
            "id": "TGP-03",
            "nome": "Jurisdição: espécies, limites e poderes",
            "incidencia_pct": 15,
            "prioridade": 1,
            "semana_sugerida": 3,
            "horas_estimadas": 4
          },
          {
            "id": "TGP-04",
            "nome": "Ação: condições, classificação e elementos",
            "incidencia_pct": 15,
            "prioridade": 1,
            "semana_sugerida": 4,
            "horas_estimadas": 4
          },
          {
            "id": "TGP-05",
            "nome": "Competência absoluta e relativa; competência dos Juizados Especiais Federais",
            "incidencia_pct": 18,
            "prioridade": 1,
            "semana_sugerida": 5,
            "horas_estimadas": 5
          },
          {
            "id": "TGP-06",
            "nome": "Pressupostos processuais e sujeitos do processo",
            "incidencia_pct": 14,
            "prioridade": 1,
            "semana_sugerida": 6,
            "horas_estimadas": 4
          },
          {
            "id": "TGP-07",
            "nome": "Tutela jurisdicional: espécies",
            "incidencia_pct": 8,
            "prioridade": 2,
            "semana_sugerida": 7,
            "horas_estimadas": 3
          },
          {
            "id": "TGP-08",
            "nome": "Acesso à justiça, gratuidade e métodos apropriados de solução de conflitos",
            "incidencia_pct": 10,
            "prioridade": 2,
            "semana_sugerida": 8,
            "horas_estimadas": 4
          }
        ]
      },
      {
        "id": "PEN",
        "nome": "Noções de Direito Penal",
        "peso": 2,
        "cor": "#9D465D",
        "dificuldade": "media",
        "base_teorica": "pdf",
        "topicos": [
          {
            "id": "PEN-01",
            "nome": "Aplicação da lei penal",
            "incidencia_pct": 10,
            "prioridade": 1,
            "semana_sugerida": 1,
            "horas_estimadas": 4
          },
          {
            "id": "PEN-02",
            "nome": "Imputabilidade penal",
            "incidencia_pct": 6,
            "prioridade": 2,
            "semana_sugerida": 2,
            "horas_estimadas": 3
          },
          {
            "id": "PEN-03",
            "nome": "Concurso de pessoas",
            "incidencia_pct": 6,
            "prioridade": 2,
            "semana_sugerida": 3,
            "horas_estimadas": 3
          },
          {
            "id": "PEN-04",
            "nome": "Espécies e aplicação da pena",
            "incidencia_pct": 13,
            "prioridade": 1,
            "semana_sugerida": 4,
            "horas_estimadas": 5
          },
          {
            "id": "PEN-05",
            "nome": "Medidas de segurança e extinção da punibilidade",
            "incidencia_pct": 7,
            "prioridade": 2,
            "semana_sugerida": 5,
            "horas_estimadas": 4
          },
          {
            "id": "PEN-06",
            "nome": "Crimes praticados por funcionário público contra a administração em geral",
            "incidencia_pct": 15,
            "prioridade": 1,
            "semana_sugerida": 6,
            "horas_estimadas": 6
          },
          {
            "id": "PEN-07",
            "nome": "Crimes praticados por particular contra a administração em geral",
            "incidencia_pct": 13,
            "prioridade": 1,
            "semana_sugerida": 7,
            "horas_estimadas": 5
          },
          {
            "id": "PEN-08",
            "nome": "Crimes contra a administração da justiça",
            "incidencia_pct": 13,
            "prioridade": 1,
            "semana_sugerida": 8,
            "horas_estimadas": 5
          },
          {
            "id": "PEN-09",
            "nome": "Crimes de preconceito de raça ou cor: Leis 7.716/1989 e 14.532/2023",
            "incidencia_pct": 7,
            "prioridade": 2,
            "semana_sugerida": 9,
            "horas_estimadas": 4
          },
          {
            "id": "PEN-10",
            "nome": "Crimes de abuso de autoridade: Lei 13.869/2019",
            "incidencia_pct": 10,
            "prioridade": 1,
            "semana_sugerida": 10,
            "horas_estimadas": 4
          }
        ]
      },
      {
        "id": "AGP",
        "nome": "Noções de Administração Geral e Pública",
        "peso": 3,
        "cor": "#7A611C",
        "dificuldade": "media",
        "base_teorica": "pdf",
        "topicos": [
          {
            "id": "AGP-01",
            "nome": "Evolução da administração: abordagens clássica, humanística, comportamental, sistêmica e contingencial",
            "incidencia_pct": 10,
            "prioridade": 1,
            "semana_sugerida": 1,
            "horas_estimadas": 6
          },
          {
            "id": "AGP-02",
            "nome": "Modelos patrimonialista, burocrático e gerencial; reformas administrativas brasileiras e governança",
            "incidencia_pct": 8,
            "prioridade": 1,
            "semana_sugerida": 2,
            "horas_estimadas": 5
          },
          {
            "id": "AGP-03",
            "nome": "Processo administrativo: planejamento, organização, direção e controle",
            "incidencia_pct": 7,
            "prioridade": 1,
            "semana_sugerida": 3,
            "horas_estimadas": 4
          },
          {
            "id": "AGP-04",
            "nome": "Planejamento estratégico: conceitos, características, ferramentas, análise competitiva e estratégias genéricas",
            "incidencia_pct": 8,
            "prioridade": 1,
            "semana_sugerida": 4,
            "horas_estimadas": 5
          },
          {
            "id": "AGP-05",
            "nome": "Redes e alianças; planejamento tático e operacional; administração por objetivos",
            "incidencia_pct": 5,
            "prioridade": 2,
            "semana_sugerida": 5,
            "horas_estimadas": 4
          },
          {
            "id": "AGP-06",
            "nome": "Processo decisório",
            "incidencia_pct": 5,
            "prioridade": 1,
            "semana_sugerida": 6,
            "horas_estimadas": 3
          },
          {
            "id": "AGP-07",
            "nome": "Estrutura organizacional e departamentalização: tipos, características, vantagens e desvantagens",
            "incidencia_pct": 8,
            "prioridade": 1,
            "semana_sugerida": 7,
            "horas_estimadas": 5
          },
          {
            "id": "AGP-08",
            "nome": "Organização informal e cultura organizacional",
            "incidencia_pct": 4,
            "prioridade": 2,
            "semana_sugerida": 8,
            "horas_estimadas": 3
          },
          {
            "id": "AGP-09",
            "nome": "Direção: motivação, liderança, comunicação, descentralização e delegação",
            "incidencia_pct": 8,
            "prioridade": 1,
            "semana_sugerida": 9,
            "horas_estimadas": 5
          },
          {
            "id": "AGP-10",
            "nome": "Controle: características, tipos, vantagens, desvantagens e medição do desempenho organizacional",
            "incidencia_pct": 7,
            "prioridade": 1,
            "semana_sugerida": 10,
            "horas_estimadas": 4
          },
          {
            "id": "AGP-11",
            "nome": "Qualidade e excelência gerencial: teóricos, contribuições e ferramentas",
            "incidencia_pct": 6,
            "prioridade": 2,
            "semana_sugerida": 11,
            "horas_estimadas": 5
          },
          {
            "id": "AGP-12",
            "nome": "Projetos: definições, elaboração, análise, avaliação e ciclo de vida preditivo, adaptativo e híbrido",
            "incidencia_pct": 8,
            "prioridade": 1,
            "semana_sugerida": 12,
            "horas_estimadas": 5
          },
          {
            "id": "AGP-13",
            "nome": "Tailoring e metodologias ágeis: Scrum, Kanban e Lean",
            "incidencia_pct": 5,
            "prioridade": 2,
            "semana_sugerida": 13,
            "horas_estimadas": 4
          },
          {
            "id": "AGP-14",
            "nome": "Gestão de processos: abordagem, mapeamento, análise, melhoria e ISO 9000:2000",
            "incidencia_pct": 8,
            "prioridade": 1,
            "semana_sugerida": 14,
            "horas_estimadas": 5
          },
          {
            "id": "AGP-15",
            "nome": "Noções de estatística para controle e melhoria de processos",
            "incidencia_pct": 3,
            "prioridade": 2,
            "semana_sugerida": 15,
            "horas_estimadas": 3
          }
        ]
      },
      {
        "id": "AFO",
        "nome": "Administração Financeira e Orçamentária e Orçamento Público",
        "peso": 3,
        "cor": "#157B87",
        "dificuldade": "media",
        "base_teorica": "pdf",
        "topicos": [
          {
            "id": "AFO-01",
            "nome": "Finanças públicas: papel do Estado e formas e dimensões de intervenção na economia",
            "incidencia_pct": 4,
            "prioridade": 2,
            "semana_sugerida": 1,
            "horas_estimadas": 3
          },
          {
            "id": "AFO-02",
            "nome": "Orçamento: origens, tipos, instrumento de planejamento e princípios",
            "incidencia_pct": 11,
            "prioridade": 1,
            "semana_sugerida": 2,
            "horas_estimadas": 5
          },
          {
            "id": "AFO-03",
            "nome": "Orçamento brasileiro: PPA, LDO, LOA e outros planos e programas",
            "incidencia_pct": 11,
            "prioridade": 1,
            "semana_sugerida": 3,
            "horas_estimadas": 5
          },
          {
            "id": "AFO-04",
            "nome": "Ciclo orçamentário e classificações orçamentárias",
            "incidencia_pct": 11,
            "prioridade": 1,
            "semana_sugerida": 4,
            "horas_estimadas": 5
          },
          {
            "id": "AFO-05",
            "nome": "Programação e execução orçamentária e financeira: acompanhamento e sistemas de informação",
            "incidencia_pct": 8,
            "prioridade": 1,
            "semana_sugerida": 5,
            "horas_estimadas": 4
          },
          {
            "id": "AFO-06",
            "nome": "Alterações orçamentárias e créditos ordinários e adicionais",
            "incidencia_pct": 8,
            "prioridade": 1,
            "semana_sugerida": 6,
            "horas_estimadas": 4
          },
          {
            "id": "AFO-07",
            "nome": "Receita pública: categorias, fontes, estágios e dívida ativa",
            "incidencia_pct": 11,
            "prioridade": 1,
            "semana_sugerida": 7,
            "horas_estimadas": 5
          },
          {
            "id": "AFO-08",
            "nome": "Despesa pública: categorias e estágios",
            "incidencia_pct": 8,
            "prioridade": 1,
            "semana_sugerida": 8,
            "horas_estimadas": 4
          },
          {
            "id": "AFO-09",
            "nome": "Restos a pagar, despesas de exercícios anteriores, dívidas flutuante e fundada e suprimento de fundos",
            "incidencia_pct": 11,
            "prioridade": 1,
            "semana_sugerida": 9,
            "horas_estimadas": 5
          },
          {
            "id": "AFO-10",
            "nome": "LRF: planejamento, receita e despesa pública",
            "incidencia_pct": 11,
            "prioridade": 1,
            "semana_sugerida": 10,
            "horas_estimadas": 5
          },
          {
            "id": "AFO-11",
            "nome": "LRF: transparência, controle e fiscalização",
            "incidencia_pct": 6,
            "prioridade": 2,
            "semana_sugerida": 11,
            "horas_estimadas": 4
          }
        ]
      },
      {
        "id": "GOV",
        "nome": "Noções de Governança",
        "peso": 2,
        "cor": "#70609C",
        "dificuldade": "media",
        "base_teorica": "pdf",
        "topicos": [
          {
            "id": "GOV-01",
            "nome": "Governança pública: conceitos e características; administração pública gerencial",
            "incidencia_pct": 12,
            "prioridade": 1,
            "semana_sugerida": 1,
            "horas_estimadas": 3
          },
          {
            "id": "GOV-02",
            "nome": "Gestão por processos",
            "incidencia_pct": 12,
            "prioridade": 1,
            "semana_sugerida": 2,
            "horas_estimadas": 3
          },
          {
            "id": "GOV-03",
            "nome": "Gestão de riscos",
            "incidencia_pct": 17,
            "prioridade": 1,
            "semana_sugerida": 3,
            "horas_estimadas": 4
          },
          {
            "id": "GOV-04",
            "nome": "Gestão de projetos",
            "incidencia_pct": 12,
            "prioridade": 1,
            "semana_sugerida": 4,
            "horas_estimadas": 3
          },
          {
            "id": "GOV-05",
            "nome": "Análise e tomada de decisão e gerenciamento de crise",
            "incidencia_pct": 9,
            "prioridade": 2,
            "semana_sugerida": 5,
            "horas_estimadas": 3
          },
          {
            "id": "GOV-06",
            "nome": "Compliance: conceitos, apoio da alta administração e código de conduta",
            "incidencia_pct": 12,
            "prioridade": 1,
            "semana_sugerida": 6,
            "horas_estimadas": 3
          },
          {
            "id": "GOV-07",
            "nome": "Controles internos, treinamento e comunicação",
            "incidencia_pct": 9,
            "prioridade": 2,
            "semana_sugerida": 7,
            "horas_estimadas": 3
          },
          {
            "id": "GOV-08",
            "nome": "Governança das contratações no Judiciário: Resolução CNJ 347/2020",
            "incidencia_pct": 17,
            "prioridade": 1,
            "semana_sugerida": 8,
            "horas_estimadas": 4
          }
        ]
      },
      {
        "id": "EST",
        "nome": "Noções de Gestão Estratégica",
        "peso": 1,
        "cor": "#557330",
        "dificuldade": "media",
        "base_teorica": "pdf",
        "topicos": [
          {
            "id": "EST-01",
            "nome": "Estratégia do Poder Judiciário: Resolução CNJ 325/2020, ciclo 2021–2026 da referência",
            "incidencia_pct": 19,
            "prioridade": 1,
            "semana_sugerida": 1,
            "horas_estimadas": 3
          },
          {
            "id": "EST-02",
            "nome": "Estratégia da Justiça Federal: Resolução CJF 668/2020, ciclo 2021–2026 da referência",
            "incidencia_pct": 18,
            "prioridade": 1,
            "semana_sugerida": 2,
            "horas_estimadas": 3
          },
          {
            "id": "EST-03",
            "nome": "Ferramentas de análise e planejamento estratégico, tático e operacional",
            "incidencia_pct": 25,
            "prioridade": 1,
            "semana_sugerida": 3,
            "horas_estimadas": 4
          },
          {
            "id": "EST-04",
            "nome": "Balanced Scorecard, estratégias e indicadores de gestão",
            "incidencia_pct": 25,
            "prioridade": 1,
            "semana_sugerida": 4,
            "horas_estimadas": 4
          },
          {
            "id": "EST-05",
            "nome": "Gestão de projetos e gestão por competências",
            "incidencia_pct": 13,
            "prioridade": 2,
            "semana_sugerida": 5,
            "horas_estimadas": 3
          }
        ]
      },
      {
        "id": "SUS",
        "nome": "Noções de Sustentabilidade",
        "peso": 1,
        "cor": "#34734C",
        "dificuldade": "media",
        "base_teorica": "pdf",
        "topicos": [
          {
            "id": "SUS-01",
            "nome": "Meio ambiente: Constituição, art. 225",
            "incidencia_pct": 13,
            "prioridade": 1,
            "semana_sugerida": 1,
            "horas_estimadas": 2
          },
          {
            "id": "SUS-02",
            "nome": "Desenvolvimento sustentável e Relatório Brundtland",
            "incidencia_pct": 9,
            "prioridade": 2,
            "semana_sugerida": 2,
            "horas_estimadas": 2
          },
          {
            "id": "SUS-03",
            "nome": "Agenda Ambiental na Administração Pública (A3P)",
            "incidencia_pct": 14,
            "prioridade": 2,
            "semana_sugerida": 3,
            "horas_estimadas": 3
          },
          {
            "id": "SUS-04",
            "nome": "Unidades socioambientais e Plano de Logística Sustentável: Resolução CNJ 400/2021",
            "incidencia_pct": 25,
            "prioridade": 1,
            "semana_sugerida": 4,
            "horas_estimadas": 4
          },
          {
            "id": "SUS-05",
            "nome": "Política Nacional sobre Mudança do Clima: Lei 12.187/2009",
            "incidencia_pct": 14,
            "prioridade": 2,
            "semana_sugerida": 5,
            "horas_estimadas": 3
          },
          {
            "id": "SUS-06",
            "nome": "Política Nacional de Resíduos Sólidos: Lei 12.305/2010 e Decreto 10.936/2022",
            "incidencia_pct": 25,
            "prioridade": 1,
            "semana_sugerida": 6,
            "horas_estimadas": 4
          }
        ]
      },
      {
        "id": "DHA",
        "nome": "Direitos Humanos, Fundamentais e Acessibilidade",
        "peso": 1,
        "cor": "#B66540",
        "dificuldade": "media",
        "base_teorica": "pdf",
        "topicos": [
          {
            "id": "DHA-01",
            "nome": "Teoria geral dos direitos fundamentais e distinção entre direitos humanos e fundamentais",
            "incidencia_pct": 16,
            "prioridade": 1,
            "semana_sugerida": 1,
            "horas_estimadas": 3
          },
          {
            "id": "DHA-02",
            "nome": "Declaração Universal dos Direitos Humanos",
            "incidencia_pct": 16,
            "prioridade": 1,
            "semana_sugerida": 2,
            "horas_estimadas": 3
          },
          {
            "id": "DHA-03",
            "nome": "Agenda 2030 da ONU",
            "incidencia_pct": 12,
            "prioridade": 2,
            "semana_sugerida": 3,
            "horas_estimadas": 3
          },
          {
            "id": "DHA-04",
            "nome": "Lei Brasileira de Inclusão: Lei 13.146/2015",
            "incidencia_pct": 27,
            "prioridade": 1,
            "semana_sugerida": 4,
            "horas_estimadas": 5
          },
          {
            "id": "DHA-05",
            "nome": "Acessibilidade: normas gerais e critérios da Lei 10.098/2000",
            "incidencia_pct": 21,
            "prioridade": 1,
            "semana_sugerida": 5,
            "horas_estimadas": 4
          },
          {
            "id": "DHA-06",
            "nome": "Prioridade de atendimento: Lei 10.048/2000",
            "incidencia_pct": 8,
            "prioridade": 2,
            "semana_sugerida": 6,
            "horas_estimadas": 2
          }
        ]
      },
      {
        "id": "RED",
        "nome": "Redação",
        "peso": 2,
        "cor": "#8C4E75",
        "dificuldade": "media",
        "base_teorica": "pdf",
        "topicos": [
          {
            "id": "RED-01",
            "nome": "Estrutura dissertativa, tese, projeto de texto e progressão argumentativa",
            "incidencia_pct": 22,
            "prioridade": 1,
            "semana_sugerida": 1,
            "horas_estimadas": 4
          },
          {
            "id": "RED-02",
            "nome": "Construção de argumentos, repertório pertinente e adequação ao tema",
            "incidencia_pct": 22,
            "prioridade": 1,
            "semana_sugerida": 2,
            "horas_estimadas": 4
          },
          {
            "id": "RED-03",
            "nome": "Coesão, coerência e revisão da norma-padrão",
            "incidencia_pct": 22,
            "prioridade": 1,
            "semana_sugerida": 3,
            "horas_estimadas": 4
          },
          {
            "id": "RED-04",
            "nome": "Treino de redação completa, correção e reescrita com os critérios da banca",
            "incidencia_pct": 34,
            "prioridade": 1,
            "semana_sugerida": 4,
            "horas_estimadas": 6
          }
        ]
      }
    ]
  };

  // Catálogo remoto continua separado. Os modelos-base entram no catálogo como
  // planos comuns e podem ser personalizados pelo administrador em Configurações.
  window.CATALOGO_EDITAIS_GLOBAIS = [];
  window.CATALOGO_EDITAIS_BASE = [inss, ifrj, trf2];
})();

