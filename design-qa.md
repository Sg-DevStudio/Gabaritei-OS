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

## Ajustes posteriores solicitados

- Restaurados os ícones originais específicos das conquistas e troféu no cabeçalho.
- Grade responsiva sem rolagem horizontal: seis conquistas no desktop amplo, três em larguras intermediárias e duas no celular; Ver todas expande a coleção completa.
- Editar prova aparece com hover/foco em dispositivos com mouse e permanece acessível em telas de toque.
- Retirado o nome redundante do plano no cabeçalho da disciplina.
- Separados percentuais e totais; no celular os totais ficam na linha seguinte.
- Cenários exercitados em navegador: expansão/detalhe de conquista, hover, escolha de tópico e timer, metas, abertura de disciplina e ausência de overflow.
- Atualização: cabeçalho de conquistas centralizado acima da grade; todas visíveis, sem scroll nem expansão. Conferido desktop e Android emulado, incluindo abertura dos detalhes.

- TRT4 2026: troféu antes de Conquistas; caderno conferido em desktop e 390 px, 12 disciplinas, 133 subtópicos e 128 links. Catálogo e caderno usam o cargo 19 do Edital 01/2026 da FCC. Testes de atualização preservam progresso, links e sessões; filtros amplos e cinco complementos permanecem identificados. Suíte: 320 aprovados, 7 ignorados por ambiente.

- Revisão restrita ao caderno TRT4: 120 tópicos com filtros específicos, 5 amplos com motivo documentado e 8 para complemento. Comparados códigos e nomes à árvore pública oficial do Gran (40.619 categorias). Seis amostras finais abertas no site do Gran confirmaram assuntos e banca selecionados e questões disponíveis. Categorias novas sem acervo foram substituídas ou identificadas como pendentes. Busca de remoção/redistribuição abre capítulos específicos; validada em desktop e celular de 390 px. Browser plugin not available; QA com Playwright/Chrome. Testes: 323 aprovados e 7 ignorados por ambiente. Outros cadernos não foram modificados nesta etapa.

- Revisão integral TRF2/TJSP (29/10/2026): 13 disciplinas/121 tópicos e 12 disciplinas/80 tópicos conferidos, com registro por disciplina. Links recortados preservam bancas e dados pessoais; indisponibilidade no recorte da LBI fica explícita. Novo plano TRT4 Analista Área Judiciária: 13 disciplinas/228 tópicos, requisito Direito, estudo de caso e ausência de corte/incidência aferidos. Testados detalhes, isolamento dos cadernos, busca e links em desktop e 390 px; sem overflow da página nem erros JS. Textos longos da ajuda quebram linha. 330 testes aprovados, 7 ignorados por ambiente. Browser plugin not available: Playwright/Chrome. Prompt movido à raiz; roteiro Android é planejamento, sem substituir o APK atual.


## Android nativo — 29/10/2026

A revisão do piloto 0.3 e suas limitações estão em [docs/android-design-qa.md](docs/android-design-qa.md). Este registro não altera os resultados anteriores do site.


---

# QA — prática visual de questões e cartões

final result: passed

Escopo: adaptação das três fotos do usuário (image-1794509497987.jpg, image-1794509688286.jpg e image-1794509804958.jpg) ao produto existente; não é uma cópia em pixels. As fotos têm perspectiva, outro conteúdo, densidade e enquadramento. Preservamos tipografia, marca, temas, fontes e autenticação do Gabaritei.

## Comparação e iterações

Referência e implementação foram reunidas em uma página de comparação visual, capturada em C:/tmp/gabaritei-qa-comparacao.png. Capturas individuais: C:/tmp/gabaritei-pratica-alternativas.png, C:/tmp/gabaritei-pratica-cartoes.png, C:/tmp/gabaritei-cartoes-mobile.png e C:/tmp/gabaritei-criar-teste-visual.png. As capturas de conteúdo são exemplos locais; não são cadernos de contas reais.

1. P1: os ícones não carregavam por resolução relativa do CSS. Corrigido o caminho dos SVGs oficiais; nova captura mostra ícones de navegação, acerto, erro e expansão.
2. P2: no modo imersivo móvel, o cabeçalho empurrava os botões de avaliação para fora da primeira tela. Reduzidos metadados/ações secundárias e espaçamentos nesse modo. Captura em 390 × 844 mostra cartão, Errei/Acertei e navegação sem corte horizontal.
3. P1: um erro de gravação poderia ficar fora da região expandida. O alerta e o retry agora estão dentro da prática. Simulada uma falha e confirmada a recuperação, sem perda de resposta.
4. P2: indicação de salvamento podia parecer concluída com progresso pendente. O cabeçalho agora distingue salvando, ainda não salvo e salvamento automático.

## Resultado visual e funcional

As alternativas agrupam resposta e justificativa, distinguindo seleção errada e gabarito por cor, texto e ícones. Os cartões mantêm a pergunta como foco, verso clicável e avaliação separada; quantidade/dificuldade/tema têm controles reais. A comparação final não identificou P0/P1/P2 pendente dentro desse recorte.

Conferidos desktop, 390 × 844, temas claro e escuro, ações por clique e Espaço/setas. O navegador bloqueou a API nativa de fullscreen na automação; o modo imersivo foi validado. Console sem erros na execução final. Native Android: build, testes e lint aprovados; teste visual em aparelho permanece fora da validação, pois não há aparelho conectado. Geração por IA real não executada.
