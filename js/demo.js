/* Dados simulados: nunca aplicado aos planos reais do usuário. */
(function () {
  'use strict';
  function atualizarDatas(json, hoje, D) {
    const datas = (json.sessoes || []).map(s => s.data).filter(Boolean).sort();
    if (!datas.length) return json;
    const origem = datas[datas.length - 1].slice(0, 10);
    const destino = D.addDias(D.segundaDaSemana(hoje), -1);
    const diferenca = Math.round((Date.parse(destino + 'T12:00:00Z') - Date.parse(origem + 'T12:00:00Z')) / 86400000);
    function mover(v) {
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return D.addDias(v, diferenca);
      if (Array.isArray(v)) return v.map(mover);
      if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, mover(x)]));
      return v;
    }
    return mover(json);
  }
  function registrarSemana(state, hoje, D) {
    const inicio = D.segundaDaSemana(hoje);
    (state.agenda || []).filter(b => b.planoId === state.planoAtivoId && b.data >= inicio && b.data < hoje && b.feito && b.topicoId).forEach(b => {
      const id = 'demo-agenda-' + b.id;
      if ((state.sessoes || []).some(s => s.id === id)) return;
      const min = Math.max(0, Number(b.feitoMin || b.duracaoMin) || 0);
      const tipo = b.obs === 'questoes' || b.obs === 'revisao' ? b.obs : 'teoria';
      // No exemplo, teoria e revisão também incluem prática ao final do bloco.
      const feitas = min > 0 ? Math.max(1, Math.floor(min / (tipo === 'questoes' ? 2 : 5))) : 0;
      state.sessoes.push({ id: id, planoId: state.planoAtivoId, data: b.data, topicoId: b.topicoId, tipo: tipo, duracaoMin: min, qFeitas: feitas, qCertas: Math.floor(feitas * .8), teoriaOk: tipo === 'teoria' });
    });
  }
  window.DemoEstudos = { atualizarDatas: atualizarDatas, registrarSemana: registrarSemana };
})();
