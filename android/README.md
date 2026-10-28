# Gabaritei OS para Android — beta

APK gratuito para Android 8 ou superior, com Trusted Web Activity (AndroidX Browser). Reutiliza o site e o navegador do aparelho, preservando o fluxo Google e os dados da PWA. Se o navegador não validar a associação, poderá exibir a barra de endereço.

## Recursos

- Tela inicial, tema, navegação e plano atual vêm do site publicado.
- Canal `postMessage` limitado à origem validada `https://sg-devstudio.github.io`.
- Alertas locais do próximo término do cronômetro com limite ou da fase do Pomodoro. Cronômetro livre não tem término programado.
- Pausar/descartar cancela o alerta. Retomar substitui o prazo. O alerta não registra uma sessão de estudo.
- Lembrete opcional após 3, 5 ou 7 dias sem abrir o aplicativo, sem repetição diária, respeitando 22h–8h.
- Preferências acessíveis pelo botão Notificações Android no rodapé, após a conexão nativa, ou pela tela nativa ao voltar do navegador.
- Ambos os tipos de aviso começam desligados. A pessoa precisa escolher e permitir as notificações. Alarmes exatos dependem de uma autorização adicional; sem ela o Android pode atrasar o aviso.

## Compilar

JDK 17 ou superior, Android SDK 35, Gradle 8.11.1. Configure `JAVA_HOME`, `ANDROID_HOME` e `GRADLE_USER_HOME` conforme o ambiente.

```
gradle :app:assembleDebug :app:lintDebug
```

Para release, forneça `GABARITEI_KEYSTORE` e `GABARITEI_STORE_PASSWORD` no ambiente (alias `gabaritei`) e execute `gradle :app:assembleRelease :app:lintRelease`. A chave e a senha não são versionadas. Preserve uma cópia privada da chave: atualizações devem usar a mesma assinatura.

A declaração pública está em `https://sg-devstudio.github.io/.well-known/assetlinks.json`, hospedada no repositório de associação do domínio. O arquivo no subdiretório do projeto não serviria para validar a origem.

## Validação e limites

Build release, lint e assinatura verificados no PC. Testes da ponte cobrem origem, prazo, pausa, cancelamento e Pomodoro. Não havia aparelho Android conectado para instalar e testar.

Antes de tratar a versão como estável, conferir no celular: login Google e sincronização, abertura sem barra após validar domínio, permissão concedida/negada, timer com tela bloqueada, pausa/retomada, Pomodoro, economia de bateria, reinicialização e retorno após inatividade. Force-stop e restrições do fabricante podem impedir avisos. A versão publicada é beta justamente por esta validação em aparelho ainda estar pendente.

Referências: [TWA postMessage](https://developer.chrome.com/docs/android/post-message-twa), [alarmes Android](https://developer.android.com/develop/background-work/services/alarms).
