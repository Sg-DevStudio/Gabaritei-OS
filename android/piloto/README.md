# Gabaritei — Android nativo 0.4

Kotlin, Jetpack Compose e Room; pacote `br.com.gabaritei.os.piloto`, separado do beta TWA. O piloto oferece modo local e entrada Google no mesmo projeto Firebase do site. A integração usa o contrato existente, sem substituir o estado remoto por um modelo Kotlin reduzido.

## Experiência

Menu lateral recolhível com Hoje, Planejamento, Planos, Disciplinas, Caderno de questões, Revisões, Estatísticas e Histórico. Perfil reúne temas automático/claro/escuro, tela cheia, conquistas, avisos do cronômetro, conta e exportação de segurança. O catálogo inclui logos dos órgãos e cadernos compartilhados com o site. A criação de plano permite dias, minutos diários e blocos, com revisão antes da confirmação.

Disciplinas podem ser renomeadas, reordenadas por alça ou setas, pausadas e arquivadas com restauração. Tópicos podem ser editados, adicionados e arquivados. IDs e sessões são preservados. Estudos livres ficam separados do concurso e sua inclusão nas estatísticas exige opção explícita. Estatísticas incluem Resumo, Evolução e Disciplinas, com filtros por datas, categoria e assunto. Metas semanais são preferências locais do aparelho.

Notificações são opcionais: o Android 13+ pede permissão em tempo de execução. Avisos exatos dependem da permissão especial do sistema; sem ela o aviso pode atrasar. Timer livre não agenda aviso. Não há registro automático de estudo ao notificar.

## Compilar e verificar

JDK 17 ou 21, SDK Android 35, Gradle 8.11.1. Na raiz:

```powershell
node scripts/android-pilot-catalog.cjs
gradle -p android :piloto:assembleDebug :piloto:testDebugUnitTest :piloto:lintDebug :piloto:assembleQaAndroidTest
```

Nome exibido: **Gabaritei**. O identificador técnico do pacote permanece igual para preservar a atualização e os dados. APK de entrega: `Gabaritei-0.4.0.apk` (origem: `android/piloto/build/outputs/apk/release/piloto-release.apk`). Atualizar com `adb install -r`; não desinstalar nem limpar dados. O login Google requer que a impressão SHA do certificado que assinou o APK esteja registrada no Firebase. O CI verifica código e publica relatórios, não um APK com chave debug diferente.

No Windows, executar o build em cópia com caminho ASCII se a JVM não localizar classes sob `App_Gestão_Estudos`. Conferir os hashes dos fontes entre cópia e projeto. Esquemas Room versionados; migrações destrutivas são proibidas.

## Testes físicos isolados

Usar **somente** `:piloto:connectedQaAndroidTest`: o pacote de QA é `br.com.gabaritei.os.piloto.qa`. Fazer backup do banco normal antes de qualquer teste. O executor do Gradle pode remover o pacote testado; nunca apontá-lo para o app com dados do aluno.

O teste de sincronização instrumentado exige Auth e Firestore Emulator no projeto `demo-gabaritei-android`, com as regras do repositório, portas 9099/8080 e `adb reverse`. Argumento explícito:

```powershell
gradle -p android :piloto:connectedQaAndroidTest '-Pandroid.testInstrumentationRunnerArguments.firebaseEmulator=true'
```

Sem o argumento, o teste remoto é ignorado; não tratar como validado. Nunca usar credenciais reais nesse teste. Ver contrato e limites em `../../docs/android-contas-sync.md` e QA em `../../docs/android-design-qa.md`.

## Foto de perfil

Escolha pelo seletor de fotos Android, sem permissão ampla da galeria. A imagem é reprocessada como JPEG quadrado de 256px, sem metadados, com até 50.000 caracteres na representação armazenada. A conta usa `config.fotoPerfil = { imagem, rev, em }`, compartilhado com o site. Remoção mantém a revisão para impedir restauração por aparelho antigo. No modo local, a foto fica no banco local; entrar em uma conta não copia sua foto local automaticamente. A troca de conta durante a seleção cancela o salvamento nesse perfil.

A distribuição manual 0.4 usa a variante `release`, com depuração desativada e o mesmo certificado dos APKs já instalados, para preservar atualizações. A chave de assinatura permanece fora do Git. O CI compila essa variante para verificação, sem publicar o APK assinado pelo ambiente temporário. A publicação em loja exige planejamento próprio de assinatura e validação completa do login.
