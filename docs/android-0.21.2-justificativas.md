# Android 0.21.2 — justificativas e plataformas no plano real

## Alternativa errada

Novas questões pedem justificativas que identifiquem a palavra, condição ou conceito incorreto, com até 40 palavras por alternativa. A explicação aparece dentro da alternativa após conferir a resposta.

Cadernos antigos sem `explicacoes` oferecem **Explicar esta alternativa** depois de uma resposta errada. O botão solicita justificativas usando apenas o enunciado, opções, gabarito, comentário e trecho de referência já existentes. O modelo deve recusar quando a referência for insuficiente ou o gabarito contraditório. Não há geração automática ao abrir o caderno.

O retorno precisa conter uma justificativa não vazia de até 800 caracteres por alternativa. Uma resposta incompleta ou com erro não é aplicada. As justificativas são salvas automaticamente, preservando questões, gabarito e respostas; reabrir e refazer a questão usa esse conteúdo salvo sem nova solicitação. A operação usa a chave e a cota já configuradas na conta, sem escolher um provedor pago como contingência. A explicação é apoio ao estudo; não representa revisão oficial de banca.

## Correção adicional dos atalhos

A conferência física da 0.21.1 mostrou outro problema além da composição de links pessoais: `EditalOutline.read` recriava os tópicos sem copiar `questionLinks`. O catálogo continha os três bancos, mas a tela usava apenas o link simples do Gran. A 0.21.2 preserva a lista completa na estrutura exibida.

Regressão acrescentada para o caminho completo **plano → edital → NotebookLinks**, verificando todas as plataformas e ausência de alteração do estado. No Samsung do usuário, o plano real TRF2 foi aberto e os botões TEC, Gran e Qconcursos foram confirmados em Português, com um único atalho IA no topo. Não foi necessário alterar dados do plano ou resultados de estudo.

## Validação

- 139 testes JVM aprovados; release compilada e lint sem erros.
- 447 testes Node aprovados, 12 ignorados, nenhuma falha.
- Contratos Kotlin/site de estudo, estrutura e links preservados.
- Playwright existente (plugin Browser indisponível), componente real em 1440 e 390 px: erro escolhido, detalhamento no bloco correto, salvamento, reabertura com resposta oculta e uso das justificativas salvas sem nova chamada.
- Falha simulada seguida de nova tentativa preserva o caderno e o gabarito. As respostas de IA nos testes foram simuladas localmente, sem usar chaves ou cotas reais.
- APK instalado sobre o aplicativo principal. Plataformas conferidas fisicamente; chamadas reais de explicação não foram feitas na conta do usuário durante os testes.
