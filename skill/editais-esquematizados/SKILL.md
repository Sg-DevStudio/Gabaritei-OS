---
name: editais-esquematizados
description: >
  Transforma um edital específico de concurso público em um EDITAL ESQUEMATIZADO
  pronto para upload no app de estudos (JSON ou Excel): todos os tópicos do conteúdo
  programático organizados em ordem lógica de aprendizado, incidência por tópico na
  banca/concurso (pesquisada em provas anteriores e bancos de questões) e quantidade
  de conteúdo para estudar (horas estimadas). Pesquisa também a nota de corte do
  último NOMEADO do concurso anterior — ampla concorrência E cota de negros (e PcD
  quando disponível). ATIVE quando o usuário enviar/anexar um edital (PDF, doc, link
  ou texto) ou disser: "esquematiza esse edital", "cria o edital esquematizado",
  "prepara o edital para o site/app", "o que mais cai", "incidência da banca",
  "nota de corte", "quanto preciso tirar", ou mencionar preparação de material a
  partir de qualquer edital (FCC, Cebraspe, FGV, Vunesp etc.).
---

# Editais Esquematizados

## Princípio central

O app de estudos do usuário gera o plano de estudos sozinho — o que ele precisa de
entrada é um **edital esquematizado de qualidade**: tópicos completos e na ordem
certa de aprendizado, incidência real da banca e estimativa honesta de volume de
estudo, mais a **meta de desempenho** (nota de corte do último nomeado). Esta skill
produz exatamente esse insumo. Cronograma, calendário e revisões ficam por conta do
app; esta skill NÃO monta cronograma.

O arquivo deve **autopreencher ao máximo o cadastro do app**: quando o usuário
importa o JSON na seção "Editais esquematizados", o app já lê título, banca, órgão,
cargo, área, estado (UF), nível, nota de corte e janela da prova direto do arquivo —
então preencha TODOS esses campos. Quanto mais completo o JSON, menos o usuário
digita.

### Regra de ouro: preencher tudo que dá, perguntar o resto, nunca inventar

- Preencha cada campo que você consiga extrair do edital ou confirmar com fonte.
- O que você **não encontrar ou não tiver certeza** (nota de corte, incidência de um
  tópico, UF, janela da prova, banca) **NÃO é chutado**: liste os campos faltantes e
  **pergunte ao usuário** — ele pesquisa e te devolve o dado, você junta tudo e gera
  o arquivo final. É melhor um arquivo com 3 perguntas pendentes do que um arquivo
  com 3 números inventados.
- Para campos não-críticos que mesmo assim ficarem sem fonte, use o neutro seguro
  (`incidencia_pct: 0`, `foto` ausente, `em_alta: false`) e avise o usuário do que
  ficou em branco — nunca um valor plausível "de fachada".

Fluxo: **edital recebido → esquematização → incidência → notas de corte →
(perguntar o que faltou) → arquivo pronto para upload** (seção "Editais
esquematizados" da aba Configurações do app).

> Toda busca na web desta skill segue o protocolo da skill `checagem-fatos`
> (fonte primária > snippet, triangulação, data de publicação). Se ela estiver
> disponível, aplique-a silenciosamente.

---

## FASE 0 — Recepção do edital

O usuário envia o edital (PDF, .docx, link ou texto colado). Antes de esquematizar,
confirme apenas o essencial que não estiver claro no documento:

1. **Cargo-alvo**: editais costumam ter vários cargos — esquematize só o cargo do
   usuário (pergunte se houver ambiguidade). Cargo errado = material inútil.
2. **Formato de saída**: JSON (padrão, pronto para o app) ou Excel (.xlsx). Se o
   usuário não disser nada, entregue JSON.
3. Se o documento recebido for um material já trabalhado (ex.: um "Blueprint" com
   incidências e notas de corte), **aproveite os dados dele como fonte primária** —
   não refaça buscas para o que o documento já responde com fonte.

---

## FASE 1 — Esquematização do conteúdo programático

- Extraia TODAS as disciplinas e tópicos do conteúdo programático do cargo,
  incluindo leis e artigos citados nominalmente no edital.
- **Granularidade — um assunto estudável por tópico**: cada assunto que o aluno
  estuda e cobra estatística separada deve ser um tópico próprio. Use como régua os
  filtros de assunto do Qconcursos / TEC Concursos: se a banca tem um filtro só para
  "Concordância", outro para "Regência" e outro para "Pontuação", então são TRÊS
  tópicos — nunca um único "Gramática (concordância, regência, pontuação)".
  - NÃO una assuntos só porque pertencem à mesma matéria (gramática, organização dos
    poderes etc.). Una APENAS quando: (a) o assunto é pouquíssimo cobrado e não rende
    estatística própria, OU (b) há afinidade extrema — aprender um já é aprender o
    outro (ex.: sinonímia + antonímia).
  - Quebre itens gigantes (ex.: "Lei 8.112/1990" vira provimento/vacância/posse;
    licenças/vantagens/deveres/PAD). Cada tópico deve ser estudável em 2–9h.
- **Ordem lógica de aprendizado** (`semana_sugerida`): pré-requisito vem antes
  (princípios antes de controle de constitucionalidade; parte geral antes de
  recursos; organização administrativa antes de ato administrativo). A incidência
  decide quanto tempo o tópico recebe — nunca embaralha a sequência pedagógica.
- **Quantidade de conteúdo** (`horas_estimadas`): estime por tópico usando
  `references/tempos-medios.md` (volume da lei/matéria × banca × nível do cargo).

## FASE 2 — Incidência na banca/concurso

Leia `references/analise-estatistica.md` antes desta fase.

- Pesquise a incidência por tópico nas **2 últimas provas do cargo/banca** e nas
  estatísticas públicas de bancos de questões (Tec Concursos, Qconcursos e afins
  são FONTE DE PESQUISA legítima — mas **nunca inclua links dessas plataformas no
  arquivo entregue**; a escolha de plataforma é do candidato).
- Classifique cada questão/estatística em um tópico do edital ATUAL e atribua
  `incidencia_pct` por tópico: as incidências de cada disciplina devem somar ~100.
- Marque `prioridade` 1–3 (1 = núcleo da banca, 3 = periférico) combinando
  incidência × peso da disciplina na prova.

## FASE 3 — Nota de corte do último nomeado (ampla E cota de negros)

- Busque a nota final do **último candidato efetivamente NOMEADO** (não só
  aprovado) do concurso anterior do mesmo cargo — método em
  `references/analise-estatistica.md`. Faça SEMPRE para **ampla concorrência E
  cota de negros**; inclua PcD quando disponível. Se houver múltiplas unidades de
  classificação (sede/seções), traga todas em tabela.
- **Entregue o número fechado, com fonte** (lista de classificação, D.O.U., ato de
  nomeação, levantamento público citado). Só apresente aproximação declarada se as
  listas realmente não estiverem acessíveis — nunca "confirmo depois".
- Converta para percentual da nota máxima (`nota_corte_sugerida_pct`) — é esse
  número que o usuário digita no campo "nota de corte estimada" do app. Use a
  unidade mais concorrida (pior caso) como sugestão padrão e liste as demais.

## FASE 4 — Arquivo de saída

### JSON (padrão) — contrato do edital esquematizado

Siga `references/contrato-edital.md`. Resumo do schema:

```json
{
  "tipo": "edital_esquematizado",
  "versao": 1,
  "gerado_em": "AAAA-MM-DD",
  "titulo": "Órgão — Cargo (Edital NN/AAAA)",
  "banca": "FCC",
  "orgao": "TRF 3ª Região",
  "cargo": "nome completo do cargo",
  "area": "Administrativa",
  "estado": "SP",
  "nivel": "medio",
  "nota_corte_sugerida_pct": 84,
  "lista_corte": "ampla",
  "janela_prova": { "inicio": "AAAA-MM", "fim": "AAAA-MM" },
  "em_alta": false,
  "salario": "R$ 5.563,90",
  "beneficios": "vale-refeição, plano de saúde, previdência complementar",
  "vagas": "1119",
  "fonte": "edital + listas de nomeação usadas",
  "notas_corte_ultimo_nomeado": {
    "escala": "como a nota final é calculada e qual o máximo",
    "Unidade X": { "ampla": 16.80, "ampla_pct": 84.0, "negros": 15.60, "negros_pct": 78.0, "pcd": 15.32 }
  },
  "disciplinas": [ { "id": "ADM", "nome": "...", "cor": "#1E7D46", "peso": 2,
    "carater": "eliminatoria_classificatoria", "nota_minima_pct": 50,
    "base_teorica": "pdf", "topicos": [ { "id": "ADM-01", "nome": "...",
    "incidencia_pct": 15, "prioridade": 1, "horas_estimadas": 6,
    "semana_sugerida": 2 } ] } ]
}
```

Campos **opcionais** por disciplina, usados na "visão geral" do modal de detalhes:
- `carater`: `eliminatoria` | `classificatoria` | `eliminatoria_classificatoria`
  (se a disciplina elimina por nota mínima, classifica por pontos, ou ambos).
- `nota_minima_pct`: nota mínima exigida na disciplina, em % (ex.: `50`). Omita se
  não houver mínimo por disciplina. Quando ausentes, o app mostra "—".

Campos que o app **autopreenche** no cadastro a partir do JSON: `titulo`, `banca`,
`orgao`, `cargo`, `area`, `estado` (UF, 2 letras), `nivel` (`facil`|`medio`|
`dificil`), `nota_corte_sugerida_pct`, `lista_corte` (`ampla`|`negros`|`pcd`|
`indigenas` — a QUAL lista a nota sugerida se refere) e `janela_prova`
(`inicio`/`fim` em `AAAA-MM`).
Preencha todos os que tiver — o que faltar, pergunte ao usuário (regra de ouro).
`notas_corte_ultimo_nomeado` e `fonte` ficam para o usuário auditar a meta. IDs:
disciplina = sigla de 3–4 letras maiúsculas; tópico = `SIGLA-NN` sequencial.
Entregue como **arquivo .json para download** (UTF-8, parseável, sem comentários) —
este é o caminho rápido recomendado; o Excel abaixo é alternativa de legado.

### Excel (.xlsx) — alternativa

Uma linha por tópico com as colunas que o app importa: `disciplina`, `sigla`,
`topico`, `incidencia`, `prioridade`, `horas`, `semana`, `peso`, `cor`. Aba extra
"Notas de corte" com a tabela da Fase 3.

## Checklist de fechamento (OBRIGATÓRIO antes de entregar)

1. Todas as disciplinas do cargo estão presentes, com TODOS os tópicos do edital?
2. Incidências de cada disciplina somam ~100 e têm fonte?
3. `semana_sugerida` respeita a ordem pedagógica dentro de cada disciplina?
4. Notas de corte: números fechados para ampla E negros, com fonte? (Frases
   proibidas: "eu fecho depois", "posso puxar se você quiser".)
5. Campos de autopreenchimento (`orgao`, `cargo`, `area`, `estado`, `nivel`,
   `janela_prova`, `nota_corte_sugerida_pct`) preenchidos com fonte OU listados
   como pergunta ao usuário — nenhum chutado?
6. Sem links de plataformas de questões no arquivo?
7. JSON parseia sem erro / planilha abre com cabeçalhos corretos?

## Manutenção e legado

- **Atualização**: se o usuário voltar com um edital novo do mesmo concurso,
  preserve os IDs dos tópicos que continuam existindo (o app casa histórico por ID)
  e marque o que entrou/saiu.
- **Plano completo em JSON (legado)**: se o usuário pedir explicitamente um PLANO
  (com cronograma) em vez do edital esquematizado, use o contrato antigo em
  `references/contrato-json.md`. O caminho preferido, porém, é entregar o edital
  esquematizado e deixar o app gerar o plano personalizado.

## O que esta skill NÃO faz

- Não monta cronograma nem calendário — isso é função do app.
- Não inventa NADA (incidência, nota de corte, UF, banca, janela da prova): se a
  fonte não existir, **pergunta ao usuário** e espera o dado — nunca preenche com
  chute nem com "aproximação de fachada".
- Não esquematiza cargo diferente do que o usuário vai prestar.
