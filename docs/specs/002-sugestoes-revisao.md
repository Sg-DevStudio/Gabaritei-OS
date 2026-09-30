# 002 — Controle de sugestões de revisão por plano

- **Status:** implementado
- **Atualizado em:** 2026-09-30

## Contexto e objetivo

Alunos que seguem um sistema próprio de revisão precisam poder suspender as sugestões automáticas do Gabaritei sem perder o histórico. O controle fica no Planejamento, na mesma linha de Editar plano, Edital e Excluir.

## Comportamento

- Botão alterna entre “Desativar sugestões de revisão” e “Ativar sugestões de revisão”, com `aria-pressed` refletindo o estado.
- Preferência independente por plano, salva localmente e sincronizada junto ao plano.
- Planos sem a preferência explícita mantêm sugestões ativas.
- Desativar impede novos agendamentos automáticos, reforço, manutenção e alterações automáticas do espaçamento; suspende pendências automáticas na fila, calendário, alertas e exportações e libera sua carga no planejamento futuro.
- Revisões concluídas e blocos manuais ficam preservados. Revisões explicitamente identificadas como manuais também continuam visíveis.
- Reativar retoma as pendências preservadas e habilita sugestões para estudos futuros; não cria uma curva retroativa em massa.
- A aba Revisões explica quando as sugestões estão suspensas e aponta para Planejamento. Flashcards continuam independentes.

## Dados

Campo booleano opcional `state.planos[].plano.sugestoesRevisao`. `false` suspende sugestões; `true` ou ausência mantém o comportamento anterior. `state.plano` é o espelho hidratado da entrada ativa. Sem mudança no schema nem nas regras Firestore: o estado já é serializado em chunks.

## Verificação

- Testes de domínio: padrão ativo, pendências sem carga quando suspensas, histórico preservado, revisões manuais, persistência, troca de plano e reativação.
- Testes da sincronização: limpeza total em ambos os sentidos, trabalho posterior, falha de gravação, restauração durante leitura, troca de conta e envio agendado com estado substituído.
- Service worker: migração de cache conhecido e isolamento de caches de outras PWAs.
- Navegador: alternar botão, conferir persistência após recarga, confirmar suspensão na aba Revisões e testar largura móvel.
