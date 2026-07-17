'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadDomain } = require('./helpers/load-domain');
const { loadStore } = require('./helpers/load-store');
const D = loadDomain();
const S = loadStore();

function topico(id, horas, status) {
  return {
    id: id, nome: id, horas_estimadas: horas, incidencia_pct: 40,
    prioridade: 2, status: status || 'pendente', orfao: false
  };
}

function estadoBase() {
  return {
    planoAtivoId: 'p1',
    plano: {
      gerado_em: '2026-07-06',
      ritmoAtivo: 'sustentavel',
      ritmos: { sustentavel: { semanas: 8, h_semana: 10 } },
      radar: { janela_prova: ['2026-08', '2026-08'] }
    },
    cronogramas: {
      sustentavel: Array.from({ length: 8 }, function (_, i) {
        return { semana: i + 1, inicio: D.addDias('2026-07-06', i * 7), blocos: [] };
      })
    },
    disciplinas: [
      { id: 'A', nome: 'Origem', peso: 2, dificuldade: 'dificil', planejamentoStatus: 'active', topicos: [topico('A-1', 10)] },
      { id: 'B', nome: 'Destino B', peso: 2, planejamentoStatus: 'active', topicos: [topico('B-1', 4)] },
      { id: 'C', nome: 'Destino C', peso: 1, planejamentoStatus: 'active', topicos: [topico('C-1', 2)] }
    ],
    agenda: [
      { id: 'feito', planoId: 'p1', data: '2026-07-13', disciplinaId: 'A', topicoId: 'A-1', duracaoMin: 60, feito: true, feitoMin: 60 },
      { id: 'b1', planoId: 'p1', data: '2026-07-14', disciplinaId: 'A', topicoId: 'A-1', duracaoMin: 60, feito: false, feitoMin: 0, ordem: 0 },
      { id: 'b2', planoId: 'p1', data: '2026-07-15', disciplinaId: 'A', topicoId: 'A-1', duracaoMin: 60, feito: false, feitoMin: 0, ordem: 0 },
      { id: 'b3', planoId: 'p1', data: '2026-07-20', disciplinaId: 'A', topicoId: 'A-1', duracaoMin: 60, feito: false, feitoMin: 0, ordem: 0 },
      { id: 'b4', planoId: 'p1', data: '2026-07-21', disciplinaId: 'A', topicoId: 'A-1', duracaoMin: 60, feito: false, feitoMin: 0, ordem: 0 },
      { id: 'bB', planoId: 'p1', data: '2026-07-14', disciplinaId: 'B', topicoId: 'B-1', duracaoMin: 90, feito: false, feitoMin: 0, ordem: 1 }
    ],
    sessoes: [{ id: 's1', planoId: 'p1', data: '2026-07-13', topicoId: 'A-1', tipo: 'teoria', duracaoMin: 60 }],
    revisoes: [
      { id: 'r-feita', planoId: 'p1', topicoId: 'A-1', tipo: '24h', dataAgendada: '2026-07-14', dataConcluida: '2026-07-14' },
      { id: 'r-futura', planoId: 'p1', topicoId: 'A-1', tipo: '7d', dataAgendada: '2026-07-20', dataConcluida: null }
    ],
    simulados: [],
    config: {}
  };
}

function previa(st, extra) {
  return D.simularAjusteAgenda(st, Object.assign({
    blocoId: 'b1', tipo: 'substituir', alcance: 'bloco',
    hoje: '2026-07-14', minutosSemana: 600
  }, extra || {}));
}

function aplicar(st, p) {
  let seq = 0;
  return D.aplicarAjusteAgenda(st, p, {
    operacaoId: 'op-teste',
    aplicadaEm: '2026-07-14',
    criarId: function () { seq++; return 'novo-' + seq; }
  });
}

function totaisDia(agenda) {
  return agenda.reduce(function (mapa, b) {
    mapa[b.data] = (mapa[b.data] || 0) + (b.duracaoMin || 0);
    return mapa;
  }, {});
}

test('1. substituição de um único bloco altera somente o selecionado', () => {
  const st = estadoBase();
  const p = previa(st, { disciplinasDestino: ['B'] });
  assert.equal(p.blocosAfetados, 1);
  aplicar(st, p);
  assert.equal(st.agenda.find((b) => b.id === 'b1').disciplinaId, 'B');
  assert.equal(st.agenda.find((b) => b.id === 'b2').disciplinaId, 'A');
});

test('2. substituição do restante da semana não alcança a semana seguinte', () => {
  const st = estadoBase();
  const p = previa(st, { alcance: 'semana', disciplinasDestino: ['B'] });
  assert.deepEqual(p.mudancas.map((m) => m.blocoId), ['b1', 'b2']);
  aplicar(st, p);
  assert.equal(st.agenda.find((b) => b.id === 'b3').disciplinaId, 'A');
});

test('3. pausa de todos os blocos futuros marca a disciplina como paused', () => {
  const st = estadoBase();
  const p = previa(st, { tipo: 'pausar', alcance: 'futuro' });
  assert.equal(p.blocosAfetados, 4);
  assert.equal(p.marcarPausada, true);
  aplicar(st, p);
  assert.equal(D.statusDisciplinaPlanejamento(st.disciplinas[0]), 'paused');
  assert.equal(st.disciplinas[0].pausaAlcance, 'futuro');
});

test('4. blocos concluídos e iniciados são preservados', () => {
  const st = estadoBase();
  st.agenda.push({ id: 'parcial', planoId: 'p1', data: '2026-07-16', disciplinaId: 'A', duracaoMin: 60, feitoMin: 10 });
  const p = previa(st, { tipo: 'pausar', alcance: 'futuro' });
  assert.equal(p.mudancas.some((m) => m.blocoId === 'feito'), false);
  assert.equal(p.mudancas.some((m) => m.blocoId === 'parcial'), false);
  aplicar(st, p);
  assert.equal(st.agenda.find((b) => b.id === 'feito').feitoMin, 60);
  assert.equal(st.agenda.find((b) => b.id === 'parcial').feitoMin, 10);
});

test('5. conteúdo pendente da disciplina pausada permanece intacto', () => {
  const st = estadoBase();
  const antes = JSON.stringify(st.disciplinas[0].topicos);
  aplicar(st, previa(st, { tipo: 'pausar', alcance: 'futuro' }));
  assert.equal(JSON.stringify(st.disciplinas[0].topicos), antes);
  assert.equal(D.minutosPendentesDisciplina(st.disciplinas[0]), 600);
});

test('6. redistribuição não ultrapassa a disponibilidade já ocupada no dia', () => {
  const st = estadoBase();
  const antes = totaisDia(st.agenda);
  aplicar(st, previa(st, { alcance: 'futuro' }));
  const depois = totaisDia(st.agenda);
  Object.keys(depois).forEach((dia) => assert.ok(depois[dia] <= antes[dia]));
});

test('7. horas substitutas não viram progresso ou sessão da disciplina pausada', () => {
  const st = estadoBase();
  const sessoesAntes = JSON.stringify(st.sessoes);
  aplicar(st, previa(st, { tipo: 'pausar', alcance: 'futuro' }));
  assert.equal(JSON.stringify(st.sessoes), sessoesAntes);
  assert.equal(st.disciplinas[0].topicos[0].status, 'pendente');
});

test('8. revisões válidas derivadas de estudo são preservadas', () => {
  const st = estadoBase();
  const revisoesAntes = JSON.stringify(st.revisoes);
  aplicar(st, previa(st, { tipo: 'pausar', alcance: 'futuro' }));
  assert.equal(JSON.stringify(st.revisoes), revisoesAntes);
  assert.ok(st.revisoes.some((r) => r.id === 'r-feita'));
});

test('9. pausa não cria revisão para conteúdo não estudado', () => {
  const st = estadoBase();
  const quantidade = st.revisoes.length;
  aplicar(st, previa(st, { tipo: 'pausar', alcance: 'futuro' }));
  assert.equal(st.revisoes.length, quantidade);
  assert.equal(st.revisoes.some((r) => r.id.includes('B-1')), false);
});

test('10. reativação torna a disciplina elegível e reinsere sua carga pendente', () => {
  const st = estadoBase();
  aplicar(st, previa(st, { tipo: 'pausar', alcance: 'futuro' }));
  assert.equal(D.sugerirCiclo(st, { minutosSemana: 600 }).some((b) => b.disciplinaId === 'A'), false);
  assert.equal(D.reativarDisciplina(st, 'A', { data: '2026-07-21', modo: 'automatic' }), true);
  assert.equal(D.statusDisciplinaPlanejamento(st.disciplinas[0]), 'active');
  assert.equal(D.sugerirCiclo(st, { minutosSemana: 600 }).some((b) => b.disciplinaId === 'A'), true);
  assert.equal(D.minutosPendentesDisciplina(st.disciplinas[0]), 600);
});

test('11. prévia alerta quando a pausa deixa o edital inviável', () => {
  const st = estadoBase();
  const p = previa(st, { tipo: 'pausar', alcance: 'futuro', minutosSemana: 600 });
  assert.equal(p.viabilidade.viavel, false);
  assert.ok(p.viabilidade.deficitMin >= 600);
  assert.ok(p.avisos.some((a) => a.includes('Faltarão aproximadamente')));
});

test('12. prévia/cancelamento não persistem; confirmação aplica a mudança', () => {
  const st = estadoBase();
  const antes = JSON.stringify(st);
  const p = previa(st, { disciplinasDestino: ['B'] });
  assert.equal(JSON.stringify(st), antes, 'simular equivale a abrir/cancelar a prévia');
  aplicar(st, p);
  assert.notEqual(JSON.stringify(st), antes, 'confirmar aplica');
});

test('13. aplicação não duplica ids de blocos ao dividir o tempo', () => {
  const st = estadoBase();
  st.disciplinas.find((d) => d.id === 'B').topicos[0].horas_estimadas = 0.5;
  const p = previa(st, { alcance: 'semana', disciplinasDestino: ['B', 'C'] });
  aplicar(st, p);
  const ids = st.agenda.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('14. sem receptor, pausa deixa tempo livre e substituição não confirma', () => {
  const st = estadoBase();
  st.disciplinas.slice(1).forEach((d) => {
    d.topicos.forEach((t) => { t.status = 'teoria_concluida'; });
    d.planejamentoStatus = 'completed';
  });
  const pausa = previa(st, { tipo: 'pausar' });
  assert.equal(pausa.totalRedistribuidoMin, 0);
  assert.equal(pausa.naoAlocadoMin, 60);
  assert.equal(pausa.podeAplicar, true);
  const troca = previa(st, { tipo: 'substituir' });
  assert.equal(troca.podeAplicar, false);
  assert.ok(troca.avisos.some((a) => a.includes('Nenhuma disciplina ativa')));
});

test('15. pausa e auditoria persistem após salvar e recarregar o estado', () => {
  const st = S.estadoVazio();
  st.planoAtivoId = 'p1';
  st.planos = [{
    id: 'p1',
    plano: {},
    disciplinas: [{
      id: 'A',
      nome: 'Origem',
      planejamentoStatus: 'paused',
      pausaAlcance: 'futuro',
      pausaModo: 'semanas',
      pausaSemanas: 2,
      pausaReativarEm: '2026-07-28',
      topicos: [topico('A-1', 10)]
    }],
    cronogramas: {}
  }];
  st.config.historicoAjustesAgenda = [{ id: 'op-1', tipo: 'pausar', disciplinaId: 'A' }];
  st.config.ultimoAjusteAgenda = { id: 'op-1', tipo: 'pausar' };

  S.salvar(st);
  const recarregado = S.carregar();
  const disciplina = recarregado.planos[0].disciplinas[0];

  assert.equal(disciplina.planejamentoStatus, 'paused');
  assert.equal(disciplina.pausaAlcance, 'futuro');
  assert.equal(disciplina.pausaModo, 'semanas');
  assert.equal(disciplina.pausaSemanas, 2);
  assert.equal(disciplina.pausaReativarEm, '2026-07-28');
  assert.equal(recarregado.config.historicoAjustesAgenda[0].id, 'op-1');
  assert.equal(recarregado.config.ultimoAjusteAgenda.id, 'op-1');
});

test('16. pausa por semanas calcula e persiste a data de retorno', () => {
  const st = estadoBase();
  const p = previa(st, {
    tipo: 'pausar',
    alcance: 'futuro',
    pausaModo: 'semanas',
    pausaSemanas: 2
  });

  assert.equal(p.pausaReativarEm, '2026-07-28');
  aplicar(st, p);
  assert.equal(st.disciplinas[0].pausaModo, 'semanas');
  assert.equal(st.disciplinas[0].pausaSemanas, 2);
  assert.equal(st.disciplinas[0].pausaReativarEm, '2026-07-28');
  assert.equal(D.pausaDisciplinaExpirada(st.disciplinas[0], '2026-07-27'), false);
  assert.equal(D.pausaDisciplinaExpirada(st.disciplinas[0], '2026-07-28'), true);
});

test('17. pausa até uma data exige retorno posterior ao início', () => {
  const st = estadoBase();
  const valida = previa(st, {
    tipo: 'pausar',
    alcance: 'futuro',
    pausaModo: 'data',
    pausaAte: '2026-08-03'
  });
  const invalida = previa(st, {
    tipo: 'pausar',
    alcance: 'futuro',
    pausaModo: 'data',
    pausaAte: '2026-07-14'
  });

  assert.equal(valida.ok, true);
  assert.equal(valida.pausaReativarEm, '2026-08-03');
  assert.equal(invalida.ok, false);
  assert.ok(invalida.erro.includes('posterior'));
});

test('18. pausa manual continua sem vencimento automático', () => {
  const st = estadoBase();
  const p = previa(st, { tipo: 'pausar', alcance: 'futuro', pausaModo: 'manual' });
  aplicar(st, p);

  assert.equal(st.disciplinas[0].pausaModo, 'manual');
  assert.equal(st.disciplinas[0].pausaReativarEm, undefined);
  assert.equal(D.pausaDisciplinaExpirada(st.disciplinas[0], '2030-01-01'), false);
});

test('19. reativação remove os metadados do prazo encerrado', () => {
  const st = estadoBase();
  aplicar(st, previa(st, {
    tipo: 'pausar',
    alcance: 'futuro',
    pausaModo: 'semanas',
    pausaSemanas: 1
  }));

  D.reativarDisciplina(st, 'A', { data: '2026-07-21', modo: 'prazo' });

  assert.equal(st.disciplinas[0].planejamentoStatus, 'active');
  assert.equal(st.disciplinas[0].pausaModo, undefined);
  assert.equal(st.disciplinas[0].pausaSemanas, undefined);
  assert.equal(st.disciplinas[0].pausaReativarEm, undefined);
  assert.equal(st.disciplinas[0].retomadaModo, 'prazo');
});

test('20. viabilidade considera que uma pausa temporária devolve a disciplina ao plano', () => {
  const st = estadoBase();
  const manual = D.viabilidadeEdital(st, '2026-07-14', {
    dataFinal: '2026-08-31',
    minutosSemana: 600,
    disciplinasPausadas: ['A']
  });
  const temporaria = D.viabilidadeEdital(st, '2026-07-14', {
    dataFinal: '2026-08-31',
    minutosSemana: 600,
    disciplinasPausadas: ['A'],
    pausasTemporarias: { A: '2026-07-28' }
  });

  assert.equal(manual.deficitMin, 600);
  assert.equal(temporaria.deficitMin, 0);
  assert.equal(temporaria.conteudoPausadoTemporarioMin, 600);
});
