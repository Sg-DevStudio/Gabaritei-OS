# Prática visual de questões e cartões

## Recorte

Adaptar as três referências enviadas ao Gabaritei existente: configuração visual do teste, justificativa junto de cada alternativa depois da confirmação, cartão de recordação com verso, autoavaliação e tela cheia. Manter temas, teclado e aparelhos pequenos, quantidade de 1 a 100 e todas as identidades/respostas existentes. Não recriar a infraestrutura nem integrar NotebookLM.

## Dados e compatibilidade

`explicacoes` é um array opcional em questões antigas, na mesma ordem das alternativas. Novas gerações exigem o array completo, com validação de tamanho e conteúdo. Sem ele, o comentário já salvo aparece junto da alternativa correta; não inventamos comentários específicos nem executamos IA para preencher cadernos antigos.

`treinoCartoes` guarda contadores acertos/erros, último resultado e data, por ID de questão. É independente de `respostas`. Web e Android preservam as duas estruturas no mesmo caderno privado, mantendo limites e regras de segurança. Não há migração que reescreva cadernos de usuários.

O novo conteúdo aumenta a saída: etapas de três questões no Groq e dez no Gemini reduzem o risco de truncamento. A quantidade personalizada continua até 100, com progresso por etapa e recuperação de lote parcial. Cotas pessoais e cobrança do provedor permanecem as mesmas; nenhum faturamento é ativado.

## Interface

- Quantidade rápida 5/10/20, valor personalizado, dificuldade e tema funcionais; idioma português do Brasil.
- Erro escolhido em vermelho e resposta correta em verde, com justificativas dentro das opções, sem exibir o gabarito da tentativa anterior ao reabrir.
- Cartão clicável, Espaço para virar, setas para navegar, Errei/Acertei com feedback e movimentos distintos. Respeita redução de movimento no navegador.
- Tela cheia pela API quando permitida, com modo imersivo como alternativa. Em celular, metadados e ações secundárias são reduzidos para manter os controles visíveis; criar/excluir continuam acessíveis ao sair desse modo.
- Falha de salvamento aparece dentro da prática, inclusive em tela cheia, com retry e progresso conservado na tela. Autosave feliz não cria um aviso grande a cada resposta.
- Ícones oficiais Heroicons, com licença MIT incluída.

## Validação

Testes de domínio e interface cobrem leitura de cadernos antigos, justificativas, autoavaliação sem alterar respostas objetivas, citações, ausência de gabarito revelado e escape de HTML. Fluxo no navegador com identidade/conteúdo sintéticos: quantidade e dificuldade, erro selecionado, cartões, duas avaliações, gravação, próximo cartão, teclado, recuperação de falha, modo imersivo e viewport móvel. Temas claro/escuro conferidos.

O Android foi compilado, testado e analisado com lint. Não houve validação visual nem instalação em aparelho físico: `adb devices` não encontrou aparelho. Não executamos inferência com chaves reais; o formato e a persistência foram conferidos com respostas controladas.
