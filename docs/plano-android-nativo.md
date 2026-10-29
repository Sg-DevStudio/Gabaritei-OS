# Gabaritei OS — proposta para um app Android nativo

Planejamento inicial, conferido em 29/10/2026. O piloto local foi aprovado e está sendo implementado no módulo `android/piloto`; não substitui o APK atual. Escopo, decisões e aceite: [piloto Android](android-piloto.md).

## Estado atual e objetivo

O projeto `android/` atual usa Trusted Web Activity. A `MainActivity.java` abre o site publicado no navegador e possui uma ponte para alarmes e notificações. Essas integrações nativas são úteis, mas as telas e a maior parte das regras continuam no site.

O objetivo proposto é ter telas Android próprias, navegação imediata, estudo e registros locais, cronômetro confiável com a tela bloqueada e sincronização compatível com o site. Abrir questões no Gran continuará dependendo da internet e do acesso do aluno à plataforma externa.

## Direção recomendada

Para um produto focado em Android, recomendo **Kotlin + Jetpack Compose**, com Material 3. A interface será renderizada pelo Android. O site poderá continuar atendendo quem usa computador.

Reaproveitaríamos os JSONs de editais, cadernos e fontes, a identidade visual, o modelo dos dados, os cenários de teste das regras e, depois de validar compatibilidade, o mesmo Firebase e a conta do aluno. As telas HTML/CSS e as regras JavaScript não viram telas ou regras Kotlin automaticamente: essa parte precisará ser implementada e comparada com o comportamento existente.

Flutter ou React Native também podem produzir aplicativos próprios. Se iOS entrar no objetivo, vale reavaliar essa escolha antes de começar. Para Android como prioridade, Compose evita acrescentar uma camada de execução e oferece integração direta com os recursos do aparelho. Esta é uma recomendação de arquitetura, não uma alegação de que outra tecnologia seria incapaz de atender ao produto.

Referências: [Compose](https://developer.android.com/compose), [armazenamento local com Room](https://developer.android.com/training/data-storage/room).

## O que pode começar sem custo de serviço

| Parte | Caminho inicial | Limite real |
|---|---|---|
| Desenvolvimento e testes locais | Android Studio, Kotlin, Compose, emulador e aparelho por ADB | Tempo de implementação e capacidade do computador/aparelho |
| Dados sem internet | Room para dados e DataStore para preferências | Armazenamento do aparelho; backup e migrações precisam ser implementados |
| Catálogo de planos e links | JSONs versionados, incluídos no aplicativo | Atualização desses dados precisa de um fluxo explícito |
| Pequeno piloto com distribuição registrada | Conta de distribuição limitada do Android Developer Console | Gratuita para até 20 dispositivos, conforme as regras atuais |
| Sincronização | Reutilizar os serviços existentes que couberem nas cotas gratuitas | É preciso conferir plano de cobrança, consumo, regras e compatibilidade do projeto real |

**Publicar na Google Play não é gratuito:** a conta tem taxa única de US$ 25. Há também requisitos de verificação e testes, conforme o tipo de conta. A distribuição limitada gratuita não equivale a lançar um produto sem limite de alunos. O Google já iniciou a implantação regional de verificação em lojas participantes e prevê expansão. Antes de escolher o canal público, precisamos conferir as regras vigentes para aquele canal e os aparelhos atendidos.

Fontes: [taxa e cadastro da Play Console](https://support.google.com/googleplay/android-developer/answer/6112435?hl=pt-BR), [contas limitadas e taxa da distribuição completa](https://support.google.com/android-developer-console/answer/16561738?hl=en), [implantação da verificação Android](https://developer.android.com/developer-verification).

O Firebase tem plano Spark e cotas gratuitas, mas isso não significa backend ilimitado. Cloud Functions requer Blaze e uma conta de faturamento; serviços e uso acima das cotas podem gerar cobrança. Não habilitar cobrança, contratar serviço nem criar infraestrutura adicional sem uma decisão específica do usuário. IA para transformar PDFs em questões fica fora da primeira versão: não assumir que APIs de Google ou DeepSeek serão gratuitas ou ilimitadas.

Fonte: [planos e cobrança do Firebase](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans).

## Implantação em etapas

### 1. Especificar a primeira versão

Mapear os fluxos atuais e acordar uma lista curta de telas essenciais: Hoje, Planos/Planejamento, caderno de questões, cronômetro e registro de estudo. Definir o que precisa funcionar sem internet e qual aparelho será usado para validar. Revisões, desempenho, conquistas e configurações entram no plano de paridade; a sequência deve seguir a rotina real do aluno.

Entregável: especificação curta, telas priorizadas, critérios de pronto e inventário dos dados que precisam ser preservados.

### 2. Criar uma primeira experiência nativa local

Implementar navegação, identidade visual e uma sequência utilizável: escolher plano → escolher tópico → iniciar estudo ou abrir o Gran → registrar a sessão. Usar dados de exemplo e banco local. A interface principal não pode ser uma WebView carregando o site.

Aceite: o app inicia sem rede; navegação e consulta ao edital funcionam; registro persiste após fechar e abrir; links externos usam o mecanismo do Android, com retorno ao app. O sistema operacional e os links verificados do Gran determinam se o destino abre no app ou no navegador; não prometer abertura forçada no aplicativo do Gran.

### 3. Portar as regras e o cronômetro

Reimplementar as regras de fila, agenda, revisão, metas e indicadores em Kotlin, comparando as saídas com casos de teste do domínio atual. Usar identificadores estáveis para sessões e tópicos. O timer deve calcular o tempo transcorrido a partir de referências persistidas, sem depender de uma tela atualizando a cada segundo.

Testar pausa, retomada, término, Pomodoro, bloqueio de tela, retorno do segundo plano, mudança de horário e reinicialização. Alarmes, permissões e restrições de bateria precisam ser tratados conforme a versão Android. Não chamar isso de confiável apenas porque funciona no emulador; validar em aparelho físico.

### 4. Integrar a conta e a sincronização

Conferir o contrato atual em `js/firebase-sync.js`, incluindo o documento `users/{uid}/state/app`, identificação dos planos, versões e regras de segurança. O mesmo login deve identificar a mesma pessoa. Não sobrescrever o documento inteiro a partir de um modelo Kotlin incompleto.

Primeiro usar backups de teste e comparação de importação/exportação. Definir versionamento, fila de alterações locais, deduplicação de sessões e resolução de conflitos antes de gravar dados reais. Validar edição offline seguida de sincronização, uso simultâneo do site e app, troca de conta e interrupção de rede. Mudanças de esquema precisam preservar compatibilidade durante a transição.

### 5. Fazer um piloto e expandir a paridade

Distribuir para um grupo pequeno, coletar problemas de uso e estabilidade e corrigir antes de uma publicação ampla. Depois completar revisões, desempenho, conquistas e ferramentas que forem prioritárias. Preservar a chave de assinatura do aplicativo; conferir se o novo APK pode atualizar o beta existente sem perder dados.

## Decisões para nossa conversa

- O app deve compartilhar conta e histórico com o site desde a primeira versão ou isso entra após o piloto local? Minha proposta é validar primeiro a experiência local e exigir sincronização compatível antes de migrar alunos reais.
- Quais cinco ações o aluno mais executa no celular? Elas definem o primeiro fluxo, não a ordem das abas do site.
- Qual é o tamanho do piloto e qual aparelho Android será usado para testar? Até 20 dispositivos registrados permite começar com a modalidade limitada gratuita.
- O produto ficará só em Android ou há intenção concreta de iOS? Isso pode mudar a escolha de tecnologia.

Respostas recebidas: piloto inicialmente local; sincronização compatível obrigatória antes de alunos reais; fluxo central do site adaptado para telas nativas; um participante com Samsung S25; somente Android. As perguntas acima registram a decisão original e não são pendências de aprovação.

Critério de sucesso: um aluno consegue estudar, registrar e retomar sua rotina em telas Android próprias, sem perda de histórico e sem depender de recarregar o site.
