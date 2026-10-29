# Verificação visual do Android nativo

Versão 0.3.0-estudos, 29/10/2026. Aparelho físico: Samsung Galaxy S25 SM-S931B, Android 17/API 37, 1080 × 2340, densidade 450 (largura lógica 384dp), fonte do sistema 1,0. As capturas e o banco pessoal ficam fora do Git.

## Direção implementada

Azul da identidade do Gabaritei, fundos separados dos cartões, contorno discreto, raios de 18dp, espaçamento principal de 12dp e fonte Inter incorporada. Próximo estudo e Ainda hoje ocupam o mesmo cartão. As quantidades ficam abaixo das porcentagens. Navegação inferior com cinco destinos e rótulos completos. O título do plano não repete o ano do edital.

Perfil reúne aparência e conta. Conquistas aparecem em diálogo central, em duas colunas com ícones e requisitos, com rolagem vertical. Logos de TRF2, TJSP e TRT4 aparecem no catálogo. Cadernos mantêm disciplinas recolhíveis, busca e botão compacto do Gran. Criação é um diálogo em duas etapas com confirmação.

## Conferência no S25

- Hoje: estudo conhecido de 60 minutos e 55 questões aparece na semana; 40 acertos resultam em 73% após arredondamento. Nenhum tópico foi marcado concluído indevidamente.
- Temas: Claro selecionado no perfil e aplicado às telas; Auto/Escuro disponíveis e persistidos. Diálogos usam superfície coerente com o tema.
- Conquistas: abertura pelo perfil, título com troféu à esquerda, cartões e fechamento. Sem barra horizontal.
- Planos: quatro cartões, logos visíveis, botões de criação e caderno. Fluxo de rotina e prévia conferido sem criar plano de teste no banco do aluno.
- Desempenho: cartões de tempo, acertos, questões e progresso; filtros 7/30/Tudo, gráfico de minutos e acertos por disciplina. Sem atribuir acerto zero à ausência de questões.
- Notificações: permissão POST_NOTIFICATIONS concedida no fluxo Android; canal e botão Testar aviso disponíveis. Avisos precisos dependem da configuração do sistema.
- Tela cheia: habilitada por padrão, barras acessíveis por gesto; restauração do modo imersivo ao retornar de diálogo ou outra janela. Conteúdo respeita recorte da câmera.
- Troca de abas: rolagem volta ao início para não abrir a nova tela com título cortado.

## Verificação automatizada

24 testes JVM aprovados; lint sem erros (29 avisos, incluindo recomendações de estilo e APIs obsoletas). Três testes instrumentados aprovados no S25, no pacote QA isolado, incluindo sincronização com Auth/Firestore Emulator. Contrato Kotlin → domínio JavaScript aprovado. Suíte do site: 332 aprovados, sete ignorados, zero falhas.

## Limites declarados

Fonte ampliada extrema, leitor de tela e outros tamanhos de aparelho ainda exigem uma rodada específica. A preferência visual final depende do uso pelo aluno. A entrada Google de produção exige a seleção da conta pelo titular; o emulador não substitui essa validação. O piloto ainda não tem paridade de todas as telas do site. Não divulgar como versão pronta para migração geral de alunos.


## Rodada 0.4.0-rotina — 29/10/2026

Nome exibido no aparelho: **Gabaritei**. Pacote técnico mantido para atualizar sem apagar dados. Menu lateral modal de 304dp substitui a barra inferior, com oito destinos e acesso ao perfil/estudo livre no rodapé. Início mantém próximo estudo e apenas um Ainda hoje; semana, revisões e metas ficam acessíveis na mesma tela. Metas são preferências do aparelho.

Disciplinas: nome, cor, ordem por alça ou setas, pausa e arquivamento reversível. Tópicos podem ser adicionados, renomeados e arquivados. As sessões e os IDs ficam preservados; tópicos arquivados continuam identificados no histórico e nos totais por disciplina. Planejamento permite ajustar o tempo de blocos e de etapas de um ciclo existente, sem zerar os créditos.

Estatísticas: Resumo, Evolução e Disciplinas; filtros comuns por intervalo, disciplina, tópico e categoria. Estudos livres ficam fora dos totais do concurso até inclusão explícita. Percentual usa soma de acertos/soma de questões, com amostra visível. Progresso no edital é acumulado e identificado separadamente do período.

Foto de perfil: seletor nativo Android e upload com prévia no site; JPEG quadrado de 256px e representação de até 50.000 caracteres. Remoção mantém revisão; mesclagem com aparelho antigo não restaura a foto. Foto de modo local não é copiada automaticamente para a conta. Não exige acesso amplo à galeria nem um serviço separado de imagens.

Conferências:

- No QA do S25: criação de plano, renomear, mover disciplina pela seta, pausar/retomar, arquivar/restaurar, registro livre, registro do plano, filtros por datas, três vistas estatísticas, tema claro e planejamento.
- Massa sintética: 30 min, 5 questões/4 acertos no estudo livre; 30 min, 10 questões/8 acertos no plano. Cada escopo mostrou seus próprios totais e 80% de acertos.
- 35 testes JVM e lint sem erros (30 avisos). Cinco testes instrumentados aprovados no S25 no pacote QA, incluindo persistência/categoria, reprocessamento da foto e transações concorrentes com Auth/Firestore Emulator. Foto + renomear em clientes diferentes foram preservados; remoção da foto chegou ao outro cliente; outra conta recebeu acesso negado ao histórico.
- Site: 335 testes aprovados, sete ignorados, zero falhas. Seleção, prévia, salvar, exibir no cabeçalho e remover foto conferidos em Chrome isolado, 1365×900 e 390×844, modo de demonstração, sem erros JavaScript. Browser plugin não disponível nesta sessão; usado Playwright do runtime existente.
- Backup privado do banco principal validado antes da instalação: uma sessão, 60 min, 55 questões e 40 acertos. Capturas, fotos de teste e cópia do banco ficam fora do Git.

Limites: a seleção da conta Google de produção continua adiada a pedido do usuário. Essa rodada valida sincronização em emuladores, sem atestar ainda o login Google real no S25. Criar um ciclo completo no app, mover estudo livre para plano, visão geral simultânea de vários planos e métricas de páginas/aulas continuam para etapas posteriores. Fonte ampliada/TalkBack e outros aparelhos precisam de rodada dedicada.


Distribuição manual: APK `release` com depuração desativada e certificado compatível com a versão nativa instalada. Botão de download, detalhes da versão e QR do site passam a apontar para `android-native-v0.4.0/Gabaritei.apk`; o QR foi gerado localmente e decodificado para conferir o destino. A distribuição antiga por TWA continua preservada no histórico de releases.


## Rodada 0.5.0-planos — 29/10/2026

Catálogo público carregado sem login no S25: 14 planos na data da conferência, com seis modelos locais e cache para offline. Card abre detalhes do próprio concurso, com disciplinas recolhíveis, dados cadastrados e referência. Planos sem caderno mostram indisponibilidade e permitem acrescentar links pessoais depois de criar o plano. Planos iniciados não são reescritos pelo catálogo.

Comparação nativa conferida em 63 casos contra a regra do site. Disponibilidade na criação em horas por dia (2 ou 2,5), mantendo os blocos em minutos. Cabeçalhos expansíveis corrigidos para não recortar nomes em múltiplas linhas, incluindo detalhes, caderno e seletor de assuntos.

Lembretes opcionais: dias, horário aproximado, prévia com emoji, canal separado do cronômetro e no máximo um envio regular por dia. Não avisar durante timer ativo; considerar os estudos/simulados disponíveis no aparelho. Reagendar após reinício, ajuste de relógio/fuso e atualização. Desativados por padrão.

Gran Questões 5.2.37: registrados `/aluno/filtro/concursos` e `/simulados/`; URLs dos cadernos usam `/questoes`. A adaptação nativa mantém toda a query, usa o pacote do Gran e deixa a URL web original como alternativa. Interpretação de Textos e Regência/Crase foram abertos e conferidos sem responder questões, inclusive com o Gran já aberto. Fonte Android: https://developer.android.com/training/app-links/about . O comportamento depende da versão do aplicativo Gran; o site conserva os links web.

Verificação: 50 testes JVM aprovados; sete testes físicos no pacote QA aprovados, incluindo cache offline/corrompido, entrega de notificação, supressão após estudo e durante cronômetro, persistência e sincronização com Firebase Emulator. Site: 335 testes aprovados, sete ignorados. Lint sem erros (39 avisos). A cópia QA recebeu nome distinto e backup prévio (zero sessões), sem alterar o banco do app principal. Não incluir capturas pessoais no Git.
