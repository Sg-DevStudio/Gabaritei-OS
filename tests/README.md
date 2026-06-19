# Testes

Suíte das regras de domínio puras (`js/domain.js`), sem dependências externas —
usa só o test runner nativo do Node (`node --test`).

```bash
npm test            # roda tudo
node --test tests/desempenho.test.js   # um arquivo só
```

- `helpers/load-domain.js` carrega `js/domain.js` (que faz `window.Dominio = {...}`)
  num `window` global e devolve o objeto `Dominio`.
- Cada arquivo `*.test.js` cobre um eixo: datas, revisões/curva, desempenho,
  plano/burndown, urgência da fila, análise de erros de simulado, gamificação.
- Roda em cada Pull Request e push no `main` via `.github/workflows/test.yml`.

Por que só `domain.js`? É puro (sem DOM/rede), então dá cobertura alta e barata —
as regras que decidem cronograma, revisões, semáforo e prioridade ficam blindadas.
