# Como contribuir — Gabaritei OS

Projeto **PWA estático** (HTML/CSS/JS puro, **sem build**), desenvolvido sob a
ótica de **Spec-Driven Development (SDD)** com boas práticas de engenharia, mas
**leve** (é um projeto enxuto — processo existe para evitar regressão, não para
burocratizar).

## Mapa do repositório
- `CLAUDE.md` — **constituição**: princípios e convenções do projeto.
- `ROADMAP.md` — **spec funcional + plano**: como o sistema deve funcionar e a direção.
- `docs/specs/` — **specs por feature** (o quê/por quê + tarefas + verificação). Veja o `README` da pasta.
- `js/domain.js` — regras de negócio **puras** (`window.Dominio`), testáveis sem DOM.
- `js/app.js` — UI; `js/store.js` — persistência; `js/charts.js`, `js/timer.js`, `js/frases.js`.
- `tests/` — suíte (`node --test`, sem dependências).
- `skill/` — skill que gera editais esquematizados.

## Fluxo (SDD-lite)
1. **Spec** — para feature/mudança não-trivial, crie/atualize `docs/specs/NNN-slug.md`
   a partir do `docs/specs/_TEMPLATE.md` (o quê, por quê, comportamento, dados,
   verificação, tarefas). Fix pequeno pode ir direto ao PR.
2. **Implemente** — regra de negócio nova vai (de preferência) em `js/domain.js` (puro).
3. **Verifique** — rode o **gate** localmente (abaixo). Regra de domínio nova ganha teste.
4. **PR** — preencha o template; o CI roda sintaxe + testes em cada PR.

## Gate de verificação
Rode antes de abrir o PR (o CI repete isso):

```bash
npm test                       # suíte de domínio (node --test)
for f in js/app.js js/domain.js js/store.js js/sync.js js/timer.js js/charts.js js/frases.js sw.js; do node --check "$f"; done
```

Regras do gate:
- `npm test` **verde** e sem erro de sintaxe.
- **Regra de domínio nova/alterada tem teste** em `tests/` (alvo barato: `domain.js` é puro).
- **Bump do cache do SW** (`sw.js` `CACHE` + `?v=` no `index.html`) quando mudar `css/js/index`.
- Sem id de modelo em commits/PRs/código.
- `data/*.json`: `janela_prova` vazia para concurso encerrado (ver `CLAUDE.md`).

## Testes
- Ficam em `tests/*.test.js`, usam só o runner nativo do Node (sem `npm install`).
- `tests/helpers/load-domain.js` carrega `js/domain.js` num `window` global.
- Rode um arquivo: `node --test tests/desempenho.test.js`.
