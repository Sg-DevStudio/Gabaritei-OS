# 002 — Cadernos pessoais do TEC

- **Status:** implementado
- **Atualizado em:** 2026-11-04

## Objetivo
Abrir cadernos do TEC a partir dos blocos e disciplinas do Gabaritei e lançar
manualmente o resultado da prática no histórico já existente.

## Fluxos
- Em Hoje ou no detalhe da disciplina, vincular um endereço HTTPS do TEC.
- Abrir o caderno em outra aba sem creditar estudo automaticamente.
- Registrar tópico, tempo real, questões feitas e acertos; usar as métricas,
  metas e ajustes de revisão existentes.
- Editar/remover o vínculo, preservando histórico e materiais de outras plataformas.
- Na agenda, respeitar a disciplina e o tópico escolhidos no formulário do bloco.

## Dados e regras
- `planos[].links[]`: `tipo: tec-questoes`, id, disciplinaId, nome, url, oculto,
  revVinculo e atualizadoEm. Um vínculo por disciplina e plano.
- Remoção mantém item oculto. Revisão do vínculo evita restauração por aba antiga.
- `sessoes[].plataformaQuestoes: tec` identifica a origem, sem mudar o cálculo.
- Domínio HTTPS exato tecconcursos.com.br ou www.tecconcursos.com.br, sem credenciais.
- Questões/acertos inteiros, 1–999 questões, 0–feitas acertos e 1–720 minutos.
- No modo exemplo, alterações continuam somente em memória.
- Seguir o tema e as proporções atuais, com ações que se ajustam ao celular.

## Fora do escopo
API do TEC, extração de questões, captura de login, importação automática de
resultados e alterações no APK nativo.

## Verificação
- Testes de URL, isolamento entre planos, edição/remoção, persistência, mescla de
  abas e inclusão das sessões nas métricas em `tests/tec-questoes.test.js`.
- Teste de interface em perfil descartável, desktop e celular, com dados sintéticos.
- Login real do TEC e sincronização autenticada em aparelhos não são simulados
  como prova de integração: este recurso usa links externos e o fluxo de sync existente.
