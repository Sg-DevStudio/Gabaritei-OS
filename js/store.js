/* ============================================================
   store.js — camada única de persistência (localStorage)
   Schema v2: vários planos em state.planos[]; o plano ativo é
   "hidratado" nos campos state.plano/disciplinas/cronogramas
   (referências, não cópias) para o resto do app não mudar.
   Trocar este arquivo é o que a migração futura p/ Supabase exige.
   ============================================================ */
(function () {
  'use strict';

  const CHAVE = 'estudos.v1';
  const VERSAO_SCHEMA = 2;

  function agoraISO() {
    return new Date().toISOString();
  }

  function novoId(prefixo) {
    return prefixo + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function clonarJson(valor) {
    return valor == null ? valor : JSON.parse(JSON.stringify(valor));
  }

  function ordenarChaves(valor) {
    if (Array.isArray(valor)) return valor.map(ordenarChaves);
    if (!valor || typeof valor !== 'object') return valor;
    const ordenado = {};
    Object.keys(valor).sort().forEach(function (chave) {
      ordenado[chave] = ordenarChaves(valor[chave]);
    });
    return ordenado;
  }

  function stringifyEstavel(valor) {
    return JSON.stringify(ordenarChaves(valor));
  }

  function assinaturaSemCampos(obj, campos) {
    if (!obj || typeof obj !== 'object') return JSON.stringify(obj);
    const copia = clonarJson(obj);
    (campos || []).forEach(function (campo) { delete copia[campo]; });
    return stringifyEstavel(copia);
  }

  function assinaturaPlano(plano) {
    return assinaturaSemCampos(plano, [
      'atualizadoEm', 'estruturaAtualizadaEm', 'estruturaRev', 'estruturaHash'
    ]);
  }

  function assinaturaItem(item) {
    return assinaturaSemCampos(item, ['atualizadoEm']);
  }

  function hashTexto(texto) {
    let hash = 2166136261;
    const s = String(texto || '');
    for (let i = 0; i < s.length; i++) {
      hash ^= s.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function idLink(link) {
    if (!link) return '';
    return String(link.id || link.url || ('hash-' + hashTexto(JSON.stringify(link))));
  }

  function chaveEntidade(tipo, planoId, id) {
    return tipo + ':' + String(planoId || '') + ':' + encodeURIComponent(String(id || ''));
  }

  function agendaPersistente(item) {
    return !!(item && (item.gerado === false || item.extra || item.bloqueado));
  }

  const LETRAS_PT = 'A-Za-zÀ-ÖØ-öø-ÿ';
  const REGRAS_ACENTOS_PT = [
    ['Nao', 'Não'], ['nao', 'não'], ['Voce', 'Você'], ['voce', 'você'],
    ['Ate', 'Até'], ['ate', 'até'], ['ha', 'há'],
    ['catalogo', 'catálogo'], ['Catalogo', 'Catálogo'],
    ['usuarios', 'usuários'], ['usuario', 'usuário'], ['publicacao', 'publicação'],
    ['configuracoes', 'configurações'], ['revisoes', 'revisões'], ['revisao', 'revisão'],
    ['estatisticas', 'estatísticas'], ['historico', 'histórico'], ['sessoes', 'sessões'], ['sessao', 'sessão'],
    ['acoes', 'ações'], ['acao', 'ação'], ['opcoes', 'opções'], ['opcao', 'opção'],
    ['questoes', 'questões'], ['questao', 'questão'], ['topicos', 'tópicos'], ['topico', 'tópico'],
    ['proxima', 'próxima'], ['proximo', 'próximo'], ['ultimo', 'último'], ['ultima', 'última'],
    ['conteudo', 'conteúdo'], ['geracao', 'geração'], ['observacoes', 'observações'], ['observacao', 'observação'],
    ['incidencias', 'incidências'], ['incidencia', 'incidência'], ['classificacao', 'classificação'],
    ['convocacao', 'convocação'], ['nomeacoes', 'nomeações'], ['informacao', 'informação'], ['retificacao', 'retificação'],
    ['inclusoes', 'inclusões'], ['comparacao', 'comparação'], ['edicao', 'edição'],
    ['noticia', 'notícia'], ['noticias', 'notícias'], ['possivel', 'possível'],
    ['Basicos', 'Básicos'], ['basicos', 'básicos'], ['Especificos', 'Específicos'], ['especificos', 'específicos'],
    ['multipla', 'múltipla'], ['maxima', 'máxima'], ['alem', 'além'],
    ['confiavel', 'confiável'], ['rapida', 'rápida'], ['conferencia', 'conferência'],
    ['Compreensao', 'Compreensão'], ['compreensao', 'compreensão'],
    ['Interpretacao', 'Interpretação'], ['interpretacao', 'interpretação'],
    ['Acentuacao', 'Acentuação'], ['acentuacao', 'acentuação'],
    ['Ortografica', 'Ortográfica'], ['ortografica', 'ortográfica'],
    ['Grafica', 'Gráfica'], ['grafica', 'gráfica'],
    ['Tecnico', 'Técnico'], ['tecnico', 'técnico'], ['Judiciario', 'Judiciário'], ['judiciario', 'judiciário'],
    ['area', 'área'], ['Area', 'Área'], ['medio', 'médio'], ['Medio', 'Médio'],
    ['Publica', 'Pública'], ['publica', 'pública'], ['Publico', 'Público'], ['publico', 'público'],
    ['Policia', 'Polícia'], ['policia', 'polícia'], ['Rodoviaria', 'Rodoviária'], ['rodoviaria', 'rodoviária'],
    ['Juridica', 'Jurídica'], ['juridica', 'jurídica'], ['juridico', 'jurídico'],
    ['Lingua', 'Língua'], ['lingua', 'língua'], ['Etica', 'Ética'], ['etica', 'ética'],
    ['Raciocinio', 'Raciocínio'], ['raciocinio', 'raciocínio'], ['Logico', 'Lógico'], ['logico', 'lógico'],
    ['Nocoes', 'Noções'], ['nocoes', 'noções'], ['Matematica', 'Matemática'], ['matematica', 'matemática'],
    ['Fisica', 'Física'], ['fisica', 'física'], ['Quimica', 'Química'], ['quimica', 'química'],
    ['Informatica', 'Informática'], ['informatica', 'informática'], ['Legislacao', 'Legislação'], ['legislacao', 'legislação'],
    ['Justica', 'Justiça'], ['justica', 'justiça'], ['Ministerio', 'Ministério'], ['ministerio', 'ministério'],
    ['Codigo', 'Código'], ['codigo', 'código'], ['Analise', 'Análise'], ['analise', 'análise'],
    ['materia', 'matéria'], ['Materia', 'Matéria'], ['pagina', 'página'], ['Pagina', 'Página'],
    ['disponiveis', 'disponíveis'], ['disponivel', 'disponível'], ['cronometro', 'cronômetro'],
    ['calendario', 'calendário'], ['horario', 'horário'], ['graficos', 'gráficos'],
    ['notificacoes', 'notificações'], ['notificacao', 'notificação'], ['autenticacao', 'autenticação'],
    ['seguranca', 'segurança'], ['memoria', 'memória'], ['rapido', 'rápido'], ['Rapido', 'Rápido'],
    ['maximo', 'máximo'], ['minimo', 'mínimo'], ['numero', 'número'], ['invalido', 'inválido'],
    ['media', 'média'], ['Media', 'Média'], ['referencia', 'referência'], ['referencias', 'referências'],
    ['Brasilia', 'Brasília'], ['Ceara', 'Ceará'], ['Sao', 'São'], ['Regiao', 'Região'], ['Secao', 'Seção'],
    ['Nivel', 'Nível'], ['nivel', 'nível'], ['Junior', 'Júnior'], ['Enfase', 'Ênfase'], ['Operacao', 'Operação'],
    ['Petroleo', 'Petróleo'], ['generos', 'gêneros'], ['Generos', 'Gêneros'], ['narracao', 'narração'],
    ['descricao', 'descrição'], ['dissertacao', 'dissertação'], ['morfossintaticas', 'morfossintáticas'],
    ['Regencia', 'Regência'], ['regencia', 'regência'], ['Concordancia', 'Concordância'], ['concordancia', 'concordância'],
    ['Pontuacao', 'Pontuação'], ['pontuacao', 'pontuação'], ['paragrafos', 'parágrafos'],
    ['numericos', 'numéricos'], ['Relacoes', 'Relações'], ['relacoes', 'relações'], ['Equacoes', 'Equações'], ['equacoes', 'equações'],
    ['Funcoes', 'Funções'], ['funcoes', 'funções'], ['logaritmicas', 'logarítmicas'], ['trigonometricas', 'trigonométricas'],
    ['analitica', 'analítica'], ['circulo', 'círculo'], ['combinatoria', 'combinatória'],
    ['Progressao', 'Progressão'], ['progressao', 'progressão'], ['aritmetica', 'aritmética'], ['geometrica', 'geométrica'],
    ['Acidos', 'Ácidos'], ['acidos', 'ácidos'], ['oxidos', 'óxidos'], ['Reacoes', 'Reações'], ['reacoes', 'reações'],
    ['Calculos', 'Cálculos'], ['calculos', 'cálculos'], ['estequiometricos', 'estequiométricos'],
    ['Transformacoes', 'Transformações'], ['transformacoes', 'transformações'], ['equilibrio', 'equilíbrio'],
    ['Condicoes', 'Condições'], ['condicoes', 'condições'], ['Solucoes', 'Soluções'], ['solucoes', 'soluções'],
    ['Dispersoes', 'Dispersões'], ['dispersoes', 'dispersões'], ['eletrica', 'elétrica'], ['organica', 'orgânica'],
    ['polimeros', 'polímeros'], ['Termoquimica', 'Termoquímica'], ['termicos', 'térmicos'], ['quimicos', 'químicos'],
    ['Estatica', 'Estática'], ['cinematica', 'cinemática'], ['dinamica', 'dinâmica'], ['mecanica', 'mecânica'],
    ['Hidrostatica', 'Hidrostática'], ['Termodinamica', 'Termodinâmica'], ['basica', 'básica'],
    ['Maquinas', 'Máquinas'], ['Eletrostatica', 'Eletrostática'], ['Radiacao', 'Radiação'],
    ['eletronica', 'eletrônica'], ['instrumentacao', 'instrumentação'], ['metrologia', 'metrologia'],
    ['Operacoes', 'Operações'], ['operacoes', 'operações'], ['Seguranca', 'Segurança'], ['saude', 'saúde'], ['Tubulacoes', 'Tubulações'], ['valvulas', 'válvulas'],
    ['acessorios', 'acessórios'], ['Transmissao', 'Transmissão'], ['pneumaticos', 'pneumáticos'],
    ['centrifugas', 'centrífugas'], ['Administracao', 'Administração'], ['administracao', 'administração'],
    ['Constituicao', 'Constituição'], ['constituicao', 'constituição'], ['disposicoes', 'disposições'],
    ['publicos', 'públicos'], ['Licitacoes', 'Licitações'], ['licitacoes', 'licitações'], ['proibicoes', 'proibições'],
    ['vacancia', 'vacância'], ['Principios', 'Princípios'], ['principios', 'princípios'], ['Republica', 'República'],
    ['Sucessao', 'Sucessão'], ['sucessao', 'sucessão'], ['Remuneracao', 'Remuneração'], ['remuneracao', 'remuneração'],
    ['salario', 'salário'], ['Duracao', 'Duração'], ['duracao', 'duração'], ['protecao', 'proteção'],
    ['Ferias', 'Férias'], ['ferias', 'férias'], ['previo', 'prévio'], ['Competencia', 'Competência'], ['competencia', 'competência'],
    ['Organizacao', 'Organização'], ['organizacao', 'organização'], ['Direcao', 'Direção'], ['direcao', 'direção'],
    ['Comunicacao', 'Comunicação'], ['comunicacao', 'comunicação'], ['citacao', 'citação'], ['citacoes', 'citações'],
    ['intimacao', 'intimação'], ['intimacoes', 'intimações'], ['sumario', 'sumário'], ['suspeicao', 'suspeição'],
    ['distribuicao', 'distribuição'], ['peticao', 'petição'], ['provisoria', 'provisória'],
    ['Resolucao', 'Resolução'], ['resolucao', 'resolução'], ['Deficiencia', 'Deficiência'], ['deficiencia', 'deficiência'],
    ['Orcamento', 'Orçamento'], ['orcamento', 'orçamento'], ['orcamentarios', 'orçamentários'],
    ['politico', 'político'], ['tramitacao', 'tramitação'], ['expedicao', 'expedição'],
    ['Metodos', 'Métodos'], ['metodos', 'métodos'], ['Numeros', 'Números'], ['numeros', 'números'],
    ['aritmeticos', 'aritméticos'], ['geometricos', 'geométricos'],
    ['Prevencao', 'Prevenção'], ['prevencao', 'prevenção'], ['virus', 'vírus'], ['eletronico', 'eletrônico'],
    ['Servicos', 'Serviços'], ['servicos', 'serviços'], ['jurisdicao', 'jurisdição'],
    ['Redacao', 'Redação'], ['redacao', 'redação'],
    ['Audiencias', 'Audiências'], ['audiencias', 'audiências'], ['notificacao', 'notificação'], ['confissao', 'confissão'],
    ['ordinario', 'ordinário'], ['sumarissimo', 'sumaríssimo'], ['Dissidio', 'Dissídio'], ['dissidio', 'dissídio'],
    ['reclamacao', 'reclamação'], ['representacao', 'representação'], ['substituicao', 'substituição'],
    ['vicios', 'vícios'], ['correcao', 'correção'], ['concisao', 'concisão'], ['precisao', 'precisão'],
    ['Coerencia', 'Coerência'], ['coerencia', 'coerência'], ['argumentacao', 'argumentação'],
    ['transcricao', 'transcrição'], ['contemporaneo', 'contemporâneo']
  ].map(function (par) {
    return { re: new RegExp('(^|[^' + LETRAS_PT + '])' + par[0] + '(?=$|[^' + LETRAS_PT + '])', 'g'), para: '$1' + par[1] };
  });

  const CAMPOS_TEXTO_PT = {
    titulo: true, nome: true, concurso: true, orgao: true, cargo: true, area: true,
    fonte: true, corte_fonte: true, escala: true, observacoes: true, observacao: true, descricao: true,
    desc: true, texto: true, nomeRitmo: true, frente: true, verso: true
  };

  function corrigirAcentosTexto(valor) {
    if (typeof valor !== 'string') return valor;
    let texto = valor;
    REGRAS_ACENTOS_PT.forEach(function (r) { texto = texto.replace(r.re, r.para); });
    texto = texto
      .replace(/\bPúblicação\b/g, 'Publicação')
      .replace(/\bpúblicação\b/g, 'publicação')
      .replace(/\bpúblicações\b/g, 'publicações')
      .replace(/\bsugerida e (apenas|aproximada)\b/g, 'sugerida é $1')
      .replace(/\bsugerida e (somente|muito)\b/g, 'sugerida é $1')
      .replace(/\b3a Região\b/g, '3ª Região')
      .replace(/\b4a Região\b/g, '4ª Região')
      .replace(/\b13o\b/g, '13º')
      .replace(/\boxido-redução\b/gi, function (m) { return m[0] === 'O' ? 'Óxido-redução' : 'óxido-redução'; });
    return texto;
  }

  function normalizarAcentosCampos(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    Object.keys(obj).forEach(function (chave) {
      const valor = obj[chave];
      if (typeof valor === 'string' && CAMPOS_TEXTO_PT[chave]) {
        obj[chave] = corrigirAcentosTexto(valor);
      } else if (Array.isArray(valor) && CAMPOS_TEXTO_PT[chave]) {
        obj[chave] = valor.map(function (item) {
          return typeof item === 'string' ? corrigirAcentosTexto(item) : normalizarAcentosCampos(item);
        });
      }
    });
    return obj;
  }

  function normalizarAcentosDisciplinas(disciplinas) {
    if (!Array.isArray(disciplinas)) return disciplinas;
    disciplinas.forEach(function (d) {
      normalizarAcentosCampos(d);
      (d.topicos || []).forEach(normalizarAcentosCampos);
    });
    return disciplinas;
  }

  function normalizarAcentosEdital(edital) {
    normalizarAcentosCampos(edital);
    if (edital && edital.notas_corte_ultimo_nomeado) {
      normalizarAcentosCampos(edital.notas_corte_ultimo_nomeado);
      Object.keys(edital.notas_corte_ultimo_nomeado).forEach(function (k) {
        normalizarAcentosCampos(edital.notas_corte_ultimo_nomeado[k]);
      });
    }
    normalizarAcentosDisciplinas(edital && edital.disciplinas);
    return edital;
  }

  function normalizarAcentosConteudo(state) {
    if (!state || typeof state !== 'object') return state;
    (state.planos || []).forEach(function (p) {
      normalizarAcentosCampos(p && p.plano);
      if (p && p.plano && p.plano.meta) normalizarAcentosCampos(p.plano.meta);
      normalizarAcentosDisciplinas(p && p.disciplinas);
    });
    (state.editais || []).forEach(normalizarAcentosEdital);
    ((state.config && state.config.carreirasPersonalizadas) || []).forEach(normalizarAcentosEdital);
    (state.flashcards || []).forEach(function (deck) {
      normalizarAcentosCampos(deck);
      (deck.cards || []).forEach(normalizarAcentosCampos);
    });
    return state;
  }

  function estadoVazio() {
    const agora = agoraISO();
    return {
      versao: VERSAO_SCHEMA,
      planos: [],        // {id, criadoEm, plano, disciplinas, cronogramas, links}
      planoAtivoId: null,
      // slots hidratados do plano ativo (referências para dentro de planos[])
      plano: null,
      disciplinas: [],
      cronogramas: { sustentavel: [], hardcore: [] },
      links: [],
      sessoes: [],   // {id, planoId, data, topicoId, tipo, duracaoMin, qFeitas, qCertas, obs, revisaoId?}
      revisoes: [],  // {id, planoId, topicoId, tipo, dataAgendada, dataConcluida, resultadoPct, duracaoConcluidaMin?, sessaoId?}
      simulados: [], // {id, planoId, data, tipo, acertos:[{disciplinaId, certas, total}]}
      agenda: [],    // {id, planoId, data, disciplinaId, topicoId|null, duracaoMin, obs, feito, gerado}
      editais: [],   // editais esquematizados {id, titulo, banca, notaCorte, criadoEm, disciplinas}
      flashcards: [], // {id, planoId, disciplinaId, nome, criadoEm, cards:[{id, frente, verso, criadoEm, sr}]}
      config: {
        ultimoBackup: null,
        metaQuestoesSemana: 100,
        onboardingNomeVisto: false,
        onboardingGuiaVisto: false,
        lembretesPush: false,
        tema: 'claro',
        carreirasPersonalizadas: [],
        criadoEm: agora,
        atualizadoEm: agora,
        googleCalendar: { clientId: '', calendarId: 'primary', eventos: {} }
      }
    };
  }

  // re-aponta os slots (plano/disciplinas/...) para o plano ativo
  function hidratar(state) {
    const ativo = state.planos.find(function (p) { return p.id === state.planoAtivoId; }) || null;
    state.plano = ativo ? ativo.plano : null;
    state.disciplinas = ativo ? ativo.disciplinas : [];
    state.cronogramas = ativo ? ativo.cronogramas : { sustentavel: [], hardcore: [] };
    state.links = ativo ? (ativo.links || []) : [];
    return state;
  }

  // Garante modo de planejamento e ciclo válido em um plano (objeto plano.plano).
  function normalizarCicloPlano(plano) {
    if (plano.modoPlanejamento !== 'ciclo') plano.modoPlanejamento = 'cronograma';
    if (!plano.ciclo || typeof plano.ciclo !== 'object') plano.ciclo = { blocos: [], volta: 1 };
    if (!Array.isArray(plano.ciclo.blocos)) plano.ciclo.blocos = [];
    const volta = parseInt(plano.ciclo.volta, 10);
    plano.ciclo.volta = volta > 0 ? volta : 1;
    plano.ciclo.blocos = plano.ciclo.blocos
      .filter(function (b) { return b && b.disciplinaId; })
      .map(function (b) {
        const meta = Math.round(Number(b.metaMin));
        const feito = Math.round(Number(b.feitoMin));
        return {
          id: b.id || novoId('blc'),
          disciplinaId: String(b.disciplinaId),
          topicoId: b.topicoId || null,
          metaMin: meta > 0 ? meta : 60,
          feitoMin: feito > 0 ? Math.min(feito, meta > 0 ? meta : 60) : 0
        };
      });
    return plano;
  }

  // Estado de participação da disciplina no planejamento. O campo é opcional nos
  // backups antigos; a migração o preenche sem alterar tópicos nem histórico.
  function normalizarStatusDisciplinas(disciplinas) {
    (disciplinas || []).forEach(function (d) {
      if (!d || d.id === 'ORF') return;
      if (d.cor != null && (typeof d.cor !== 'string' || !/^#[0-9a-f]{6}$/i.test(d.cor))) d.cor = '#3B82F6';
      const topicos = (d.topicos || []).filter(function (t) { return t && !t.orfao; });
      const concluida = topicos.length > 0 && topicos.every(function (t) {
        return t.status === 'teoria_concluida' || t.status === 'dominado';
      });
      if (d.planejamentoStatus === 'paused') return;
      d.planejamentoStatus = concluida ? 'completed' : 'active';
    });
  }

  // Recupera horas perdidas: para cada bloco da agenda concluído cujo tópico não
  // era resolvível (b.topicoId nulo e a disciplina sem tópicos), o registro antigo
  // pela bolinha NÃO criava sessão. Aqui recriamos a sessão correspondente. Blocos
  // com tópico ficam de fora (já têm sessão) e o guard registroRapidoId evita
  // recriar caso a migração rode de novo.
  function backfillSessoesBlocosSemTopico(state) {
    if (!Array.isArray(state.agenda)) return;
    function discDoBloco(b) {
      const p = (state.planos || []).find(function (x) { return x.id === b.planoId; });
      const lista = p ? p.disciplinas : state.disciplinas;
      return (lista || []).find(function (d) { return d.id === b.disciplinaId; }) || null;
    }
    state.agenda.forEach(function (b) {
      if (!b || !b.feito || b.registroRapidoId) return;
      const min = b.feitoMin || b.duracaoMin || 0;
      if (min <= 0) return;
      const disc = discDoBloco(b);
      const topId = b.topicoId || (disc && disc.topicos && disc.topicos[0] ? disc.topicos[0].id : null);
      if (topId) return; // tinha tópico → o registro antigo já gravou a sessão
      const sessao = {
        id: novoId('ses'), planoId: b.planoId, data: b.data, topicoId: null,
        tipo: b.obs === 'questoes' ? 'questoes' : b.obs === 'revisao' ? 'revisao' : 'teoria',
        duracaoMin: min, qFeitas: 0, qCertas: 0, obs: '', origemRegistroRapido: 'fila'
      };
      state.sessoes.push(sessao);
      b.registroRapidoId = sessao.id;
    });
  }

  function migrar(state) {
    // ponto único para migrações de schema
    if (!state.config) state.config = { ultimoBackup: null, metaQuestoesSemana: 100 };
    if (!state.config.criadoEm) state.config.criadoEm = agoraISO();
    if (!state.config.atualizadoEm) state.config.atualizadoEm = state.config.criadoEm;
    // Tombstones: ids de registros de estudo excluídos de propósito. O merge
    // multi-dispositivo usa isso para NÃO ressuscitar o que o usuário apagou.
    if (!Array.isArray(state.config.removidos)) state.config.removidos = [];
    if (!state.config.entidadesExcluidas || typeof state.config.entidadesExcluidas !== 'object' || Array.isArray(state.config.entidadesExcluidas)) {
      state.config.entidadesExcluidas = {};
    }
    if (!Number.isFinite(parseInt(state.config.rev, 10))) state.config.rev = 0;
    if (state.config.metaQuestoesSemana === undefined) state.config.metaQuestoesSemana = 100;
    // Metas de acerto definidas pelo aluno: % geral (null = usa a nota de corte do
    // plano) e overrides por disciplina ({ disciplinaId: pct }).
    if (state.config.metaAcertoPct === undefined) state.config.metaAcertoPct = null;
    if (!state.config.metaAcertoDisc || typeof state.config.metaAcertoDisc !== 'object' || Array.isArray(state.config.metaAcertoDisc)) {
      state.config.metaAcertoDisc = {};
    }
    if (!state.config.onboardingNomeVisto) {
      const temAtividade = (Array.isArray(state.planos) && state.planos.length > 0) ||
                           (Array.isArray(state.sessoes) && state.sessoes.length > 0);
      state.config.onboardingNomeVisto = !!state.config.nomeUsuario || temAtividade;
    }
    if (state.config.ultimoBackup === undefined) state.config.ultimoBackup = null;
    state.config.lembretesPush = state.config.lembretesPush === true;
    if (!state.config.tema) state.config.tema = 'claro';
    if (!Array.isArray(state.config.carreirasPersonalizadas)) state.config.carreirasPersonalizadas = [];
    if (!Array.isArray(state.config.blocosVinculados)) state.config.blocosVinculados = [];
    // Regras de estudo recorrente (troca de disciplina por dia da semana), que o
    // motor de geração da agenda respeita (ver domain.aplicarRegrasAgenda).
    if (!Array.isArray(state.config.regrasAgenda)) state.config.regrasAgenda = [];
    if (!Array.isArray(state.config.historicoAjustesAgenda)) state.config.historicoAjustesAgenda = [];
    if (state.config.ultimoAjusteAgenda === undefined) state.config.ultimoAjusteAgenda = null;
    if (!state.config.googleCalendar) state.config.googleCalendar = {};
    if (state.config.googleCalendar.clientId === undefined) state.config.googleCalendar.clientId = '';
    if (!state.config.googleCalendar.calendarId) state.config.googleCalendar.calendarId = 'primary';
    if (!state.config.googleCalendar.eventos || Array.isArray(state.config.googleCalendar.eventos)) {
      state.config.googleCalendar.eventos = {};
    }
    if (!state.sessoes) state.sessoes = [];
    if (!state.revisoes) state.revisoes = [];
    if (!state.simulados) state.simulados = [];
    state.sessoes.forEach(function (s) {
      if (!s) return;
      const feitas = Math.max(0, Math.round(Number(s.qFeitas) || 0));
      const certas = Math.max(0, Math.round(Number(s.qCertas) || 0));
      s.qFeitas = feitas;
      s.qCertas = Math.min(feitas, certas);
    });
    state.simulados.forEach(function (sim) {
      (sim && sim.acertos || []).forEach(function (a) {
        const total = Math.max(0, Math.round(Number(a.total) || 0));
        const certas = Math.max(0, Math.round(Number(a.certas) || 0));
        a.total = total;
        a.certas = Math.min(total, certas);
      });
    });
    if (!state.agenda) state.agenda = [];
    // Progresso parcial dos blocos: minutos já estudados (acumulados pelo timer/
    // registro). Blocos antigos marcados como feitos contam o tempo planejado.
    state.agenda.forEach(function (a) {
      if (a && typeof a.feitoMin !== 'number') a.feitoMin = a.feito ? (a.duracaoMin || 0) : 0;
    });
    if (!Array.isArray(state.editais)) state.editais = [];
    if (!Array.isArray(state.flashcards)) state.flashcards = [];

    // v1 → v2: embrulha o plano único em planos[] e carimba o histórico
    if (!state.planos) {
      state.planos = [];
      if (state.plano) {
        const pid = novoId('pln');
        state.planos.push({
          id: pid,
          criadoEm: agoraISO(),
          plano: state.plano,
          disciplinas: state.disciplinas || [],
          cronogramas: state.cronogramas || { sustentavel: [], hardcore: [] },
          links: state.links || []
        });
        state.planoAtivoId = pid;
        [state.sessoes, state.revisoes, state.simulados, state.agenda].forEach(function (lista) {
          lista.forEach(function (item) { if (!item.planoId) item.planoId = pid; });
        });
      } else {
        state.planoAtivoId = null;
      }
    }
    if (state.planoAtivoId && !state.planos.some(function (p) { return p.id === state.planoAtivoId; })) {
      state.planoAtivoId = state.planos.length > 0 ? state.planos[0].id : null;
    }
    // Ciclo de estudos: cada plano ganha um modo ('cronograma' | 'ciclo') e um
    // ciclo (fila ponderada de blocos). Planos antigos ficam em 'cronograma'.
    state.planos.forEach(function (p) {
      if (!p) return;
      if (p.plano) normalizarCicloPlano(p.plano);
      normalizarStatusDisciplinas(p.disciplinas);
      if (!p.estruturaAtualizadaEm) p.estruturaAtualizadaEm = p.atualizadoEm || p.criadoEm || state.config.criadoEm;
      if (!Number.isFinite(parseInt(p.estruturaRev, 10))) p.estruturaRev = 0;
      if (!p.estruturaHash) p.estruturaHash = assinaturaPlano(p);
    });
    normalizarAcentosConteudo(state);
    // Backfill único: até a correção do registro pela bolinha, um bloco concluído
    // SEM tópico resolvível era riscado (feito) mas não gravava sessão — então as
    // horas não somavam. Recriamos a sessão só para esses casos (tópico não
    // resolvível = o código antigo nunca criou sessão), sem risco de duplicar:
    // blocos com tópico já têm sessão e o guard registroRapidoId torna idempotente.
    if (!state.config.backfillSessoesSemTopico) {
      backfillSessoesBlocosSemTopico(state);
      state.config.backfillSessoesSemTopico = true;
    }
    state.versao = VERSAO_SCHEMA;
    return hidratar(state);
  }

  function carregar() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return estadoVazio();
      return migrar(JSON.parse(bruto));
    } catch (e) {
      console.error('Falha ao ler o estado salvo; iniciando vazio.', e);
      return estadoVazio();
    }
  }

  // Remove apenas os dados pessoais do app. Preferências visuais e o id técnico
  // do dispositivo ficam em chaves separadas e não expõem o plano do aluno.
  function limparLocal() {
    localStorage.removeItem(CHAVE);
  }

  function lerPersistidoCru() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      return bruto ? JSON.parse(bruto) : null;
    } catch (e) {
      return null;
    }
  }

  function mapaPorId(lista) {
    const mapa = {};
    (Array.isArray(lista) ? lista : []).forEach(function (item) {
      if (item && item.id) mapa[item.id] = item;
    });
    return mapa;
  }

  function carimbarItensAlterados(state, anterior, agora) {
    ['sessoes', 'revisoes', 'simulados', 'flashcards'].forEach(function (nome) {
      const antigos = mapaPorId(anterior && anterior[nome]);
      (state[nome] || []).forEach(function (item) {
        if (!item || !item.id) return;
        const antigo = antigos[item.id];
        if (!antigo || assinaturaItem(item) !== assinaturaItem(antigo)) item.atualizadoEm = agora;
      });
    });

    const agendasAntigas = mapaPorId(anterior && anterior.agenda);
    (state.agenda || []).forEach(function (item) {
      if (!agendaPersistente(item) || !item.id) return;
      const antigo = agendasAntigas[item.id];
      if (!antigo || assinaturaItem(item) !== assinaturaItem(antigo)) item.atualizadoEm = agora;
    });

    const decksAntigos = mapaPorId(anterior && anterior.flashcards);
    (state.flashcards || []).forEach(function (deck) {
      if (!deck || !deck.id) return;
      const cardsAntigos = mapaPorId(decksAntigos[deck.id] && decksAntigos[deck.id].cards);
      (deck.cards || []).forEach(function (card) {
        if (!card || !card.id) return;
        const antigo = cardsAntigos[card.id];
        if (!antigo || assinaturaItem(card) !== assinaturaItem(antigo)) card.atualizadoEm = agora;
      });
    });
  }

  function entidadesDoEstado(state) {
    const entidades = {};
    (state && state.planos || []).forEach(function (p) {
      if (!p || !p.id) return;
      (p.disciplinas || []).forEach(function (d) {
        if (!d || !d.id) return;
        entidades[chaveEntidade('disc', p.id, d.id)] = true;
        (d.topicos || []).forEach(function (t) {
          if (t && t.id) entidades[chaveEntidade('top', p.id, t.id)] = true;
        });
      });
      (p.links || []).forEach(function (link) {
        const id = idLink(link);
        if (id) entidades[chaveEntidade('link', p.id, id)] = true;
      });
    });
    (state && state.agenda || []).forEach(function (item) {
      if (agendaPersistente(item) && item.id) entidades[chaveEntidade('agenda', item.planoId, item.id)] = true;
    });
    (state && state.flashcards || []).forEach(function (deck) {
      (deck && deck.cards || []).forEach(function (card) {
        if (card && card.id) entidades[chaveEntidade('card', deck.id, card.id)] = true;
      });
    });
    return entidades;
  }

  function registrarEntidadesExcluidas(state, anterior, agora) {
    if (!anterior) return;
    const antes = entidadesDoEstado(anterior);
    const agoraExistentes = entidadesDoEstado(state);
    const lapides = state.config.entidadesExcluidas;
    Object.keys(antes).forEach(function (chave) {
      if (!agoraExistentes[chave]) lapides[chave] = agora;
    });
    // Recriações explícitas com o mesmo id neste aparelho voltam a ser válidas.
    Object.keys(agoraExistentes).forEach(function (chave) {
      if (!antes[chave] && lapides[chave]) delete lapides[chave];
    });
  }

  function carimbarEstruturasAlteradas(state, agora) {
    (state.planos || []).forEach(function (plano) {
      if (!plano) return;
      const assinatura = assinaturaPlano(plano);
      if (plano.estruturaHash && plano.estruturaHash !== assinatura) {
        plano.estruturaAtualizadaEm = agora;
        plano.atualizadoEm = agora; // compatibilidade com versões antigas do app
        plano.estruturaRev = (parseInt(plano.estruturaRev, 10) || 0) + 1;
      }
      plano.estruturaHash = assinaturaPlano(plano);
    });
  }

  function paraPersistencia(state) {
    const copia = clonarJson(state || estadoVazio());
    migrar(copia);
    delete copia.plano;
    delete copia.disciplinas;
    delete copia.cronogramas;
    delete copia.links;
    return copia;
  }

  function estadosEquivalentes(a, b) {
    return stringifyEstavel(paraPersistencia(a)) === stringifyEstavel(paraPersistencia(b));
  }

  function limparLapidesDeEntidadesPresentes(state, restaurado) {
    const presentes = entidadesDoEstado(restaurado);
    [state && state.config, restaurado && restaurado.config].forEach(function (config) {
      if (!config || !config.entidadesExcluidas) return;
      Object.keys(presentes).forEach(function (chave) {
        if (config.entidadesExcluidas[chave]) delete config.entidadesExcluidas[chave];
      });
    });
  }

  function salvar(state, opcoes) {
    opcoes = opcoes || {};
    const anterior = lerPersistidoCru();
    migrar(state);
    if (opcoes.marcarAlterado !== false) {
      const agora = agoraISO();
      registrarEntidadesExcluidas(state, anterior, agora);
      carimbarItensAlterados(state, anterior, agora);
      carimbarEstruturasAlteradas(state, agora);
      state.config.atualizadoEm = agora;
      // Contador de revisão monotônico: desempata a escolha da "base" da mescla
      // sem depender do relógio do aparelho (relógio errado não engana o sync).
      state.config.rev = (parseInt(state.config.rev, 10) || 0) + 1;
    }
    // Não duplica o plano ativo no JSON salvo: os slots são recriados no carregar().
    const copia = paraPersistencia(state);
    try {
      localStorage.setItem(CHAVE, JSON.stringify(copia));
      return { ok: true };
    } catch (e) {
      // Quota estourada (estado grande, ex.: fotos de edital em data URL): não
      // derruba a ação do usuário — o estado segue em memória e vai para a
      // nuvem pelo sync; só o cache local deste aparelho fica defasado.
      console.error('Não consegui salvar no localStorage (quota?). O estado segue em memória/na nuvem.', e);
      return { ok: false, erro: e && e.message ? e.message : String(e) };
    }
  }

  function ativarPlano(state, planoId) {
    if (!state.planos.some(function (p) { return p.id === planoId; })) return false;
    state.planoAtivoId = planoId;
    hidratar(state);
    return true;
  }

  function removerPlano(state, planoId) {
    state.planos = state.planos.filter(function (p) { return p.id !== planoId; });
    if (state.planoAtivoId === planoId) {
      state.planoAtivoId = state.planos.length > 0 ? state.planos[0].id : null;
    }
    hidratar(state);
  }

  // ---------- Exportação/restauração manual (a nuvem fica com o Firebase) ----------
  function exportarBackup(state) {
    state.config.ultimoBackup = window.Dominio.hojeISO();
    const persistencia = salvar(state);
    const copia = Object.assign({}, state);
    delete copia.plano; delete copia.disciplinas; delete copia.cronogramas; delete copia.links;
    const blob = new Blob([JSON.stringify(copia, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-estudos-' + state.config.ultimoBackup + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return persistencia;
  }

  function importarBackup(texto, opcoes) {
    opcoes = opcoes || {};
    let dados;
    try { dados = JSON.parse(texto); }
    catch (e) { return { ok: false, erro: 'O arquivo não é um JSON válido: ' + e.message }; }
    if (!dados || !Array.isArray(dados.sessoes) || (dados.versao !== 1 && dados.versao !== VERSAO_SCHEMA)) {
      return { ok: false, erro: 'O arquivo não parece ser um backup deste app (campo "versao" ou "sessoes" ausente).' };
    }
    try {
      const state = migrar(dados);
      if (opcoes.persistir !== false) {
        const persistencia = salvar(state);
        if (!persistencia.ok) return { ok: false, erro: 'O backup é válido, mas não coube no armazenamento local: ' + persistencia.erro };
      }
      return { ok: true, state };
    } catch (e) {
      return { ok: false, erro: 'Não foi possível restaurar o backup: ' + (e && e.message ? e.message : String(e)) };
    }
  }

  function diasDesdeBackup(state) {
    if (!state.config.ultimoBackup) return null;
    return window.Dominio.diffDias(state.config.ultimoBackup, window.Dominio.hojeISO());
  }

  function temDados(state) {
    return state.planos.length > 0 || state.sessoes.length > 0;
  }

  // Listas de registros de estudo que devem SOMAR entre dispositivos (e não ser
  // substituídas por completo). Cada item tem id estável. A união é segura contra
  // ressurreição porque exclusões explícitas deixam tombstone (config.removidos
  // para registros; config.planosExcluidos para planos). A `agenda` fica de fora
  // de propósito: é regenerável (ganha ids novos a cada recálculo) e uni-la
  // duplicaria blocos no calendário — as horas vivem nas `sessoes`, não nos blocos.
  const LISTAS_ESTUDO = ['sessoes', 'revisoes', 'simulados', 'flashcards'];

  // Quantos registros de estudo um estado carrega (para detectar se a mesclagem
  // realmente recuperou itens que faltavam num dos lados).
  function contarRegistros(state) {
    if (!state) return 0;
    return LISTAS_ESTUDO.reduce(function (n, k) {
      return n + (Array.isArray(state[k]) ? state[k].length : 0);
    }, 0);
  }

  // Marca ids como removidos de propósito (tombstone), para o merge não os trazer
  // de volta de um dispositivo desatualizado. Aceita um id ou um array de ids.
  function marcarRemovido(state, ids) {
    if (!state.config) state.config = {};
    if (!Array.isArray(state.config.removidos)) state.config.removidos = [];
    const lista = Array.isArray(ids) ? ids : [ids];
    const set = {};
    state.config.removidos.forEach(function (i) { set[i] = true; });
    lista.forEach(function (i) { if (i && !set[i]) { state.config.removidos.push(i); set[i] = true; } });
  }

  function itemMaisNovo(preferido, complementar, tipo) {
    if (!preferido) return clonarJson(complementar);
    if (!complementar) return preferido;
    const dataP = preferido.atualizadoEm || '';
    const dataC = complementar.atualizadoEm || '';
    if (dataC > dataP) return clonarJson(complementar);
    if (dataP > dataC) return preferido;
    // Backups antigos não tinham carimbo por registro. Neles, uma conclusão não
    // pode voltar a pendente só porque o estado pendente foi escolhido como base.
    if (tipo === 'revisoes' && complementar.dataConcluida && !preferido.dataConcluida) {
      return clonarJson(complementar);
    }
    if (tipo === 'card') {
      const revisaoP = preferido.sr && preferido.sr.ultimaRevisao || '';
      const revisaoC = complementar.sr && complementar.sr.ultimaRevisao || '';
      if (revisaoC > revisaoP) return clonarJson(complementar);
    }
    return preferido;
  }

  function mesclarDeckFlashcards(preferido, complementar, lapidesEntidades) {
    const resultado = itemMaisNovo(preferido, complementar, 'flashcards');
    const outro = resultado === preferido ? complementar : preferido;
    resultado.cards = Array.isArray(resultado.cards) ? resultado.cards : [];
    const porId = {};
    resultado.cards.forEach(function (card, i) { if (card && card.id) porId[card.id] = i; });
    (outro && outro.cards || []).forEach(function (card) {
      if (!card || !card.id) return;
      const chave = chaveEntidade('card', resultado.id, card.id);
      if (lapidesEntidades[chave]) return;
      if (porId[card.id] === undefined) {
        porId[card.id] = resultado.cards.length;
        resultado.cards.push(clonarJson(card));
      } else {
        resultado.cards[porId[card.id]] = itemMaisNovo(resultado.cards[porId[card.id]], card, 'card');
      }
    });
    resultado.cards = resultado.cards.filter(function (card) {
      return !card || !card.id || !lapidesEntidades[chaveEntidade('card', resultado.id, card.id)];
    });
    return resultado;
  }

  function unirItensPorId(preferidos, complementares) {
    const resultado = Array.isArray(preferidos) ? preferidos : [];
    const ids = {};
    resultado.forEach(function (item) { if (item && item.id) ids[item.id] = true; });
    (Array.isArray(complementares) ? complementares : []).forEach(function (item) {
      if (item && item.id && !ids[item.id]) { resultado.push(clonarJson(item)); ids[item.id] = true; }
    });
    return resultado;
  }

  function entidadeExcluida(lapides, tipo, planoId, id) {
    return !!lapides[chaveEntidade(tipo, planoId, id)];
  }

  function filtrarEstruturaPlano(plano, lapides) {
    if (!plano) return plano;
    plano.disciplinas = (plano.disciplinas || []).filter(function (d) {
      return !d || !d.id || !entidadeExcluida(lapides, 'disc', plano.id, d.id);
    });
    plano.disciplinas.forEach(function (d) {
      d.topicos = (d.topicos || []).filter(function (t) {
        return !t || !t.id || !entidadeExcluida(lapides, 'top', plano.id, t.id);
      });
    });
    plano.links = (plano.links || []).filter(function (link) {
      const id = idLink(link);
      return !id || !entidadeExcluida(lapides, 'link', plano.id, id);
    });
    return plano;
  }

  // Resolve edições estruturais concorrentes sem trocar o plano inteiro. Campos
  // escalares e cronogramas seguem a versão mais nova; disciplinas/tópicos/links
  // adicionados no outro aparelho são preservados por id.
  function mesclarEstruturaPlano(preferido, complementar, lapides) {
    if (!preferido || !complementar) return preferido || complementar;
    filtrarEstruturaPlano(preferido, lapides);
    filtrarEstruturaPlano(complementar, lapides);
    preferido.disciplinas = Array.isArray(preferido.disciplinas) ? preferido.disciplinas : [];
    const discPorId = {};
    preferido.disciplinas.forEach(function (d) { if (d && d.id) discPorId[d.id] = d; });
    (complementar.disciplinas || []).forEach(function (d) {
      if (!d || !d.id) return;
      if (entidadeExcluida(lapides, 'disc', preferido.id, d.id)) return;
      if (!discPorId[d.id]) {
        const copia = clonarJson(d);
        preferido.disciplinas.push(copia);
        discPorId[d.id] = copia;
        return;
      }
      const disc = discPorId[d.id];
      disc.topicos = unirItensPorId(disc.topicos, (d.topicos || []).filter(function (t) {
        return !t || !t.id || !entidadeExcluida(lapides, 'top', preferido.id, t.id);
      }));
    });

    preferido.links = Array.isArray(preferido.links) ? preferido.links : [];
    const chavesLink = {};
    preferido.links.forEach(function (l) {
      if (l) chavesLink[l.id || l.url || JSON.stringify(l)] = true;
    });
    (complementar.links || []).forEach(function (l) {
      if (!l) return;
      const chave = l.id || l.url || JSON.stringify(l);
      if (entidadeExcluida(lapides, 'link', preferido.id, idLink(l))) return;
      if (!chavesLink[chave]) { preferido.links.push(clonarJson(l)); chavesLink[chave] = true; }
    });
    return filtrarEstruturaPlano(preferido, lapides);
  }

  // Mescla dois estados sem perder registros de estudo: `base` (o mais recente)
  // define plano/config/disciplinas e vence empates de mesmo id; `outro` contribui
  // apenas os registros cujo id não existe em `base`. Resolve a
  // perda multi-dispositivo do last-write-wins (um aparelho sobrescrevia as sessões
  // que só existiam no outro), SEM ressuscitar o que foi apagado: tombstones
  // (config.removidos) de qualquer lado são respeitados e propagados, e a exclusão
  // total continua tratada antes, pelo apagadoEm.
  function mesclarEstados(base, outro) {
    const merged = JSON.parse(JSON.stringify(base || {}));
    if (!outro) return migrar(merged);
    if (!merged.config) merged.config = {};
    // Tombstones combinados dos dois lados: ninguém ressuscita o que alguém apagou.
    const tomb = {};
    [base, outro].forEach(function (st) {
      const r = st && st.config && Array.isArray(st.config.removidos) ? st.config.removidos : [];
      r.forEach(function (id) { tomb[id] = true; });
    });
    merged.config.removidos = Object.keys(tomb);
    const tombEntidades = Object.assign(
      {},
      base && base.config && base.config.entidadesExcluidas,
      outro && outro.config && outro.config.entidadesExcluidas
    );
    merged.config.entidadesExcluidas = tombEntidades;
    LISTAS_ESTUDO.forEach(function (k) {
      let baseLista = Array.isArray(merged[k]) ? merged[k] : (merged[k] = []);
      const outroLista = Array.isArray(outro[k]) ? outro[k] : [];
      // tira do resultado o que foi apagado em QUALQUER dispositivo (deleção vence)
      baseLista = merged[k] = baseLista.filter(function (item) { return !item || !tomb[item.id]; });
      const ids = {};
      baseLista.forEach(function (item, i) { if (item && item.id) ids[item.id] = i; });
      outroLista.forEach(function (item) {
        if (!item || !item.id || tomb[item.id]) return;
        if (ids[item.id] === undefined) {
          ids[item.id] = baseLista.length;
          baseLista.push(clonarJson(item));
        } else if (k === 'flashcards') {
          baseLista[ids[item.id]] = mesclarDeckFlashcards(baseLista[ids[item.id]], item, tombEntidades);
        } else {
          baseLista[ids[item.id]] = itemMaisNovo(baseLista[ids[item.id]], item, k);
        }
      });
      if (k === 'flashcards') {
        baseLista.forEach(function (deck, i) {
          baseLista[i] = mesclarDeckFlashcards(deck, null, tombEntidades);
        });
      }
    });
    // Planos que só existem no outro lado também são recuperados (cada plano
    // carrega seu próprio conteúdo; sessões órfãs sem plano não contam horas).
    // Para planos presentes nos DOIS lados, vence a versão editada por último
    // (carimbo por plano, gravado no salvar) — assim editar a estrutura/ciclo
    // num aparelho não é desfeito por um estado "mais novo" que não a tocou.
    if (Array.isArray(outro.planos) && Array.isArray(merged.planos)) {
      const idsP = {};
      merged.planos.forEach(function (p, i) { if (p && p.id) idsP[p.id] = i; });
      outro.planos.forEach(function (p) {
        if (!p || !p.id) return;
        const copiaOutroPlano = JSON.parse(JSON.stringify(p));
        if (idsP[p.id] === undefined) { idsP[p.id] = merged.planos.length; merged.planos.push(copiaOutroPlano); return; }
        const atual = merged.planos[idsP[p.id]];
        const dataP = p.estruturaAtualizadaEm || p.atualizadoEm || '';
        const dataAtual = (atual && (atual.estruturaAtualizadaEm || atual.atualizadoEm)) || '';
        const pMaisNovo = dataP > dataAtual;
        const preferido = pMaisNovo ? copiaOutroPlano : atual;
        const complementar = pMaisNovo ? atual : copiaOutroPlano;
        merged.planos[idsP[p.id]] = mesclarEstruturaPlano(preferido, complementar, tombEntidades);
      });
      merged.planos.forEach(function (p) { filtrarEstruturaPlano(p, tombEntidades); });
    }
    // Progresso dos blocos da agenda: sem união (regenerável), mas blocos com o
    // MESMO id nos dois lados somam o andamento — bloco riscado/parcial num
    // aparelho não volta a "pendente" no outro.
    if (Array.isArray(merged.agenda) && Array.isArray(outro.agenda)) {
      const porId = {};
      outro.agenda.forEach(function (a) { if (a && a.id) porId[a.id] = a; });
      merged.agenda.forEach(function (a, i) {
        const o = a && a.id ? porId[a.id] : null;
        if (!o) return;
        const escolhido = agendaPersistente(a) || agendaPersistente(o)
          ? itemMaisNovo(a, o, 'agenda')
          : a;
        if (a.feito || o.feito) escolhido.feito = true;
        const feitoMinA = typeof a.feitoMin === 'number' ? a.feitoMin : 0;
        const feitoMinO = typeof o.feitoMin === 'number' ? o.feitoMin : 0;
        escolhido.feitoMin = Math.max(feitoMinA, feitoMinO);
        if (!escolhido.registroRapidoId) escolhido.registroRapidoId = a.registroRapidoId || o.registroRapidoId;
        merged.agenda[i] = escolhido;
      });
      // Blocos manuais, extras ou fixados não são regeneráveis: eles precisam ser
      // unidos entre aparelhos. Blocos automáticos exclusivos do outro lado seguem
      // fora para não duplicar uma agenda que o motor pode recalcular.
      const idsAgenda = {};
      merged.agenda.forEach(function (a) { if (a && a.id) idsAgenda[a.id] = true; });
      outro.agenda.forEach(function (a) {
        if (!agendaPersistente(a) || !a.id || idsAgenda[a.id]) return;
        if (entidadeExcluida(tombEntidades, 'agenda', a.planoId, a.id)) return;
        merged.agenda.push(clonarJson(a));
        idsAgenda[a.id] = true;
      });
      merged.agenda = merged.agenda.filter(function (a) {
        return !a || !a.id || !entidadeExcluida(tombEntidades, 'agenda', a.planoId, a.id);
      });
    }
    // rev monotônico: o resultado da mescla nunca "anda para trás" em relação
    // aos dois lados (ver salvar/firebase-sync).
    const revBase = parseInt(base && base.config && base.config.rev, 10) || 0;
    const revOutro = parseInt(outro && outro.config && outro.config.rev, 10) || 0;
    merged.config.rev = Math.max(revBase, revOutro);
    const apagadoBase = base && base.config && base.config.apagadoEm;
    const apagadoOutro = outro && outro.config && outro.config.apagadoEm;
    if (apagadoBase || apagadoOutro) {
      merged.config.apagadoEm = (apagadoBase || '') > (apagadoOutro || '') ? apagadoBase : apagadoOutro;
    }
    // Lápides de exclusão: um plano excluído num aparelho não pode ressuscitar
    // quando outro aparelho traz uma cópia local antiga (anterior à exclusão).
    // Recriar um plano gera id novo; portanto uma lápide sempre bloqueia o id
    // antigo, independentemente de relógios incorretos entre aparelhos.
    const tumbas = Object.assign(
      {},
      base && base.config && base.config.planosExcluidos,
      outro && outro.config && outro.config.planosExcluidos
    );
    if (Object.keys(tumbas).length > 0) {
      if (!merged.config) merged.config = {};
      merged.config.planosExcluidos = Object.assign({}, merged.config.planosExcluidos, tumbas);
      if (Array.isArray(merged.planos)) {
        merged.planos = merged.planos.filter(function (p) {
          return !p || !p.id || !tumbas[p.id];
        });
      }
    }
    // Flags de onboarding são "sticky": uma vez vistas, não devem regredir para
    // false por causa de uma base remota mais antiga que não tinha o campo.
    if (outro.config) {
      if (outro.config.onboardingNomeVisto) merged.config.onboardingNomeVisto = true;
      if (outro.config.onboardingGuiaVisto) merged.config.onboardingGuiaVisto = true;
      if (outro.config.nomeUsuario && !merged.config.nomeUsuario) {
        merged.config.nomeUsuario = outro.config.nomeUsuario;
      }
    }
    return migrar(merged);
  }

  window.Store = {
    carregar, salvar, limparLocal, estadoVazio, normalizar: migrar, hidratar, novoId,
    ativarPlano, removerPlano, exportarBackup, importarBackup, diasDesdeBackup, temDados,
    mesclarEstados, contarRegistros, marcarRemovido, paraPersistencia, estadosEquivalentes,
    limparLapidesDeEntidadesPresentes,
    corrigirAcentosTexto, normalizarAcentosEdital, normalizarAcentosConteudo
  };
})();
