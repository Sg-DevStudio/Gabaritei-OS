# Gabaritei — piloto Android nativo

## Versão atual: 0.3.0-estudos

O piloto agora tem conta Google, sincronização compatível, criação de rotina, notificações opcionais, temas, tela cheia, logos, desempenho e conquistas no perfil. Consulte [contas e sincronização](android-contas-sync.md) e [verificação visual](android-design-qa.md). As seções abaixo registram o escopo histórico da versão 0.1 e suas pendências à época.

## Decisões aprovadas em 29/10/2026

- Android como única plataforma móvel neste momento; Kotlin e Jetpack Compose.
- Um participante, com Samsung Galaxy S25. Versão Android/One UI será anotada no teste físico.
- Primeira entrega local para validar a experiência. Conta e histórico compatíveis com o site são obrigatórios antes de migrar alunos reais.
- Fluxo baseado na rotina central do site: plano → próximo estudo → tópico → estudar ou resolver questões → registrar e retomar.
- Desenvolvimento e teste local sem serviço pago. Nenhuma conta de cobrança ou inscrição em loja é criada nesta etapa.

## Experiência e critérios de aceite

Interface compacta, azul do Gabaritei, cartões com pouca distância entre eles, texto legível e alvos de toque adequados. As telas são renderizadas pelo Android. Há quatro destinos no piloto: Hoje, Planos, Questões e Histórico. Isso é uma sequência inicial de validação, não uma decisão de remover as outras funções do produto.

| Fluxo | Critério observável |
|---|---|
| Escolher plano | Catálogo abre sem internet; seleção é mantida ao reabrir |
| Escolher tópico | Busca e disciplinas expansíveis apresentam os tópicos reais do edital |
| Estudar | Cronômetro pode ser pausado, retomado e concluído; apenas um fica ativo |
| Resolver questões | Um link por tópico, abrindo pelo mecanismo padrão do Android; link pessoal pode ser alterado e restaurado |
| Registrar | Tempo e questões são validados; repetição do envio não duplica a sessão |
| Retomar | Sessões, conclusão de tópicos, preferências e links ficam em banco local |

O catálogo é gerado das mesmas fontes versionadas do site. IDs de concurso e tópico são preservados. Os dados pessoais do piloto têm um esquema próprio explicitamente local; não se afirma compatibilidade de sincronização apenas porque os nomes dos campos coincidem.

## Estrutura e limites desta entrega

Módulo `android/piloto`, pacote `br.com.gabaritei.os.piloto`, nome Gabaritei Piloto. Instala ao lado do beta TWA existente; não compartilha dados locais com ele e não substitui seu pacote. Não incorpora Firebase nem solicita permissão de rede. Links externos são enviados ao Android; o aplicativo de destino é quem usa a rede.

Room mantém sessões, conclusão, links pessoais, escolha de plano/tópico e cronômetro. O tempo usa relógio monotônico durante a mesma inicialização do aparelho. Após reiniciar o aparelho, o cronômetro é pausado e conserva o tempo consolidado na última pausa; não conta o período desligado nem inventa tempo perdido. Aviso de término, Pomodoro, serviço em primeiro plano e recuperação detalhada após reinicialização continuam pendentes. O cronômetro inicial é livre.

Agenda automática, revisões, metas, conquistas e paridade completa de indicadores continuam no plano de evolução. Não apresentá-los como implementados neste piloto. O bloco Ainda hoje é uma sugestão do próximo tópico não concluído, não um bloco da agenda automática do site.

## Contrato mínimo de dados locais

| Entidade | Chave e campos principais | Regra |
|---|---|---|
| Session | UUID, planId, topicId, segundos, questões, acertos, data final em epoch ms | Insert idempotente; acertos ≤ questões; tempo 1 segundo a 24 horas |
| Progress | planId + topicId, completed | Conclusão opcional, independente da quantidade de questões |
| PersonalLink | planId + topicId, HTTPS URL | Sem credenciais no URL; vazio restaura referência |
| Settings | registro único, plano e tópico selecionados | Não altera outro plano |
| Timer | registro único, UUID da sessão, plano, tópico, acumulado, referência monotônica, boot | Não permite dois cronômetros simultâneos |

## Validação no S25

- Instalar ao lado do beta atual; conferir nome e ícone.
- Modo avião: abrir planos, trocar plano, buscar tópico e fazer registro manual.
- Fechar e abrir: conferir plano, histórico, conclusão e links pessoais.
- Rodar timer, bloquear por dois minutos e retornar; comparar com relógio independente.
- Pausar, sair, reabrir e retomar sem contar o intervalo pausado.
- Concluir duas vezes rapidamente: apenas uma sessão no histórico.
- Abrir Gran, voltar e conferir seleção e timer; não prometer que o Gran abrirá no app em todos os aparelhos.
- Testar tema escuro, tamanho de fonte ampliado, teclado aberto e navegação de voltar.
- Executar testes instrumentados de banco após conectar o aparelho.

## Condições antes de usar contas reais

Especificar o contrato atual do site em `users/{uid}/state/app`, autenticação, deduplicação por UUID, fila offline, conflitos entre site e celular, campos desconhecidos e migrações. Importação/exportação deve fazer uma ida e volta sem perda de campos. Nenhuma gravação a partir do modelo parcial do piloto pode sobrescrever o estado real inteiro. Testar com cópias de dados e contas de teste antes de habilitar gravação real.

Referências: [Compose e BOM](https://developer.android.com/develop/ui/compose/bom), [Room](https://developer.android.com/jetpack/androidx/releases/room), [distribuição Android e contas limitadas](https://developer.android.com/developer-verification).

## Resultado da primeira entrega local — 29/10/2026

- APK debug `0.1.0-local`, 10.295.103 bytes, assinatura v2 verificada. Pacote, nome, SDK mínimo 26 e alvo 35 conferidos no manifesto compilado. Sem permissão INTERNET.
- Compilação do app e do APK de testes instrumentados concluídas. Três testes JVM de domínio passaram; teste Node do catálogo passou. Lint sem erros; permanecem avisos de versões de dependências mais novas e sugestões KTX.
- 4 planos e 562 tópicos no catálogo offline, preservando IDs, URLs, pendências e avisos de recorte sem questões.
- Fontes usadas na cópia de build conferidas por hash contra o projeto. Hash SHA-256 do APK entregue: `4CFE31FE8C04707A130209A50E359A796999BD16DFACC5FF4DCC340E9F4ABCAF`.
- Aparelho não conectado. Usuário preferiu instalar o APK manualmente depois. Interface renderizada, persistência em aparelho, retorno do Gran e cronômetro com tela bloqueada ainda precisam de teste no S25. Os testes instrumentados foram compilados, não executados.
- Nenhuma conta de produção foi conectada; nenhum dado real do site foi migrado; o APK TWA e seu link público de download foram preservados.
