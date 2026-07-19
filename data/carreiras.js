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
        semana_sugerida: null,
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
    foto: 'assets/carreiras/capa-trf-tjaa.jpg',
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
    foto: 'assets/carreiras/capa-trt-tjaa.jpg',
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

  window.CATALOGO_CARREIRAS = [trf, trt];
})();
