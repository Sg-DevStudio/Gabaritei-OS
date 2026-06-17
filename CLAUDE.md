# Gabaritei OS — memória do projeto

App PWA estático (HTML/CSS/JS puro, sem build) de planos de estudo para concursos.
Estado em `localStorage` (`js/store.js`) + sync Firebase (`js/firebase-sync.js`);
regras de domínio puras em `js/domain.js`; UI em `js/app.js`; gráficos em
`js/charts.js`. Editais ficam em `data/*.json` (fallback/exemplos) e no catálogo
global do Firebase. A skill que gera editais está em `skill/editais-esquematizados/`.

## Regras de dados dos editais

### `janela_prova` — só preencher quando apontar para o FUTURO
A `janela_prova` (`{ inicio, fim }` em `AAAA-MM`) vira referência de **cronograma e
revisões** do aluno. Só preencha em dois cenários:
1. **Edital vigente / recém-publicado** → a janela é a **data futura real** da prova.
2. **Pré-edital** → a janela é uma **previsão futura** explícita.

**Concurso já ENCERRADO usado só como base de conteúdo → `janela_prova` VAZIA**
(`{ "inicio": "", "fim": "" }`). Nunca colocar data de prova que já aconteceu — ela
polui o cronograma/revisões. A data passada, se relevante, vai em `observacoes`/`fonte`.
(Vale tanto para a skill quanto para edições manuais dos JSONs em `data/`.)

## Convenções
- Testes rápidos com jsdom: escreva o script em arquivo temporário **fora do repo**
  (ex.: `/tmp`) ou nomeie `_t_*.cjs` e remova antes de commitar — não versionar.
- Não incluir o id do modelo em commits/PRs/código.
