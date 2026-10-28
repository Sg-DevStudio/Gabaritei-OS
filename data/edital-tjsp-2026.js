/* Fonte oficial: edital TJSP 02/2026, Anexo VIII. */
(function(){
"use strict";
const base = {
  "area": "Judiciária",
  "salario": "R$ 6.782,54",
  "beneficios": "Auxílios para alimentação, saúde e transporte",
  "nivel": "medio",
  "cortes": {
    "ampla": null,
    "negros": null,
    "pcd": null
  },
  "orgao": "Tribunal de Justiça do Estado de São Paulo - TJSP",
  "emAlta": false,
  "id": "edt-mqifhb2v-yh9ym",
  "criadoEm": "2026-06-17",
  "notaCorte": "",
  "vagas": "Cadastro de reserva — 2ª a 10ª RAJ",
  "disciplinas": [
    {
      "dificuldade": "media",
      "topicos": [
        {
          "nome": "Análise, compreensão e interpretação de textos",
          "semana_sugerida": "1",
          "incidencia_pct": "24",
          "id": "POR-01",
          "horas_estimadas": "9",
          "prioridade": "1"
        },
        {
          "nome": "Informacoes literais, inferencias e ponto de vista do autor",
          "semana_sugerida": "2",
          "incidencia_pct": "12",
          "id": "POR-02",
          "horas_estimadas": "5",
          "prioridade": "1"
        },
        {
          "prioridade": "1",
          "id": "POR-03",
          "horas_estimadas": "6",
          "nome": "Estruturacao textual, relações entre ideias e coesao",
          "incidencia_pct": "12",
          "semana_sugerida": "3"
        },
        {
          "prioridade": "2",
          "nome": "Significacao contextual, sinonimos, antonimos e sentido figurado",
          "semana_sugerida": "4",
          "incidencia_pct": "10",
          "horas_estimadas": "4",
          "id": "POR-04"
        },
        {
          "id": "POR-05",
          "horas_estimadas": "3",
          "semana_sugerida": "5",
          "incidencia_pct": "5",
          "nome": "Substantivo, adjetivo, artigo e numeral",
          "prioridade": "2"
        },
        {
          "prioridade": "2",
          "semana_sugerida": "5",
          "incidencia_pct": "7",
          "nome": "Pronome e colocacao pronominal",
          "horas_estimadas": "4",
          "id": "POR-06"
        },
        {
          "horas_estimadas": "4",
          "id": "POR-07",
          "nome": "Verbo e adverbio",
          "incidencia_pct": "8",
          "semana_sugerida": "6",
          "prioridade": "2"
        },
        {
          "horas_estimadas": "2",
          "id": "POR-08",
          "semana_sugerida": "6",
          "incidencia_pct": "4",
          "nome": "Preposicao e conjuncao",
          "prioridade": "2"
        },
        {
          "prioridade": "1",
          "horas_estimadas": "5",
          "id": "POR-09",
          "incidencia_pct": "6",
          "semana_sugerida": "7",
          "nome": "Concordância verbal e nominal"
        },
        {
          "prioridade": "1",
          "horas_estimadas": "5",
          "id": "POR-10",
          "nome": "Regência verbal e nominal",
          "incidencia_pct": "5",
          "semana_sugerida": "8"
        },
        {
          "horas_estimadas": "3",
          "id": "POR-11",
          "nome": "Crase",
          "semana_sugerida": "9",
          "incidencia_pct": "3",
          "prioridade": "2"
        },
        {
          "prioridade": "2",
          "incidencia_pct": "4",
          "semana_sugerida": "10",
          "nome": "Pontuação",
          "id": "POR-12",
          "horas_estimadas": "4"
        }
      ],
      "peso": "4",
      "id": "POR",
      "nome": "Língua Portuguesa",
      "nota_minima_pct": null,
      "base_teorica": "pdf",
      "carater": "",
      "cor": "#2563eb"
    },
    {
      "dificuldade": "media",
      "topicos": [
        {
          "prioridade": "1",
          "horas_estimadas": "7",
          "id": "DPE-01",
          "semana_sugerida": "1",
          "incidencia_pct": "24",
          "nome": "Falsidade documental: arts. 293 a 305 do Código Penal"
        },
        {
          "nome": "Falsa identidade e fraude em certames: arts. 307, 308 e 311-A do CP",
          "incidencia_pct": "10",
          "semana_sugerida": "2",
          "horas_estimadas": "4",
          "id": "DPE-02",
          "prioridade": "2"
        },
        {
          "prioridade": "1",
          "nome": "Crimes de funcionário público: arts. 312 a 317 e 319 a 327 do CP",
          "incidencia_pct": "26",
          "semana_sugerida": "3",
          "horas_estimadas": "8",
          "id": "DPE-03"
        },
        {
          "prioridade": "1",
          "nome": "Crimes de particular contra a Administração: arts. 328 a 333 do CP",
          "semana_sugerida": "4",
          "incidencia_pct": "18",
          "id": "DPE-04",
          "horas_estimadas": "6"
        },
        {
          "incidencia_pct": "18",
          "semana_sugerida": "5",
          "nome": "Crimes contra a Administração da Justiça: arts. 339 a 347 do CP",
          "id": "DPE-05",
          "horas_estimadas": "7",
          "prioridade": "1"
        },
        {
          "incidencia_pct": "4",
          "semana_sugerida": "6",
          "nome": "Demais crimes do edital: arts. 336, 337, 357 e 359 do CP",
          "horas_estimadas": "3",
          "id": "DPE-06",
          "prioridade": "3"
        }
      ],
      "peso": "3",
      "id": "DPE",
      "nome": "Direito Penal",
      "nota_minima_pct": null,
      "base_teorica": "pdf",
      "carater": "",
      "cor": "#7c3aed"
    },
    {
      "dificuldade": "media",
      "topicos": [
        {
          "id": "DPP-01",
          "horas_estimadas": "6",
          "incidencia_pct": "16",
          "semana_sugerida": "1",
          "nome": "Juiz, MP, acusado, defensor e auxiliares: arts. 251 a 258, 261 a 267 e 274 do CPP",
          "prioridade": "1"
        },
        {
          "id": "DPP-02",
          "horas_estimadas": "7",
          "nome": "Citações e intimações: arts. 351 a 372 do CPP",
          "incidencia_pct": "18",
          "semana_sugerida": "2",
          "prioridade": "1"
        },
        {
          "id": "DPP-03",
          "horas_estimadas": "9",
          "semana_sugerida": "3",
          "incidencia_pct": "22",
          "nome": "Procedimento comum: arts. 394 a 497 do CPP",
          "prioridade": "1"
        },
        {
          "horas_estimadas": "5",
          "id": "DPP-04",
          "nome": "Procedimento sumário e restauração de autos: arts. 531 a 538 e 541 a 548 do CPP",
          "incidencia_pct": "10",
          "semana_sugerida": "4",
          "prioridade": "2"
        },
        {
          "semana_sugerida": "5",
          "incidencia_pct": "20",
          "nome": "Recursos e habeas corpus: arts. 574 a 667 do CPP",
          "horas_estimadas": "8",
          "id": "DPP-05",
          "prioridade": "1"
        },
        {
          "semana_sugerida": "6",
          "incidencia_pct": "14",
          "nome": "Juizados Especiais Criminais: arts. 60 a 83, 88 e 89 da Lei 9.099/1995",
          "id": "DPP-06",
          "horas_estimadas": "6",
          "prioridade": "1"
        }
      ],
      "peso": "3",
      "id": "DPP",
      "nome": "Direito Processual Penal",
      "nota_minima_pct": null,
      "base_teorica": "pdf",
      "carater": "",
      "cor": "#9333ea"
    },
    {
      "nota_minima_pct": null,
      "nome": "Direito Processual Civil",
      "topicos": [
        {
          "nome": "Impedimento, suspeição e atos processuais: arts. 144 a 155 e 188 a 211 do CPC",
          "semana_sugerida": "1",
          "incidencia_pct": "12",
          "id": "DPC-01",
          "horas_estimadas": "6",
          "prioridade": "1"
        },
        {
          "nome": "Comunicação dos atos: arts. 212 a 275 do CPC",
          "incidencia_pct": "18",
          "semana_sugerida": "2",
          "horas_estimadas": "8",
          "id": "DPC-02",
          "prioridade": "1"
        },
        {
          "prioridade": "1",
          "id": "DPC-03",
          "horas_estimadas": "8",
          "nome": "Tutela provisória: arts. 294 a 311 do CPC",
          "incidencia_pct": "15",
          "semana_sugerida": "3"
        },
        {
          "nome": "Procedimento comum: arts. 318 a 484 do CPC",
          "semana_sugerida": "4",
          "incidencia_pct": "22",
          "horas_estimadas": "10",
          "id": "DPC-04",
          "prioridade": "1"
        },
        {
          "prioridade": "2",
          "nome": "Sentença, coisa julgada e cumprimento: arts. 485 a 538 do CPC",
          "incidencia_pct": "13",
          "semana_sugerida": "5",
          "id": "DPC-05",
          "horas_estimadas": "7"
        },
        {
          "prioridade": "1",
          "horas_estimadas": "8",
          "id": "DPC-06",
          "incidencia_pct": "14",
          "semana_sugerida": "6",
          "nome": "Recursos civeis: arts. 994 a 1026 do CPC"
        },
        {
          "prioridade": "2",
          "semana_sugerida": "7",
          "incidencia_pct": "6",
          "nome": "Juizados Cíveis: arts. 3 a 19 da Lei 9.099/1995 e Lei 12.153/2009",
          "id": "DPC-07",
          "horas_estimadas": "5"
        }
      ],
      "dificuldade": "media",
      "peso": "4",
      "id": "DPC",
      "cor": "#0f766e",
      "base_teorica": "pdf",
      "carater": ""
    },
    {
      "nome": "Direito Constitucional",
      "nota_minima_pct": null,
      "dificuldade": "media",
      "topicos": [
        {
          "nome": "Direitos e deveres individuais e coletivos",
          "incidencia_pct": "28",
          "semana_sugerida": "1",
          "horas_estimadas": "7",
          "id": "CON-01",
          "prioridade": "1"
        },
        {
          "prioridade": "2",
          "id": "CON-02",
          "horas_estimadas": "4",
          "nome": "Direitos sociais",
          "incidencia_pct": "12",
          "semana_sugerida": "2"
        },
        {
          "prioridade": "2",
          "nome": "Nacionalidade",
          "incidencia_pct": "8",
          "semana_sugerida": "3",
          "id": "CON-03",
          "horas_estimadas": "3"
        },
        {
          "incidencia_pct": "24",
          "semana_sugerida": "4",
          "nome": "Administração pública na Constituição",
          "horas_estimadas": "7",
          "id": "CON-04",
          "prioridade": "1"
        },
        {
          "prioridade": "1",
          "horas_estimadas": "6",
          "id": "CON-05",
          "nome": "Servidores públicos",
          "semana_sugerida": "5",
          "incidencia_pct": "18"
        },
        {
          "prioridade": "2",
          "semana_sugerida": "6",
          "incidencia_pct": "10",
          "nome": "Poder Judiciário: artigo 92 da Constituição",
          "id": "CON-06",
          "horas_estimadas": "3"
        }
      ],
      "peso": "2",
      "id": "CON",
      "cor": "#1d4ed8",
      "base_teorica": "pdf",
      "carater": ""
    },
    {
      "cor": "#2e7d68",
      "carater": "",
      "base_teorica": "pdf",
      "nota_minima_pct": null,
      "nome": "Direito Administrativo",
      "peso": "3",
      "id": "DAD",
      "topicos": [
        {
          "horas_estimadas": "7",
          "id": "DAD-01",
          "nome": "Estatuto SP: disposições e provimento (arts. 1 a 86 da Lei 10.261/1968)",
          "incidencia_pct": "18",
          "semana_sugerida": "1",
          "prioridade": "1"
        },
        {
          "nome": "Estatuto SP: exercício e vencimentos (arts. 171 a 175)",
          "incidencia_pct": "20",
          "semana_sugerida": "2",
          "id": "DAD-02",
          "horas_estimadas": "8",
          "prioridade": "1"
        },
        {
          "semana_sugerida": "3",
          "incidencia_pct": "20",
          "nome": "Estatuto SP: deveres, proibições, responsabilidades e penalidades (arts. 239 a 263)",
          "id": "DAD-03",
          "horas_estimadas": "8",
          "prioridade": "1"
        },
        {
          "nome": "Estatuto SP: procedimentos disciplinares (arts. 264 a 323)",
          "semana_sugerida": "4",
          "incidencia_pct": "16",
          "id": "DAD-04",
          "horas_estimadas": "7",
          "prioridade": "1"
        },
        {
          "prioridade": "1",
          "nome": "Improbidade administrativa: Lei 8.429/1992",
          "incidencia_pct": "18",
          "semana_sugerida": "5",
          "horas_estimadas": "7",
          "id": "DAD-05"
        },
        {
          "prioridade": "2",
          "horas_estimadas": "4",
          "id": "DAD-06",
          "nome": "Revisão integrada: arts. 1 a 86, 171 a 175 e 239 a 323 do Estatuto SP e Lei 8.429/1992",
          "incidencia_pct": "8",
          "semana_sugerida": "6"
        }
      ],
      "dificuldade": "media"
    },
    {
      "cor": "#0e7490",
      "carater": "",
      "base_teorica": "pdf",
      "nota_minima_pct": null,
      "nome": "Legislação Interna TJSP",
      "id": "LIN",
      "peso": "4",
      "topicos": [
        {
          "prioridade": "1",
          "id": "LIN-01",
          "horas_estimadas": "6",
          "incidencia_pct": "12",
          "semana_sugerida": "1",
          "nome": "Normas CGJ, Tomo I: Capítulo II, Seção I, subseções I e II"
        },
        {
          "incidencia_pct": "18",
          "semana_sugerida": "2",
          "nome": "Normas CGJ, Tomo I: Capítulo III, seções I, II, V, VI e VII",
          "horas_estimadas": "8",
          "id": "LIN-02",
          "prioridade": "1"
        },
        {
          "id": "LIN-03",
          "horas_estimadas": "7",
          "nome": "Normas CGJ, Tomo I: Capítulo III, seção VIII, subseções I, II e III",
          "semana_sugerida": "3",
          "incidencia_pct": "14",
          "prioridade": "1"
        },
        {
          "id": "LIN-04",
          "horas_estimadas": "9",
          "nome": "Normas CGJ, Tomo I: Capítulo III, seções IX a XIX",
          "semana_sugerida": "4",
          "incidencia_pct": "18",
          "prioridade": "1"
        },
        {
          "prioridade": "1",
          "nome": "Normas CGJ, Tomo I: Capítulo XI, seções I a VII",
          "semana_sugerida": "5",
          "incidencia_pct": "12",
          "horas_estimadas": "7",
          "id": "LIN-05"
        },
        {
          "nome": "Resolução TJSP 850/2021: teletrabalho",
          "incidencia_pct": "8",
          "semana_sugerida": "6",
          "horas_estimadas": "4",
          "id": "LIN-06",
          "prioridade": "2"
        },
        {
          "prioridade": "1",
          "semana_sugerida": "7",
          "incidencia_pct": "10",
          "nome": "Resolução TJSP 963/2025: governanca e eproc",
          "horas_estimadas": "5",
          "id": "LIN-07"
        },
        {
          "nome": "LC 1.111/2010 e Regimento Interno do TJSP",
          "semana_sugerida": "8",
          "incidencia_pct": "8",
          "id": "LIN-08",
          "horas_estimadas": "5",
          "prioridade": "2"
        }
      ],
      "dificuldade": "media"
    },
    {
      "peso": "1",
      "id": "ATU",
      "topicos": [
        {
          "incidencia_pct": "22",
          "semana_sugerida": "1",
          "nome": "Fatos políticos e institucionais a partir do 1º semestre de 2026",
          "horas_estimadas": "4",
          "id": "ATU-01",
          "prioridade": "2"
        },
        {
          "id": "ATU-02",
          "horas_estimadas": "4",
          "incidencia_pct": "18",
          "semana_sugerida": "2",
          "nome": "Fatos econômicos nacionais e internacionais a partir de 2026",
          "prioridade": "2"
        },
        {
          "id": "ATU-03",
          "horas_estimadas": "4",
          "nome": "Fatos sociais e culturais nacionais e internacionais a partir de 2026",
          "incidencia_pct": "20",
          "semana_sugerida": "3",
          "prioridade": "2"
        },
        {
          "horas_estimadas": "5",
          "id": "ATU-04",
          "nome": "Estatuto da Pessoa com Deficiência: arts. 1 a 13",
          "semana_sugerida": "4",
          "incidencia_pct": "20",
          "prioridade": "1"
        },
        {
          "nome": "Estatuto da Pessoa com Deficiência: arts. 34 a 38",
          "incidencia_pct": "20",
          "semana_sugerida": "5",
          "id": "ATU-05",
          "horas_estimadas": "4",
          "prioridade": "1"
        }
      ],
      "dificuldade": "media",
      "nota_minima_pct": null,
      "nome": "Atualidades",
      "carater": "",
      "base_teorica": "pdf",
      "cor": "#c2410c"
    },
    {
      "cor": "#b45309",
      "base_teorica": "pdf",
      "carater": "",
      "nome": "Matemática",
      "nota_minima_pct": null,
      "dificuldade": "media",
      "topicos": [
        {
          "incidencia_pct": "12",
          "semana_sugerida": "1",
          "nome": "Operações com números reais, MMC e MDC",
          "id": "MAT-01",
          "horas_estimadas": "4",
          "prioridade": "2"
        },
        {
          "prioridade": "1",
          "semana_sugerida": "2",
          "incidencia_pct": "22",
          "nome": "Razao, proporcao, porcentagem e regra de tres",
          "id": "MAT-02",
          "horas_estimadas": "6"
        },
        {
          "prioridade": "2",
          "incidencia_pct": "10",
          "semana_sugerida": "3",
          "nome": "Média aritmética simples e ponderada",
          "id": "MAT-03",
          "horas_estimadas": "3"
        },
        {
          "nome": "Juros simples",
          "semana_sugerida": "4",
          "incidencia_pct": "10",
          "id": "MAT-04",
          "horas_estimadas": "4",
          "prioridade": "2"
        },
        {
          "prioridade": "1",
          "incidencia_pct": "14",
          "semana_sugerida": "5",
          "nome": "Equações de 1o e 2o graus e sistemas",
          "horas_estimadas": "6",
          "id": "MAT-05"
        },
        {
          "semana_sugerida": "6",
          "incidencia_pct": "12",
          "nome": "Tabelas, gráficos e sistemas de medidas",
          "id": "MAT-06",
          "horas_estimadas": "5",
          "prioridade": "2"
        },
        {
          "id": "MAT-07",
          "horas_estimadas": "6",
          "incidencia_pct": "12",
          "semana_sugerida": "7",
          "nome": "Geometria: perimetro, área, volume, angulos e Pitagoras",
          "prioridade": "2"
        },
        {
          "prioridade": "1",
          "semana_sugerida": "8",
          "incidencia_pct": "8",
          "nome": "Resolução de situacoes-problema",
          "horas_estimadas": "5",
          "id": "MAT-08"
        }
      ],
      "peso": "1",
      "id": "MAT"
    },
    {
      "nota_minima_pct": null,
      "nome": "Informática",
      "topicos": [
        {
          "id": "INF-01",
          "horas_estimadas": "5",
          "nome": "Windows 10 ou superior: pastas, arquivos, atalhos e área de transferencia",
          "semana_sugerida": "1",
          "incidencia_pct": "14",
          "prioridade": "1"
        },
        {
          "prioridade": "1",
          "semana_sugerida": "2",
          "incidencia_pct": "18",
          "nome": "Word: edição, formatacao, tabelas, impressao e objetos",
          "horas_estimadas": "7",
          "id": "INF-02"
        },
        {
          "prioridade": "1",
          "nome": "Excel: células, fórmulas, funções, macros, dados externos, gráficos e impressão",
          "incidencia_pct": "24",
          "semana_sugerida": "3",
          "horas_estimadas": "9",
          "id": "INF-03"
        },
        {
          "prioridade": "2",
          "nome": "Correio eletrônico: envio, preparo de mensagens e anexos",
          "incidencia_pct": "8",
          "semana_sugerida": "4",
          "horas_estimadas": "3",
          "id": "INF-04"
        },
        {
          "id": "INF-05",
          "horas_estimadas": "4",
          "nome": "Internet: navegacao, URL, links, sites, busca e impressao",
          "semana_sugerida": "5",
          "incidencia_pct": "12",
          "prioridade": "2"
        },
        {
          "id": "INF-06",
          "horas_estimadas": "4",
          "semana_sugerida": "6",
          "incidencia_pct": "10",
          "nome": "Microsoft Teams: chats, chamadas, grupos, reunioes e gravacao",
          "prioridade": "2"
        },
        {
          "prioridade": "1",
          "id": "INF-07",
          "horas_estimadas": "6",
          "nome": "Microsoft 365, SharePoint, OneNote, PowerPoint e OneDrive",
          "incidencia_pct": "14",
          "semana_sugerida": "7"
        }
      ],
      "dificuldade": "media",
      "peso": "2",
      "id": "INF",
      "cor": "#0369a1",
      "base_teorica": "pdf",
      "carater": ""
    },
    {
      "base_teorica": "pdf",
      "carater": "",
      "cor": "#475569",
      "topicos": [
        {
          "nome": "Estruturas logicas",
          "semana_sugerida": "1",
          "incidencia_pct": "22",
          "horas_estimadas": "6",
          "id": "RLM-01",
          "prioridade": "1"
        },
        {
          "id": "RLM-02",
          "horas_estimadas": "6",
          "semana_sugerida": "2",
          "incidencia_pct": "22",
          "nome": "Logica de argumentação",
          "prioridade": "1"
        },
        {
          "prioridade": "1",
          "nome": "Diagramas logicos",
          "semana_sugerida": "3",
          "incidencia_pct": "22",
          "id": "RLM-03",
          "horas_estimadas": "6"
        },
        {
          "prioridade": "1",
          "nome": "Sequencias numericas",
          "semana_sugerida": "4",
          "incidencia_pct": "17",
          "id": "RLM-04",
          "horas_estimadas": "5"
        },
        {
          "prioridade": "1",
          "semana_sugerida": "5",
          "incidencia_pct": "17",
          "nome": "Sequencias figurais e padroes",
          "id": "RLM-05",
          "horas_estimadas": "5"
        }
      ],
      "dificuldade": "media",
      "id": "RLM",
      "peso": "2",
      "nota_minima_pct": null,
      "nome": "Raciocínio Lógico"
    },
    {
      "nota_minima_pct": null,
      "nome": "Redação",
      "topicos": [
        {
          "id": "RED-01",
          "horas_estimadas": "10",
          "semana_sugerida": "1",
          "incidencia_pct": "40",
          "nome": "Texto dissertativo-argumentativo",
          "prioridade": "1"
        },
        {
          "prioridade": "1",
          "nome": "Tese, posicionamento e defesa de ponto de vista",
          "incidencia_pct": "20",
          "semana_sugerida": "2",
          "horas_estimadas": "5",
          "id": "RED-02"
        },
        {
          "prioridade": "1",
          "horas_estimadas": "6",
          "id": "RED-03",
          "incidencia_pct": "20",
          "semana_sugerida": "3",
          "nome": "Coesao, coerência e progressão argumentativa"
        },
        {
          "prioridade": "1",
          "incidencia_pct": "20",
          "semana_sugerida": "4",
          "nome": "Norma-padrao, clareza e legibilidade",
          "horas_estimadas": "5",
          "id": "RED-04"
        }
      ],
      "dificuldade": "media",
      "id": "RED",
      "peso": "2",
      "cor": "#be123c",
      "base_teorica": "pdf",
      "carater": ""
    }
  ],
  "atualizadoEm": "2026-10-28T23:40:00.000Z",
  "estado": "SP",
  "arquivado": false,
  "titulo": "TJSP - Escrevente Técnico Judiciário (Edital 2026)",
  "tipoCorte": "ampla",
  "cargo": "Escrevente Técnico Judiciário",
  "janelaProva": {
    "inicio": "2027-03-14",
    "fim": "2027-03-14"
  },
  "banca": "Vunesp",
  "fonte": "https://documento.vunesp.com.br/documento/stream/NzkyMDQ1Nw%3d%3d",
  "referencia": "Edital 02/2026, Anexo VIII — 2ª a 10ª RAJ",
  "inscricoes": {
    "inicio": "2026-10-28",
    "fim": "2026-12-10"
  },
  "observacoes": "Edital 02/2026. Objetiva: 70 questões (Português 16; Direito 30; Atualidades 4; Matemática 4; Informática 9; Lógica 7), mais redação. Incidências e horas são estimativas herdadas de planejamento, não estatísticas medidas. Nota do último nomeado não validada."
};
const clone = x => JSON.parse(JSON.stringify(x));
function atualizarCatalogo(e) {
  if (!e || e.id !== base.id || String(e.atualizadoEm || '') >= base.atualizadoEm) return e;
  return Object.assign({}, e, clone(base));
}
function atualizarPlanos(state, mesclar) {
  let mudou = false;
  (state.planos || []).forEach(p => {
    const pl = p.plano;
    if (!pl || pl.origemEditalId !== base.id || String(pl.origemEditalVersao || '') >= base.atualizadoEm) return;
    p.disciplinas = mesclar(p.disciplinas || [], clone(base.disciplinas)).disciplinas;
    pl.concurso = base.titulo;
    pl.origemEditalVersao = base.atualizadoEm;
    pl.radar = Object.assign({}, pl.radar, {janela_prova:['2027-03-14','2027-03-14']});
    mudou = true;
  });
  return mudou;
}
window.EditalTJSP2026 = {base, atualizarCatalogo, atualizarPlanos};
window.CATALOGO_EDITAIS_BASE = (window.CATALOGO_EDITAIS_BASE || []).concat([base]);
})();
