# Android 0.21.3 — riscar alternativas

Na resolução interna de questões, cada alternativa tem uma tesoura. O primeiro toque risca a opção e troca o ícone por restaurar; o segundo desfaz o risco. O controle tem área de toque própria, separada da seleção da resposta. Uma transição de 170 ms suaviza a mudança. No site, a animação respeita `prefers-reduced-motion`; no Android, usa as animações do Compose e a escala de movimento do sistema.

## Regras da tentativa

- Riscar a opção atualmente selecionada limpa a seleção temporária. Restaurá-la não a marca automaticamente.
- Riscar outra opção conserva a escolha atual.
- Uma opção riscada fica indisponível para seleção e não pode ser confirmada por engano.
- Qualquer alternativa pode ser riscada, inclusive a correta: o recurso não consulta o gabarito nem dá pistas.
- Os riscos permanecem ao navegar entre questões e usar tela cheia durante a tentativa.
- Ao conferir, a correção mostra todas as opções normalmente. Reabrir o caderno inicia uma tentativa sem riscos ou seleção anterior.

Os riscos são rascunho local. Não alteram o banco, respostas já salvas, acertos, tempo, histórico ou documentos da nuvem. Não usam IA. Somente “Conferir resposta” mantém o fluxo existente de registrar a resposta.

## Implementação

Site: mapas locais separados de `respostas`, controles com `aria-pressed`, nomes de ação por alternativa, navegação por teclado e alvo de toque de 44 px. Recriar o HTML preserva a seleção ainda não confirmada.

Android: estado local da tentativa separado do `JSONObject` do caderno, seleção acessível com papel de alternativa e botões próprios para riscar/restaurar. Nenhuma migração de Room, Firestore ou formato dos cadernos foi necessária.

## Verificação

- 141 testes JVM aprovados, compilação release e lint sem erros.
- 449 testes Node aprovados, 12 ignorados e nenhuma falha.
- Contratos Kotlin/site preservados.
- Playwright existente (plugin Browser indisponível), 1440 e 390 px: cortar/restaurar, limpar apenas a seleção riscada, preservar seleção de outra opção, navegar, tela cheia, ausência de gravação antes de confirmar, nova tentativa limpa, movimento reduzido e nenhum erro de execução.
- O fluxo anterior de detalhar alternativas também foi verificado nas duas larguras, incluindo salvamento, falha e reutilização das explicações. Chamadas de IA foram simuladas, sem cota real.
- APK instalado sobre o aplicativo principal. Com a tela estabilizada, a conferência física confirmou: selecionar uma opção, riscá-la e verificar que ficou desmarcada; restaurá-la e verificar que não foi selecionada automaticamente. O teste usou somente o rascunho da tentativa, sem tocar em “Conferir resposta”, gerar questões ou executar IA.
