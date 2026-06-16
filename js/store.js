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
      sessoes: [],   // {id, planoId, data, topicoId, tipo, duracaoMin, qFeitas, qCertas, obs}
      revisoes: [],  // {id, planoId, topicoId, tipo, dataAgendada, dataConcluida, resultadoPct}
      simulados: [], // {id, planoId, data, tipo, acertos:[{disciplinaId, certas, total}]}
      agenda: [],    // {id, planoId, data, disciplinaId, topicoId|null, duracaoMin, obs, feito, gerado}
      editais: [],   // editais esquematizados {id, titulo, banca, notaCorte, criadoEm, disciplinas}
      flashcards: [], // {id, planoId, disciplinaId, nome, criadoEm, cards:[{id, frente, verso, criadoEm, sr}]}
      config: {
        ultimoBackup: null,
        metaQuestoesSemana: 100,
        onboardingNomeVisto: false,
        onboardingGuiaVisto: false,
        tema: 'claro',
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

  function migrar(state) {
    // ponto único para migrações de schema
    if (!state.config) state.config = { ultimoBackup: null, metaQuestoesSemana: 100 };
    if (!state.config.criadoEm) state.config.criadoEm = agoraISO();
    if (!state.config.atualizadoEm) state.config.atualizadoEm = state.config.criadoEm;
    if (state.config.metaQuestoesSemana === undefined) state.config.metaQuestoesSemana = 100;
    if (state.config.onboardingNomeVisto === undefined) state.config.onboardingNomeVisto = !!state.config.nomeUsuario;
    if (state.config.ultimoBackup === undefined) state.config.ultimoBackup = null;
    if (!state.config.tema) state.config.tema = 'claro';
    if (!Array.isArray(state.config.blocosVinculados)) state.config.blocosVinculados = [];
    if (!state.config.googleCalendar) state.config.googleCalendar = {};
    if (state.config.googleCalendar.clientId === undefined) state.config.googleCalendar.clientId = '';
    if (!state.config.googleCalendar.calendarId) state.config.googleCalendar.calendarId = 'primary';
    if (!state.config.googleCalendar.eventos || Array.isArray(state.config.googleCalendar.eventos)) {
      state.config.googleCalendar.eventos = {};
    }
    if (!state.sessoes) state.sessoes = [];
    if (!state.revisoes) state.revisoes = [];
    if (!state.simulados) state.simulados = [];
    if (!state.agenda) state.agenda = [];
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
    state.planos.forEach(function (p) { if (p && p.plano) normalizarCicloPlano(p.plano); });
    normalizarAcentosConteudo(state);
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

  function salvar(state, opcoes) {
    opcoes = opcoes || {};
    migrar(state);
    if (opcoes.marcarAlterado !== false) state.config.atualizadoEm = agoraISO();
    // não duplica o plano ativo no JSON salvo: os slots são recriados no carregar()
    const copia = Object.assign({}, state);
    delete copia.plano; delete copia.disciplinas; delete copia.cronogramas; delete copia.links;
    localStorage.setItem(CHAVE, JSON.stringify(copia));
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
    salvar(state);
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
  }

  function importarBackup(texto) {
    let dados;
    try { dados = JSON.parse(texto); }
    catch (e) { return { ok: false, erro: 'O arquivo não é um JSON válido: ' + e.message }; }
    if (!dados || !Array.isArray(dados.sessoes) || (dados.versao !== 1 && dados.versao !== VERSAO_SCHEMA)) {
      return { ok: false, erro: 'O arquivo não parece ser um backup deste app (campo "versao" ou "sessoes" ausente).' };
    }
    const state = migrar(dados);
    salvar(state);
    return { ok: true, state };
  }

  function diasDesdeBackup(state) {
    if (!state.config.ultimoBackup) return null;
    return window.Dominio.diffDias(state.config.ultimoBackup, window.Dominio.hojeISO());
  }

  function temDados(state) {
    return state.planos.length > 0 || state.sessoes.length > 0;
  }

  window.Store = {
    carregar, salvar, estadoVazio, normalizar: migrar, hidratar, novoId,
    ativarPlano, removerPlano, exportarBackup, importarBackup, diasDesdeBackup, temDados,
    corrigirAcentosTexto, normalizarAcentosEdital, normalizarAcentosConteudo
  };
})();
