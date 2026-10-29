# Android: contas, sincronização e preservação

Atualizado em 29/10/2026, versão 0.3.0-estudos.

## Contrato compartilhado

A conta Google autentica no mesmo Firebase do site. O documento é `users/{uid}/state/current`, formato 2, com revisão e fragmentos `current-chunk-00` a `current-chunk-23`. `js/remote-state.js`, `js/store.js` e `firestore.rules` são as referências. Os IDs de instâncias de plano são distintos dos IDs de edital.

O Android lê o JSON integral e aplica operações pequenas sobre a versão remota mais recente, dentro de transação. Conserva campos desconhecidos, revisões de campos, exclusões e marca de sincronização principal. Não publica um estado parcial reconstruído a partir das telas. A codificação respeita o limite de unidades UTF-16 e não corta pares substitutos. Há cópia diária antes da primeira gravação nativa, nos slots de backup já existentes.

## Conta e modo local

Cada UID tem seu próprio banco Room; o banco local legado permanece separado. Entrar não importa estudos locais automaticamente. O aluno confirma a importação no perfil, mantendo a cópia original. IDs estáveis tornam a repetição idempotente. Logout/troca de conta pausa o timer anterior e cancela seus avisos.

Mutações ficam em fila persistente e são reenviadas ao recuperar rede. A confirmação remove somente as operações incluídas na transação; novas operações não se perdem. Alteração de geração principal ou edição concorrente do mesmo link exige escolha. Manter a versão do site arquiva a fila e o estado local para recuperação. Reaplicar ainda respeita planos e tópicos excluídos.

## Regras e limites

Registros atualizam histórico, conclusão opcional, revisões e crédito na agenda segundo o contrato do site. Links pessoais ficam associados ao subtópico e respeitam exclusões. Criação nativa inclui edital, metadados, tópicos e rotina manual persistente. Essa rotina não reproduz todas as opções de planejamento adaptativo do site.

O app não oferece ainda todas as telas do site: edição completa de revisões/flashcards/simulados, ferramentas e administração continuam fora do piloto. Estatísticas usam sessões e simulados existentes sem duplicar simulados como sessões fictícias.

## Evidência de validação

Testes JVM cobrem migrações, separação por conta, filas, conflitos, exclusões, campos futuros, Unicode, rotina, métricas, avisos e idempotência. Testes no S25 com Firebase Emulator cobrem persistência, duas gravações concorrentes, fragmentos, backup e bloqueio de leitura de outro UID. O script `scripts/android-contract-check.cjs` passa o JSON emitido pelo Kotlin pelo domínio real do site.

O login Google de produção precisa ser concluído pelo titular escolhendo a mesma conta do site no seletor do Android. Testes em emulador não equivalem a confirmar essa entrada real, nem comprovam a paridade de todos os fluxos do site.

## Segurança operacional de testes

Houve uma execução inicial instrumentada no pacote normal; o executor removeu os dados locais. O incidente foi informado ao usuário. O registro documentado no print (1 hora, 55 questões, 40 acertos) foi reconstruído com um novo ID estável; não se afirma recuperar o UUID ou segundos originais. Depois disso, foi criado pacote QA separado e conferida a preservação do banco normal. Não executar testes destrutivos no pacote do aluno. Backups e capturas pessoais ficam fora do repositório.
