/* ============================================================
   domain.js — Regras de negócio RN01–RN08 (funções puras, sem DOM)
   Mantê-las aqui permite testar e, no futuro, migrar para
   Supabase levando as regras intactas.
   ============================================================ */
(function () {
  'use strict';

  // ---------- Datas (sempre fuso local, formato interno AAAA-MM-DD) ----------
  function hojeISO() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function addDias(iso, n) {
    const [a, m, d] = iso.split('-').map(Number);
    const dt = new Date(a, m - 1, d + n);
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }

  function diffDias(isoA, isoB) { // isoB - isoA em dias
    const [a1, m1, d1] = isoA.split('-').map(Number);
    const [a2, m2, d2] = isoB.split('-').map(Number);
    return Math.round((new Date(a2, m2 - 1, d2) - new Date(a1, m1 - 1, d1)) / 86400000);
  }

  function formatarDataBR(iso) {
    if (!iso) return '—';
    const [a, m, d] = iso.split('-');
    return d + '/' + m + '/' + a;
  }

  function formatarMesBR(aaaaMM) {
    if (!aaaaMM) return '—';
    const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const [a, m] = aaaaMM.split('-').map(Number);
    return meses[m - 1] + '/' + a;
  }

  function segundaDaSemana(iso) {
    const [a, m, d] = iso.split('-').map(Number);
    const dt = new Date(a, m - 1, d);
    const dia = dt.getDay(); // 0=dom
    const recuo = dia === 0 ? 6 : dia - 1;
    return addDias(iso, -recuo);
  }

  function formatarMin(min) {
    const h = Math.floor(min / 60), m = Math.round(min % 60);
    if (h === 0) return m + 'min';
    return h + 'h' + (m > 0 ? String(m).padStart(2, '0') : '');
  }

  // ---------- Buscas no estado ----------
  function topicoPorId(state, id) {
    for (const d of state.disciplinas) {
      const t = d.topicos.find((t) => t.id === id);
      if (t) return t;
    }
    return null;
  }

  function disciplinaDoTopico(state, topicoId) {
    return state.disciplinas.find((d) => d.topicos.some((t) => t.id === topicoId)) || null;
  }

  function disciplinaPorId(state, id) {
    return state.disciplinas.find((d) => d.id === id) || null;
  }

  // Registros do plano ativo (itens antigos sem planoId contam — schema v1)
  function doPlanoAtivo(state, lista) {
    if (!state.planoAtivoId) return lista;
    return lista.filter((x) => !x.planoId || x.planoId === state.planoAtivoId);
  }

  function sessoesDoPlano(state) { return doPlanoAtivo(state, state.sessoes); }

  // ---------- RN01 — Teoria concluída agenda revisões (curva 1-3-7-14-30) ----------
  // Intervalos expansivos (1, 3, 7, 14, 30 dias) — alinhados à evidência de
  // repetição espaçada para achatar a curva do esquecimento. A 1ª revisão fica
  // em ~24h (a mais crítica) e as demais espaçam progressivamente.
  function agendarRevisoes(topicoId, dataBaseISO) {
    const intervalos = [
      { tipo: '24h', dias: 1 },
      { tipo: '3d', dias: 3 },
      { tipo: '7d', dias: 7 },
      { tipo: '14d', dias: 14 },
      { tipo: '30d', dias: 30 }
    ];
    return intervalos.map(function (iv) {
      return {
        id: 'rev-' + topicoId + '-' + iv.tipo + '-' + dataBaseISO, topicoId: topicoId, tipo: iv.tipo,
        dataAgendada: addDias(dataBaseISO, iv.dias), dataConcluida: null, resultadoPct: null
      };
    });
  }

  // ---------- RN02 — Desempenho acumulado ----------
  function desempenhoTopico(sessoes, topicoId) {
    let feitas = 0, certas = 0;
    for (const s of sessoes) {
      if (s.topicoId === topicoId && s.qFeitas > 0) { feitas += s.qFeitas; certas += s.qCertas; }
    }
    return { feitas, certas, pct: feitas > 0 ? Math.round((certas / feitas) * 100) : null };
  }

  function desempenhoDisciplina(state, disciplina) {
    // média ponderada pela incidência, só entre tópicos com registro
    const sessoes = sessoesDoPlano(state);
    let somaPesos = 0, soma = 0;
    for (const t of disciplina.topicos) {
      const d = desempenhoTopico(sessoes, t.id);
      if (d.pct !== null) {
        const peso = t.incidencia_pct || 1;
        soma += d.pct * peso;
        somaPesos += peso;
      }
    }
    return somaPesos > 0 ? Math.round(soma / somaPesos) : null;
  }

  function desempenhoGeral(state) {
    let soma = 0, somaPesos = 0;
    for (const d of state.disciplinas) {
      const pct = desempenhoDisciplina(state, d);
      if (pct !== null) { soma += pct * (d.peso || 1); somaPesos += (d.peso || 1); }
    }
    return somaPesos > 0 ? Math.round(soma / somaPesos) : null;
  }

  // ---------- RN03 — Revisão de 30d com <70% reabre o tópico ----------
  function revisaoReabreTopico(revisao, resultadoPct) {
    return revisao.tipo === '30d' && resultadoPct !== null && resultadoPct < 70;
  }

  // ---------- RN03b — Reforço: 3 desempenhos seguidos abaixo do limite sugerem
  // voltar à teoria. Não reabre sozinho (decisão do aluno) — só sinaliza que as
  // questões não estão fixando e a base teórica precisa ser revista.
  const LIMITE_SUGESTAO_TEORIA = 65;
  const MIN_SESSOES_SUGESTAO = 3;
  function sugereRevisarTeoria(state, topicoId, limite, minSessoes) {
    limite = limite || LIMITE_SUGESTAO_TEORIA;
    minSessoes = minSessoes || MIN_SESSOES_SUGESTAO;
    const ses = sessoesDoPlano(state)
      .filter(function (s) { return s.topicoId === topicoId && s.qFeitas > 0; })
      .slice()
      .sort(function (a, b) { return String(a.data || '').localeCompare(String(b.data || '')); });
    if (ses.length < minSessoes) return false;
    return ses.slice(-minSessoes).every(function (s) {
      return Math.round((s.qCertas / s.qFeitas) * 100) < limite;
    });
  }

  // ---------- RN04 — Streak (dia conta com ≥1 sessão) ----------
  function streak(sessoes, hoje) {
    const dias = new Set(sessoes.map((s) => s.data));
    let atual = 0;
    let cursor = dias.has(hoje) ? hoje : addDias(hoje, -1);
    while (dias.has(cursor)) { atual++; cursor = addDias(cursor, -1); }

    let recorde = 0;
    const ordenados = [...dias].sort();
    let corrida = 0, anterior = null;
    for (const dia of ordenados) {
      corrida = (anterior !== null && diffDias(anterior, dia) === 1) ? corrida + 1 : 1;
      if (corrida > recorde) recorde = corrida;
      anterior = dia;
    }
    return { atual, recorde: Math.max(recorde, atual) };
  }

  // ---------- RN05 — Semáforo contra a meta de corte ----------
  function semaforo(pct, metaPct) {
    if (pct === null || pct === undefined) return null;
    if (pct >= metaPct) return 'verde';
    if (pct >= metaPct - 10) return 'amarelo';
    return 'vermelho';
  }

  // ---------- Cronograma ----------
  function cronogramaAtivo(state) {
    if (!state.plano) return [];
    const ritmo = state.plano.ritmoAtivo || 'sustentavel';
    return (state.cronogramas && state.cronogramas[ritmo]) || [];
  }

  function semanaCorrente(state, hoje) {
    const cron = cronogramaAtivo(state);
    if (cron.length === 0) return null;
    for (const sem of cron) {
      if (hoje >= sem.inicio && hoje < addDias(sem.inicio, 7)) return sem;
    }
    if (hoje < cron[0].inicio) return { futura: true, proxima: cron[0] };
    return { encerrado: true, ultima: cron[cron.length - 1] };
  }

  // Um bloco conta como "feito" se há sessão do mesmo tópico e tipo na semana corrente
  function chaveBlocoVinculado(inicioSemana, bloco) {
    if (!inicioSemana || !bloco || !bloco.topico) return '';
    return inicioSemana + '|' + bloco.topico + '|' + (bloco.tipo || 'teoria');
  }

  function blocoFeito(state, bloco, inicioSemana) {
    const vinculados = state.config && Array.isArray(state.config.blocosVinculados)
      ? state.config.blocosVinculados : [];
    if (vinculados.indexOf(chaveBlocoVinculado(inicioSemana, bloco)) >= 0) return true;
    const fim = addDias(inicioSemana, 7);
    const tipoSessao = bloco.tipo === 'questoes' ? 'questoes' : bloco.tipo === 'teoria' ? 'teoria' : null;
    return sessoesDoPlano(state).some((s) =>
      s.topicoId === bloco.topico && s.data >= inicioSemana && s.data < fim &&
      (tipoSessao === null || s.tipo === tipoSessao)
    );
  }

  // ---------- Ciclo de estudos (alternativa ao cronograma fixo) ----------
  // Fila ponderada de matérias com meta de tempo por bloco; roda no ritmo do
  // aluno e, ao fechar a volta, recomeça. Tudo puro/testável (sem DOM).
  function novoIdBloco() {
    return 'blc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function cicloAtivo(state) {
    return (state.plano && state.plano.modoPlanejamento === 'ciclo') ? state.plano.ciclo : null;
  }

  // Bloco atual = primeiro ainda não concluído; null quando a volta fechou.
  function blocoCicloAtual(ciclo) {
    if (!ciclo || !Array.isArray(ciclo.blocos)) return null;
    for (const b of ciclo.blocos) {
      if ((b.feitoMin || 0) < (b.metaMin || 0)) return b;
    }
    return null;
  }

  // Gera blocos ponderados por peso da disciplina × incidência dos tópicos
  // pendentes, com leve reforço para matérias com desempenho baixo. Exclui ORF.
  function sugerirCiclo(state, opcoes) {
    opcoes = opcoes || {};
    const discs = (state.disciplinas || []).filter(function (d) { return d && d.id !== 'ORF'; });
    if (discs.length === 0) return [];

    const minutosSemana = opcoes.minutosSemana > 0 ? opcoes.minutosSemana : 600;
    const minBloco = Math.max(10, Math.round(Number(opcoes.minBloco) || 30));
    const maxBloco = Math.max(minBloco, Math.round(Number(opcoes.maxBloco) || 75));
    const ordemAtaque = opcoes.ordemAtaque || (state.plano && state.plano.ordemAtaque) || 'incidencia';
    const sessoes = sessoesDoPlano(state);
    function topicoSugerido(d) {
      const topicos = (d.topicos || []).filter(function (t) {
        return t && !t.orfao && t.status !== 'dominado';
      });
      if (topicos.length === 0) return null;
      // Disciplina nunca vista (tudo "pendente", sem reabertura) segue a ordem do
      // edital mesmo com 80/20: a base precisa ser vista em sequência.
      const nuncaVista = topicos.every(function (t) { return t.status === 'pendente' && !t.reaberto; });
      const usarIncidencia = ordemAtaque === 'incidencia' && !nuncaVista;
      topicos.sort(function (a, b) {
        const aConcl = a.status === 'teoria_concluida' ? 1 : 0;
        const bConcl = b.status === 'teoria_concluida' ? 1 : 0;
        if (aConcl !== bConcl) return aConcl - bConcl;
        const da = desempenhoTopico(sessoes, a.id);
        const db = desempenhoTopico(sessoes, b.id);
        const pctA = da.pct === null ? 101 : da.pct;
        const pctB = db.pct === null ? 101 : db.pct;
        if (pctA !== pctB && (da.feitas >= 3 || db.feitas >= 3)) return pctA - pctB;
        if (usarIncidencia) return (b.incidencia_pct || 0) - (a.incidencia_pct || 0);
        return (a.semana_sugerida || 9999) - (b.semana_sugerida || 9999);
      });
      return topicos[0] || null;
    }
    const pesos = discs.map(function (d) {
      const incidencia = (d.topicos || []).reduce(function (s, t) {
        if (t.orfao) return s;
        const pend = t.status !== 'dominado' && t.status !== 'teoria_concluida';
        return s + (pend ? (t.incidencia_pct || 1) : (t.incidencia_pct || 1) * 0.3);
      }, 0);
      const base = (d.peso || 1) * Math.max(1, incidencia);
      // matéria fraca (desempenho < 70%) ganha até +50% de tempo
      const pct = desempenhoDisciplina(state, d);
      const reforco = (pct !== null && pct < 70) ? 1 + (70 - pct) / 140 : 1;
      return { disc: d, peso: base * reforco };
    });
    const somaPesos = pesos.reduce(function (s, p) { return s + p.peso; }, 0) || 1;

    return pesos.map(function (p) {
      const bruto = (p.peso / somaPesos) * minutosSemana;
      // múltiplos de 30, entre 30min e 2h (blocos digeríveis; o resto vira mais voltas)
      const metaMin = Math.min(maxBloco, Math.max(minBloco, Math.round(bruto / 5) * 5));
      const topico = topicoSugerido(p.disc);
      return { id: novoIdBloco(), disciplinaId: p.disc.id, topicoId: topico ? topico.id : null, metaMin: metaMin, feitoMin: 0 };
    });
  }

  // Credita `minutos` ao bloco atual (se a disciplina bate) ou ao próximo bloco
  // pendente daquela disciplina. Fecha a volta (reset + volta++) quando completa.
  function avancarCiclo(ciclo, disciplinaId, minutos) {
    const res = { creditou: false, completouBloco: false, completouVolta: false };
    if (!ciclo || !Array.isArray(ciclo.blocos) || ciclo.blocos.length === 0) return res;
    minutos = Math.max(0, Math.round(Number(minutos) || 0));
    if (!minutos || !disciplinaId) return res;

    const atual = blocoCicloAtual(ciclo);
    let alvo = (atual && atual.disciplinaId === disciplinaId) ? atual : null;
    if (!alvo) {
      alvo = ciclo.blocos.find(function (b) {
        return b.disciplinaId === disciplinaId && (b.feitoMin || 0) < (b.metaMin || 0);
      }) || null;
    }
    if (!alvo) return res; // estudou algo fora do ciclo

    const completoAntes = (alvo.feitoMin || 0) >= (alvo.metaMin || 0);
    alvo.feitoMin = Math.min(alvo.metaMin || 0, (alvo.feitoMin || 0) + minutos);
    res.creditou = true;
    if (!completoAntes && alvo.feitoMin >= (alvo.metaMin || 0)) res.completouBloco = true;

    // volta inteira concluída → zera e incrementa
    if (!blocoCicloAtual(ciclo)) {
      ciclo.blocos.forEach(function (b) { b.feitoMin = 0; });
      ciclo.volta = (ciclo.volta || 1) + 1;
      res.completouVolta = true;
    }
    return res;
  }

  // ---------- RN06 — Fila do dia: revisões vencidas → blocos da semana → reabertos ----------
  function filaHoje(state, hoje) {
    const fila = [];

    const vencidas = doPlanoAtivo(state, state.revisoes)
      .filter((r) => !r.dataConcluida && r.dataAgendada <= hoje && topicoPorId(state, r.topicoId))
      .sort((a, b) => a.dataAgendada.localeCompare(b.dataAgendada));
    for (const r of vencidas) fila.push({ categoria: 'revisao', topicoId: r.topicoId, revisao: r });

    const sem = semanaCorrente(state, hoje);
    if (sem && !sem.futura && !sem.encerrado) {
      for (const b of sem.blocos) {
        if (!topicoPorId(state, b.topico)) continue;
        fila.push({
          categoria: 'bloco', topicoId: b.topico, tipoBloco: b.tipo,
          semana: sem.semana, feito: blocoFeito(state, b, sem.inicio)
        });
      }
    }

    const jaListados = new Set(fila.map((i) => i.topicoId + '|' + i.categoria));
    for (const d of state.disciplinas) {
      for (const t of d.topicos) {
        if (t.reaberto && !jaListados.has(t.id + '|reaberto')) {
          fila.push({ categoria: 'reaberto', topicoId: t.id });
        }
      }
    }
    return fila;
  }

  // ---------- RN07 — Sugestão de reestudo (>50% de erro) ----------
  function sugerirReestudo(qFeitas, qCertas) {
    return qFeitas > 0 && (qFeitas - qCertas) / qFeitas > 0.5;
  }

  // ---------- Validação do JSON do plano (contrato v1) ----------
  function validarPlano(json) {
    const erros = [];
    if (!json || typeof json !== 'object') { erros.push('O conteúdo não é um objeto JSON.'); return { ok: false, erros }; }
    if (json.versao !== 1) erros.push('Campo "versao": esperado 1, recebido ' + JSON.stringify(json.versao) + '.');
    if (!json.plano || typeof json.plano !== 'object') erros.push('Campo "plano" ausente ou inválido.');
    else {
      if (!json.plano.concurso) erros.push('Campo "plano.concurso" é obrigatório.');
      if (!json.plano.meta || typeof json.plano.meta.corte_pct !== 'number') erros.push('Campo "plano.meta.corte_pct" deve ser um número.');
    }
    if (!Array.isArray(json.disciplinas) || json.disciplinas.length === 0) {
      erros.push('Campo "disciplinas" deve ser uma lista com ao menos 1 disciplina.');
    } else {
      const idsTopicos = new Set();
      json.disciplinas.forEach(function (d, i) {
        const ref = 'disciplinas[' + i + ']';
        if (!d.id) erros.push(ref + '.id é obrigatório.');
        if (!d.nome) erros.push(ref + '.nome é obrigatório.');
        if (!Array.isArray(d.topicos) || d.topicos.length === 0) erros.push(ref + '.topicos deve ter ao menos 1 tópico.');
        else d.topicos.forEach(function (t, j) {
          const refT = ref + '.topicos[' + j + ']';
          if (!t.id) erros.push(refT + '.id é obrigatório.');
          else if (idsTopicos.has(t.id)) erros.push(refT + '.id duplicado: ' + t.id);
          else idsTopicos.add(t.id);
          if (!t.nome) erros.push(refT + '.nome é obrigatório.');
          if (typeof t.incidencia_pct !== 'number') erros.push(refT + '.incidencia_pct deve ser um número.');
        });
      });
      if (json.cronograma) {
        ['sustentavel', 'hardcore'].forEach(function (ritmo) {
          (json.cronograma[ritmo] || []).forEach(function (sem, i) {
            (sem.blocos || []).forEach(function (b, j) {
              if (b.topico && !idsTopicos.has(b.topico)) {
                erros.push('cronograma.' + ritmo + '[' + i + '].blocos[' + j + ']: tópico "' + b.topico + '" não existe em disciplinas.');
              }
            });
          });
        });
      }
    }
    const totalTopicos = Array.isArray(json.disciplinas)
      ? json.disciplinas.reduce(function (n, d) { return n + ((d.topicos || []).length); }, 0) : 0;
    return {
      ok: erros.length === 0,
      erros,
      resumo: {
        concurso: json.plano && json.plano.concurso,
        banca: json.plano && json.plano.banca,
        disciplinas: Array.isArray(json.disciplinas) ? json.disciplinas.length : 0,
        topicos: totalTopicos,
        semanas: json.cronograma && json.cronograma.sustentavel ? json.cronograma.sustentavel.length : 0
      }
    };
  }

  // ---------- RN08 — Reimportar plano preserva todo o histórico ----------
  function mesclarPlano(stateAtual, json) {
    const statusAntigo = {};
    const nomesAntigos = {};
    function listaMesclada(chave) {
      const atual = Array.isArray(stateAtual[chave]) ? stateAtual[chave] : [];
      const seed = Array.isArray(json[chave]) ? json[chave] : [];
      return atual.length > 0 ? atual : seed;
    }
    (stateAtual.disciplinas || []).forEach(function (d) {
      d.topicos.forEach(function (t) {
        statusAntigo[t.id] = { status: t.status, reaberto: !!t.reaberto };
        nomesAntigos[t.id] = { nome: t.nome, disciplinaId: d.id, disciplinaNome: d.nome, cor: d.cor };
      });
    });

    const disciplinas = json.disciplinas.map(function (d) {
      return {
        id: d.id, nome: d.nome, cor: d.cor || '#9A9DA3', peso: d.peso || 1,
        base_teorica: d.base_teorica || 'pdf',
        dificuldade: d.dificuldade || 'media',
        origem: d.origem || null,
        topicos: d.topicos.map(function (t) {
          const antigo = statusAntigo[t.id];
          return {
            id: t.id, nome: t.nome,
            incidencia_pct: t.incidencia_pct, prioridade: t.prioridade || 2,
            horas_estimadas: t.horas_estimadas || 2, semana_sugerida: t.semana_sugerida || null,
            status: antigo ? antigo.status : (t.status || 'pendente'),
            reaberto: antigo ? antigo.reaberto : !!t.reaberto,
            orfao: false
          };
        })
      };
    });

    // Tópicos com histórico que sumiram do plano novo: manter como órfãos (nunca apagar registro)
    const idsNovos = new Set();
    disciplinas.forEach(function (d) { d.topicos.forEach(function (t) { idsNovos.add(t.id); }); });
    const idsComHistorico = new Set();
    (stateAtual.sessoes || []).forEach(function (s) { idsComHistorico.add(s.topicoId); });
    (stateAtual.revisoes || []).forEach(function (r) { idsComHistorico.add(r.topicoId); });

    idsComHistorico.forEach(function (id) {
      if (idsNovos.has(id) || !nomesAntigos[id]) return;
      const info = nomesAntigos[id];
      let disc = disciplinas.find(function (d) { return d.id === info.disciplinaId; });
      if (!disc) {
        disc = disciplinas.find(function (d) { return d.id === 'ORF'; });
        if (!disc) {
          disc = { id: 'ORF', nome: 'Tópicos órfãos (planos anteriores)', cor: '#9A9DA3', peso: 0, base_teorica: 'pdf', topicos: [] };
          disciplinas.push(disc);
        }
      }
      const antigo = statusAntigo[id] || {};
      disc.topicos.push({
        id: id, nome: info.nome, incidencia_pct: 0, prioridade: 3, horas_estimadas: 0,
        semana_sugerida: null, status: antigo.status || 'pendente', reaberto: false, orfao: true
      });
    });

    return {
      versao: 1,
      plano: {
        concurso: json.plano.concurso,
        banca: json.plano.banca || '',
        cota: json.plano.cota || null,
        meta: json.plano.meta,
        radar: json.plano.radar || null,
        ritmos: json.plano.ritmos || null,
        ritmoAtivo: (stateAtual.plano && stateAtual.plano.ritmoAtivo) ||
          (json.plano.ritmos && json.plano.ritmos.ativo) || 'sustentavel',
        gerado_em: json.gerado_em || null
      },
      disciplinas,
      cronogramas: {
        sustentavel: (json.cronograma && json.cronograma.sustentavel) || [],
        hardcore: (json.cronograma && json.cronograma.hardcore) || []
      },
      links: json.links || [],
      sessoes: listaMesclada('sessoes'),
      revisoes: listaMesclada('revisoes'),
      simulados: listaMesclada('simulados'),
      agenda: listaMesclada('agenda'),
      flashcards: listaMesclada('flashcards'),
      config: Object.assign({}, json.config || {}, stateAtual.config || {})
    };
  }

  // ---------- Metas da semana ----------
  function metaSemanal(state, hoje) {
    const inicio = segundaDaSemana(hoje);
    const fim = addDias(inicio, 7);
    let minutos = 0, qFeitas = 0, qCertas = 0;
    for (const s of sessoesDoPlano(state)) {
      if (s.data >= inicio && s.data < fim) {
        minutos += s.duracaoMin || 0;
        qFeitas += s.qFeitas || 0;
        qCertas += s.qCertas || 0;
      }
    }
    let horasAlvo = 0;
    if (state.plano && state.plano.ritmos) {
      const r = state.plano.ritmos[state.plano.ritmoAtivo || 'sustentavel'];
      horasAlvo = r ? (r.h_semana || r.h_semana_exigidas || 0) : 0;
    }
    const questoesAlvo = (state.config && state.config.metaQuestoesSemana) || 100;
    return { inicio, minutos, qFeitas, qCertas, horasAlvo, questoesAlvo };
  }

  // ---------- Progresso do edital ----------
  function progressoEdital(state) {
    let total = 0, concluidos = 0;
    for (const d of state.disciplinas) {
      for (const t of d.topicos) {
        if (t.orfao) continue;
        total++;
        if (t.status === 'teoria_concluida' || t.status === 'dominado') concluidos++;
      }
    }
    return { total, concluidos, pct: total > 0 ? Math.round((concluidos / total) * 100) : 0 };
  }

  function progressoDisciplina(disciplina) {
    const tops = disciplina.topicos.filter(function (t) { return !t.orfao; });
    const conc = tops.filter(function (t) { return t.status === 'teoria_concluida' || t.status === 'dominado'; }).length;
    return { total: tops.length, concluidos: conc, pct: tops.length > 0 ? Math.round((conc / tops.length) * 100) : 0 };
  }

  // ---------- Heatmap de constância (minutos por dia) ----------
  function heatmapDias(sessoes, hoje, nDias) {
    const porDia = {};
    for (const s of sessoes) porDia[s.data] = (porDia[s.data] || 0) + (s.duracaoMin || 0);
    const dias = [];
    for (let i = nDias - 1; i >= 0; i--) {
      const d = addDias(hoje, -i);
      dias.push({ data: d, minutos: porDia[d] || 0 });
    }
    return dias;
  }

  // ---------- Série semanal para gráficos ----------
  function serieSemanal(state, hoje, nSemanas) {
    const serie = [];
    const sessoes = sessoesDoPlano(state);
    const inicioAtual = segundaDaSemana(hoje);
    for (let i = nSemanas - 1; i >= 0; i--) {
      const ini = addDias(inicioAtual, -7 * i);
      const fim = addDias(ini, 7);
      let minutos = 0, feitas = 0, certas = 0;
      for (const s of sessoes) {
        if (s.data >= ini && s.data < fim) {
          minutos += s.duracaoMin || 0; feitas += s.qFeitas || 0; certas += s.qCertas || 0;
        }
      }
      serie.push({ inicio: ini, horas: Math.round((minutos / 60) * 10) / 10, qFeitas: feitas, pct: feitas > 0 ? Math.round((certas / feitas) * 100) : null });
    }
    return serie;
  }

  // ---------- Piores tópicos (para simulado → fila, F3) ----------
  function pioresTopicos(state, n) {
    const lista = [];
    const sessoes = sessoesDoPlano(state);
    for (const d of state.disciplinas) {
      for (const t of d.topicos) {
        if (t.orfao) continue;
        const desemp = desempenhoTopico(sessoes, t.id);
        if (desemp.pct !== null && desemp.feitas >= 5) {
          lista.push({ topico: t, disciplina: d, pct: desemp.pct, feitas: desemp.feitas });
        }
      }
    }
    lista.sort(function (a, b) { return a.pct - b.pct; });
    return lista.slice(0, n);
  }

  // ---------- RN09 — Esforço total do edital (burn-down) ----------
  // Fator 1.8 sobre as horas de teoria estimadas: cobre teoria + questões + revisões 24h/7d/30d.
  const FATOR_ESFORCO = 1.8;

  function totalHorasTeoria(disciplinas) {
    if (!disciplinas) return 0;
    return disciplinas.reduce(function (n, d) {
      if (d.id === 'ORF') return n;
      return n + (d.topicos || []).reduce(function (m, t) {
        return t.orfao ? m : m + (t.horas_estimadas || 2);
      }, 0);
    }, 0);
  }

  function esforcoTotalHoras(state) {
    return Math.round(totalHorasTeoria(state.disciplinas) * FATOR_ESFORCO);
  }

  function horasRealizadas(state, desdeISO, ateISO) {
    let min = 0;
    for (const s of sessoesDoPlano(state)) {
      if (desdeISO && s.data < desdeISO) continue;
      if (ateISO && s.data >= ateISO) continue;
      min += s.duracaoMin || 0;
    }
    return min / 60;
  }

  function ritmoInfoAtivo(state) {
    if (!state.plano || !state.plano.ritmos) return null;
    const chave = state.plano.ritmoAtivo || 'sustentavel';
    const r = state.plano.ritmos[chave];
    return r && typeof r === 'object' ? r : null;
  }

  // RN09 — Carga semanal ideal + projeção de conclusão no ritmo real do aluno.
  // Recalculado a cada render: o "vencimento" do cronograma some porque a carga
  // ideal restante é sempre (esforço que falta) / (semanas que faltam até a meta).
  function burndownEdital(state, hoje) {
    const r = ritmoInfoAtivo(state);
    if (!r || !r.semanas) return null;
    const inicio = (state.plano && state.plano.gerado_em) || segundaDaSemana(hoje);
    const semanasTotais = r.semanas;
    const meses = r.meses || Math.max(1, Math.round(semanasTotais / 4.345));
    const esforcoTotal = esforcoTotalHoras(state);
    const horasFeitas = horasRealizadas(state, inicio, null);
    const decorridas = Math.min(semanasTotais, Math.max(0, diffDias(inicio, hoje) / 7));
    const semanasRestantes = Math.max(0.5, semanasTotais - decorridas);
    const restante = Math.max(0, esforcoTotal - horasFeitas);
    const cargaIdeal = Math.round((restante / semanasRestantes) * 10) / 10;
    const cargaPlanejada = r.h_semana || cargaIdeal;
    const ritmoReal = decorridas >= 0.5 ? horasFeitas / decorridas : cargaPlanejada;
    const semanasProjetadas = ritmoReal > 0.1 ? restante / ritmoReal : Infinity;
    const mesesProjetados = isFinite(semanasProjetadas)
      ? Math.round(((decorridas + semanasProjetadas) / 4.345) * 10) / 10 : Infinity;
    const pctConcluido = esforcoTotal > 0 ? Math.min(100, Math.round((horasFeitas / esforcoTotal) * 100)) : 0;
    // Conclusão estimada DINÂMICA (semanas a partir de hoje): usa o ritmo real
    // quando há dados; senão o ritmo planejado (casa com a estimativa inicial).
    // Estudar menos → ritmo cai → prazo sobe; adiantar tópicos → restante cai → prazo desce.
    const paceProjecao = (horasFeitas >= 0.1 && decorridas >= 0.5) ? ritmoReal : cargaPlanejada;
    const semanasParaConcluir = restante <= 0 ? 0 : Math.min(260, restante / Math.max(0.5, paceProjecao));
    // "Adiantado"/"Atrasado" só fazem sentido com estudo REAL registrado e tempo
    // suficiente decorrido. Sem horas feitas, o plano é "no prazo" (neutro) no
    // começo e "parado" se já passou ~1 semana — nunca "adiantado" com 0h.
    let situacao = 'no_prazo';
    if (restante <= 0) situacao = 'concluido';
    else if (horasFeitas < 0.1) situacao = decorridas >= 1 ? 'parado' : 'no_prazo';
    else if (decorridas < 0.5) situacao = 'no_prazo'; // cedo demais para projetar
    else if (!isFinite(mesesProjetados)) situacao = 'parado';
    else if (mesesProjetados > meses + 0.5) situacao = 'atrasado';
    else if (mesesProjetados < meses - 0.5) situacao = 'adiantado';
    return {
      esforcoTotal, horasFeitas: Math.round(horasFeitas * 10) / 10, restante: Math.round(restante * 10) / 10,
      semanasTotais, meses, semanasDecorridas: Math.round(decorridas * 10) / 10,
      semanasRestantes: Math.round(semanasRestantes * 10) / 10, cargaIdeal,
      cargaPlanejada: Math.round(cargaPlanejada * 10) / 10, ritmoReal: Math.round(ritmoReal * 10) / 10,
      semanasParaConcluir: Math.round(semanasParaConcluir * 10) / 10,
      mesesProjetados, pctConcluido, situacao
    };
  }

  // RN10 — Check-in semanal: Planejado vs. Realizado da última semana fechada
  // + prévia da semana CORRENTE (o aluno antecipa, no último dia, se vai fechar).
  function checkinSemanal(state, hoje) {
    const inicioAtual = segundaDaSemana(hoje);
    const inicioAnterior = addDias(inicioAtual, -7);
    const fimAtual = addDias(inicioAtual, 7);
    let realizadoMin = 0, qFeitas = 0, realizadoAtualMin = 0;
    for (const s of sessoesDoPlano(state)) {
      if (s.data >= inicioAnterior && s.data < inicioAtual) {
        realizadoMin += s.duracaoMin || 0;
        qFeitas += s.qFeitas || 0;
      } else if (s.data >= inicioAtual && s.data < fimAtual) {
        realizadoAtualMin += s.duracaoMin || 0;
      }
    }
    const r = ritmoInfoAtivo(state);
    const planejado = r ? (r.h_semana || 0) : 0;
    const realizado = Math.round((realizadoMin / 60) * 10) / 10;
    const saldo = Math.round((realizado - planejado) * 10) / 10; // <0 déficit, >0 superávit

    // Semana corrente: quanto já foi feito e quanto falta para bater o planejado.
    const realizadoAtual = Math.round((realizadoAtualMin / 60) * 10) / 10;
    const restanteAtual = Math.round(Math.max(0, planejado - realizadoAtual) * 10) / 10;
    // último dia útil do plano na semana (segunda = índice 0 ... domingo = 6)
    const dias = (state.config && state.config.rotinaEstudos && state.config.rotinaEstudos.dias) || null;
    const ordem = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
    let ultimoIdx = 6;
    if (dias) {
      for (let i = ordem.length - 1; i >= 0; i--) {
        const d = dias[ordem[i]];
        if (d && d.ativo && (d.minutos || 0) > 0) { ultimoIdx = i; break; }
      }
    }
    const idxHoje = (function () { const n = new Date(hoje + 'T00:00:00').getDay(); return n === 0 ? 6 : n - 1; })();
    const ehUltimoDia = idxHoje >= ultimoIdx;
    // >8h restantes num único dia final é irrealista → projeta que não fecha.
    const naoVaiFechar = ehUltimoDia && restanteAtual > 8;

    return {
      inicio: inicioAnterior, planejado, realizado, saldo, qFeitas, temDados: realizadoMin > 0,
      atual: {
        planejado: planejado, realizado: realizadoAtual, restante: restanteAtual,
        ehUltimoDia: ehUltimoDia, naoVaiFechar: naoVaiFechar
      }
    };
  }

  // ---------- Conciliação de planos: "dá para conciliar dois concursos?" ----------
  // Compara dois editais e diz se é viável estudar para os dois ao mesmo tempo.
  // Pura e testável: recebe os editais (com disciplinas/tópicos) e a rotina semanal.
  function normalizarNomeConc(s) {
    return String(s == null ? '' : s).toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }

  // Palavras vazias que não ajudam a identificar a disciplina ("Noções de Direito
  // Administrativo" e "Direito Administrativo" devem casar). Removê-las antes de
  // comparar evita falsos negativos por causa de prefixos editoriais.
  const STOP_DISC = { de: 1, do: 1, da: 1, dos: 1, das: 1, e: 1, a: 1, o: 1, as: 1, os: 1, em: 1, ao: 1, nocoes: 1, nocao: 1, nocoe: 1, elementos: 1, fundamentos: 1, introducao: 1, basica: 1, basico: 1, geral: 1, gerais: 1, conhecimentos: 1, parte: 1 };
  const STOP_TOP = { de: 1, do: 1, da: 1, dos: 1, das: 1, e: 1, a: 1, o: 1, as: 1, os: 1, em: 1, no: 1, na: 1, nos: 1, nas: 1, ao: 1, aos: 1, com: 1, para: 1, por: 1, sua: 1, seu: 1, suas: 1, seus: 1, lei: 1, art: 1, artigo: 1, n: 1 };

  // Conjunto de tokens significativos de um nome, aplicando sinônimos comuns de
  // edital para que variações de banca ("Português" vs "Língua Portuguesa") casem.
  function tokensSignificativos(nome, stop) {
    let n = ' ' + normalizarNomeConc(nome) + ' ';
    n = n.replace(/ portugues /g, ' lingua portuguesa ')
         .replace(/ matematica /g, ' raciocinio logico ')
         .replace(/ rlm /g, ' raciocinio logico ')
         .replace(/ informatica /g, ' informatica ')
         .replace(/ rh /g, ' recursos humanos ')
         // Sinônimos jurídicos/temáticos comuns: a mesma matéria aparece com
         // nomes/siglas diferentes entre bancas. Canoniza para o mesmo termo para
         // que tópicos equivalentes casem (Jaccard) mesmo redigidos de outro jeito.
         .replace(/ (cf|cf88|crfb|constituicao da republica|constituicao federal) /g, ' constituicao federal ')
         .replace(/ (rju|regime juridico unico) /g, ' regime juridico servidores ')
         .replace(/ cpc /g, ' codigo processo civil ')
         .replace(/ cpp /g, ' codigo processo penal ')
         .replace(/ clt /g, ' consolidacao leis trabalho ')
         .replace(/ lgpd /g, ' protecao dados pessoais ')
         .replace(/ improbidade /g, ' improbidade administrativa ');
    const set = {};
    n.trim().split(' ').forEach(function (w) { if (w && w.length > 1 && !stop[w]) set[w] = true; });
    // Tópicos curtos (ex.: "LGPD", "Lei 8.112") podem ficar sem tokens após a
    // limpeza; nesse caso usamos o nome normalizado inteiro como token, para que
    // tópicos idênticos ainda casem entre si.
    if (!Object.keys(set).length) { const inteiro = n.trim().replace(/\s+/g, '_'); if (inteiro) set[inteiro] = true; }
    return set;
  }

  function tokensDisc(nome) { return tokensSignificativos(nome, STOP_DISC); }
  function tokensTop(nome) { return tokensSignificativos(nome, STOP_TOP); }

  // Similaridade de Jaccard entre dois conjuntos de tokens (0..1). Prefixos
  // editoriais ("Noções de", "Fundamentos de") já são removidos por STOP_DISC/
  // STOP_TOP, então a interseção pura distingue bem "Direito do Trabalho" de
  // "Direito Processual do Trabalho" (que não devem casar como iguais).
  function similaridadeTokens(a, b) {
    const ka = Object.keys(a), kb = Object.keys(b);
    if (!ka.length || !kb.length) return 0;
    let inter = 0;
    ka.forEach(function (k) { if (b[k]) inter++; });
    const uniao = ka.length + kb.length - inter;
    return uniao ? inter / uniao : 0;
  }

  // Chave estável de uma disciplina (tokens significativos ordenados), usada para
  // agrupar/deduplicar disciplinas equivalentes mesmo com nomes diferentes.
  function canonizarDisciplina(nome) {
    const toks = Object.keys(tokensDisc(nome)).sort();
    return toks.join(' ') || normalizarNomeConc(nome);
  }

  // Limiares de similaridade para considerar duas disciplinas/tópicos "o mesmo".
  const SIM_DISC = 0.5;
  const SIM_TOP = 0.34;

  // Disciplinas de um edital com seus tópicos já tokenizados e horas somadas.
  function disciplinasDoEdital(ed) {
    return (ed.disciplinas || []).map(function (d) {
      const topicos = (d.topicos || []).map(function (t) {
        const horas = t.horas_estimadas || 2;
        return { nome: d.nome + ' › ' + t.nome, tokens: tokensTop(t.nome), horas: horas };
      });
      return {
        nome: d.nome,
        tokens: tokensDisc(d.nome),
        topicos: topicos,
        horas: topicos.reduce(function (n, t) { return n + t.horas; }, 0)
      };
    });
  }

  function topicosDoEdital(ed) {
    const out = [];
    (ed.disciplinas || []).forEach(function (d) {
      (d.topicos || []).forEach(function (t) {
        out.push({ disc: normalizarNomeConc(d.nome), nome: normalizarNomeConc(t.nome), horas: t.horas_estimadas || 2 });
      });
    });
    return out;
  }

  // Quantos meses faltam de hoje até um marco "AAAA-MM" (null se não definido).
  function mesesAteMarco(aaaaMM, hoje) {
    if (!aaaaMM) return null;
    const a = String(aaaaMM).split('-');
    const ano = parseInt(a[0], 10), mes = parseInt(a[1] || '1', 10);
    if (!ano) return null;
    const h = String(hoje).split('-');
    return (ano - parseInt(h[0], 10)) * 12 + (mes - parseInt(h[1], 10));
  }

  // Mensagem OBJETIVA: só o veredito acionável. Os números (sobreposição, carga,
  // semanas, exclusivos) já aparecem na grade/colunas do card, então não repetimos
  // aqui. O título "Compatibilidade X" também já é mostrado em negrito à parte.
  function mensagemConciliacao(nivel, d) {
    if (nivel === 'alta') return 'Muito conteúdo em comum e a carga cabe na sua rotina — dá para conciliar com folga.';
    if (nivel === 'moderada') return 'Dá para conciliar aproveitando o conteúdo comum, mas fica no limite — priorize o que cai nos dois.';
    if (nivel === 'baixa') return 'Conciliar exige cortar conteúdo e aumentar as horas por semana.';
    return 'Pouco conteúdo em comum e a carga combinada não cabe no tempo disponível.';
  }

  function conciliarPlanos(edA, edB, opcoes) {
    opcoes = opcoes || {};
    const horasSemana = opcoes.horasSemana || 18;
    const hoje = opcoes.hoje || hojeISO();

    const discsA = disciplinasDoEdital(edA), discsB = disciplinasDoEdital(edB);
    const totalA = discsA.reduce(function (n, d) { return n + d.topicos.length; }, 0);
    const totalB = discsB.reduce(function (n, d) { return n + d.topicos.length; }, 0);
    const horasA = discsA.reduce(function (n, d) { return n + d.horas; }, 0);
    const horasB = discsB.reduce(function (n, d) { return n + d.horas; }, 0);

    // Casa cada disciplina de A com a melhor de B (similaridade de tokens), sem
    // reutilizar disciplinas. Disciplinas equivalentes contam como "em comum"
    // mesmo escritas de formas diferentes entre as bancas.
    const usadasB = {};
    const disciplinasComuns = [];
    let topicosComuns = 0, horasComuns = 0;

    discsA.forEach(function (dA) {
      let melhor = -1, melhorSim = SIM_DISC;
      discsB.forEach(function (dB, j) {
        if (usadasB[j]) return;
        const sim = similaridadeTokens(dA.tokens, dB.tokens);
        if (sim >= melhorSim) { melhorSim = sim; melhor = j; }
      });
      if (melhor < 0) return;
      usadasB[melhor] = true;
      const dB = discsB[melhor];
      disciplinasComuns.push(dA.nome);

      // Dentro de uma disciplina compartilhada, casa tópicos por similaridade.
      const usadosT = {};
      let paresT = 0, horasParesT = 0;
      dA.topicos.forEach(function (tA) {
        let achou = -1, simT = SIM_TOP;
        dB.topicos.forEach(function (tB, k) {
          if (usadosT[k]) return;
          const s = similaridadeTokens(tA.tokens, tB.tokens);
          if (s >= simT) { simT = s; achou = k; }
        });
        if (achou >= 0) { usadosT[achou] = true; paresT++; horasParesT += Math.min(tA.horas, dB.topicos[achou].horas); }
      });

      // Mesmo quando os tópicos são redigidos de forma diferente, compartilhar a
      // disciplina já transfere boa parte do estudo. Por isso aplicamos um piso de
      // conteúdo em comum proporcional à FORÇA do casamento da disciplina:
      //  • casamento forte (mesma matéria, sim ≥ 0.8) → piso 70%;
      //  • casamento normal (sim ≥ 0.5) → piso 50%.
      // Assim editais da mesma área (ex.: dois "Téc. Judiciário Adm.") deixam de ser
      // subestimados só porque as bancas redigem os tópicos com palavras diferentes.
      const piso = melhorSim >= 0.8 ? 0.7 : 0.5;
      const menorHorasDisc = Math.min(dA.horas, dB.horas);
      const alinhamento = menorHorasDisc > 0 ? horasParesT / menorHorasDisc : 0;
      horasComuns += menorHorasDisc * Math.max(alinhamento, piso);
      topicosComuns += Math.max(paresT, Math.round(Math.min(dA.topicos.length, dB.topicos.length) * piso));
    });

    horasComuns = Math.round(horasComuns);
    topicosComuns = Math.min(topicosComuns, Math.min(totalA, totalB));
    const exclusivosA = Math.max(0, totalA - topicosComuns);
    const exclusivosB = Math.max(0, totalB - topicosComuns);

    const cargaUniaoH = Math.round((horasA + horasB - horasComuns) * 1.8);
    const cargaSomadaH = Math.round((horasA + horasB) * 1.8);
    const economiaH = cargaSomadaH - cargaUniaoH;

    const mA = mesesAteMarco(edA.janelaProva && edA.janelaProva.inicio, hoje);
    const mB = mesesAteMarco(edB.janelaProva && edB.janelaProva.inicio, hoje);
    const mesesAlvo = [mA, mB].filter(function (m) { return m != null && m > 0; });
    const mesesMin = mesesAlvo.length ? Math.min.apply(null, mesesAlvo) : null;
    const provaDefinida = mesesMin != null;
    const semanasDisponiveis = provaDefinida ? Math.max(2, Math.round(mesesMin * 4.345)) : 26;

    const exigidaSemana = Math.round((cargaUniaoH / semanasDisponiveis) * 10) / 10;
    const ratio = horasSemana > 0 ? exigidaSemana / horasSemana : 99;
    // Sobreposição de conteúdo medida em horas de estudo (mais fiel do que contar
    // tópicos), em relação ao menor dos dois editais.
    const menorHoras = Math.max(1, Math.min(horasA, horasB));
    const overlapPct = Math.min(100, Math.round((horasComuns / menorHoras) * 100));

    const ordem = ['nao_recomendado', 'baixa', 'moderada', 'alta'];
    function subirNivel(n) { return ordem[Math.min(ordem.length - 1, ordem.indexOf(n) + 1)]; }
    function descerNivel(n) { return ordem[Math.max(0, ordem.indexOf(n) - 1)]; }

    // Base pela folga de tempo (quanto a carga combinada cabe na rotina).
    let nivel;
    if (ratio <= 0.85) nivel = 'alta';
    else if (ratio <= 1.1) nivel = 'moderada';
    else if (ratio <= 1.45) nivel = 'baixa';
    else nivel = 'nao_recomendado';

    // Conteúdo compartilhado torna a conciliação eficiente: estudar uma vez
    // aproveita nos dois. Por isso a sobreposição puxa o nível para cima:
    //  • ≥50%  → sobe um nível (ex.: moderada → alta quando a carga cabe);
    //  • ≥75%  → sobe outro nível (editais quase iguais chegam a "alta");
    //  • ≥30%  → ao menos tira do "não recomendado" (vira meio-termo: baixa).
    if (overlapPct >= 50) nivel = subirNivel(nivel);
    if (overlapPct >= 75 && ratio <= 1.2) nivel = subirNivel(nivel);
    if (overlapPct >= 30 && nivel === 'nao_recomendado') nivel = 'baixa';

    // Provas muito próximas com carga acima da capacidade derrubam um nível.
    if (provaDefinida && semanasDisponiveis < 8 && ratio > 1.1) nivel = descerNivel(nivel);

    const detalhes = {
      disciplinasComuns: disciplinasComuns, nDisciplinasComuns: disciplinasComuns.length,
      topicosComuns: topicosComuns, exclusivosA: exclusivosA, exclusivosB: exclusivosB,
      totalA: totalA, totalB: totalB, overlapPct: overlapPct,
      cargaUniaoH: cargaUniaoH, cargaSomadaH: cargaSomadaH, economiaH: economiaH,
      exigidaSemana: exigidaSemana, horasSemana: horasSemana,
      semanasDisponiveis: semanasDisponiveis, provaDefinida: provaDefinida, mesesMin: mesesMin
    };
    return { nivel: nivel, ratio: Math.round(ratio * 100) / 100, mensagem: mensagemConciliacao(nivel, detalhes), detalhes: detalhes };
  }

  // ---------- Curva do esquecimento adaptativa (ajuste por desempenho) ----------
  // Decide o que fazer com o tópico depois de uma revisão, a partir do % de acerto.
  // Regras: <50% reabre + sobe prioridade + reforço em 2d; <70% sobe prioridade +
  // reforço em 3d (reabre só na de 30d); >=85% na de 30d marca como dominado.
  function ajustePosRevisao(revisao, resultadoPct) {
    const r = { reabrir: false, subirPrioridade: false, revisaoExtraDias: null, dominar: false };
    if (resultadoPct == null) return r; // revisão só de leitura, sem questões — neutro
    if (resultadoPct < 50) { r.reabrir = true; r.subirPrioridade = true; r.revisaoExtraDias = 2; }
    else if (resultadoPct < 70) { r.subirPrioridade = true; r.revisaoExtraDias = 3; if (revisao.tipo === '30d') r.reabrir = true; }
    else if (resultadoPct >= 85 && revisao.tipo === '30d') { r.dominar = true; }
    return r;
  }

  // Revisão extra de reforço (curva encurtada quando o desempenho foi baixo).
  function revisaoReforco(topicoId, baseISO, dias) {
    const data = addDias(baseISO, dias);
    return { id: 'rev-' + topicoId + '-reforco-' + data, topicoId: topicoId, tipo: 'reforço', dataAgendada: data, dataConcluida: null, resultadoPct: null };
  }

  // ---------- Espaçamento adaptativo das revisões (curva por desempenho) ----------
  // A cadência de revisão reflete o histórico de acertos do tópico: quem vai
  // melhorando precisa revisar com MENOS frequência (intervalos esticam), quem
  // vai piorando precisa revisar com MAIS frequência (intervalos encurtam). É o
  // mesmo princípio do SM-2 dos flashcards, aplicado às revisões do tópico.
  const TIPOS_CICLO_REV = { '24h': 1, '3d': 1, '7d': 1, '14d': 1, '30d': 1 };

  // Multiplicador do espaçamento para uma faixa de desempenho (%).
  function multiplicadorEspacamento(p) {
    if (p >= 85) return 1.25;        // dominando: espaça mais
    if (p >= 70) return 1.1;         // indo bem: espaça um pouco
    if (p >= 50) return 0.85;        // vacilando: aproxima
    return 0.6;                      // não fixou: aproxima bastante
  }

  // Fator multiplicativo do espaçamento (1 = neutro). Acumula o efeito de cada
  // revisão já feita: acerto alto estica, acerto baixo encurta. Como os multipli-
  // cadores recentes compõem sobre os antigos, a TENDÊNCIA recente domina.
  // `sessoes` (opcional): as questões do estudo do dia a dia também realimentam o
  // espaçamento — o desempenho recente (últimas 3 sessões de QUESTÕES, fora as de
  // revisão, que já entram acima) entra como um multiplicador adicional. Assim a
  // maior parte das questões do aluno passa a influenciar o timing das revisões.
  function fatorEspacamentoRevisao(revisoes, topicoId, sessoes) {
    const feitas = (revisoes || [])
      .filter(function (r) {
        return r.topicoId === topicoId && TIPOS_CICLO_REV[r.tipo] && r.dataConcluida && r.resultadoPct != null;
      })
      .sort(function (a, b) { return String(a.dataConcluida).localeCompare(String(b.dataConcluida)); });
    let f = 1;
    feitas.forEach(function (r) { f *= multiplicadorEspacamento(r.resultadoPct); });
    if (sessoes && sessoes.length) {
      const recentes = sessoes
        .filter(function (s) { return s.topicoId === topicoId && s.tipo !== 'revisao' && s.qFeitas > 0; })
        .sort(function (a, b) { return String(a.data || '').localeCompare(String(b.data || '')); })
        .slice(-3);
      if (recentes.length) {
        let fe = 0, ce = 0;
        recentes.forEach(function (s) { fe += s.qFeitas; ce += s.qCertas; });
        if (fe > 0) f *= multiplicadorEspacamento(Math.round((ce / fe) * 100));
      }
    }
    return Math.max(0.4, Math.min(2.2, Math.round(f * 100) / 100));
  }

  // Reescala as revisões do ciclo ainda PENDENTES (futuras) do tópico pelo fator
  // de espaçamento. Não mexe em revisões já feitas nem nas vencidas/de hoje.
  function reagendarRevisoesAdaptativo(revisoes, topicoId, hoje, sessoes) {
    hoje = hoje || hojeISO();
    const f = fatorEspacamentoRevisao(revisoes, topicoId, sessoes);
    let ajustadas = 0;
    (revisoes || []).forEach(function (r) {
      if (r.topicoId !== topicoId || !TIPOS_CICLO_REV[r.tipo] || r.dataConcluida) return;
      const gap = diffDias(hoje, r.dataAgendada); // dias de hoje até a revisão
      if (gap <= 0) return; // já venceu ou é hoje — não remarca
      const novoGap = Math.max(1, Math.round(gap * f));
      const novaData = addDias(hoje, novoGap);
      if (novaData !== r.dataAgendada) { r.dataAgendada = novaData; ajustadas++; }
    });
    return { fator: f, ajustadas: ajustadas };
  }

  // Estado adaptativo de uma revisão PENDENTE, para a UI mostrar o porquê do
  // timing. A data-base original está no fim do id (rev-<top>-<tipo>-AAAA-MM-DD);
  // comparamos a data agendada atual com a data "nominal" do ciclo:
  //   antecipada → veio para mais cedo (desempenho abaixo do esperado)
  //   espacada   → foi empurrada (o aluno vem indo bem)
  //   reforco    → revisão extra criada por desempenho baixo
  const DIAS_CICLO_REV = { '24h': 1, '3d': 3, '7d': 7, '14d': 14, '30d': 30 };
  function estadoAdaptacaoRevisao(rev) {
    if (!rev || rev.dataConcluida) return null;
    if (rev.tipo === 'reforço') return 'reforco';
    const dias = DIAS_CICLO_REV[rev.tipo];
    if (!dias) return null;
    const m = String(rev.id || '').match(/(\d{4}-\d{2}-\d{2})$/);
    if (!m) return null;
    const nominal = addDias(m[1], dias);
    if (rev.dataAgendada < nominal) return 'antecipada';
    if (rev.dataAgendada > nominal) return 'espacada';
    return 'normal';
  }

  // ---------- Prontidão para a prova: as revisões cabem antes da prova? ----------
  // A janela da prova fica em state.plano.radar.janela_prova = [iniMes, fimMes]
  // (strings AAAA-MM). O "prazo" para estar revisado é o INÍCIO da janela (a prova
  // mais cedo possível), convertido para o 1º dia do mês.
  function prazoProva(state) {
    const janela = state.plano && state.plano.radar && state.plano.radar.janela_prova;
    const ini = janela && janela[0];
    if (!ini || !/^\d{4}-\d{2}/.test(ini)) return null;
    return ini.slice(0, 7) + '-01';
  }

  // Mede quantos tópicos terminam o ciclo de revisão ANTES da prova. Um tópico está
  // "pronto" se a sua revisão pendente mais distante cai até o prazo; senão, "em risco".
  // Tópicos sem revisão pendente (todas já feitas) contam como prontos.
  function prontidaoProva(state, hoje) {
    const prazo = prazoProva(state);
    if (!prazo) return null;
    hoje = hoje || hojeISO();
    const pend = doPlanoAtivo(state, state.revisoes)
      .filter(function (r) { return !r.dataConcluida && topicoPorId(state, r.topicoId); });

    const ultimaPorTopico = {};
    let revisoesForaDoPrazo = 0;
    pend.forEach(function (r) {
      if (r.dataAgendada > prazo) revisoesForaDoPrazo++;
      if (!ultimaPorTopico[r.topicoId] || r.dataAgendada > ultimaPorTopico[r.topicoId]) {
        ultimaPorTopico[r.topicoId] = r.dataAgendada;
      }
    });

    const ids = Object.keys(ultimaPorTopico);
    let emRisco = 0;
    ids.forEach(function (id) { if (ultimaPorTopico[id] > prazo) emRisco++; });
    const totalTopicos = ids.length;
    const prontos = totalTopicos - emRisco;
    const pct = totalTopicos > 0 ? Math.round((prontos / totalTopicos) * 100) : 100;
    return { prazo: prazo, totalTopicos: totalTopicos, prontos: prontos, emRisco: emRisco, revisoesForaDoPrazo: revisoesForaDoPrazo, pct: pct };
  }

  // ---------- Modo reta final ----------
  // Nas últimas semanas antes da prova, o foco deixa de ser "ver matéria nova" e
  // passa a ser consolidar: questões, simulados e revisão do que mais cai. Liga
  // sozinho quando a prova está a <= 6 semanas (porData) e pode ser ligado
  // manualmente pelo aluno (manual) — útil quando não há data marcada.
  const SEMANAS_RETA_FINAL = 6;
  function retaFinalInfo(state, hoje) {
    const manual = !!(state && state.plano && state.plano.modoRetaFinal);
    const prazo = prazoProva(state);
    hoje = hoje || hojeISO();
    if (!prazo) return { ativa: manual, manual: manual, porData: false, semanas: null, dias: null, prazo: null };
    const dias = diffDias(hoje, prazo);
    if (dias <= 0) return { ativa: manual, manual: manual, porData: false, passou: true, semanas: 0, dias: dias, prazo: prazo };
    const semanas = Math.ceil(dias / 7);
    const porData = semanas <= SEMANAS_RETA_FINAL;
    return { ativa: manual || porData, manual: manual, porData: porData, passou: false, semanas: semanas, dias: dias, prazo: prazo };
  }

  // ---------- Plano combinado: une dois editais conciliáveis num só ----------
  // Dedup de disciplinas/tópicos por nome normalizado ("reduzir blocos redundantes").
  // O tópico em comum vira um só, com a maior incidência, a maior prioridade
  // (menor número) e as maiores horas — depois o cronograma adaptativo distribui.
  function tituloCurtoConc(t) { return String(t || '').split(/\s[-–—]/)[0].trim().slice(0, 28); }

  function combinarEditais(edA, edB) {
    const discMap = {};
    const rotuloA = tituloCurtoConc(edA.titulo);
    const rotuloB = tituloCurtoConc(edB.titulo);
    function addDisc(d, origemRotulo) {
      const k = canonizarDisciplina(d.nome);
      if (!k) return;
      if (!discMap[k]) {
        discMap[k] = { id: '', nome: d.nome, cor: d.cor || '#3B82F6', peso: d.peso || 1, dificuldade: d.dificuldade || 'media', base_teorica: d.base_teorica || 'pdf', _origem: {}, _top: {}, topicos: [] };
      }
      const alvo = discMap[k];
      if (origemRotulo) alvo._origem[origemRotulo] = true;
      alvo.peso = Math.max(alvo.peso, d.peso || 1);
      (d.topicos || []).forEach(function (t) {
        const tk = normalizarNomeConc(t.nome);
        if (!tk) return;
        if (!alvo._top[tk]) {
          alvo._top[tk] = { id: '', nome: t.nome, incidencia_pct: t.incidencia_pct || 0, prioridade: t.prioridade || 2, horas_estimadas: t.horas_estimadas || 2, semana_sugerida: t.semana_sugerida || null, status: 'pendente', reaberto: false, orfao: false };
          alvo.topicos.push(alvo._top[tk]);
        } else {
          const ex = alvo._top[tk];
          ex.incidencia_pct = Math.max(ex.incidencia_pct, t.incidencia_pct || 0);
          ex.prioridade = Math.min(ex.prioridade, t.prioridade || 2);
          ex.horas_estimadas = Math.max(ex.horas_estimadas, t.horas_estimadas || 2);
        }
      });
    }
    (edA.disciplinas || []).forEach(function (d) { addDisc(d, rotuloA); });
    (edB.disciplinas || []).forEach(function (d) { addDisc(d, rotuloB); });
    const disciplinas = Object.keys(discMap).map(function (k) {
      const d = discMap[k];
      d.origem = Object.keys(d._origem).join(' + ');
      delete d._origem; delete d._top;
      return d;
    });
    const inis = [edA.janelaProva && edA.janelaProva.inicio, edB.janelaProva && edB.janelaProva.inicio].filter(Boolean).sort();
    return {
      titulo: tituloCurtoConc(edA.titulo) + ' + ' + tituloCurtoConc(edB.titulo) + ' (combinado)',
      banca: [edA.banca, edB.banca].filter(Boolean).join(' + '),
      notaCorte: Math.max(edA.notaCorte || 70, edB.notaCorte || 70),
      nivel: 'dificil',
      janelaProva: inis.length ? { inicio: inis[0], fim: '' } : { inicio: '', fim: '' },
      disciplinas: disciplinas
    };
  }

  // ---------- Conquistas (gamificação leve, derivada dos dados existentes) ----------
  function conquistas(state, hoje) {
    hoje = hoje || hojeISO();
    const ses = sessoesDoPlano(state);
    const totalQ = ses.reduce(function (n, s) { return n + (s.qFeitas || 0); }, 0);
    const horas = ses.reduce(function (n, s) { return n + (s.duracaoMin || 0); }, 0) / 60;
    const st = streak(ses, hoje);
    let dominados = 0, concluidos = 0, totalTop = 0;
    (state.disciplinas || []).forEach(function (d) {
      (d.topicos || []).forEach(function (t) {
        if (t.orfao) return;
        totalTop++;
        if (t.status === 'dominado') dominados++;
        if (t.status === 'dominado' || t.status === 'teoria_concluida') concluidos++;
      });
    });
    const prog = totalTop > 0 ? Math.round((concluidos / totalTop) * 100) : 0;
    const nSim = doPlanoAtivo(state, state.simulados || []).length;
    const defs = [
      { id: 'plano', icone: '🚀', titulo: 'Plano traçado', desc: 'Comece um plano de estudos', ganha: (state.planos || []).length >= 1 },
      { id: 'streak7', icone: '🔥', titulo: 'Semana de fogo', desc: '7 dias seguidos estudando', ganha: st.recorde >= 7 },
      { id: 'streak30', icone: '🏔️', titulo: 'Inabalável', desc: '30 dias seguidos estudando', ganha: st.recorde >= 30 },
      { id: 'q100', icone: '💯', titulo: 'Centena', desc: '100 questões resolvidas', ganha: totalQ >= 100 },
      { id: 'q1000', icone: '🎯', titulo: 'Franco-atirador', desc: '1.000 questões resolvidas', ganha: totalQ >= 1000 },
      { id: 'h50', icone: '⏱️', titulo: 'Maratonista', desc: '50 horas de estudo registradas', ganha: horas >= 50 },
      { id: 'dom10', icone: '🧠', titulo: 'Domínio', desc: '10 tópicos dominados', ganha: dominados >= 10 },
      { id: 'meio', icone: '📈', titulo: 'Meio caminho', desc: '50% do edital concluído', ganha: prog >= 50 },
      { id: 'edital', icone: '🏆', titulo: 'Edital fechado', desc: '100% do edital concluído', ganha: prog >= 100 },
      { id: 'sim', icone: '📝', titulo: 'Simulado feito', desc: 'Registre um simulado', ganha: nSim >= 1 }
    ];
    return { lista: defs, ganhas: defs.filter(function (d) { return d.ganha; }).length, total: defs.length };
  }

  // ---------------- Flashcards: repetição espaçada (SM-2 simplificado) ----------------
  // Recebe o estado SR de uma carta + a nota dada e devolve o novo estado SR.
  // notas: 'errei' | 'dificil' | 'bom' | 'facil'. Datas em ISO (YYYY-MM-DD).
  function revisarFlashcard(sr, nota, hoje) {
    hoje = hoje || hojeISO();
    const base = sr || {};
    let ease = typeof base.facilidade === 'number' ? base.facilidade : 2.5;
    let rep = base.repeticoes || 0;
    let intervalo = base.intervalo || 0;
    let lapsos = base.lapsos || 0;

    if (nota === 'errei') {
      ease = Math.max(1.3, ease - 0.2);
      rep = 0;
      lapsos += 1;
      intervalo = 1; // volta no dia seguinte (e reaparece na sessão atual)
    } else if (nota === 'dificil') {
      ease = Math.max(1.3, ease - 0.15);
      rep += 1;
      intervalo = rep <= 1 ? 1 : Math.max(1, Math.round((intervalo || 1) * 1.2));
    } else if (nota === 'facil') {
      ease = ease + 0.15;
      rep += 1;
      intervalo = rep === 1 ? 2 : Math.max(2, Math.round((intervalo || 1) * ease * 1.3));
    } else { // 'bom' (padrão)
      rep += 1;
      intervalo = rep === 1 ? 1 : rep === 2 ? 3 : Math.max(1, Math.round((intervalo || 1) * ease));
    }
    return {
      intervalo: intervalo,
      facilidade: Math.round(ease * 100) / 100,
      repeticoes: rep,
      lapsos: lapsos,
      proximaRevisao: addDias(hoje, intervalo),
      ultimaRevisao: hoje
    };
  }

  // Carta nova (sem agendamento) ou vencida conta como "devida".
  function flashcardDevido(card, hoje) {
    hoje = hoje || hojeISO();
    const sr = card && card.sr;
    return !sr || !sr.proximaRevisao || sr.proximaRevisao <= hoje;
  }

  // Mescla a estrutura de um edital ATUALIZADO em um plano já existente, casando
  // por id de disciplina/tópico. NÃO perde progresso: sessões/revisões ficam em
  // state.sessoes/revisoes (keyed por topicoId), então só atualizamos as
  // DEFINIÇÕES. Tópicos/disciplinas novos entram; os que sumiram do edital são
  // mantidos e marcados (removidoDoEdital) para preservar o histórico; os que
  // continuam recebem a definição nova e mantêm o estado de estudo (status/etc.).
  function mesclarEditalNoPlano(discPlano, discEdital) {
    discPlano = Array.isArray(discPlano) ? discPlano : [];
    discEdital = Array.isArray(discEdital) ? discEdital : [];
    const RUNTIME = ['status', 'reaberto', 'orfao'];
    const resumo = { disciplinasNovas: 0, disciplinasRemovidas: 0, topicosNovos: 0, topicosRemovidos: 0, topicosMantidos: 0 };

    function mergeTopicos(tPlano, tEdital) {
      tPlano = tPlano || []; tEdital = tEdital || [];
      const porId = {};
      tPlano.forEach(function (t) { if (t && t.id) porId[t.id] = t; });
      const usados = {};
      const out = tEdital.map(function (te) {
        const tp = te && te.id ? porId[te.id] : null;
        const novo = Object.assign({}, te);
        delete novo.removidoDoEdital;
        if (tp) {
          usados[te.id] = true;
          RUNTIME.forEach(function (k) { if (tp[k] !== undefined) novo[k] = tp[k]; });
          resumo.topicosMantidos++;
        } else {
          resumo.topicosNovos++;
        }
        return novo;
      });
      tPlano.forEach(function (tp) {
        if (tp && tp.id && !usados[tp.id]) {
          resumo.topicosRemovidos++;
          out.push(Object.assign({}, tp, { removidoDoEdital: true }));
        }
      });
      return out;
    }

    const porId = {};
    discPlano.forEach(function (d) { if (d && d.id) porId[d.id] = d; });
    const usadas = {};
    const merged = discEdital.map(function (de) {
      const dp = de && de.id ? porId[de.id] : null;
      const novo = Object.assign({}, de);
      delete novo.removidoDoEdital;
      if (dp) {
        usadas[de.id] = true;
        novo.topicos = mergeTopicos(dp.topicos, de.topicos);
      } else {
        resumo.disciplinasNovas++;
        novo.topicos = (de.topicos || []).map(function (t) { return Object.assign({}, t); });
        resumo.topicosNovos += novo.topicos.length;
      }
      return novo;
    });
    discPlano.forEach(function (dp) {
      if (dp && dp.id && !usadas[dp.id]) {
        resumo.disciplinasRemovidas++;
        merged.push(Object.assign({}, dp, {
          removidoDoEdital: true,
          topicos: (dp.topicos || []).map(function (t) { return Object.assign({}, t, { removidoDoEdital: true }); })
        }));
      }
    });
    return { disciplinas: merged, resumo: resumo };
  }

  window.Dominio = {
    hojeISO, addDias, diffDias, formatarDataBR, formatarMesBR, segundaDaSemana, formatarMin,
    topicoPorId, disciplinaDoTopico, disciplinaPorId, doPlanoAtivo, sessoesDoPlano,
    agendarRevisoes, desempenhoTopico, desempenhoDisciplina, desempenhoGeral,
    revisaoReabreTopico, sugereRevisarTeoria, fatorEspacamentoRevisao,
    reagendarRevisoesAdaptativo, estadoAdaptacaoRevisao, prazoProva, prontidaoProva, retaFinalInfo, streak, semaforo,
    cronogramaAtivo, semanaCorrente, blocoFeito, filaHoje, sugerirReestudo,
    cicloAtivo, blocoCicloAtual, sugerirCiclo, avancarCiclo,
    validarPlano, mesclarPlano, metaSemanal, progressoEdital, progressoDisciplina,
    heatmapDias, serieSemanal, pioresTopicos,
    totalHorasTeoria, esforcoTotalHoras, horasRealizadas, burndownEdital, checkinSemanal,
    conciliarPlanos, mesclarEditalNoPlano, ajustePosRevisao, revisaoReforco, combinarEditais, conquistas,
    revisarFlashcard, flashcardDevido
  };
})();
