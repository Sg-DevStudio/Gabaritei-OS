# Specs por feature

Cada feature ou mudança não-trivial tem uma **spec** curta aqui — o "o quê/por quê"
antes do "como". Mantém a intenção registrada (Spec-Driven Development), evita
regressão e facilita revisar. Convenções e princípios gerais ficam no `CLAUDE.md`;
a spec funcional ampla e o roadmap, no `ROADMAP.md`.

## Como usar
1. Copie `_TEMPLATE.md` para `NNN-slug.md` (NNN = próximo número sequencial).
   Ex.: `002-simulado-cronometrado.md`.
2. Preencha objetivo, comportamento, dados, verificação e tarefas.
3. Implemente, marque as tarefas, ligue o PR e mude o **Status** para `implementado`.

## Convenções
- **Nome:** `NNN-slug.md` (número crescente, slug curto em kebab-case).
- **Status:** `rascunho` → `em andamento` → `implementado` (ou `descartado`).
- Fix pequeno/óbvio não precisa de spec — vai direto ao PR.
- Toda regra de domínio nova entra com teste em `tests/` (item de Verificação).

## Índice
| # | Spec | Status |
|---|------|--------|
| 001 | [Análise de erro por tipo nos simulados](001-analise-erro-por-tipo.md) | implementado |
