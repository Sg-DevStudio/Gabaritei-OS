# Saída JSON — contrato com o app de estudos (Fase 3/Entregáveis)

Quando o usuário pedir o plano "em JSON", "para o app", "para importar no sistema",
gere um arquivo `.json` seguindo EXATAMENTE este contrato. Ele alimenta o app pessoal
de estudos (PWA); campo fora do contrato quebra a importação.

## Regras
- `versao` é obrigatório e vale `1` até segunda ordem. Mudanças de estrutura exigem
  incrementar a versão E avisar o usuário.
- IDs: disciplina = sigla de 3 letras maiúsculas (`ADM`, `POR`); tópico =
  `SIGLA-NN` sequencial (`ADM-01`). IDs são estáveis: ao reexportar um plano
  atualizado, manter os IDs dos tópicos que continuam existindo (o app preserva o
  histórico por ID).
- Cores: hex únicas por disciplina, legíveis sobre fundo claro (`#F7F8F6`).
- Datas: `AAAA-MM-DD`; meses: `AAAA-MM`. Percentuais: número 0–100.
- Todo o conteúdo (incidência, meta, radar, cronograma) sai das Fases 1–3 da skill —
  o JSON é só outra serialização do mesmo plano, nunca conteúdo novo inventado.
- `links` é **opcional e normalmente omitido**: não incluir links de plataformas de
  questões (regra da Fase 1.4); o campo existe só para retrocompatibilidade.
- O cronograma segue a **construção incremental** da Fase 3.2: semana 1 com 3–5
  disciplinas-base, entrada progressiva das demais, disciplina concluída permanece
  com blocos de `questoes`/`revisao`, ordem pedagógica respeitada dentro de cada
  disciplina. Cronograma "em blocos" (uma disciplina por vez do início ao fim da
  semana N à M) está ERRADO.
- Validar mentalmente antes de entregar: JSON parseável, sem comentários, sem
  vírgula sobrando, incidências de cada disciplina somando ~100.

## Round-trip (editar um plano existente)

Se o usuário fornecer o JSON atual pedindo alterações: ele é a fonte da verdade.
Preserve os IDs de tudo que continua existindo, aplique só o que foi pedido,
reconstrua o cronograma pela regra incremental a partir do estado declarado
("já estou estudando X, Y, Z" → essas disciplinas continuam de onde estão) e
devolva o arquivo completo com `gerado_em` atualizado. Nunca devolva um fragmento.

## Schema (v1)

```json
{
  "versao": 1,
  "gerado_em": "2026-06-10",
  "plano": {
    "concurso": "TRF3 — Técnico Judiciário, Área Administrativa",
    "banca": "FCC",
    "cota": "negros",
    "meta": {
      "corte_pct": 75,
      "corte_fonte": "lista de classificação FCC 2024 — último nomeado cota",
      "minimos": { "gerais": 40, "especificas": 40, "media": 6.0 }
    },
    "radar": {
      "janela_edital": ["2026-07", "2027-06"],
      "janela_prova": ["2027-01", "2027-06"],
      "confianca": "media",
      "reavaliar_em": "2026-08-10"
    },
    "ritmos": {
      "ativo": "sustentavel",
      "sustentavel": { "h_semana": 19, "semanas": 28 },
      "hardcore": { "dias": 120, "h_semana_exigidas": 32 }
    }
  },
  "disciplinas": [
    {
      "id": "ADM",
      "nome": "Direito Administrativo",
      "cor": "#1E7D46",
      "peso": 2,
      "base_teorica": "pdf",
      "topicos": [
        {
          "id": "ADM-01",
          "nome": "Atos administrativos — atributos, elementos, classificação",
          "incidencia_pct": 15,
          "prioridade": 1,
          "horas_estimadas": 6,
          "semana_sugerida": 2
        }
      ]
    }
  ],
  "cronograma": {
    "sustentavel": [
      {
        "semana": 1,
        "inicio": "2026-06-15",
        "blocos": [
          { "disciplina": "POR", "topico": "POR-01", "tipo": "teoria" },
          { "disciplina": "ADM", "topico": "ADM-01", "tipo": "questoes" }
        ],
        "marcos": ["Montar decks Anki"]
      }
    ],
    "hardcore": []
  },
  "links": [
    { "titulo": "Guia TRF3 — Tec Concursos", "url": "https://...", "custo": "pago" }
  ]
}
```

`tipo` de bloco: `teoria` | `questoes` | `revisao` | `simulado_parcial` |
`simulado_total` | `redacao`.

## Checklist específico da saída JSON
1. Parseia sem erro (gere e revise antes de entregar).
2. Todos os tópicos do cronograma existem em `disciplinas[].topicos[]`.
3. IDs estáveis em reexportação (preservar os anteriores quando o tópico persiste).
4. Os DOIS cronogramas presentes (sustentável e hardcore) — mesmo que o usuário só
   vá usar um, o app permite alternar.
5. Entregar como arquivo `.json` para download, não colado na conversa (acima de
   ~50 tópicos o texto vira ruído).
