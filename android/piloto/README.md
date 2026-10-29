# Gabaritei Piloto — experiência nativa local

Kotlin + Jetpack Compose + Room. Pacote `br.com.gabaritei.os.piloto`, separado do beta TWA. Não acessa Firebase nem sincroniza com a conta do site. O cronômetro inicial é livre e não envia notificações.

## Compilar

JDK 17 ou 21, SDK Android 35 e Gradle 8.11.1. Defina `JAVA_HOME`, `ANDROID_HOME` e, se desejar, `GRADLE_USER_HOME`. As dependências iniciais estão fixadas em versões estáveis compatíveis com esse ambiente; não são uma alegação de serem as versões mais recentes.

Na raiz do repositório:

```powershell
node scripts/android-pilot-catalog.cjs
gradle -p android :piloto:assembleDebug :piloto:testDebugUnitTest :piloto:lintDebug :piloto:assembleDebugAndroidTest
```

APK: `android/piloto/build/outputs/apk/debug/piloto-debug.apk`.

## Aparelho de teste

Habilite as opções do desenvolvedor e a depuração USB no S25; conecte por cabo e autorize este computador na tela do celular. Use o `adb` do SDK:

```powershell
adb devices -l
adb install -r android/piloto/build/outputs/apk/debug/piloto-debug.apk
gradle -p android :piloto:connectedDebugAndroidTest
```

Não desinstalar o piloto entre atualizações quando quiser preservar os registros locais. O APK debug é destinado a este piloto e não substitui uma distribuição pública assinada. Antes de alunos reais, concluir autenticação, migração e sincronização testadas, conforme `docs/android-piloto.md`.

Esquemas do Room em `schemas/` fazem parte do versionamento. Não usar migração destrutiva: qualquer futura mudança de banco precisa de migração e teste de preservação.

No Windows deste projeto, os testes JVM não localizaram a classe compilada ao executar sob o caminho com acento `App_Gestão_Estudos`. Foram executados com sucesso em uma cópia de build em caminho ASCII, com hashes dos arquivos-fonte conferidos. Em caso desse erro, use um checkout/cópia de build sem acentos; não remova conteúdo do projeto original para contornar o problema.
