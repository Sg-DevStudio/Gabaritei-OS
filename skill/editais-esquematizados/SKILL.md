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

Fluxo: **edital recebido → esquematização → incidência → notas de corte →
arquivo pronto para upload** (seção "Editais esquematizados" da aba Configurações
do app).

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
  "cargo": "nome completo do cargo",
  "fonte": "edital + listas de nomeação usadas",
  "nota_corte_sugerida_pct": 84,
  "notas_corte_ultimo_nomeado": {
    "escala": "como a nota final é calculada e qual o máximo",
    "Unidade X": { "ampla": 16.80, "ampla_pct": 84.0, "negros": 15.60, "negros_pct": 78.0, "pcd": 15.32 }
  },
  "disciplinas": [ { "id": "ADM", "nome": "...", "cor": "#1E7D46", "peso": 2,
    "base_teorica": "pdf", "topicos": [ { "id": "ADM-01", "nome": "...",
    "incidencia_pct": 15, "prioridade": 1, "horas_estimadas": 6,
    "semana_sugerida": 2 } ] } ]
}
```

O app lê o campo `disciplinas`; os metadados (título, banca, notas de corte) são
para o usuário preencher o formulário de cadastro e conferir as fontes. IDs:
disciplina = sigla de 3–4 letras maiúsculas; tópico = `SIGLA-NN` sequencial.
Entregue como **arquivo .json para download** (UTF-8, parseável, sem comentários).

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
5. Sem links de plataformas de questões no arquivo?
6. JSON parseia sem erro / planilha abre com cabeçalhos corretos?

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
- Não inventa incidência nem nota de corte: se a fonte não existir, diga e ofereça
  a melhor aproximação declarada.
- Não esquematiza cargo diferente do que o usuário vai prestar.
