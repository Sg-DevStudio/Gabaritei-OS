<!-- Mantenha curto. O objetivo é o gate de verificação, não burocracia. -->

## O quê / Por quê
<!-- O que muda e qual problema/intenção resolve. Link da spec se houver. -->

- Spec: <!-- docs/specs/NNN-*.md (ou "n/a" para fix pequeno) -->

## Como verificar
<!-- Passos manuais e/ou quais testes cobrem a mudança. -->

## Checklist
- [ ] `npm test` verde
- [ ] `node --check` nos JS alterados (o CI também roda)
- [ ] Regra de domínio nova/alterada tem teste em `tests/`
- [ ] Bump do cache do SW (`sw.js` + `?v=` no `index.html`) se mexi em css/js/index
- [ ] Sem id de modelo em commits/código (convenção do projeto)
- [ ] `janela_prova` vazia em concurso encerrado (regra do `CLAUDE.md`), se editei `data/*.json`
