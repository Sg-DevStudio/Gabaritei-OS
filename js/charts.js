/* ============================================================
   charts.js — gráficos da aba Estatísticas (Chart.js via CDN)
   Degrada com aviso se o CDN não carregou (offline).
   ============================================================ */
(function () {
  'use strict';

  const instancias = {};

  function disponivel() { return typeof window.Chart !== 'undefined'; }
  function graficoMobile() {
    return !!(window.matchMedia && window.matchMedia('(max-width: 560px)').matches);
  }
  function curto(txt, max) {
    txt = String(txt || '');
    return txt.length > max ? txt.slice(0, max - 1) + '…' : txt;
  }

  function destruir(id) {
    if (instancias[id]) { instancias[id].destroy(); delete instancias[id]; }
  }

  const FONTE_MONO = "'IBM Plex Mono', monospace";
  const FONTE_UI = "'IBM Plex Sans', sans-serif";
  const AZUL = '#2454D6';
  const AZUL_FORTE = '#183A9E';
  const AZUL_CLARO = '#7FA0EE';
  const LAVANDA = '#6F7FD8';
  const VERDE_OS = '#2E7D68';
  const VERDE_MEDIO = '#6FAE8F';
  const VERMELHO = '#B83A2E';
  const NEUTRO = '#E3E7F0';

  // Cores que acompanham o tema (claro/escuro): lidas dos tokens CSS no momento
  // em que o gráfico é criado, para os rótulos/grades não sumirem no modo escuro.
  function corVar(nome, fallback) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }
  function paleta() {
    return {
      texto: corVar('--tinta', '#17181C'),
      sub: corVar('--grafite', '#6B7180'),
      grade: corVar('--linha', '#E4E8F2'),
      card: corVar('--papel-card', '#FFFFFF')
    };
  }

  function basePlugins(P) {
    return {
      legend: { labels: { color: P.texto, font: { family: FONTE_UI, size: 12 } } }
    };
  }

  // Gráfico 1 — evolução semanal: barras de horas + linha de % de acerto
  function evolucaoSemanal(canvas, serie) {
    if (!disponivel()) return false;
    destruir(canvas.id);
    const P = paleta();
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
        plugins: basePlugins(P),
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'horas', color: P.sub }, ticks: { color: P.sub, font: { family: FONTE_MONO } }, grid: { color: P.grade } },
          y2: { beginAtZero: true, max: 100, position: 'right', grid: { drawOnChartArea: false }, ticks: { color: P.sub, font: { family: FONTE_MONO }, callback: function (v) { return v + '%'; } } },
          x: { ticks: { color: P.sub, font: { family: FONTE_MONO } }, grid: { color: P.grade } }
        }
      }
    });
    return true;
  }

  function desempenhoGeralSemanal(canvas, serie) {
    if (!disponivel()) return false;
    destruir(canvas.id);
    const P = paleta();
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
        plugins: Object.assign(basePlugins(P), {
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
            ticks: { color: P.sub, font: { family: FONTE_MONO }, callback: function (v) { return v + '%'; } },
            grid: { color: P.grade }
          },
          x: { ticks: { color: P.sub, font: { family: FONTE_MONO } }, grid: { color: P.grade } }
        }
      }
    });
    return true;
  }

  function desempenhoPorDisciplina(canvas, dados) {
    if (!disponivel()) return false;
    destruir(canvas.id);
    const P = paleta();
    const cores = dados.map(function (d) {
      if (d.cor && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(d.cor)) return d.cor;
      if (d.pct === null) return NEUTRO;
      if (d.pct >= 70) return VERDE_OS;
      if (d.pct >= 50) return VERDE_MEDIO;
      return VERMELHO;
    });
    if (!graficoMobile()) {
      instancias[canvas.id] = new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: dados.map(function (d) { return d.sigla; }),
          datasets: [{
            label: '% de acerto acumulado',
            data: dados.map(function (d) { return d.pct === null ? 0 : d.pct; }),
            backgroundColor: cores,
            borderColor: P.card,
            borderWidth: 3,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '56%',
          plugins: Object.assign(basePlugins(P), {
            legend: {
              position: 'right',
              labels: { color: P.texto, font: { family: FONTE_UI, size: 12 }, boxWidth: 12, padding: 12 }
            },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  const pct = dados[ctx.dataIndex].pct;
                  return pct === null ? 'Sem questões registradas' : ctx.label + ': ' + pct + '% de acerto';
                }
              }
            }
          })
        }
      });
      return true;
    }
    instancias[canvas.id] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: dados.map(function (d) { return d.sigla; }),
        datasets: [
          {
            type: 'bar',
            label: '% de acerto acumulado',
            data: dados.map(function (d) { return d.pct; }),
            backgroundColor: cores,
            borderRadius: 5,
            barPercentage: 0.58,
            categoryPercentage: 0.7
          },
          {
            type: 'line',
            label: 'Tendência',
            data: dados.map(function (d) { return d.pct; }),
            borderColor: AZUL,
            pointBackgroundColor: cores,
            pointBorderColor: P.card,
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 6,
            borderWidth: 2,
            tension: 0.22,
            fill: false
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: Object.assign(basePlugins(P), {
          legend: { display: false },
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
            ticks: { color: P.sub, font: { family: FONTE_MONO }, callback: function (v) { return v + '%'; } },
            grid: { color: P.grade }
          },
          x: { ticks: { color: P.sub, font: { family: FONTE_MONO }, maxRotation: 0 }, grid: { color: P.grade } }
        }
      }
    });
    return true;
  }

  function disciplinasHoras(canvas, dados) {
    if (!disponivel()) return false;
    destruir(canvas.id);
    const P = paleta();
    const mobile = graficoMobile();
    instancias[canvas.id] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: dados.map(function (d) { return curto(d.nome, mobile ? 16 : 18); }),
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
        indexAxis: 'x',
        responsive: true,
        maintainAspectRatio: false,
        plugins: Object.assign(basePlugins(P), {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (ctx) { return 'Horas de estudo: ' + dados[ctx.dataIndex].rotulo; }
            }
          }
        }),
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: P.sub, font: { family: FONTE_MONO }, callback: function (v) { return v + 'h'; } },
            grid: { color: P.grade }
          },
          x: {
            ticks: { color: P.texto, font: { family: FONTE_UI, size: mobile ? 10 : 11 }, maxRotation: 55, minRotation: 35 },
            grid: { color: P.grade }
          }
        }
      }
    });
    return true;
  }

  function topicosDesempenho(canvas, dados) {
    if (!disponivel()) return false;
    destruir(canvas.id);
    const P = paleta();
    const mobile = graficoMobile();
    const cores = dados.map(function (d) {
      if (d.pct >= 70) return VERDE_OS;
      if (d.pct >= 50) return VERDE_MEDIO;
      return VERMELHO;
    });
    instancias[canvas.id] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: dados.map(function (d) { return mobile ? curto(d.topico, 16) : d.topicoCurto; }),
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
        indexAxis: mobile ? 'x' : 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: Object.assign(basePlugins(P), {
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
        scales: mobile ? {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: { color: P.sub, font: { family: FONTE_MONO }, callback: function (v) { return v + '%'; } },
            grid: { color: P.grade }
          },
          x: {
            ticks: { color: P.texto, font: { family: FONTE_UI, size: 10 }, maxRotation: 55, minRotation: 35 },
            grid: { display: false }
          }
        } : {
          x: {
            beginAtZero: true,
            max: 100,
            ticks: { color: P.sub, font: { family: FONTE_MONO }, callback: function (v) { return v + '%'; } },
            grid: { color: P.grade }
          },
          y: {
            ticks: { color: P.texto, font: { family: FONTE_UI, size: 12 } },
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
