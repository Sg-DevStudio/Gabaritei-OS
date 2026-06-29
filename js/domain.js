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
  // `opcoes.pular24h`: omite a revisão de 24h. Usado no agendamento RETROATIVO em
  // massa (tópicos marcados como "já estudei": ponto de partida, modo aprofundar,
  // plano de exemplo) — como NÃO houve estudo no dia anterior, a 24h não se aplica
  // e a curva começa em 3d. A 24h fica reservada para o estudo real do dia.
  function agendarRevisoes(topicoId, dataBaseISO, opcoes) {
    opcoes = opcoes || {};
    let intervalos = [
      { tipo: '24h', dias: 1 },
      { tipo: '3d', dias: 3 },
      { tipo: '7d', dias: 7 },
      { tipo: '14d', dias: 14 },
      { tipo: '30d', dias: 30 }
    ];
    if (opcoes.pular24h) intervalos = intervalos.filter(function (iv) { return iv.tipo !== '24h'; });
    return intervalos.map(function (iv) {
      return {
        id: 'rev-' + topicoId + '-' + iv.tipo + '-' + dataBaseISO, topicoId: topicoId, tipo: iv.tipo,
        dataAgendada: addDias(dataBaseISO, iv.dias), dataConcluida: null, resultadoPct: null
      };
    });
  }

  // ---------- RN02 — Desempenho (janela móvel de recência) ----------
  // `pct` reflete a JANELA das ~20 questões mais recentes do tópico — quem começou
  // mal e melhorou não fica preso na média vitalícia (o semáforo passa a verde).
  // `feitas`/`certas` seguem vitalícios: alimentam a pizza de acertos/erros e os
  // totais, que devem mostrar tudo o que o aluno já fez.
  const JANELA_Q_DESEMPENHO = 20;
  function desempenhoTopico(sessoes, topicoId) {
    let feitas = 0, certas = 0;
    const doTopico = [];
    for (const s of sessoes) {
      if (s.topicoId === topicoId && s.qFeitas > 0) { feitas += s.qFeitas; certas += s.qCertas; doTopico.push(s); }
    }
    // janela: sessões mais recentes primeiro, acumulando até ~20 questões (sem
    // partir sessão — a que cruza o limite entra inteira).
    let jf = 0, jc = 0;
    doTopico
      .slice()
      .sort(function (a, b) { return String(b.data || '').localeCompare(String(a.data || '')); })
      .some(function (s) { jf += s.qFeitas; jc += s.qCertas; return jf >= JANELA_Q_DESEMPENHO; });
    const pct = jf > 0 ? Math.round((jc / jf) * 100)
      : (feitas > 0 ? Math.round((certas / feitas) * 100) : null);
    return { feitas, certas, pct };
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

  // Disciplinas já "ativas" no ciclo: o ciclo introduz as matérias de forma
  // gradual (voltaInicio), então na volta atual só entram as que já liberaram.
  // Blocos sem voltaInicio (ciclos antigos / adicionados à mão) contam como
  // ativos desde a volta 1 — compatível com o que já existia.
  function blocosAtivosCiclo(ciclo) {
    if (!ciclo || !Array.isArray(ciclo.blocos)) return [];
    const volta = ciclo.volta || 1;
    return ciclo.blocos.filter(function (b) { return (b.voltaInicio || 1) <= volta; });
  }

  // Bloco atual = primeiro ATIVO ainda não concluído; null quando a volta fechou.
  function blocoCicloAtual(ciclo) {
    const ativos = blocosAtivosCiclo(ciclo);
    for (const b of ativos) {
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

    const hojeCiclo = opcoes.hoje || hojeISO();
    const enfaseCiclo = state.plano && state.plano.enfase;
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
        // bagagem ("já estudei/domino") por último: 1ª passada depois dos inéditos
        const aBag = a.bagagem ? 1 : 0;
        const bBag = b.bagagem ? 1 : 0;
        if (aBag !== bBag) return aBag - bBag;
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
      // ênfase do plano combinado: prioriza o concurso principal
      const enf = fatorEnfase(enfaseCiclo, d, hojeCiclo);
      return { disc: d, peso: base * reforco * enf };
    });
    const somaPesos = pesos.reduce(function (s, p) { return s + p.peso; }, 0) || 1;

    // Ordena por peso (mais importante primeiro) e introduz as disciplinas de
    // forma GRADUAL: poucas na volta 1, o resto entra nas voltas seguintes (rampa)
    // — o aluno não começa esmagado por todas as matérias de uma vez. Com até 4
    // disciplinas não vale escalonar.
    const ordenados = pesos.slice().sort(function (a, b) { return b.peso - a.peso; });
    const total = ordenados.length;
    return ordenados.map(function (p, rank) {
      const bruto = (p.peso / somaPesos) * minutosSemana;
      // múltiplos de 30, entre 30min e 2h (blocos digeríveis; o resto vira mais voltas)
      const metaMin = Math.min(maxBloco, Math.max(minBloco, Math.round(bruto / 5) * 5));
      const topico = topicoSugerido(p.disc);
      const voltaInicio = total <= 4 ? 1 : (rank < 3 ? 1 : 1 + Math.ceil((rank - 2) / 2));
      return { id: novoIdBloco(), disciplinaId: p.disc.id, topicoId: topico ? topico.id : null, metaMin: metaMin, feitoMin: 0, voltaInicio: voltaInicio };
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

    // Dedup por tópico: um reaberto que já está na fila (revisão vencida ou bloco
    // da semana) não deve aparecer uma 2ª vez como "reaberto".
    const jaListados = new Set(fila.map((i) => i.topicoId));
    const reabertos = [];
    for (const d of state.disciplinas) {
      for (const t of d.topicos) {
        if (t.reaberto && !jaListados.has(t.id)) {
          reabertos.push({ categoria: 'reaberto', topicoId: t.id });
        }
      }
    }
    // reabertos primeiro pelos mais urgentes (mais cai + pior desempenho + prova perto)
    reabertos.sort((a, b) => urgenciaTopico(state, b.topicoId, hoje) - urgenciaTopico(state, a.topicoId, hoje));
    for (const r of reabertos) fila.push(r);
    return fila;
  }

  // ---------- Urgência do tópico (fila do dia: 80/20 DINÂMICO) ----------
  // Combina os três sinais que, juntos, dizem o que rende mais HOJE rumo à
  // aprovação — em vez de atacar só pela ordem do calendário:
  //   • incidência (80/20): o que mais cai pesa mais;
  //   • déficit de desempenho: quanto falta para a meta de corte (com amostra);
  //   • proximidade da prova: na reta final, aperta o que ainda não fixou.
  // Score multiplicativo (cada fator ~1 = neutro) para a UI ordenar e destacar.
  // Não persiste nada — é derivado do estado a cada render.
  function urgenciaTopico(state, topicoId, hoje, metaPct) {
    const t = topicoPorId(state, topicoId);
    if (!t) return 0;
    hoje = hoje || hojeISO();
    metaPct = metaPct || (state.plano && state.plano.meta && state.plano.meta.corte_pct) || 70;

    // 1) incidência 0..100 → 0.5..1.5 (o que mais cai vale até 3× o que menos cai; nunca zera)
    const inc = Math.max(0, Math.min(100, t.incidencia_pct || 0));
    const fInc = 0.5 + inc / 100;

    // 2) déficit de desempenho: com amostra (≥3 questões), quanto falta p/ a meta
    const dt = desempenhoTopico(sessoesDoPlano(state), topicoId);
    let fDef;
    if (dt.pct !== null && dt.feitas >= 3) {
      fDef = 1 + Math.max(0, metaPct - dt.pct) / 100; // na meta → 1; longe → até ~1.7
    } else {
      fDef = 1.1; // sem base ainda: leve urgência (precisa diagnosticar)
    }

    // 3) proximidade da prova: a reta final prioriza o que ainda não está no ponto
    const rf = retaFinalInfo(state, hoje);
    let fProx = 1;
    if (rf && rf.prazo && !rf.passou && rf.semanas != null) {
      fProx = rf.semanas <= 2 ? 1.5 : rf.semanas <= 6 ? 1.25 : rf.semanas <= 12 ? 1.1 : 1;
    }

    // tópico dominado praticamente sai da frente (já fixado)
    const fStatus = t.status === 'dominado' ? 0.3 : 1;

    return Math.round(fInc * fDef * fProx * fStatus * 1000) / 1000;
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
        // Normaliza para AAAA-MM-DD: JSONs importados/externos podem trazer um
        // timestamp completo ("2026-06-19T10:00:00Z") e os helpers de data fazem
        // .split('-') — com hora junto, addDias/diffDias/segundaDaSemana viram NaN.
        gerado_em: (typeof json.gerado_em === 'string' ? json.gerado_em.slice(0, 10) : json.gerado_em) || null
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
    // Simulados da semana também são questões resolvidas: entram na contagem e,
    // sobretudo, na margem de acertos (qCertas/qFeitas) — antes só as sessões
    // de estudo contavam e os simulados ficavam de fora desse cálculo.
    for (const sim of doPlanoAtivo(state, state.simulados || [])) {
      if (sim.data >= inicio && sim.data < fim) {
        for (const a of (sim.acertos || [])) {
          qFeitas += a.total || 0;
          qCertas += a.certas || 0;
        }
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

  // Data (AAAA-MM-DD) da primeira sessão do plano a partir de uma âncora; null se
  // ainda não houve estudo. Base para medir o ritmo real sobre o período ATIVO.
  function primeiraDataSessaoPlano(state, desdeISO) {
    let min = null;
    for (const s of sessoesDoPlano(state)) {
      if (desdeISO && s.data < desdeISO) continue;
      if (!min || s.data < min) min = s.data;
    }
    return min;
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
    // Âncora sempre na segunda-feira: gerado_em pode chegar como dia "qualquer"
    // (plano vindo de edital/importação), e a divergência de até 6 dias distorce
    // semanas decorridas/restantes no burndown. segundaDaSemana é idempotente
    // para planos internos (já gravados na segunda).
    const inicio = segundaDaSemana((state.plano && state.plano.gerado_em) || hoje);
    const semanasTotais = r.semanas;
    const meses = r.meses || Math.max(1, Math.round(semanasTotais / 4.345));
    const esforcoTotal = esforcoTotalHoras(state);
    const horasFeitas = horasRealizadas(state, inicio, null);
    const decorridas = Math.min(semanasTotais, Math.max(0, diffDias(inicio, hoje) / 7));
    const semanasRestantes = Math.max(0.5, semanasTotais - decorridas);
    // "Concluído" deve significar EDITAL concluído (tópicos), não só o orçamento de
    // horas estimado gasto. esforcoTotal é uma estimativa fixa: quem faz muitas
    // questões pode gastar mais horas que o previsto com matéria ainda pendente
    // (restante iria a 0 e diria "Concluído" cedo demais); e quem fecha os tópicos
    // abaixo do orçamento ficaria eternamente "quase lá". Ancora o restante nos
    // tópicos: 0 só quando tudo está concluído; senão, no MENOS o esforço pendente.
    const prog = progressoEdital(state);
    const tudoFeito = prog.total > 0 && prog.concluidos >= prog.total;
    const fracPendente = prog.total > 0 ? (prog.total - prog.concluidos) / prog.total : 0;
    let restante = tudoFeito ? 0 : Math.max(0, esforcoTotal - horasFeitas);
    if (restante <= 0 && !tudoFeito) restante = Math.max(1, Math.round(esforcoTotal * fracPendente));
    const cargaIdeal = Math.round((restante / semanasRestantes) * 10) / 10;
    const cargaPlanejada = r.h_semana || cargaIdeal;
    // Ritmo real medido sobre o período ATIVO (da 1ª sessão até hoje), não desde a
    // criação do plano: um plano gerado há semanas mas estudado só agora não deve
    // ter o ritmo diluído por semanas sem estudo (isso estourava a projeção).
    const primeiraSessao = primeiraDataSessaoPlano(state, inicio);
    const semanasAtivas = primeiraSessao
      ? Math.min(semanasTotais, Math.max(0, diffDias(primeiraSessao, hoje) / 7))
      : 0;
    const ritmoReal = primeiraSessao ? horasFeitas / Math.max(0.5, semanasAtivas) : cargaPlanejada;
    // Só projeta pela média REAL quando há amostra representativa (≥ ~2 semanas de
    // atividade com estudo registrado). Antes disso, 1–2 sessões jogariam a
    // conclusão para anos à frente; mantém a estimativa PLANEJADA (a meta se você
    // seguir o plano) — que é o que o aluno via no início.
    const projecaoReal = !!primeiraSessao && semanasAtivas >= 2 && horasFeitas >= 0.1;
    const paceProjecao = projecaoReal ? ritmoReal : cargaPlanejada;
    const semanasProjetadas = paceProjecao > 0.1 ? restante / paceProjecao : Infinity;
    const mesesProjetados = isFinite(semanasProjetadas)
      ? Math.round(((decorridas + semanasProjetadas) / 4.345) * 10) / 10 : Infinity;
    const pctConcluido = esforcoTotal > 0 ? Math.min(100, Math.round((horasFeitas / esforcoTotal) * 100)) : 0;
    // Conclusão estimada DINÂMICA (semanas a partir de hoje).
    const semanasParaConcluir = restante <= 0 ? 0 : Math.min(260, restante / Math.max(0.5, paceProjecao));
    // "Adiantado"/"Atrasado" só com amostra real representativa; antes disso o
    // plano é "no prazo" (neutro) e "parado" se já passou ~1 semana sem estudo.
    let situacao = 'no_prazo';
    if (restante <= 0) situacao = 'concluido';
    else if (!projecaoReal) situacao = (horasFeitas < 0.1 && decorridas >= 1) ? 'parado' : 'no_prazo';
    else if (!isFinite(mesesProjetados)) situacao = 'parado';
    else if (mesesProjetados > meses + 0.5) situacao = 'atrasado';
    else if (mesesProjetados < meses - 0.5) situacao = 'adiantado';
    return {
      esforcoTotal, horasFeitas: Math.round(horasFeitas * 10) / 10, restante: Math.round(restante * 10) / 10,
      semanasTotais, meses, semanasDecorridas: Math.round(decorridas * 10) / 10,
      semanasRestantes: Math.round(semanasRestantes * 10) / 10, cargaIdeal,
      cargaPlanejada: Math.round(cargaPlanejada * 10) / 10, ritmoReal: Math.round(ritmoReal * 10) / 10,
      semanasParaConcluir: Math.round(semanasParaConcluir * 10) / 10,
      mesesProjetados, pctConcluido, situacao, projecaoReal
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

  // Matérias de assunto ÚNICO: o nome da matéria já a identifica, independentemente
  // do escopo descrito. Sem isso, "Química Geral, Inorgânica e Orgânica" e
  // "Química e Fundamentos da Matéria" não casam na comparação (só compartilham o
  // token "quimica"). Não inclui áreas que se subdividem em disciplinas distintas
  // de concurso (Direito, Contabilidade, etc.).
  const ANCORAS_DISC = {
    quimica: 1, fisica: 1, biologia: 1, geografia: 1, historia: 1,
    filosofia: 1, sociologia: 1, redacao: 1, atualidades: 1, ingles: 1, espanhol: 1
  };
  function tokensDisc(nome) {
    const set = tokensSignificativos(nome, STOP_DISC);
    // Com exatamente UM anchor, colapsa para ele (variações de escopo casam).
    // Com 0 ou 2+ anchors (ex.: "Física e Química"), mantém os tokens completos.
    const anchors = Object.keys(set).filter(function (k) { return ANCORAS_DISC[k]; });
    if (anchors.length === 1) { const o = {}; o[anchors[0]] = true; return o; }
    return set;
  }
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
    // (1) Disciplinas em comum (para exibir), casadas por similaridade de nome,
    // sem reutilizar. Guarda também um PISO de reuso por disciplina: a MESMA
    // matéria redigida de formas diferentes já transfere boa parte do estudo.
    const usadasB = {};
    const disciplinasComuns = [];
    let pisoTopicos = 0, pisoHoras = 0;
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
      //  • casamento forte (mesma matéria, sim ≥ 0.8) → piso 70%;
      //  • casamento normal (sim ≥ 0.5) → piso 50%.
      const piso = melhorSim >= 0.8 ? 0.7 : 0.5;
      pisoTopicos += Math.round(Math.min(dA.topicos.length, dB.topicos.length) * piso);
      pisoHoras += Math.min(dA.horas, dB.horas) * piso;
    });

    // (2) Tópicos em comum medidos GLOBALMENTE — compara os tópicos dos DOIS
    // editais inteiros, não só dentro das disciplinas de mesmo nome. Conteúdo
    // igual em disciplinas com títulos diferentes também conta (faz muita
    // diferença). Casa cada tópico de A com o melhor tópico ainda livre de B.
    const topicosB = [];
    discsB.forEach(function (dB) { (dB.topicos || []).forEach(function (tB) { topicosB.push(tB); }); });
    const usadosTB = {};
    let paresGlobais = 0, horasGlobais = 0;
    discsA.forEach(function (dA) {
      dA.topicos.forEach(function (tA) {
        let achou = -1, simT = SIM_TOP;
        topicosB.forEach(function (tB, k) {
          if (usadosTB[k]) return;
          const s = similaridadeTokens(tA.tokens, tB.tokens);
          if (s >= simT) { simT = s; achou = k; }
        });
        if (achou >= 0) { usadosTB[achou] = true; paresGlobais++; horasGlobais += Math.min(tA.horas, topicosB[achou].horas); }
      });
    });

    // (3) Conteúdo em comum = o MAIOR entre a medição global de tópicos e o piso
    // por disciplina. Evita duplo-contar e não subestima nenhum dos dois sinais.
    let topicosComuns = Math.min(Math.min(totalA, totalB), Math.max(paresGlobais, pisoTopicos));
    let horasComuns = Math.round(Math.max(horasGlobais, pisoHoras));
    const exclusivosA = Math.max(0, totalA - topicosComuns);
    const exclusivosB = Math.max(0, totalB - topicosComuns);

    const cargaUniaoH = Math.round((horasA + horasB - horasComuns) * FATOR_ESFORCO);
    const cargaSomadaH = Math.round((horasA + horasB) * FATOR_ESFORCO);
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
  // reforço em 3d (reabre só na de 30d); >=85% na de 30d (com amostra mínima)
  // marca como dominado.
  // `qFeitas` evita "dominar" com amostra ridícula (ex.: 1 questão acertada = 100%):
  // só consagra o domínio quando há base estatística mínima de questões. Mantido
  // opcional para retrocompat — sem o argumento, exige só o critério antigo.
  const MIN_Q_DOMINIO = 5;
  // Manutenção: depois que a curva 24h→30d fecha, o tópico ainda precisa de revisão
  // periódica até a prova — senão um tópico fechado no mês 1 de um plano longo é
  // esquecido. Ao concluir a 30d (ou uma manutenção) com aproveitamento (≥70%),
  // agenda a próxima manutenção +30 dias; cada manutenção concluída agenda a
  // seguinte (recorrência sob demanda, sem disparar tudo de uma vez).
  const DIAS_MANUTENCAO = 30;
  const TIPOS_PONTA_CURVA = { '30d': true, 'manutenção': true };
  // `incidenciaPct` (opcional): adia um pouco o reforço em tópicos de baixa
  // incidência (k<1) — o reforço acontece, mas mais espaçado. base/k arredondado.
  function ajustePosRevisao(revisao, resultadoPct, qFeitas, incidenciaPct) {
    const r = { reabrir: false, subirPrioridade: false, revisaoExtraDias: null, dominar: false, manutencaoDias: null };
    if (resultadoPct == null) return r; // revisão só de leitura, sem questões — neutro
    const k = moduladorIncidencia(incidenciaPct);
    const reforcoDias = function (base) { return Math.round(base / k); }; // k=1→base; k=0,5→2×base
    if (resultadoPct < 50) { r.reabrir = true; r.subirPrioridade = true; r.revisaoExtraDias = reforcoDias(2); }
    else if (resultadoPct < 70) { r.subirPrioridade = true; r.revisaoExtraDias = reforcoDias(3); if (revisao.tipo === '30d') r.reabrir = true; }
    else {
      if (resultadoPct >= 85 && TIPOS_PONTA_CURVA[revisao.tipo] && (qFeitas == null || qFeitas >= MIN_Q_DOMINIO)) r.dominar = true;
      if (TIPOS_PONTA_CURVA[revisao.tipo]) r.manutencaoDias = DIAS_MANUTENCAO; // ≥70% na ponta da curva → mantém aquecido
    }
    return r;
  }

  // Revisão extra de reforço (curva encurtada quando o desempenho foi baixo).
  function revisaoReforco(topicoId, baseISO, dias) {
    const data = addDias(baseISO, dias);
    return { id: 'rev-' + topicoId + '-reforco-' + data, topicoId: topicoId, tipo: 'reforço', dataAgendada: data, dataConcluida: null, resultadoPct: null };
  }

  // Revisão de manutenção (após a curva fechar): mantém o tópico aquecido até a
  // prova. A data entra no id (sufixo AAAA-MM-DD) como nas demais revisões.
  function revisaoManutencao(topicoId, baseISO, dias) {
    const data = addDias(baseISO, dias);
    return { id: 'rev-' + topicoId + '-manut-' + data, topicoId: topicoId, tipo: 'manutenção', dataAgendada: data, dataConcluida: null, resultadoPct: null };
  }

  // ---------- RN13 — Revisão como item de tempo (fonte única no calendário) ----------
  // Duração estimada por tipo de revisão (min): curta no início da curva, mais
  // longa nas pontas; reforço/manutenção tratados como revisão "cheia". É o que
  // o calendário mostra e o que as revisões descontam do tempo do dia.
  const DURACAO_REVISAO_MIN = { '24h': 10, '3d': 15, '7d': 15, '14d': 20, '30d': 20, 'manutenção': 20, 'reforço': 20 };
  function duracaoRevisaoMin(tipo) { return DURACAO_REVISAO_MIN[tipo] || 15; }

  // Revisões PENDENTES (não concluídas) agendadas para um dia, com tópico válido.
  // Fonte única para Hoje, aba Revisões e calendário — todos leem daqui.
  function revisoesPendentesNoDia(state, dia) {
    return doPlanoAtivo(state, state.revisoes || []).filter(function (r) {
      return r && !r.dataConcluida && r.dataAgendada === dia && topicoPorId(state, r.topicoId);
    });
  }
  function minutosRevisaoNoDia(state, dia) {
    return revisoesPendentesNoDia(state, dia).reduce(function (n, r) { return n + duracaoRevisaoMin(r.tipo); }, 0);
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

  // Modulador da INTENSIDADE do ajuste pela incidência do tópico (0..1). O acerto
  // continua mandando na DIREÇÃO (espaçar/aproximar); a incidência só regula o
  // QUANTO. Rampa linear: incidência ≥50% → k=1 (efeito cheio); incidência 0% →
  // k=0,5 (metade do efeito). Assim, errar muito num tópico de baixa incidência
  // ainda aproxima a revisão, mas com menos agressividade — sem roubar tempo dos
  // tópicos campeões de incidência. Nunca inverte o sinal.
  const INCIDENCIA_K_PISO = 0.5;
  const INCIDENCIA_K_PLENA = 50; // a partir daqui, efeito cheio
  function moduladorIncidencia(incidenciaPct) {
    if (incidenciaPct == null) return 1; // sem dado de incidência → efeito cheio (retrocompat)
    const inc = Math.max(0, Math.min(INCIDENCIA_K_PLENA, incidenciaPct));
    return INCIDENCIA_K_PISO + (1 - INCIDENCIA_K_PISO) * (inc / INCIDENCIA_K_PLENA);
  }

  // Fator multiplicativo do espaçamento (1 = neutro), PONDERADO POR RECÊNCIA.
  // Cada revisão feita estica (acerto alto) ou encurta (acerto baixo) a cadência,
  // mas a mais recente pesa mais e as antigas desvanecem (peso geométrico 0.6^idade):
  // assim quem começou mal e MELHOROU não fica preso no piso por erros antigos, e
  // uma sequência boa recente ainda compõe a favor. Só as últimas
  // JANELA_REV_ESPACAMENTO revisões entram (o resto já desvaneceu na prática).
  // `sessoes` (opcional): as questões do dia a dia (últimas 3, fora as de revisão)
  // realimentam o timing como um multiplicador recente adicional.
  const JANELA_REV_ESPACAMENTO = 6;
  const DECAIMENTO_RECENCIA = 0.6;
  function fatorEspacamentoRevisao(revisoes, topicoId, sessoes, incidenciaPct) {
    const feitas = (revisoes || [])
      .filter(function (r) {
        return r.topicoId === topicoId && TIPOS_CICLO_REV[r.tipo] && r.dataConcluida && r.resultadoPct != null;
      })
      .sort(function (a, b) { return String(a.dataConcluida).localeCompare(String(b.dataConcluida)); })
      .slice(-JANELA_REV_ESPACAMENTO);
    let f = 1;
    const n = feitas.length;
    feitas.forEach(function (r, i) {
      const idadeRel = (n - 1) - i; // 0 = mais recente
      const peso = Math.pow(DECAIMENTO_RECENCIA, idadeRel);
      f *= Math.pow(multiplicadorEspacamento(r.resultadoPct), peso);
    });
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
    // Pondera a intensidade pela incidência: puxa o fator de volta ao neutro (1)
    // quanto menor a incidência. f_ajustado = 1 + (f - 1) * k.
    const k = moduladorIncidencia(incidenciaPct);
    f = 1 + (f - 1) * k;
    return Math.max(0.4, Math.min(2.2, Math.round(f * 100) / 100));
  }

  // Reescala as revisões do ciclo ainda PENDENTES (futuras) do tópico pelo fator
  // de espaçamento. Não mexe em revisões já feitas nem nas vencidas/de hoje.
  function reagendarRevisoesAdaptativo(revisoes, topicoId, hoje, sessoes, incidenciaPct) {
    hoje = hoje || hojeISO();
    const f = fatorEspacamentoRevisao(revisoes, topicoId, sessoes, incidenciaPct);
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

  // ---------- RN12 — Cobertura vs. prova: tópicos que NÃO devem ser alcançados ----------
  // Confronta o que falta de TEORIA com a data da prova e devolve a lista de
  // tópicos em risco (com incidência) para o aluno decidir. Dois modos:
  //  - ciclo: estima as voltas que ainda cabem até a prova. Em cada volta o ciclo
  //    cobre ~1 tópico pendente por disciplina ativa (o de MAIOR incidência primeiro),
  //    então os de MENOR incidência além do alcance ficam em risco. Só dispara na
  //    "reta final" — quando restam ≤ limiarPctVoltas (padrão 20%) das voltas.
  //  - cronograma: se há teoria agendada para semanas DEPOIS do prazo da prova,
  //    esses tópicos não serão vistos a tempo (o cronograma estende o prazo em vez
  //    de respeitar a data). Lista-os para o aluno priorizar.
  // "Pendente" = ainda precisa de teoria (status != teoria_concluida/dominado).
  function precisaTeoria(t) {
    return t && !t.orfao && t.status !== 'teoria_concluida' && t.status !== 'dominado';
  }

  function alertaCoberturaCiclo(state, hoje, prazo, dias, opcoes) {
    const ciclo = cicloAtivo(state);
    if (!ciclo || !Array.isArray(ciclo.blocos) || ciclo.blocos.length === 0) return null;
    const minSemana = opcoes && opcoes.minutosSemana > 0 ? opcoes.minutosSemana : 0;
    if (!minSemana) return null; // sem rotina não dá pra estimar voltas
    const tempoVolta = ciclo.blocos.reduce(function (s, b) { return s + (b.metaMin || 0); }, 0);
    if (tempoVolta <= 0) return null;

    const voltasRestantes = Math.max(1, Math.floor((dias / 7 * minSemana) / tempoVolta));
    const voltaAtual = ciclo.volta || 1;
    const voltasFeitas = voltaAtual - 1;
    const voltasTotais = voltasFeitas + voltasRestantes;
    const pctRestante = voltasTotais > 0 ? voltasRestantes / voltasTotais : 1;

    // Menor voltaInicio por disciplina presente no ciclo (a rampa de entrada).
    const voltaInicioPorDisc = {};
    ciclo.blocos.forEach(function (b) {
      const vi = b.voltaInicio || 1;
      if (voltaInicioPorDisc[b.disciplinaId] == null || vi < voltaInicioPorDisc[b.disciplinaId]) {
        voltaInicioPorDisc[b.disciplinaId] = vi;
      }
    });

    const topicos = [];
    (state.disciplinas || []).forEach(function (d) {
      if (!d || d.id === 'ORF') return;
      const pend = (d.topicos || []).filter(precisaTeoria);
      if (pend.length === 0) return;
      pend.sort(function (a, b) { return (b.incidencia_pct || 0) - (a.incidencia_pct || 0); });
      const vi = voltaInicioPorDisc[d.id];
      let capacidade;
      if (vi == null) {
        capacidade = 0; // disciplina sem bloco no ciclo: nada será coberto
      } else {
        const inicioRel = Math.max(0, vi - voltaAtual); // voltas até essa disc entrar
        capacidade = Math.max(0, voltasRestantes - inicioRel);
      }
      pend.slice(capacidade).forEach(function (t) {
        topicos.push({ id: t.id, nome: t.nome, disciplina: d.nome, disciplinaId: d.id, incidencia: t.incidencia_pct || 0 });
      });
    });

    if (topicos.length === 0) return null;
    const limiar = opcoes && opcoes.limiarPctVoltas > 0 ? opcoes.limiarPctVoltas : 0.2;
    if (pctRestante > limiar) return null; // só na reta final (em voltas)
    topicos.sort(function (a, b) { return (b.incidencia || 0) - (a.incidencia || 0); });
    return {
      modo: 'ciclo', voltaAtual: voltaAtual, voltasRestantes: voltasRestantes,
      voltasTotais: voltasTotais, pctRestante: Math.round(pctRestante * 100), topicos: topicos
    };
  }

  function alertaCoberturaCronograma(state, hoje, prazo) {
    const cron = cronogramaAtivo(state);
    if (!cron || cron.length === 0) return null;
    const topicos = [];
    const vistos = {};
    cron.forEach(function (sem) {
      if (!sem || !sem.inicio || sem.inicio < prazo) return; // semana dentro do prazo: ok
      (sem.blocos || []).forEach(function (b) {
        if (!b || !b.topico || vistos[b.topico]) return;
        if (b.tipo && b.tipo !== 'teoria') return; // só "ver conteúdo" conta
        const t = topicoPorId(state, b.topico);
        if (!precisaTeoria(t)) return;
        vistos[b.topico] = true;
        const d = disciplinaDoTopico(state, b.topico);
        topicos.push({ id: t.id, nome: t.nome, disciplina: d ? d.nome : '', disciplinaId: d ? d.id : null, incidencia: t.incidencia_pct || 0 });
      });
    });
    if (topicos.length === 0) return null;
    topicos.sort(function (a, b) { return (b.incidencia || 0) - (a.incidencia || 0); });
    const ultima = cron[cron.length - 1];
    const fimPlano = ultima ? addDias(ultima.inicio, 7) : prazo;
    const semanasApos = Math.max(1, Math.ceil(diffDias(prazo, fimPlano) / 7));
    return { modo: 'cronograma', prazo: prazo, semanasApos: semanasApos, topicos: topicos };
  }

  // Ponto único: decide o modo pelo plano e devolve o alerta (ou null). hoje e
  // opcoes.minutosSemana (rotina) vêm da UI.
  function alertaCobertura(state, hoje, opcoes) {
    opcoes = opcoes || {};
    hoje = hoje || hojeISO();
    const prazo = prazoProva(state);
    if (!prazo) return null; // sem data de prova não há contra o que comparar
    const dias = diffDias(hoje, prazo);
    if (dias <= 0) return null; // prova hoje ou no passado
    const modo = state.plano && state.plano.modoPlanejamento;
    return modo === 'ciclo'
      ? alertaCoberturaCiclo(state, hoje, prazo, dias, opcoes)
      : alertaCoberturaCronograma(state, hoje, prazo);
  }

  // Acrescenta blocos ao ciclo para os tópicos dados, entrando na volta atual.
  // Ignora os que já têm bloco do mesmo tópico. Devolve quantos foram adicionados.
  function adicionarTopicosAoCiclo(ciclo, itens) {
    if (!ciclo || !Array.isArray(ciclo.blocos) || !Array.isArray(itens)) return 0;
    const volta = ciclo.volta || 1;
    let add = 0;
    itens.forEach(function (it) {
      if (!it || !it.disciplinaId || !it.id) return;
      const existe = ciclo.blocos.some(function (b) { return b.topicoId === it.id && b.disciplinaId === it.disciplinaId; });
      if (existe) return;
      ciclo.blocos.push({ id: novoIdBloco(), disciplinaId: it.disciplinaId, topicoId: it.id, metaMin: 30, feitoMin: 0, voltaInicio: volta });
      add++;
    });
    return add;
  }

  // Ênfase do plano combinado: dá mais tempo a um concurso ("principal") sem
  // largar o outro. Devolve um MULTIPLICADOR do peso de uma disciplina:
  //  • disciplina compartilhada ou exclusiva do PRINCIPAL  → 1 (peso cheio);
  //  • disciplina EXCLUSIVA do secundário                  → (1-split)/split;
  //  • após a prova do secundário                          → ~0 (foco volta 100%
  //    ao principal automaticamente).
  // enfase = { principal, secundario, split (fração do principal), provaSecundario (AAAA-MM) }.
  function fatorEnfase(enfase, disc, hoje) {
    if (!enfase || !enfase.secundario || !enfase.split) return 1;
    const origem = (disc && disc.origem) || '';
    if (origem !== enfase.secundario) return 1; // só afeta exclusivas do secundário
    hoje = hoje || hojeISO();
    if (enfase.provaSecundario && hoje.slice(0, 7) > enfase.provaSecundario) return 0.12;
    const s = enfase.split;
    if (s <= 0 || s >= 1) return 1;
    return Math.round(((1 - s) / s) * 100) / 100;
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
      disciplinas: disciplinas,
      // rótulos exatos de cada origem (o mesmo texto gravado em disc.origem) +
      // janela de prova de cada um — base para configurar a ênfase no plano.
      rotulos: {
        a: rotuloA, b: rotuloB,
        provaA: (edA.janelaProva && edA.janelaProva.inicio) || '',
        provaB: (edB.janelaProva && edB.janelaProva.inicio) || ''
      }
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

  // ---------- Análise de erros do simulado (remediação focada) ----------
  // Cada disciplina de um simulado pode marcar o TIPO de erro PREDOMINANTE.
  // Agregamos PONDERADO pelo nº de erros (total - certas) da disciplina: 10 erros
  // "conceitual" pesam mais que 2 de "cálculo". Assim um único clique por
  // disciplina vira uma distribuição real de onde o aluno perde ponto — e a
  // remediação deixa de ser genérica ("revise a teoria") e passa a ser dirigida.
  const TIPOS_ERRO = ['conceitual', 'calculo', 'interpretacao', 'atencao'];
  const REMEDIACAO_ERRO = {
    conceitual: { rotulo: 'Conceitual', icone: '📖', dica: 'A base teórica está falhando: volte à teoria do tópico ANTES de fazer mais questões.' },
    calculo: { rotulo: 'Cálculo/aplicação', icone: '🧮', dica: 'Você entende, mas erra na execução: faça baterias de exercícios do mesmo tipo até automatizar.' },
    interpretacao: { rotulo: 'Interpretação', icone: '🔍', dica: 'O conteúdo você sabe, mas lê errado o enunciado: treine questões comentadas e grife o que se pede.' },
    atencao: { rotulo: 'Desatenção', icone: '🎯', dica: 'Erros bobos custam aprovação: releia a questão e confira a marcação antes de seguir.' }
  };
  function remediacaoErro(tipo) { return REMEDIACAO_ERRO[tipo] || null; }

  // Ritmo do simulado cronometrado: minutos por questão. Velocidade é fator de
  // aprovação tão decisivo quanto o acerto — a prova é contra o relógio.
  function ritmoSimulado(sim) {
    if (!sim || !sim.duracaoMin) return null;
    let totalQ = 0;
    (sim.acertos || []).forEach(function (a) { totalQ += (a.total || 0); });
    if (totalQ <= 0) return null;
    return Math.round((sim.duracaoMin / totalQ) * 10) / 10;
  }

  function analisarErrosSimulados(simulados) {
    const porTipo = { conceitual: 0, calculo: 0, interpretacao: 0, atencao: 0 };
    let totalClassificado = 0, totalErros = 0;
    (simulados || []).forEach(function (sim) {
      (sim.acertos || []).forEach(function (a) {
        const erros = Math.max(0, (a.total || 0) - (a.certas || 0));
        totalErros += erros;
        if (erros > 0 && a.tipoErro && porTipo[a.tipoErro] != null) {
          porTipo[a.tipoErro] += erros;
          totalClassificado += erros;
        }
      });
    });
    let dominante = null, max = 0;
    TIPOS_ERRO.forEach(function (t) { if (porTipo[t] > max) { max = porTipo[t]; dominante = t; } });
    return { porTipo: porTipo, totalClassificado: totalClassificado, totalErros: totalErros, dominante: dominante };
  }

  // Série histórica de simulados (por data, antigo→recente) com a % geral de cada
  // um e a tendência (variação do último vs. o anterior e vs. o primeiro). Base do
  // gráfico de evolução na aba Simulados.
  function tendenciaSimulados(simulados) {
    const pontos = (simulados || [])
      .map(function (s) {
        let c = 0, q = 0;
        (s.acertos || []).forEach(function (a) { c += a.certas || 0; q += a.total || 0; });
        return { data: s.data, pct: q > 0 ? Math.round((c / q) * 100) : null, certas: c, total: q, tipo: s.tipo };
      })
      .filter(function (p) { return p.pct !== null; })
      .sort(function (a, b) { return String(a.data).localeCompare(String(b.data)); });
    if (!pontos.length) return { pontos: pontos, ultimo: null, deltaAnterior: null, deltaPrimeiro: null, tendencia: 'sem_dados' };
    const ultimo = pontos[pontos.length - 1].pct;
    const deltaAnterior = pontos.length >= 2 ? ultimo - pontos[pontos.length - 2].pct : null;
    const deltaPrimeiro = pontos.length >= 2 ? ultimo - pontos[0].pct : null;
    let tendencia = 'estavel';
    if (deltaAnterior != null) tendencia = deltaAnterior > 2 ? 'subindo' : deltaAnterior < -2 ? 'caindo' : 'estavel';
    return { pontos: pontos, ultimo: ultimo, deltaAnterior: deltaAnterior, deltaPrimeiro: deltaPrimeiro, tendencia: tendencia };
  }

  // Ranking ACIONÁVEL: "o que mais cai × seu pior desempenho". Ordena os tópicos
  // pela urgência (incidência × déficit de desempenho × proximidade da prova),
  // trazendo também os de alta incidência ainda SEM questões (diagnóstico). Itens
  // já dominados saem do foco. Retorna os n primeiros, prontos para virar ação.
  function rankingAcionavel(state, n, hoje) {
    hoje = hoje || hojeISO();
    const metaPct = (state.plano && state.plano.meta && state.plano.meta.corte_pct) || 70;
    const sessoes = sessoesDoPlano(state);
    const itens = [];
    (state.disciplinas || []).forEach(function (d) {
      if (d.id === 'ORF') return;
      (d.topicos || []).forEach(function (t) {
        if (t.orfao || t.status === 'dominado') return;
        const dt = desempenhoTopico(sessoes, t.id);
        itens.push({
          topicoId: t.id, nome: t.nome, disciplinaId: d.id,
          incidencia: t.incidencia_pct || 0, pct: dt.pct, feitas: dt.feitas,
          urgencia: urgenciaTopico(state, t.id, hoje, metaPct),
          reaberto: !!t.reaberto, status: t.status
        });
      });
    });
    itens.sort(function (a, b) {
      return b.urgencia - a.urgencia || b.incidencia - a.incidencia || (a.pct || 0) - (b.pct || 0);
    });
    return itens.slice(0, n || 8);
  }

  window.Dominio = {
    hojeISO, addDias, diffDias, formatarDataBR, formatarMesBR, segundaDaSemana, formatarMin,
    topicoPorId, disciplinaDoTopico, disciplinaPorId, doPlanoAtivo, sessoesDoPlano,
    agendarRevisoes, desempenhoTopico, desempenhoDisciplina, desempenhoGeral,
    revisaoReabreTopico, sugereRevisarTeoria, fatorEspacamentoRevisao,
    reagendarRevisoesAdaptativo, moduladorIncidencia, estadoAdaptacaoRevisao, prazoProva, prontidaoProva, retaFinalInfo, streak, semaforo,
    cronogramaAtivo, semanaCorrente, blocoFeito, filaHoje, urgenciaTopico, sugerirReestudo,
    cicloAtivo, blocoCicloAtual, blocosAtivosCiclo, sugerirCiclo, avancarCiclo,
    alertaCobertura, adicionarTopicosAoCiclo,
    validarPlano, mesclarPlano, metaSemanal, progressoEdital, progressoDisciplina,
    heatmapDias, serieSemanal, pioresTopicos,
    totalHorasTeoria, esforcoTotalHoras, horasRealizadas, burndownEdital, checkinSemanal,
    conciliarPlanos, mesclarEditalNoPlano, ajustePosRevisao, revisaoReforco, revisaoManutencao, combinarEditais, fatorEnfase, conquistas,
    duracaoRevisaoMin, revisoesPendentesNoDia, minutosRevisaoNoDia,
    TIPOS_ERRO, remediacaoErro, analisarErrosSimulados, ritmoSimulado,
    tendenciaSimulados, rankingAcionavel,
    revisarFlashcard, flashcardDevido
  };
})();
