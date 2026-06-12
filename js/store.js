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
      config: { ultimoBackup: null, metaQuestoesSemana: 100, tema: 'claro', criadoEm: agora, atualizadoEm: agora }
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

  function migrar(state) {
    // ponto único para migrações de schema
    if (!state.config) state.config = { ultimoBackup: null, metaQuestoesSemana: 100 };
    if (!state.config.criadoEm) state.config.criadoEm = agoraISO();
    if (!state.config.atualizadoEm) state.config.atualizadoEm = state.config.criadoEm;
    if (state.config.metaQuestoesSemana === undefined) state.config.metaQuestoesSemana = 100;
    if (state.config.ultimoBackup === undefined) state.config.ultimoBackup = null;
    if (!state.config.tema) state.config.tema = 'claro';
    if (!state.sessoes) state.sessoes = [];
    if (!state.revisoes) state.revisoes = [];
    if (!state.simulados) state.simulados = [];
    if (!state.agenda) state.agenda = [];

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
    ativarPlano, removerPlano, exportarBackup, importarBackup, diasDesdeBackup, temDados
  };
})();
