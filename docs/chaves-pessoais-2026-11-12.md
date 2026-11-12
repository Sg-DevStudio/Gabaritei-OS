# Chave pessoal e acesso aos cadernos

- Um único campo aceita chaves Gemini (AIza…) e Groq (gsk_…), identificando automaticamente o provedor antes de validar. A chave do Groq não passa mais pelo validador do Google.
- A configuração é oferecida a qualquer usuário autenticado, inclusive no Android, sem depender de permissão de administrador ou de um plano ativo.
- Os documentos privados existentes permanecem separados por UID: aiPersonal para Gemini e groq para Groq. Nenhuma chave é compartilhada entre usuários, copiada para o estado de estudos ou incluída em backups/exportações.
- A conta solicitada foi identificada pelo e-mail informado pelo responsável. A consulta confirmou conta ativa e ausência de chave. Não foi necessário alterar privilégios, histórico ou dados de estudos. A própria titular deve conectar sua chave.
- No Android, uma conta sem plano já pode abrir Meus cadernos, Criar com IA e Ajustar minha IA, em vez de permanecer em um carregamento sem fim. A chave digitada não é salva no estado da tela; a troca de conta fecha o formulário.
- A validação consulta metadados do provedor e grava somente depois de confirmar que o usuário continua sendo o mesmo. Não faz inferência para testar a chave e não ativa faturamento. A geração depende da cota do projeto/conta.
- O formulário único e o envio ao provedor correto foram conferidos em prévia local com identidade e chaves sintéticas. A geração real exige a chave da própria usuária; nenhum segredo foi solicitado no chat.

## Polimento do formulário

Botões menores no PC e com área de toque de 44 px no celular. Fechar é secundário; Conectar chave é a ação principal. Desconectar aparece numa área separada e apenas quando há Groq conectado. O consentimento tem marca de seleção azul com contraste, texto clicável e foco de teclado visível. Validação de consentimento ocorre dentro do card.

Conferido no navegador em tela de PC e em 390 × 844, nos temas claro e escuro, com identidade/chaves sintéticas. Testados o clique no texto do consentimento, o aviso ao tentar conectar sem confirmar, os dois provedores no campo único e o desaparecimento da ação de desconectar quando não há Groq conectado. Nenhuma chamada real de geração ou chave de usuário foi usada na validação.

## Foco dos controles de seleção no site

As regras gerais de foco agora usam focus-visible. A modalidade de interação é identificada por pointerdown/keydown, porque o select nativo do Chrome também pode corresponder a focus-visible depois de um clique. Durante mouse/toque, caixinhas, rádios e listas não exibem contorno ou sombra de foco persistente. O foco continua no elemento e a indicação de teclado volta ao usar as teclas, sem blur forçado nem alteração do estado selecionado.

Verificação no navegador: marcar/desmarcar nas regras gerais, nos cadernos e nas redações; alternar rádio; abrir/fechar select; Tab para checkbox e select. Confirmados outline/shadow ausentes após clique e outline de teclado preservado. Sem erros de console. O teste local não gravou dados de contas.
