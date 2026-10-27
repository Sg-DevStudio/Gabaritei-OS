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

  var portugues = [
    ['Interpretação, compreensão e inferência em textos', 30, 8],
    ['Morfologia e emprego das classes de palavras', 14, 6],
    ['Sintaxe da oração e do período', 12, 7],
    ['Pontuação e efeitos de sentido', 11, 5],
    ['Concordância verbal e nominal', 10, 5],
    ['Regência verbal e nominal e crase', 9, 6],
    ['Coesão, coerência e reescrita de frases', 8, 6],
    ['Ortografia, acentuação e semântica', 6, 5]
  ];

  var raciocinio = [
    ['Lógica proposicional, equivalências e negações', 22, 7],
    ['Porcentagem, razão, proporção e regra de três', 18, 6],
    ['Sequências, padrões e raciocínio indutivo', 16, 5],
    ['Associação lógica e ordenação de informações', 14, 6],
    ['Argumentação, inferências e diagramas lógicos', 12, 6],
    ['Conjuntos, contagem e probabilidade básica', 10, 6],
    ['Problemas aritméticos e algébricos', 8, 5]
  ];

  var constitucional = [
    ['Direitos e garantias fundamentais', 22, 8],
    ['Poder Judiciário e funções essenciais à Justiça', 20, 8],
    ['Administração Pública e servidores na Constituição', 15, 7],
    ['Organização dos Poderes Legislativo e Executivo', 12, 7],
    ['Organização do Estado e repartição de competências', 10, 6],
    ['Princípios fundamentais', 8, 4],
    ['Controle de constitucionalidade', 7, 6],
    ['Direitos sociais, nacionalidade e direitos políticos', 6, 5]
  ];

  var administrativo = [
    ['Agentes públicos e Lei nº 8.112/1990', 19, 9],
    ['Atos administrativos: requisitos, atributos, espécies e invalidação', 13, 7],
    ['Licitações: planejamento, seleção e contratação na Lei nº 14.133/2021', 12, 9],
    ['Organização administrativa direta e indireta', 11, 6],
    ['Improbidade administrativa', 10, 6],
    ['Poderes e deveres da Administração', 9, 6],
    ['Contratos administrativos: execução, alteração e extinção', 8, 8],
    ['Processo administrativo federal — Lei nº 9.784/1999', 7, 6],
    ['Responsabilidade civil do Estado e controle da Administração', 6, 6],
    ['Princípios e regime jurídico-administrativo', 5, 5]
  ];

  var administracaoPublica = [
    ['Planejamento estratégico, tático e operacional', 24, 8],
    ['Gestão de pessoas, liderança e comportamento organizacional', 18, 8],
    ['Estruturas organizacionais e departamentalização', 16, 6],
    ['Gestão por processos e melhoria contínua', 13, 7],
    ['Gestão de projetos, riscos e governança', 10, 7],
    ['Qualidade no serviço público e atendimento ao cidadão', 8, 5],
    ['Gestão de materiais, patrimônio e logística', 6, 6],
    ['Gestão documental e arquivologia', 5, 5]
  ];

  var afo = [
    ['Despesa pública: estágios, restos a pagar e despesas de exercícios anteriores', 22, 8],
    ['Orçamento público, PPA, LDO e LOA', 18, 8],
    ['Lei de Responsabilidade Fiscal', 15, 8],
    ['Receita pública: classificação, estágios e dívida ativa', 13, 7],
    ['Créditos adicionais', 10, 5],
    ['Princípios e ciclo orçamentário', 9, 5],
    ['Programação e execução orçamentária e financeira', 7, 6],
    ['Suprimento de fundos e Conta Única do Tesouro', 6, 4]
  ];

  var informatica = [
    ['Internet, navegadores, correio eletrônico e colaboração', 22, 6],
    ['Segurança da informação, golpes, malware e cópias de segurança', 16, 7],
    ['Editor de textos', 14, 6],
    ['Planilhas eletrônicas', 13, 8],
    ['Sistemas operacionais e gerenciamento de arquivos', 12, 5],
    ['Redes de computadores e computação em nuvem', 10, 6],
    ['Ferramentas de apresentação e PDF', 7, 4],
    ['Conceitos de dados, IA e transformação digital', 6, 4]
  ];

  var transversal = [
    ['Estatuto da Pessoa com Deficiência — Lei nº 13.146/2015', 25, 7],
    ['Acessibilidade — Lei nº 10.098/2000 e normas correlatas', 14, 5],
    ['Proteção de dados pessoais — LGPD', 14, 6],
    ['Ética, integridade e código de conduta no serviço público', 13, 5],
    ['Sustentabilidade e responsabilidade socioambiental', 11, 5],
    ['Direitos humanos, igualdade e não discriminação', 9, 5],
    ['Acesso à informação e direitos do usuário do serviço público', 8, 5],
    ['Normas institucionais do Poder Judiciário', 6, 5]
  ];

  var trf = {
    id: 'carreira-trf-tjaa',
    tipoCatalogo: 'carreira',
    titulo: 'Carreira TRF — Técnico Judiciário · Área Administrativa',
    orgao: 'Justiça Federal',
    cargo: 'Técnico Judiciário — Área Administrativa',
    area: 'Administrativa',
    estado: 'Nacional',
    nivel: 'superior',
    banca: 'Multibanca',
    foto: 'assets/carreiras/capa-trf-tjaa.jpg?v=20260721-real1',
    fotoAlt: 'Sede do Tribunal Regional Federal da 1ª Região, em Brasília',
    fotoCredito: 'CNJ · CC BY-SA 4.0 · Wikimedia Commons',
    fotoFonte: 'https://commons.wikimedia.org/wiki/File:Tribunal_Regional_Federal_da_1%C2%AA_Regi%C3%A3o_-_TRF1.jpg',
    notaCorte: 80,
    tipoCorte: 'meta',
    cortes: { ampla: 80, negros: null, pcd: null },
    janelaProva: null,
    emAlta: true,
    cobertura: 'TRF1 a TRF6',
    atualizadoEm: '2026-07-19',
    baseEditais: ['TRF1 2024 · FGV', 'TRF2 2024 · Instituto AOCP', 'TRF3 2024 · FCC', 'TRF4 2025 · FCC', 'TRF5 2024 · IBFC', 'TRF6 2024 · Cebraspe'],
    metodologia: 'Núcleo comum construído pela recorrência nos editais recentes dos seis TRFs e priorizado por históricos de questões das bancas e da área judiciária. A prioridade é relativa dentro de cada disciplina e deve ser recalibrada quando sair o edital específico.',
    fontesResumo: 'Editais oficiais dos TRF1–TRF6 · levantamentos históricos do TEC Concursos e Qconcursos',
    disciplinas: [
      disciplina('POR', 'Língua Portuguesa', '#3B82F6', 3, portugues),
      disciplina('RLM', 'Raciocínio Lógico-Matemático', '#8B5CF6', 2, raciocinio),
      disciplina('CON', 'Noções de Direito Constitucional', '#0EA5E9', 2, constitucional),
      disciplina('ADM', 'Noções de Direito Administrativo', '#EF4444', 3, administrativo),
      disciplina('APU', 'Administração Geral e Pública', '#10B981', 2, administracaoPublica),
      disciplina('PCI', 'Noções de Direito Processual Civil', '#F59E0B', 2, [
        ['Procedimento comum: petição inicial, resposta, saneamento e sentença', 20, 9],
        ['Cumprimento de sentença e processo de execução', 14, 8],
        ['Sujeitos do processo, litisconsórcio e intervenção de terceiros', 13, 7],
        ['Atos processuais, prazos, comunicação e nulidades', 11, 7],
        ['Competência e organização judiciária federal', 10, 7],
        ['Tutelas provisórias', 9, 6],
        ['Recursos e precedentes', 8, 8],
        ['Provas no processo civil', 8, 6],
        ['Juizados Especiais Federais e processo judicial eletrônico', 7, 6]
      ]),
      disciplina('PPE', 'Noções de Direito Processual Penal', '#F97316', 1, [
        ['Inquérito policial, investigação e ação penal', 22, 7],
        ['Prisão, medidas cautelares e liberdade provisória', 18, 8],
        ['Competência penal e competência da Justiça Federal', 15, 7],
        ['Sujeitos processuais, citação e intimação', 13, 6],
        ['Provas no processo penal', 12, 7],
        ['Procedimentos, sentença e recursos', 10, 8],
        ['Leis penais especiais recorrentes em editais de TRF', 10, 7]
      ]),
      disciplina('AFO', 'Administração Financeira e Orçamentária', '#14B8A6', 2, afo),
      disciplina('INF', 'Informática', '#6366F1', 1, informatica),
      disciplina('TRA', 'Acessibilidade, Ética, LGPD e Sustentabilidade', '#EC4899', 1, transversal)
    ]
  };

  var trt = {
    id: 'carreira-trt-tjaa',
    tipoCatalogo: 'carreira',
    titulo: 'Carreira TRT — Técnico Judiciário · Área Administrativa',
    orgao: 'Justiça do Trabalho',
    cargo: 'Técnico Judiciário — Área Administrativa',
    area: 'Administrativa',
    estado: 'Nacional',
    nivel: 'superior',
    banca: 'Multibanca',
    foto: 'assets/carreiras/capa-trt-tjaa.jpg?v=20260721-real1',
    fotoAlt: 'Sede do Tribunal Regional do Trabalho da 19ª Região, em Maceió',
    fotoCredito: 'Tribunal Regional do Trabalho da 19ª Região · CC BY 2.0 · Wikimedia Commons',
    fotoFonte: 'https://commons.wikimedia.org/wiki/File:Tribunal_Regional_do_Trabalho_-_Macei%C3%B3,_AL_01.jpg',
    notaCorte: 80,
    tipoCorte: 'meta',
    cortes: { ampla: 80, negros: null, pcd: null },
    janelaProva: null,
    emAlta: true,
    cobertura: 'TRTs nacionais',
    atualizadoEm: '2026-07-19',
    baseEditais: ['TRT6 2024 · FCC', 'TRT10 2025 · Cebraspe', 'TRT15 2024/2025 · FCC', 'TRT24 2024 · FGV'],
    metodologia: 'Núcleo comum construído pela recorrência em editais recentes de TRTs, preservando o eixo próprio da Justiça do Trabalho. A prioridade relativa combina o programa oficial com históricos de questões por banca e deve ser recalibrada quando sair o edital específico.',
    fontesResumo: 'Editais oficiais de TRTs recentes · levantamentos históricos do TEC Concursos e Qconcursos',
    disciplinas: [
      disciplina('POR', 'Língua Portuguesa', '#3B82F6', 3, portugues),
      disciplina('RLM', 'Raciocínio Lógico-Matemático', '#8B5CF6', 1, raciocinio),
      disciplina('CON', 'Noções de Direito Constitucional', '#0EA5E9', 2, constitucional),
      disciplina('ADM', 'Noções de Direito Administrativo', '#EF4444', 3, administrativo),
      disciplina('DTR', 'Noções de Direito do Trabalho', '#D946EF', 3, [
        ['Contrato de trabalho: requisitos, sujeitos, modalidades e alterações', 24, 9],
        ['Extinção do contrato, aviso-prévio e estabilidade', 13, 8],
        ['Jornada de trabalho, intervalos, descanso e trabalho noturno', 12, 8],
        ['Remuneração, salário, gratificações e equiparação salarial', 11, 8],
        ['Férias, décimo terceiro salário e FGTS', 10, 7],
        ['Direitos constitucionais dos trabalhadores', 8, 6],
        ['Prescrição e decadência trabalhistas', 7, 5],
        ['Segurança e medicina do trabalho', 6, 6],
        ['Direito coletivo, negociação e greve', 5, 6],
        ['Fontes, princípios e aplicação do Direito do Trabalho', 4, 5]
      ]),
      disciplina('PTR', 'Noções de Direito Processual do Trabalho', '#F59E0B', 3, [
        ['Recursos trabalhistas', 15, 9],
        ['Execução e liquidação trabalhistas', 13, 9],
        ['Organização, jurisdição e competência da Justiça do Trabalho', 12, 8],
        ['Audiência trabalhista e conciliação', 10, 7],
        ['Provas no processo do trabalho', 10, 7],
        ['Ritos ordinário, sumário e sumaríssimo', 9, 7],
        ['Atos, termos, comunicação e prazos processuais', 8, 7],
        ['Partes, procuradores e jus postulandi', 7, 6],
        ['Petição inicial, resposta e sentença', 7, 8],
        ['Custas, nulidades e aplicação subsidiária do CPC', 9, 7]
      ]),
      disciplina('APU', 'Administração Geral e Pública', '#10B981', 2, administracaoPublica),
      disciplina('AFO', 'Administração Financeira e Orçamentária', '#14B8A6', 2, afo),
      disciplina('INF', 'Informática', '#6366F1', 1, informatica),
      disciplina('TRA', 'Acessibilidade, Ética, LGPD e Sustentabilidade', '#EC4899', 2, transversal)
    ]
  };

  // Preparação específica do TRF2, mantendo a referência histórica explícita.
  var trf2 = {
    "id": "carreira-trf2-tjaa-2024",
    "tipoCatalogo": "carreira",
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
    "emAlta": true,
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

  window.CATALOGO_CARREIRAS = [trf, trt, trf2];
})();
