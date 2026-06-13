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

  // ---------- RN01 — Teoria concluída agenda revisões 24h/7d/30d ----------
  function agendarRevisoes(topicoId, dataBaseISO) {
    return [
      { id: 'rev-' + topicoId + '-24h-' + dataBaseISO, topicoId, tipo: '24h', dataAgendada: addDias(dataBaseISO, 1), dataConcluida: null, resultadoPct: null },
      { id: 'rev-' + topicoId + '-7d-' + dataBaseISO, topicoId, tipo: '7d', dataAgendada: addDias(dataBaseISO, 7), dataConcluida: null, resultadoPct: null },
      { id: 'rev-' + topicoId + '-30d-' + dataBaseISO, topicoId, tipo: '30d', dataAgendada: addDias(dataBaseISO, 30), dataConcluida: null, resultadoPct: null }
    ];
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
        topicos: d.topicos.map(function (t) {
          const antigo = statusAntigo[t.id];
          return {
            id: t.id, nome: t.nome,
            incidencia_pct: t.incidencia_pct, prioridade: t.prioridade || 2,
            horas_estimadas: t.horas_estimadas || 2, semana_sugerida: t.semana_sugerida || null,
            status: antigo ? antigo.status : 'pendente',
            reaberto: antigo ? antigo.reaberto : false,
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
      sessoes: stateAtual.sessoes || [],
      revisoes: stateAtual.revisoes || [],
      simulados: stateAtual.simulados || [],
      config: stateAtual.config || {}
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
    let situacao = 'no_prazo';
    if (restante <= 0) situacao = 'concluido';
    else if (!isFinite(mesesProjetados)) situacao = 'parado';
    else if (mesesProjetados > meses + 0.5) situacao = 'atrasado';
    else if (mesesProjetados < meses - 0.5) situacao = 'adiantado';
    return {
      esforcoTotal, horasFeitas: Math.round(horasFeitas * 10) / 10, restante: Math.round(restante * 10) / 10,
      semanasTotais, meses, semanasDecorridas: Math.round(decorridas * 10) / 10,
      semanasRestantes: Math.round(semanasRestantes * 10) / 10, cargaIdeal,
      cargaPlanejada: Math.round(cargaPlanejada * 10) / 10, ritmoReal: Math.round(ritmoReal * 10) / 10,
      mesesProjetados, pctConcluido, situacao
    };
  }

  // RN10 — Check-in semanal: Planejado vs. Realizado da última semana fechada.
  function checkinSemanal(state, hoje) {
    const inicioAtual = segundaDaSemana(hoje);
    const inicioAnterior = addDias(inicioAtual, -7);
    let realizadoMin = 0, qFeitas = 0;
    for (const s of sessoesDoPlano(state)) {
      if (s.data >= inicioAnterior && s.data < inicioAtual) {
        realizadoMin += s.duracaoMin || 0;
        qFeitas += s.qFeitas || 0;
      }
    }
    const r = ritmoInfoAtivo(state);
    const planejado = r ? (r.h_semana || 0) : 0;
    const realizado = Math.round((realizadoMin / 60) * 10) / 10;
    const saldo = Math.round((realizado - planejado) * 10) / 10; // <0 déficit, >0 superávit
    return { inicio: inicioAnterior, planejado, realizado, saldo, qFeitas, temDados: realizadoMin > 0 };
  }

  // ---------- Conciliação de planos: "dá para conciliar dois concursos?" ----------
  // Compara dois editais e diz se é viável estudar para os dois ao mesmo tempo.
  // Pura e testável: recebe os editais (com disciplinas/tópicos) e a rotina semanal.
  function normalizarNomeConc(s) {
    return String(s == null ? '' : s).toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
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

  function mensagemConciliacao(nivel, d) {
    const comuns = d.disciplinasComuns.length;
    const base = comuns > 0
      ? 'Os dois concursos compartilham ' + comuns + ' disciplina' + (comuns > 1 ? 's' : '') + ' e ' + d.topicosComuns + ' tópico' + (d.topicosComuns !== 1 ? 's' : '') + ' (' + d.overlapPct + '% de sobreposição), economizando cerca de ' + d.economiaH + 'h de estudo. '
      : 'Os dois concursos quase não têm conteúdo em comum, então estudar os dois soma a carga inteira. ';
    const carga = 'Para cobrir tudo na janela mais próxima seriam ~' + d.exigidaSemana + 'h/semana, e você tem ~' + d.horasSemana + 'h disponíveis' +
      (d.provaDefinida ? ' (≈' + d.semanasDisponiveis + ' semanas até a prova mais próxima). ' : ' (sem data de prova definida; estimei 6 meses). ');
    let veredito;
    if (nivel === 'alta') veredito = '✅ Dá para conciliar com folga.';
    else if (nivel === 'moderada') veredito = '🟡 Dá para conciliar, mas no limite — priorize o que cai nos dois.';
    else if (nivel === 'baixa') veredito = '🟠 Conciliar vai exigir cortar conteúdo e aumentar as horas semanais.';
    else veredito = '⛔ Não recomendado: a carga combinada não cabe no tempo disponível.';
    return base + carga + veredito;
  }

  function conciliarPlanos(edA, edB, opcoes) {
    opcoes = opcoes || {};
    const horasSemana = opcoes.horasSemana || 18;
    const hoje = opcoes.hoje || hojeISO();
    const topsA = topicosDoEdital(edA), topsB = topicosDoEdital(edB);

    const discA = {}, discB = {};
    (edA.disciplinas || []).forEach(function (d) { discA[normalizarNomeConc(d.nome)] = d.nome; });
    (edB.disciplinas || []).forEach(function (d) { discB[normalizarNomeConc(d.nome)] = d.nome; });
    const disciplinasComuns = Object.keys(discA).filter(function (k) { return discB[k]; }).map(function (k) { return discA[k]; });

    const setB = {};
    topsB.forEach(function (t) { setB[t.disc + '|' + t.nome] = true; });
    const chavesA = {};
    let topicosComuns = 0, horasComuns = 0;
    topsA.forEach(function (t) {
      const k = t.disc + '|' + t.nome;
      chavesA[k] = true;
      if (setB[k]) { topicosComuns++; horasComuns += t.horas; }
    });
    const totalA = topsA.length, totalB = topsB.length;
    const exclusivosA = totalA - topicosComuns;
    const exclusivosB = topsB.filter(function (t) { return !chavesA[t.disc + '|' + t.nome]; }).length;

    const horasA = topsA.reduce(function (n, t) { return n + t.horas; }, 0);
    const horasB = topsB.reduce(function (n, t) { return n + t.horas; }, 0);
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
    const overlapPct = Math.round((topicosComuns / Math.max(1, Math.min(totalA, totalB))) * 100);

    let nivel;
    if (ratio <= 0.85) nivel = 'alta';
    else if (ratio <= 1.05) nivel = 'moderada';
    else if (ratio <= 1.3) nivel = 'baixa';
    else nivel = 'nao_recomendado';

    const ordem = ['nao_recomendado', 'baixa', 'moderada', 'alta'];
    // provas muito próximas com carga acima da capacidade derrubam um nível
    if (provaDefinida && semanasDisponiveis < 8 && ratio > 1) {
      nivel = ordem[Math.max(0, ordem.indexOf(nivel) - 1)];
    }
    // alta sobreposição no limite sobe um nível (estudar uma vez aproveita nos dois)
    if (overlapPct >= 50 && nivel === 'moderada' && ratio <= 1.0) nivel = 'alta';

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

  window.Dominio = {
    hojeISO, addDias, diffDias, formatarDataBR, formatarMesBR, segundaDaSemana, formatarMin,
    topicoPorId, disciplinaDoTopico, disciplinaPorId, doPlanoAtivo, sessoesDoPlano,
    agendarRevisoes, desempenhoTopico, desempenhoDisciplina, desempenhoGeral,
    revisaoReabreTopico, streak, semaforo,
    cronogramaAtivo, semanaCorrente, blocoFeito, filaHoje, sugerirReestudo,
    validarPlano, mesclarPlano, metaSemanal, progressoEdital, progressoDisciplina,
    heatmapDias, serieSemanal, pioresTopicos,
    totalHorasTeoria, esforcoTotalHoras, horasRealizadas, burndownEdital, checkinSemanal,
    conciliarPlanos
  };
})();
