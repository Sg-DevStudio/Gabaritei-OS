# Atualizações do Android — 0.21.0

## Uso

Instale o APK 0.21.0 uma vez por cima do aplicativo existente, sem desinstalar. As versões anteriores ainda não têm este mecanismo.

O app consulta novas versões ao retornar ao primeiro plano, no máximo a cada seis horas após uma consulta confirmada. Falhas permitem nova tentativa após quinze minutos. Também existe **Perfil e preferências → Atualizações do app → Verificar atualizações**.

Uma versão nova aparece na página inicial quando não há estudo ou operação em andamento. “Depois” adia o aviso por 24 horas. O download só começa ao tocar no botão; o diálogo mostra o progresso e permite cancelar. Após conferir o arquivo, “Instalar atualização” abre o instalador do Android. Na primeira vez, o sistema pode solicitar autorização para instalar a partir do Gabaritei. A pessoa confirma a instalação; não há instalação silenciosa.

O instalador não é aberto com cronômetro em execução, geração de questões ou progresso de caderno ainda pendente de salvamento. A atualização mantém o pacote e o certificado existentes, sem apagar Room, histórico, conta ou configurações. Rascunhos devem estar salvos antes da instalação. Downloads interrompidos podem ser refeitos; não se promete conclusão com o processo encerrado.

## Distribuição

O primeiro endereço é o asset `android-release.json` da última release pública do GitHub. Pages e Firebase têm cópias de contingência. Uma cópia antiga não é usada para afirmar que o app está atualizado quando a consulta principal falha.

O manifesto informa pacote, versão, SDK mínimo, bytes, SHA-256 e URL fixa do APK. O app recusa downgrade, SDK incompatível, arquivo incompleto, tamanho excedente, checksum divergente, pacote diferente ou assinatura diferente da instalação atual. Redirecionamentos são limitados a destinos HTTPS conhecidos. APKs ficam apenas no cache privado `app-updates/`; o FileProvider não é exportado e concede leitura somente da URI necessária ao instalador.

## Publicar a próxima versão

1. Aumentar `versionCode` e `versionName`; compilar com a mesma chave externa ao repositório. O APK de CI usa outra chave e não deve ser distribuído como atualização do app principal.
2. Gerar o manifesto do APK assinado, com Android SDK e Java disponíveis:

   ```sh
   node scripts/android-release-manifest.cjs --apk /caminho/Gabaritei.apk --tag android-native-v0.21.0 --out data/android-release.json
   ```

   Na próxima versão, substituir a tag. O script extrai versão/pacote/SDK do APK, confere o certificado fixado e calcula tamanho e SHA-256 reais.
3. Publicar `Gabaritei.apk` e `android-release.json` juntos na release `android-native-v<versão>`, marcando-a como latest. Em releases imutáveis, anexar ambos antes de publicar.
4. O workflow **Publicar atualização do APK** regenera e confere os metadados a cada publicação. Se necessário, também pode ser executado manualmente com a tag. Assim, releases futuras ficam disponíveis aos apps sem depender de alterar a home ou aguardar o deploy do site.
5. Atualizar a cópia de contingência `data/android-release.json` e o link/QR do site na publicação web. Conferir os bytes e o hash do APK baixado publicamente.

## Verificação desta versão

Compilação release, testes JVM, lint e testes Node executados localmente. Os testes cobrem manifesto/URLs, comparação de versões, identidade/assinatura, cópia truncada ou excessiva, checksum e configuração restrita do FileProvider. No Windows/Robolectric, a validação de URI real fica condicionada ao separador de arquivos Unix; o XML e as permissões do provider são sempre conferidos.

Sem aparelho conectado nesta execução: abertura do instalador e confirmação física ainda precisam ser verificadas no Android. Compilação e testes não substituem essa validação.

Referências: [permissão de instalação por origem](https://developer.android.com/reference/android/content/pm/PackageManager#canRequestPackageInstalls()), [compartilhamento seguro por URI](https://developer.android.com/training/secure-file-sharing/share-file) e [integridade de downloads](https://developer.android.com/privacy-and-security/risks/unsafe-download-manager).
