# Conferência visual — 28/10/2026

final result: passed

Escopo deste resultado: interface web. A instalação e as notificações do APK em aparelho físico continuam pendentes; a distribuição Android é beta.

## Referência e evidências

Direção: conceito 3, livro roxo do conceito 2, conquistas existentes. As instruções posteriores do usuário substituem a composição inicial do desktop: frase no lugar da saudação, conquistas centralizadas no topo e remoção do painel de histórico de constância.

Pasta de evidências local: `C:/Users/Samuel Gomes/Documents/Codex/2026-10-10/a/modernizacao-gabaritei/`.

- Fonte: `conceito-aprovado-revisado.png`, 1536 × 1024, prancha com desktop e celular.
- Implementação final: `21-topo-desktop-validado.jpg`, desktop 1905 × 912 úteis, viewport de navegador padrão de 1920 px com barra de rolagem.
- Comparação conjunta: `comparacao-final.jpg`, fonte e implementação no mesmo arquivo, redimensionadas proporcionalmente. Comparação de composição e hierarquia, sem presumir equivalência pixel a pixel: a prancha contém molduras e vários estados, e os dados são diferentes.
- Região focal do topo: inspecionada no screenshot original `21-topo-desktop-validado.jpg`, em resolução legível, além da prancha comparativa.
- Celular após o último ajuste: `22-mobile-topo-validado.jpg`, viewport solicitado 390 × 844, área útil de 375 px descontando a barra de rolagem. DOM confirmou largura total igual à largura útil e conquistas fora do cabeçalho desktop.
- Tema escuro/menu recolhido: `18-escuro-menu-recolhido.jpg`. A composição final do topo reutiliza os mesmos tokens de tema verificados.

## Revisões e correções

1. O bloco de conquistas herdava uma largura máxima inferior à coluna semanal. Corrigido para preencher a coluna e, após a revisão do usuário, centralizar no novo topo com limite de 560 px. Evidências posteriores: `18-escuro-menu-recolhido.jpg` e `21-topo-desktop-validado.jpg`.
2. Os textos de apoio dos indicadores esticavam os cartões no celular. O complemento foi retirado da apresentação móvel; título e valor continuam visíveis. Evidências posteriores: `19-mobile-final.jpg` e `22-mobile-topo-validado.jpg`.
3. A saudação ocupava a faixa que o usuário queria aproveitar. Frase e conquistas foram movidas para essa faixa somente no desktop; o redimensionamento devolve os elementos à organização móvel. Evidência: `21-topo-desktop-validado.jpg` e verificação DOM móvel posterior.
4. O painel de constância foi removido da geração do início, conforme solicitado. Verificação DOM em desktop e celular: ausência de `.constancia-card`. Histórico e domínio não foram apagados.

## Superfícies de fidelidade

- Tipografia: mantida IBM Plex Sans/Mono do produto, hierarquia de título, disciplina e tópico legível. O conteúdo da demonstração é Administração Pública/TRF3, diferente do Português/TRF2 ilustrativo.
- Espaçamento: plano em faixa fixa própria, resumo semanal único, estudo antes dos detalhes secundários, conquistas compactas. Desktop usa o espaço extra disponível; celular prioriza a ação.
- Cores: azul, fundo claro, lateral marinho e tema escuro por tokens. O tema escuro abrange conteúdo e controles.
- Imagens/ícones: logotipos institucionais existentes preservados, ícones SVG da biblioteca do app, livro roxo para Português. Selos originais mantidos a pedido. QR gerado com dados reais, sem usar o desenho ilustrativo do conceito.
- Conteúdo: valores vêm do estado existente. Sem plano, a chamada convida a escolher um concurso. Não foram criados estudos ou planos na conta real para a conferência.
- QR: o teste de redução falhou a 92 px úteis e passou a 104 px. O componente foi ajustado para reservar pelo menos 104 px úteis no celular e mais espaço no desktop.

## Interações e limites da verificação

- Abrir demonstração, expandir conquistas, abrir e fechar o detalhe de um selo.
- Alternar tema, recolher e reabrir menu; plano permanece visível.
- Redimensionar desktop/celular sem estouro horizontal.
- Iniciar estudo pela fila, pausar e descartar o timer de teste sem registrar sessão.
- Console inspecionado: Chrome exibiu mensagens de canal de extensão fechado durante a automação; não houve erro de renderização do app nos cenários conferidos. O navegador interno não apresentou erro de aplicativo na primeira conferência.
- Suíte: 294 aprovados, 7 dependentes do emulador Firestore não executados localmente; sintaxe verificada.
- APK: build release/lint sem erros, assinatura verificada e associação de domínio disponível. Teste de login/alertas no Android físico pendente.

Sem pendência P0/P1/P2 identificada na interface web conferida. Polimento futuro: ícones específicos para outras disciplinas e validação visual de conteúdo real de Português quando ele estiver na fila, sem alterar a ordem de estudo do usuário.
