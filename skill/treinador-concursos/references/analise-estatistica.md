# Análise estatística de provas (Fase 1)

## Objetivo

Transformar as 2 últimas provas em um **mapa de incidência por tópico do edital
ATUAL**, que será o critério de priorização do cronograma. O referencial é sempre o
edital mais recente: prova antiga serve de amostra estatística, não de programa.

## Passo a passo

### 1. Obter o material certo
- Edital: versão consolidada mais recente (com retificações). Confirme cargo e área.
- Provas: as 2 últimas aplicações **do mesmo cargo** (ou do cargo mais próximo, se o
  cargo for novo — declare a aproximação). Baixe prova + gabarito definitivo.
- Fontes na ordem: site da banca → site do órgão → PCI Concursos → repositórios de
  questões. Se a prova não estiver acessível para download, use análises de incidência
  publicadas por cursos confiáveis e DECLARE que a estatística é de segunda mão.

### 2. Classificar as questões
Para cada questão de cada prova, registre: disciplina → tópico do edital atual →
subtema/artigo quando identificável (ex.: "Dir. Adm. → Licitações → Lei 14.133,
modalidades"). Questão que mistura tópicos: classifique pelo núcleo da resposta.

### 3. Tabela de incidência (formato de saída)

Por disciplina:

| Tópico do edital | Prova A (n) | Prova B (n) | Total | % da disciplina | Status |
|---|---|---|---|---|---|
| Atos administrativos | 4 | 3 | 7 | 23% | mantido |
| Lei 14.133 — modalidades | 2 | 0* | 2 | 7% | **NOVO peso** |
| Lei 8.666 | — | 5 | — | — | **SAIU do edital** |

Status possíveis:
- **mantido**: está no edital atual e caiu nas provas → estatística vale cheia.
- **NOVO**: está no edital atual mas não existia/não caía antes → sem estatística;
  trate como prioridade média-alta por padrão (banca tende a cobrar o que acabou de
  incluir) e diga isso ao usuário.
- **SAIU**: caía antes mas não está mais no edital → exclua do plano e avise (evita a
  pessoa estudar material desatualizado de cursinho antigo).
- Atenção a **mudanças legislativas**: tópico "mantido" no nome mas com lei nova por
  trás (ex.: 8.666 → 14.133, antigo CPC → novo) — sinalize que a estatística vale para
  o tema, mas o conteúdo a estudar é o atualizado.

### 4. Síntese para priorização

Encerre com um ranking único:

```
prioridade do tópico = (% de incidência na disciplina) × (peso/nº de questões da
disciplina na prova) ÷ (domínio atual do aluno: 1 = nenhum, 2 = médio, 3 = alto)
```

Apresente o top ~15 tópicos como "núcleo de aprovação" — eles entram primeiro no
cronograma. Tópicos com 0 ocorrências em 2 provas e sem status NOVO entram no fim do
plano ou na lista de corte se o tempo for insuficiente.

## Nota de corte (1.3) — método para chegar ao número exato

A lógica: **nº de nomeados → posição do último nomeado → nota dessa posição na lista
de classificação**. Passo a passo:

1. **Descobrir quantos foram nomeados** no último concurso do cargo. Em concursos com
   cadastro de reserva o total de nomeações costuma SUPERAR as vagas do edital — em
   carreiras como TAE/técnico pode chegar perto do dobro das vagas iniciais. Fontes:
   portarias de nomeação no D.O. (busque `nomeação "concurso" [órgão] [ano]` e some
   as listas), páginas de acompanhamento do próprio órgão, sites/fóruns que rastreiam
   convocações. Se o usuário concorre por cota, conte as nomeações da lista da cota
   separadamente.
2. **Localizar a nota dessa posição** no PDF do resultado final/classificação da
   banca (a lista traz posição + nota). A nota do candidato na posição igual ao total
   de nomeados = nota do último nomeado. Repita na lista da cota.
3. **Atenção à unidade/região**: tribunais e órgãos com listas por seccional/polo
   (ex.: capital vs interior) têm cortes diferentes — use a(s) lista(s) da região que
   o usuário pretende, ou apresente as duas.
4. **Concurso ainda na validade**: se o órgão ainda está chamando, o corte real ainda
   pode baixar — apresente o corte atual como **piso** e diga isso.

Entregue sempre o **número fechado** (nota bruta + % de acertos equivalente + pontos
acima do mínimo eliminatório), na ampla e na cota. A busca é viável quando as listas
são públicas — não adie para "depois se o usuário quiser". Só recorra a aproximação
declarada (último classificado dentro das vagas, relatos de aprovados triangulados)
se os PDFs realmente não estiverem acessíveis.
