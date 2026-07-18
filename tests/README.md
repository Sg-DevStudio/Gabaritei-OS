# Testes

Suíte das regras de domínio, contratos de integração, codec de sincronização e
segurança do Firestore. Os testes JavaScript usam o runner nativo do Node; as
regras usam o emulador oficial.

```bash
npm test
npm run test:rules
node --test tests/desempenho.test.js
```

- `helpers/load-domain.js` carrega `js/domain.js` em um `window` global de teste.
- Cada arquivo cobre um eixo: datas, revisões, desempenho, planejamento,
  sincronização, integrações críticas ou permissões.
- A suíte roda em Pull Requests e em pushes para `main` por
  `.github/workflows/test.yml`.

As regras puras continuam concentradas em `domain.js`; os testes de contrato
blindam integrações críticas sem precisar simular toda a interface.
