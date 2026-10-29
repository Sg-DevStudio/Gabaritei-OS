# Design QA — Hoje, versão 3

final result: passed

Referência: terceiro resultado visual aprovado na conversa (Painel integrado).
Implementação: aplicação existente, rota Hoje, com dados reais do modo de demonstração.
Comparação: referência e captura desktop reunidas em comparacao-v3.png, viewport desktop 1586 × 992; verificação adicional Android emulado em 390 px.

## Iterações

- P2: regra antiga ocultava conquistas após o terceiro item. Corrigida removendo a classe de compactação antiga; a faixa agora permite rolagem horizontal e expansão.
- P2: ícone de agenda apontava para símbolo inexistente. Corrigido para o sprite ic-agenda existente.
- Corrigidos espaçamento, divisórias, altura dos cards, tempo planejado e percentuais de metas.
- Comparação posterior: conquistas visíveis no topo, estudo e metas em painel único, resumos em faixa, semana e disciplinas em colunas; sem achados P0/P1/P2 remanescentes.

## Comportamentos conferidos

- Busca e seleção de tópico; cronômetro recebe o tópico escolhido.
- Abertura de conquista, expansão e recolhimento da faixa.
- Edição de meta semanal e preservação das metas ao salvar o perfil.
- Um item em Ainda hoje; três resumos; calendário oculto no Android, conforme preferência anterior.
- Sem overflow horizontal da página nem erros JavaScript nos cenários testados.
- Suíte automatizada: 316 testes aprovados, 7 dependentes de ambiente ignorados.

## Diferenças deliberadas

O concurso, as conquistas, as datas e os números da demonstração diferem dos dados ilustrativos da referência. São preservados os controles existentes de registro e os ícones do sistema. A faixa de conquistas permite acessar todas, em vez de simular conquistas que o aluno não obteve. O aviso de modo exemplo permanece apenas na demonstração.

Limite: autenticação e sincronização com uma conta real não foram exercitadas nesta rodada visual.
