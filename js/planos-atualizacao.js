/* Atualização explícita de referências. IDs locais e histórico de estudo não são recriados. */
(function () {
  'use strict';
  const clone = v => JSON.parse(JSON.stringify(v));
  const normal = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const unica = (lista, teste) => { const ls = lista.filter(teste); return ls.length === 1 ? ls[0] : null; };
  const versao = e => {
    if (e.atualizadoEm) return String(e.atualizadoEm);
    const texto = JSON.stringify([e.titulo, e.banca, e.disciplinas]);
    let hash = 2166136261;
    for (let i = 0; i < texto.length; i++) hash = Math.imul(hash ^ texto.charCodeAt(i), 16777619);
    return 'conteudo:' + texto.length + ':' + (hash >>> 0).toString(16);
  };
  function origem(entry, catalogo) {
    const pl = entry && entry.plano;
    if (!pl || pl.combinado) return null;
    if (pl.origemEditalId) return (catalogo || []).find(e => e.id === pl.origemEditalId) || null;
    return unica(catalogo || [], e => [e.titulo].concat(e.titulosAnteriores || []).some(t => normal(t) === normal(pl.concurso)));
  }
  function foto(e) {
    if (!e) return '';
    if (e.foto || e.fotoUrl || e.imagem) return e.foto || e.fotoUrl || e.imagem;
    const n = normal(e.orgao + ' ' + e.titulo);
    if (/trt4/.test(n)) return 'assets/carreiras/logo-trt4.jpg';
    if (/tjsp/.test(n)) return 'assets/carreiras/logo-tjsp.jpg';
    if (/trf2/.test(n)) return 'assets/carreiras/capa-trf2-tjaa.svg';
    if (/trf3/.test(n)) return 'assets/carreiras/logo-trf3.png';
    if (/ufrj/.test(n)) return 'assets/carreiras/logo-ufrj.png';
    if (/ifrj/.test(n)) return 'assets/carreiras/capa-ifrj-assistente.svg';
    if (/inss/.test(n)) return 'assets/carreiras/capa-inss-tecnico.png';
    return '';
  }
  function repararMetadados(state, catalogo) {
    let mudou = false;
    (state.planos || []).forEach(entry => {
      const e = origem(entry, catalogo), pl = entry.plano;
      if (!e) return;
      if (!pl.origemEditalId) { pl.origemEditalId = e.id; mudou = true; }
      if (!pl.foto && foto(e)) { pl.foto = foto(e); mudou = true; }
      ['orgao', 'cargo', 'estado'].forEach(k => { if (!pl[k] && e[k]) { pl[k] = e[k]; mudou = true; } });
    });
    return mudou;
  }
  function preparar(entry, edital) {
    const antigas = entry.disciplinas || [], pl = entry.plano || {};
    const mesmaOrigem = !!pl.origemEditalId && pl.origemEditalId === edital.id;
    const mapaAnterior = pl.mapaEdital && pl.mapaEdital.origemId === edital.id ? pl.mapaEdital : {};
    const mapaDiscs = new Map(), mapaTops = new Map();
    const usados = new Set(antigas.flatMap(d => [d.id].concat((d.topicos || []).map(t => t.id))));
    const discsVistas = new Set(), topsVistos = new Set();
    function livre(id) {
      let valor = id, i = 1;
      while (usados.has(valor)) valor = id + '-novo-' + i++;
      usados.add(valor); return valor;
    }
    const disciplinas = (edital.disciplinas || []).map(de => {
      const idMapeado = (mapaAnterior.disciplinas || {})[de.id];
      const dp = (idMapeado && antigas.find(d => d.id === idMapeado)) ||
        (mesmaOrigem && antigas.find(d => d.id === de.id)) ||
        unica(antigas, d => !discsVistas.has(d.id) && normal(d.nome) === normal(de.nome));
      const idDisc = dp ? dp.id : livre(de.id);
      if (dp) discsVistas.add(dp.id);
      mapaDiscs.set(de.id, idDisc);
      const topicos = (de.topicos || []).map(te => {
        const anteriores = dp && dp.topicos || [];
        const idTopMap = (mapaAnterior.topicos || {})[de.id + ':' + te.id];
        const tp = (idTopMap && anteriores.find(t => t.id === idTopMap)) ||
          (mesmaOrigem && anteriores.find(t => t.id === te.id)) ||
          unica(anteriores, t => !topsVistos.has(t.id) && normal(t.nome) === normal(te.nome));
        const id = tp ? tp.id : livre(te.id);
        if (tp) topsVistos.add(tp.id);
        mapaTops.set(de.id + ':' + te.id, id);
        return Object.assign({}, clone(te), { id, status: 'pendente', reaberto: false, orfao: false });
      });
      return Object.assign({}, clone(de), { id: idDisc, topicos });
    });
    return { disciplinas, mapa: { origemId: edital.id, disciplinas: Object.fromEntries(mapaDiscs), topicos: Object.fromEntries(mapaTops) } };
  }
  function analisar(entry, edital) {
    const base = preparar(entry, edital), anteriores = entry.disciplinas || [];
    const incluidos = [], retirados = [], alterados = [], disciplinasNovas = [], disciplinasAjustadas = [];
    const novosIds = new Set(); let mantidos = 0;
    base.disciplinas.forEach(d => {
      const antiga = anteriores.find(x => x.id === d.id);
      if (!antiga) disciplinasNovas.push(d.nome);
      else {
        const campos = ['nome', 'peso', 'carater'].filter(k => String(antiga[k] == null ? '' : antiga[k]) !== String(d[k] == null ? '' : d[k]));
        if (campos.length) disciplinasAjustadas.push({ nome: d.nome, campos: campos.map(k => ({ campo: k, antes: antiga[k] == null ? '' : antiga[k], depois: d[k] == null ? '' : d[k] })) });
      }
      d.topicos.forEach(t => {
        novosIds.add(t.id);
        const velho = antiga && (antiga.topicos || []).find(x => x.id === t.id);
        if (!velho || velho.removidoDoEdital) incluidos.push({ id: t.id, nome: t.nome, disciplina: d.nome });
        else {
          mantidos++;
          if (['nome', 'horas_estimadas', 'incidencia_pct', 'prioridade', 'semana_sugerida', 'descricao', 'observacoes'].some(k => String(velho[k] == null ? '' : velho[k]) !== String(t[k] == null ? '' : t[k])))
            alterados.push({ id: t.id, antes: velho.nome, depois: t.nome, disciplina: d.nome });
        }
      });
    });
    anteriores.forEach(d => (d.topicos || []).forEach(t => {
      if (!t.removidoDoEdital && !novosIds.has(t.id)) retirados.push({ id: t.id, nome: t.nome, disciplina: d.nome });
    }));
    const pl = entry.plano || {}, metadados = [];
    for (const [campo, anterior, novo] of [['Nome', pl.concurso, edital.titulo], ['Banca', pl.banca, edital.banca], ['Imagem', pl.foto, foto(edital)]]) {
      if (novo && novo !== anterior) metadados.push({ campo, antes: anterior || '', depois: novo });
    }
    const jp = edital.janelaProva || {}, atual = pl.radar && pl.radar.janela_prova || [];
    if (jp.inicio && jp.inicio !== atual[0]) metadados.push({ campo: 'Data de referência', antes: atual.join(' a '), depois: jp.inicio + (jp.fim && jp.fim !== jp.inicio ? ' a ' + jp.fim : '') });
    return { editalId: edital.id, versao: versao(edital), disciplinas: base.disciplinas, mapa: base.mapa,
      incluidos, retirados, alterados, disciplinasNovas, disciplinasAjustadas, mantidos, metadados,
      mudou: !!(incluidos.length || retirados.length || alterados.length || disciplinasAjustadas.length || metadados.length) };
  }
  function pendente(entry, catalogo) {
    const e = origem(entry, catalogo);
    if (!e || !Array.isArray(e.disciplinas) || !e.disciplinas.length) return null;
    const atual = entry.plano.origemEditalVersao || '', nova = versao(e);
    if (atual === nova) return null;
    // Uma cópia offline/antiga do catálogo não deve oferecer downgrade.
    if (Number.isFinite(Date.parse(atual)) && Number.isFinite(Date.parse(nova)) && Date.parse(nova) < Date.parse(atual)) return null;
    return analisar(entry, e).mudou ? e : null;
  }
  function aplicar(entry, edital, D, hoje) {
    if (!edital || !(edital.disciplinas || []).length) throw new Error('O edital precisa ter conteúdo programático.');
    // null significa incidência não aferida no catálogo. O validador de importação
    // exige um número; valide uma cópia neutra sem fabricar incidência no plano.
    const validaveis = clone(edital.disciplinas).map(d => Object.assign(d, { topicos: (d.topicos || []).map(t => Object.assign(t, { incidencia_pct: t.incidencia_pct == null ? 0 : t.incidencia_pct })) }));
    const v = D.validarPlano({ versao: 1, plano: { concurso: edital.titulo, meta: { corte_pct: 70 } }, disciplinas: validaveis });
    if (!v.ok) throw new Error('Referência inválida: ' + v.erros[0]);
    const r = analisar(entry, edital), pl = entry.plano;
    const anteriorId = pl.origemEditalId || null, anteriorVersao = pl.origemEditalVersao || '';
    entry.disciplinas = D.mesclarEditalNoPlano(entry.disciplinas, r.disciplinas).disciplinas;
    const atuais = new Set(r.disciplinas.flatMap(d => d.topicos.map(t => t.id)));
    entry.disciplinas.forEach(d => (d.topicos || []).forEach(t => { if (atuais.has(t.id)) t.orfao = false; }));
    pl.concurso = edital.titulo; pl.origemEditalId = edital.id; pl.origemEditalVersao = r.versao;
    pl.mapaEdital = r.mapa;
    for (const k of ['banca', 'orgao', 'cargo', 'estado']) if (edital[k]) pl[k] = edital[k];
    if (foto(edital)) pl.foto = foto(edital);
    const jp = edital.janelaProva || {};
    const futuro = jp.inicio && /^\d{4}-\d{2}(?:-\d{2})?$/.test(jp.inicio) && jp.inicio >= String(hoje || D.hojeISO()).slice(0, jp.inicio.length);
    if (futuro) pl.radar = Object.assign({}, pl.radar, { janela_prova: [jp.inicio, jp.fim || jp.inicio] });
    const log = { em: new Date().toISOString(), origemAnteriorId: anteriorId, versaoAnterior: anteriorVersao,
      origemId: edital.id, versao: r.versao, incluidos: r.incluidos, retirados: r.retirados,
      alterados: r.alterados, disciplinasAjustadas: r.disciplinasAjustadas, metadados: r.metadados };
    pl.atualizacoesEdital = (pl.atualizacoesEdital || []).concat([log]);
    return r;
  }
  window.PlanosAtualizacao = { origem, foto, repararMetadados, analisar, pendente, aplicar, versao };
})();
