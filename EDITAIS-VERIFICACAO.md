# Verificação de precisão dos editais

> Documento de trabalho para conferir e corrigir os metadados sensíveis de cada
> edital — **nota de corte, janela de prova, banca, nível e cargo**. Esses campos
> alimentam cronograma, revisões, comparação entre editais e o veredito de
> "dá para conciliar". Valor errado aqui = todo o sistema indica errado.
>
> Última atualização do baseline: 2026-06-17.

## Legenda de status
- ✅ **verificado** — confere com fonte oficial citada.
- ⚠️ **estimado/sugerido** — valor aproximado ou previsto; precisa de fonte oficial.
- ❓ **a verificar** — ainda não conferido nesta rodada.
- 🟥 **faltando** — campo vazio no JSON.

## Campos que mais impactam o sistema
| Campo | Onde impacta |
|---|---|
| `nota_corte_sugerida_pct` | meta de corte, semáforo desempenho×meta, comparação |
| `janela_prova.inicio/fim` | cronograma, semanas até a prova, veredito de conciliação |
| `disciplinas[].topicos[].horas_estimadas` | carga semanal, comparação, "exige Xh/semana" |
| `lista_corte` | qual corte (ampla/negros/pcd) é o de referência |
| `banca` | sinônimos e estilo na comparação |

---

## 1. TRF3 — Técnico Judiciário, Área Administrativa (Edital 01/2024)
`data/edital-trf3-tjaa-2024.json` · FCC · 9 disc · 56 tóp

| Campo | Valor atual | Status | Fonte / correção |
|---|---|---|---|
| nota_corte_sugerida_pct | **84** | ❓ | "último nomeado TJAA SP ampla: 16,80/20" — confirmar conversão p/ % |
| janela_prova | **vazio** | 🟥 | edital de 2024; prova já ocorreu — definir data real |
| orgao | **vazio** | 🟥 | "Tribunal Regional Federal da 3ª Região - TRF3" |
| estado | **vazio** | 🟥 | SP |
| nivel/escolaridade | **vazio** | 🟥 | médio |
| lista_corte | **vazio** | 🟥 | ampla (confirmar) |

## 2. TJSP — Escrevente Técnico Judiciário (Edital 2025)
`data/edital-tjsp-escrevente-2025.json` · Vunesp · 12 disc · 81 tóp

| Campo | Valor atual | Status | Fonte / correção |
|---|---|---|---|
| nota_corte_sugerida_pct | **77** | ⚠️ | maior corte 2024 (S. J. Rio Preto 7,7/10); Capital 2024 foi 7,0/10 — decidir referência |
| janela_prova | **2025-12** | ❓ | confirmar data real da prova |
| lista_corte | ampla | ❓ | confirmar |

## 3. PRF — Agente Administrativo (previsto 2026/2027)
`data/edital-prf-agente-administrativo-previsto-2026.json` · A definir · 9 disc · 73 tóp

| Campo | Valor atual | Status | Fonte / correção |
|---|---|---|---|
| nota_corte_sugerida_pct | **76** | ⚠️ | baseado no edital de 2014 — concurso futuro, banca/edital não definidos |
| janela_prova | **2027-01** | ⚠️ | previsão; sem edital publicado |
| banca | A definir | ⚠️ | concurso ainda não confirmado |

## 4. Petrobras — Profissional Nível Técnico Júnior, Ênfase 8: Operação (PSP 2023.2)
`data/edital-petrobras-operacao-2023.json` · Cebraspe · 5 disc · 54 tóp

| Campo | Valor atual | Status | Fonte / correção |
|---|---|---|---|
| nota_corte_sugerida_pct | **57** | ⚠️ | "Rankei etapa 82, lista extraoficial" — corte oficial por polo foi maior (Ipojuca 73, Sudeste 72, Sul 72) |
| janela_prova | **2024-03** | ❓ | prova já ocorreu — confirmar data |
| lista_corte | ampla | ❓ | definir polo de referência |

## 5. TRT3 MG — Técnico Judiciário Área Administrativa (Edital 2022)
`data/edital-trt3-tecnico-administrativo-2022.json` · FUMARC · 8 disc · 52 tóp

| Campo | Valor atual | Status | Fonte / correção |
|---|---|---|---|
| nota_corte_sugerida_pct | **78** | ❓ | confirmar corte real do concurso 2022 |
| janela_prova | **2027-01 → 2027-02** | ⚠️ | data parece projeção; edital é de 2022 (prova já ocorreu) |

## 6. TRT4 RS — Técnico Judiciário Área Administrativa (Edital 2022)
`data/edital-trt4-tecnico-administrativo-2022.json` · FCC · 13 disc · 79 tóp

| Campo | Valor atual | Status | Fonte / correção |
|---|---|---|---|
| nota_corte_sugerida_pct | **78** | ❓ | confirmar corte real do concurso 2022 |
| janela_prova | **2026-11 → 2027-02** | ⚠️ | data parece projeção; edital é de 2022 |

---

## Como vamos preencher
1. Para cada edital, buscar a **fonte oficial** (edital publicado, banca, DOU) e a
   **nota de corte do último nomeado** (lista de classificação final / nomeações).
2. Converter a nota para **percentual da nota máxima** (`nota_corte_sugerida_pct`).
3. Definir `janela_prova` com a **data real** (concursos passados) ou marcar como
   previsão explícita (concursos futuros).
4. Registrar a fonte em `fonte` e nas `observacoes` do JSON.
