# 003 — Atualizar referências e preservar o histórico

- **Status:** implementado
- **Atualizado em:** 2026-11-04

## Objetivo
Aplicar revisões de conteúdo e permitir a troca explícita da referência anterior
por um novo edital no mesmo plano, preservando registros e rotina.

## Fluxo
- Recuperar imagens ausentes quando a origem do plano estiver identificada.
- Avisar em Hoje e Planejamento quando a referência tiver uma versão posterior.
- Exibir prévia de assuntos novos, ajustados e retirados e dados da referência.
- Aplicar somente por ação do aluno. A troca para outro edital também é explícita
  em Atualizar referência. Planos combinados não são convertidos em um único edital.
- Guardar registro de cada atualização dentro do plano. Novos tópicos ficam
  pendentes; os retirados permanecem identificados para manter o histórico.
- Não regenerar a agenda/ciclo ou modificar metas pessoais automaticamente.

## Identidade e preservação
Na mesma origem, IDs estáveis preservam progresso. Para outra origem, reutilizar
apenas nomes exatos e únicos dentro da disciplina correspondente. Não usar
semelhança textual ou reaproveitar um ID ocupado por conteúdo diferente. Guardar
o mapa entre IDs do catálogo e IDs locais para as revisões seguintes.
Sessões, revisões, simulados, flashcards, links pessoais e agenda não são apagados.

## Cadernos e logos
Localizar o plano pelo ID do edital antes do título. Isolar os quatro cadernos
publicados por edição/cargo, sem forçar a base de 2024 em um edital futuro.
Preservar links pessoais pelos IDs mapeados. Exibir a imagem do órgão no caderno.
Links do TEC e Gran usam logos com nome acessível e descrição ao passar o mouse.

## Verificação
Testes de migração/preservação e identidade dos cadernos, auditoria estrutural de
562 tópicos nos quatro cadernos disponíveis, testes de interface desktop/celular.
As contagens do banco de questões externo não são revalidadas por esta auditoria.
Não há edição direta das contas de outros alunos: cada usuário recebe o fluxo ao
abrir o site; conteúdo depende de sua ação na prévia.
