/* ============================================================
   charts.js — gráficos da aba Estatísticas (Chart.js via CDN)
   Degrada com aviso se o CDN não carregou (offline).
   ============================================================ */
(function () {
  'use strict';

  const instancias = {};

  function disponivel() { return typeof window.Chart !== 'undefined'; }

  function destruir(id) {
    if (instancias[id]) { instancias[id].destroy(); delete instancias[id]; }
  }

  const FONTE_MONO = "'IBM Plex Mono', monospace";
  const AZUL = '#2454D6';
  const AZUL_FORTE = '#183A9E';
  const AZUL_CLARO = '#7FA0EE';
  const LAVANDA = '#6F7FD8';
  const VERDE_OS = '#2E7D68';
  const VERDE_MEDIO = '#6FAE8F';
  const VERMELHO = '#B83A2E';
  const NEUTRO = '#E3E7F0';

  function basePlugins() {
    return {
      legend: { labels: { font: { family: "'IBM Plex Sans', sans-serif", size: 12 } } }
    };
  }

  // Gráfico 1 — evolução semanal: barras de horas + linha de % de acerto
  function evolucaoSemanal(canvas, serie) {
    if (!disponivel()) return false;
    destruir(canvas.id);
    const rotulos = serie.map(function (s) {
      const [a, m, d] = s.inicio.split('-');
      return d + '/' + m;
    });
    instancias[canvas.id] = new Chart(canvas, {
      data: {
        labels: rotulos,
        datasets: [
          {
            type: 'bar', label: 'Horas estudadas', data: serie.map(function (s) { return s.horas; }),
            backgroundColor: AZUL, borderRadius: 4, yAxisID: 'y'
          },
          {
            type: 'line', label: '% de acerto', data: serie.map(function (s) { return s.pct; }),
            borderColor: LAVANDA, backgroundColor: LAVANDA, spanGaps: true, tension: 0.2, yAxisID: 'y2'
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: basePlugins(),
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'horas' }, ticks: { font: { family: FONTE_MONO } } },
          y2: { beginAtZero: true, max: 100, position: 'right', grid: { drawOnChartArea: false }, ticks: { font: { family: FONTE_MONO }, callback: function (v) { return v + '%'; } } },
          x: { ticks: { font: { family: FONTE_MONO } } }
        }
      }
    });
    return true;
  }

  function desempenhoGeralSemanal(canvas, serie) {
    if (!disponivel()) return false;
    destruir(canvas.id);
    const rotulos = serie.map(function (s) {
      const [a, m, d] = s.inicio.split('-');
      return d + '/' + m;
    });
    instancias[canvas.id] = new Chart(canvas, {
      type: 'line',
      data: {
        labels: rotulos,
        datasets: [{
          label: '% de acerto geral',
          data: serie.map(function (s) { return s.pct; }),
          borderColor: AZUL_FORTE,
          backgroundColor: 'rgba(36, 84, 214, 0.12)',
          fill: true,
          spanGaps: true,
          tension: 0.25,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: Object.assign(basePlugins(), {
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const item = serie[ctx.dataIndex];
                return item.pct === null ? 'Sem questões na semana' : item.pct + '% de acerto · ' + item.qFeitas + ' questões';
              }
            }
          }
        }),
        scales: {
          y: {
            beginAtZero: true, max: 100,
            ticks: { font: { family: FONTE_MONO }, callback: function (v) { return v + '%'; } },
            grid: { color: '#E3E4E1' }
          },
          x: { ticks: { font: { family: FONTE_MONO } } }
        }
      }
    });
    return true;
  }

  function desempenhoPorDisciplina(canvas, dados) {
    if (!disponivel()) return false;
    destruir(canvas.id);
    const cores = dados.map(function (d) {
      if (d.pct === null) return NEUTRO;
      if (d.pct >= 70) return VERDE_OS;
      if (d.pct >= 50) return VERDE_MEDIO;
      return VERMELHO;
    });
    instancias[canvas.id] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: dados.map(function (d) { return d.sigla; }),
        datasets: [{
          label: '% de acerto acumulado',
          data: dados.map(function (d) { return d.pct; }),
          backgroundColor: cores, borderRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: Object.assign(basePlugins(), {
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const pct = dados[ctx.dataIndex].pct;
                return pct === null ? 'Sem questões registradas' : pct + '% de acerto acumulado';
              }
            }
          }
        }),
        scales: {
          y: {
            beginAtZero: true, max: 100,
            ticks: { font: { family: FONTE_MONO }, callback: function (v) { return v + '%'; } },
            grid: { color: '#E3E4E1' }
          },
          x: { ticks: { font: { family: FONTE_MONO } } }
        }
      }
    });
    return true;
  }

  function disciplinasHoras(canvas, dados) {
    if (!disponivel()) return false;
    destruir(canvas.id);
    const labelsPlugin = {
      id: 'labelsHoras',
      afterDatasetsDraw: function (chart) {
        const ctx = chart.ctx;
        const dataset = chart.data.datasets[0];
        const meta = chart.getDatasetMeta(0);
        ctx.save();
        ctx.font = '600 12px "IBM Plex Sans", sans-serif';
        ctx.textBaseline = 'middle';
        meta.data.forEach(function (bar, i) {
          const valor = dataset.data[i];
          if (!valor) return;
          const texto = dados[i].rotulo;
          const x = bar.x - 10;
          const dentro = bar.width > 76;
          ctx.fillStyle = dentro ? '#FFFFFF' : '#17181C';
          ctx.textAlign = dentro ? 'right' : 'left';
          ctx.fillText(texto, dentro ? x : bar.x + 8, bar.y);
        });
        ctx.restore();
      }
    };
    instancias[canvas.id] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: dados.map(function (d) { return d.nome; }),
        datasets: [{
          label: 'Horas de estudo',
          data: dados.map(function (d) { return Math.round((d.minutos / 60) * 100) / 100; }),
          backgroundColor: AZUL_CLARO,
          borderRadius: 0,
          barPercentage: 0.72,
          categoryPercentage: 0.82
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: Object.assign(basePlugins(), {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) { return 'Horas de estudo: ' + dados[ctx.dataIndex].rotulo; }
            }
          }
        }),
        scales: {
          x: {
            beginAtZero: true,
            position: 'top',
            ticks: { font: { family: FONTE_MONO }, callback: function (v) { return v + 'h'; } },
            grid: { color: '#DFE2DD' }
          },
          y: {
            ticks: { color: '#17181C', font: { family: "'IBM Plex Sans', sans-serif", size: 12 } },
            grid: { color: '#ECEEE8' }
          }
        }
      },
      plugins: [labelsPlugin]
    });
    return true;
  }

  function topicosDesempenho(canvas, dados) {
    if (!disponivel()) return false;
    destruir(canvas.id);
    const cores = dados.map(function (d) {
      if (d.pct >= 70) return VERDE_OS;
      if (d.pct >= 50) return VERDE_MEDIO;
      return VERMELHO;
    });
    instancias[canvas.id] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: dados.map(function (d) { return d.topicoCurto; }),
        datasets: [{
          label: 'Desempenho',
          data: dados.map(function (d) { return d.pct; }),
          backgroundColor: cores,
          borderRadius: 4,
          barPercentage: 0.72,
          categoryPercentage: 0.82
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: Object.assign(basePlugins(), {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function (items) {
                const item = dados[items[0].dataIndex];
                return item.disciplina + ' · ' + item.topico;
              },
              label: function (ctx) {
                const item = dados[ctx.dataIndex];
                return item.qFeitas + ' questões · ' + item.pct + '% de acerto';
              }
            }
          }
        }),
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: { font: { family: FONTE_MONO }, callback: function (v) { return v + '%'; } },
            grid: { color: '#DFE2DD' }
          },
          y: {
            ticks: { color: '#17181C', font: { family: "'IBM Plex Sans', sans-serif", size: 12 } },
            grid: { display: false }
          }
        }
      }
    });
    return true;
  }

  window.Graficos = {
    evolucaoSemanal, desempenhoGeralSemanal, desempenhoPorDisciplina,
    desempenhoVsMeta: desempenhoPorDisciplina,
    disciplinasHoras, topicosDesempenho, disponivel
  };
})();
