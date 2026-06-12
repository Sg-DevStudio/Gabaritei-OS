/* ============================================================
   store.js — camada única de persistência (localStorage)
   Trocar este arquivo é o que a migração futura p/ Supabase exige.
   ============================================================ */
(function () {
  'use strict';

  const CHAVE = 'estudos.v1';
  const VERSAO_SCHEMA = 1;

  function estadoVazio() {
    return {
      versao: VERSAO_SCHEMA,
      plano: null,
      disciplinas: [],
      cronogramas: { sustentavel: [], hardcore: [] },
      links: [],
      sessoes: [],   // {id, data, topicoId, tipo, duracaoMin, qFeitas, qCertas, obs}
      revisoes: [],  // {id, topicoId, tipo, dataAgendada, dataConcluida, resultadoPct}
      simulados: [], // {id, data, tipo, acertos:[{disciplinaId, certas, total}]}
      config: { ultimoBackup: null, metaQuestoesSemana: 100 }
    };
  }

  function migrar(state) {
    // ponto único para migrações de schema futuras
    if (!state.versao) state.versao = VERSAO_SCHEMA;
    if (!state.config) state.config = { ultimoBackup: null, metaQuestoesSemana: 100 };
    if (!state.cronogramas) state.cronogramas = { sustentavel: [], hardcore: [] };
    if (!state.sessoes) state.sessoes = [];
    if (!state.revisoes) state.revisoes = [];
    if (!state.simulados) state.simulados = [];
    if (!state.disciplinas) state.disciplinas = [];
    return state;
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

  function salvar(state) {
    localStorage.setItem(CHAVE, JSON.stringify(state));
  }

  function novoId(prefixo) {
    return prefixo + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  // ---------- Backup (mitigação do risco: localStorage apagado) ----------
  function exportarBackup(state) {
    state.config.ultimoBackup = window.Dominio.hojeISO();
    salvar(state);
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
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
    if (!dados || dados.versao !== VERSAO_SCHEMA || !Array.isArray(dados.sessoes)) {
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
    return state.plano !== null || state.sessoes.length > 0;
  }

  window.Store = { carregar, salvar, estadoVazio, novoId, exportarBackup, importarBackup, diasDesdeBackup, temDados };
})();
