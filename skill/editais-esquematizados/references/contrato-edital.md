# Contrato do edital esquematizado (v1) — upload no app

O arquivo alimenta a seção **Editais esquematizados** (aba Configurações do app
PWA). O app lê o campo `disciplinas` E **autopreenche o cadastro** com os metadados
do topo do arquivo: `titulo`, `banca`, `orgao`, `cargo`, `area`, `estado` (UF),
`nivel`, `nota_corte_sugerida_pct` e `janela_prova`. Preencha todos os que tiver com
fonte; o que faltar, pergunte ao usuário (regra de ouro — nunca invente). Também é
aceito: um JSON só com `{"disciplinas":[...]}`, uma lista de disciplinas, ou planilha
.xlsx/.csv com colunas `disciplina, sigla, topico, incidencia, prioridade, horas,
semana, peso, cor`.

## Regras

- `versao` = 1. Mudança de estrutura exige incrementar e avisar o usuário.
- IDs: disciplina = sigla de 3–4 letras maiúsculas (`ADM`, `POR`); tópico =
  `SIGLA-NN` sequencial (`ADM-01`). IDs são estáveis entre versões do mesmo
  edital — o app casa o histórico do aluno pelo ID.
- Cores: hex únicas por disciplina, legíveis sobre fundo claro.
- `incidencia_pct`: número 0–100; a soma POR DISCIPLINA deve dar ~100.
- `prioridade`: 1 (núcleo da banca) a 3 (periférico).
- `horas_estimadas`: 2–9h por tópico (quebrar tópicos maiores que isso).
- `semana_sugerida`: ordem pedagógica relativa (1 = começo). O app reescala para
  o prazo escolhido pelo usuário — importa a ORDEM, não o número absoluto.
- `notas_corte_ultimo_nomeado`: uma entrada por unidade de classificação, sempre
  com `ampla` e `negros` (e `pcd` se disponível), na escala original E em
  percentual da nota máxima. Declarar a escala e a fonte.
- Sem links de plataformas de questões em lugar nenhum do arquivo.
- Entregar como arquivo `.json` (UTF-8, sem BOM) para download.

## Schema completo

```json
{
  "tipo": "edital_esquematizado",
  "versao": 1,
  "gerado_em": "2026-06-12",
  "titulo": "TRF3 — Técnico Judiciário, Área Administrativa (Edital 01/2024)",
  "banca": "FCC",
  "orgao": "TRF 3ª Região",
  "cargo": "Técnico Judiciário — Área Administrativa (TJAA)",
  "area": "Administrativa",
  "estado": "SP",
  "nivel": "medio",
  "fonte": "Edital nº 01/2024 (DOU 18/04/2024); atos de nomeação até mai/2026",
  "nota_corte_sugerida_pct": 84,
  "janela_prova": { "inicio": "2027-07", "fim": "2027-09" },
  "em_alta": false,
  "notas_corte_ultimo_nomeado": {
    "escala": "nota final 0–20 (média ponderada das objetivas + discursiva); pct = nota/20",
    "TJAA Seção SP": { "ampla": 16.80, "ampla_pct": 84.0, "negros": 15.60, "negros_pct": 78.0, "pcd": 15.32 }
  },
  "disciplinas": [
    {
      "id": "ADM",
      "nome": "Direito Administrativo",
      "cor": "#27AE60",
      "peso": 2,
      "base_teorica": "pdf",
      "topicos": [
        {
          "id": "ADM-01",
          "nome": "Lei 8.112/1990 — provimento, vacância, posse, exercício, estabilidade",
          "incidencia_pct": 12,
          "prioridade": 1,
          "horas_estimadas": 9,
          "semana_sugerida": 8
        }
      ]
    }
  ]
}
```

## Checklist da saída

1. JSON parseia sem erro (gerar e revisar antes de entregar).
2. Incidências de cada disciplina somam ~100.
3. Nenhum tópico sem `incidencia_pct` numérico (o validador do app exige).
4. Notas de corte com fonte, para ampla E negros.
5. Metadados de autopreenchimento (`orgao`, `cargo`, `area`, `estado`, `nivel`,
   `janela_prova`, `nota_corte_sugerida_pct`) com fonte OU perguntados ao usuário —
   nada inventado. Nomes de disciplina sem prefixo "Noções de".
6. Tópicos desmembrados (um assunto por tópico, régua dos filtros do Qconcursos/TEC).
7. Arquivo .json para download, não colado na conversa.
