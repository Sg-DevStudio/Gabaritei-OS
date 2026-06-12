/* ============================================================
   charts.js — os 2 gráficos do MVP (Chart.js via CDN)
   1. Evolução semanal (horas + questões)
   2. Desempenho por disciplina × meta de corte
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
            backgroundColor: '#2148C0', borderRadius: 4, yAxisID: 'y'
          },
          {
            type: 'line', label: '% de acerto', data: serie.map(function (s) { return s.pct; }),
            borderColor: '#1E7D46', backgroundColor: '#1E7D46', spanGaps: true, tension: 0.2, yAxisID: 'y2'
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

  // Gráfico 2 — desempenho por disciplina × meta de corte
  function desempenhoVsMeta(canvas, dados, metaPct) {
    if (!disponivel()) return false;
    destruir(canvas.id);
    const cores = dados.map(function (d) {
      if (d.pct === null) return '#E3E4E1';
      if (d.pct >= metaPct) return '#1E7D46';
      if (d.pct >= metaPct - 10) return '#9A6B00';
      return '#C03B2B';
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
          annotation: undefined,
          tooltip: {
            callbacks: {
              afterLabel: function () { return 'Meta de corte: ' + metaPct + '%'; }
            }
          }
        }),
        scales: {
          y: {
            beginAtZero: true, max: 100,
            ticks: { font: { family: FONTE_MONO }, callback: function (v) { return v + '%'; } },
            grid: { color: function (ctx) { return ctx.tick.value === metaPct ? '#C03B2B' : '#E3E4E1'; } }
          },
          x: { ticks: { font: { family: FONTE_MONO } } }
        }
      }
    });
    return true;
  }

  window.Graficos = { evolucaoSemanal, desempenhoVsMeta, disponivel };
})();
