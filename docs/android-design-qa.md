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
