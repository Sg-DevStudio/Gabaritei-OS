# Gabaritei OS — Gestão de Estudos para Concursos

App **PWA estático** (HTML/CSS/JS puro, **sem build**) que transforma um edital em
um plano de estudos vivo: **cronograma ou ciclo** personalizado, **timer/pomodoro**,
registro de sessões, **revisões espaçadas adaptativas**, **flashcards (SM-2)**,
**simulados** comparados com a nota de corte e estatísticas de constância — tudo
offline-first e sincronizado entre aparelhos.

> **Posicionamento:** outras ferramentas organizam o *seu esforço*; o Gabaritei OS
> organiza o seu esforço **contra o concurso real** — o que cai, quanto precisa
> acertar e até quando.

O sistema personaliza por três eixos: **nível** (sua bagagem), **horizonte**
(tempo até a prova) e **desempenho** (o que você acerta e erra). A especificação
funcional completa fica em [`ROADMAP.md`](ROADMAP.md); as convenções de código,
em [`CLAUDE.md`](CLAUDE.md).

## O que ele faz

- **Planejamento em dois modos** — *cronograma* semanal (grade arrastável, visão
  mensal, exportação `.ics`) ou *ciclo de estudos* (fila ponderada por peso ×
  incidência, com reforço para matérias fracas). Gerado a partir da sua **rotina**
  (dias e horas) e da data-alvo da prova; a vazão de teoria acompanha as horas e o
  app **avisa** quando o edital não cabe no prazo.
- **Tela Hoje** — a fila do dia vem pronta: revisões vencidas → blocos da semana →
  tópicos reabertos. Heatmap de constância, KPIs do dia e conquistas.
- **Timer** — cronômetro livre ou **pomodoro 25/5**, com recuperação de sessão e
  registro em ≤3 toques (tempo + questões feitas/certas).
- **Revisões espaçadas** — curva **1 · 3 · 7 · 14 · 30 dias** que se **adapta ao
  desempenho** (vai bem → espaça; vai mal → aproxima e cria reforço).
- **Flashcards** — decks com repetição espaçada **SM-2** e geração assistida por IA.
- **Simulados** — registro por disciplina, semáforo contra a nota de corte e
  envio dos piores tópicos direto para a fila.
- **Desempenho** — gráficos (evolução semanal, acerto por disciplina/tópico),
  heatmap, burndown do edital e projeção dinâmica de término.
- **Edital verticalizado** — status e incidência por tópico, progresso por
  disciplina, **conciliação de dois concursos** e geração de **plano combinado**.
- **Reta final & prontidão** — nas últimas semanas o foco vira consolidação;
  o app mede se as revisões cabem antes da prova.
- **PWA** — instalável, abre offline, sincroniza PC/celular via Firebase.

## Como usar

1. **Abrir o app**
   - **Publicado:** abra a URL do GitHub Pages e, no celular, use *Adicionar à tela
     inicial* (PWA instalável, abre offline).
   - **Local:** sirva a pasta com qualquer servidor estático, por exemplo
     `python3 -m http.server 8123`, e acesse `http://localhost:8123/`.
   - Faça login com Google em **Configurações** para sincronizar os aparelhos
     pela nuvem do Firebase.
2. **Começar um plano** (tela *Planos*): escolha um edital do catálogo e clique em
   *Criar plano*, ou monte um plano manual. Os editais de exemplo em
   [`data/*.json`](data/) servem de fallback e teste.
3. **Definir a rotina** (assistente *Gerar plano com rotina*): marque os dias e as
   horas, diga o que já sabe, informe a data da prova e escolha *cronograma* ou
   *ciclo*. O sistema dimensiona o ritmo sozinho.
4. **Operar o dia** (tela *Hoje*): siga a fila, use o **Timer** e **Registre** a
   sessão. As revisões e o cronograma se reajustam ao seu progresso real.
5. **Acompanhar**: confira *Desempenho* e *Revisões*; registre *Simulados* para
   medir-se contra a nota de corte.
6. **Backup**: o Firebase mantém os aparelhos alinhados, mas o `.json` exportado em
   *Configurações* continua sendo a cópia de segurança.
7. **Sair com privacidade**: a saída confirma a última sincronização e remove
   plano, histórico e timer deste aparelho. Sem internet, o app pede conexão antes
   de sair para não descartar uma alteração ainda não enviada.

## Regras de negócio e técnicas de estudo (`js/domain.js`)

Toda a lógica é **pura e testável** (sem DOM), em `window.Dominio`.

| RN | Regra |
|----|-------|
| RN01 | Teoria concluída agenda revisões espaçadas em **+1 · +3 · +7 · +14 · +30 dias** |
| RN02 | Desempenho = acertos ÷ feitas (acumulado); disciplina pondera pela incidência |
| RN03 | Pós-revisão por desempenho: **<50%** reabre + reforço em 2d; **<70%** sobe prioridade + reforço em 3d (reabre na de 30d); **≥85%** na de 30d marca como *dominado* |
| RN04 | Streak: o dia conta com ≥1 sessão; mostra atual + recorde (heatmap) |
| RN05 | Semáforo: verde ≥ meta · amarelo ≥ meta−10pp · vermelho abaixo |
| RN06 | Fila do dia: revisões vencidas → blocos da semana → tópicos reabertos |
| RN07 | Sessão com >50% de erro sugere reestudo (o aluno decide) |
| RN08 | Reimportar plano preserva todo o histórico; tópico removido vira **órfão** |
| RN09 | **Burndown** do edital: esforço = horas de teoria × 1.8 (teoria + questões + revisões); carga ideal/semana e projeção dinâmica de término |
| RN10 | **Check-in semanal**: planejado × realizado da semana fechada + prévia da corrente |

Técnicas complementares: **espaçamento adaptativo** das revisões (fator por
desempenho, no espírito do SM-2), **ciclo de estudos** ponderado, **flashcards
SM-2**, **conciliação/combinação** de editais, **reta final** automática
(≤6 semanas até a prova) e **prontidão para a prova**.

## Estrutura

```
index.html            shell único (SPA por hash)
manifest.json, sw.js, icons/   PWA, cache offline e push no mesmo service worker
css/styles.css        tokens visuais (papel/tinta/caneta, IBM Plex)
js/domain.js          regras de negócio puras (window.Dominio) — testáveis sem DOM
js/app.js             roteamento + telas + interações
js/store.js           localStorage: schema, migrations, export/import
js/sync.js            sync legado via /api/sync (opt-in local com ?syncLocal=1)
js/firebase-sync.js   sync PC/celular via Firebase Auth + Firestore
js/remote-state.js    particionamento seguro do estado para o Firestore
js/timer.js           cronômetro/pomodoro com recuperação e alerta de limite
js/charts.js          gráficos (Chart.js via CDN)
js/frases.js          frase do dia (determinística por data)
data/*.json           editais de exemplo/fallback (contrato JSON v1)
functions/            Cloud Functions (IA de flashcards, push de lembretes)
firestore.rules       regras de acesso do Firestore
skill/editais-esquematizados/   skill que gera os editais esquematizados
```

## Contrato JSON (v1)

Editais e planos seguem o contrato `versao: 1` da skill
`editais-esquematizados`. Atualizações usam os **mesmos IDs de tópico** — é assim
que o histórico sobrevive à reimportação (RN08). Sobre datas de prova: preencha
`janela_prova` **apenas quando apontar para o futuro** (edital vigente ou previsão
de pré-edital); concurso encerrado usado só como base de conteúdo fica com a
janela **vazia** (ver `CLAUDE.md`).

## Firebase (sync em nuvem)

Para a sincronização funcionar no GitHub Pages:

1. **Authentication → Sign-in method**: habilite **Google**.
2. **Authentication → Settings → Authorized domains**: confirme `localhost` e
   adicione o domínio do GitHub Pages.
3. **Firestore Database**: crie o banco em modo produção.
4. **Rules**: publique [`firestore.rules`](firestore.rules). Elas prendem cada
   conta ao próprio perfil, liberam a leitura do catálogo global para usuários
   inclusive visitantes e permitem que **apenas o admin** publique o catálogo e
   gerencie os pedidos de edital.

O estado remoto usa metadados + partes menores, gravadas no mesmo lote atômico.
Isso evita o limite de 1 MiB por documento do Firestore e continua lendo o
formato antigo para migrá-lo sem perder dados.

## Lembretes de estudo (push)

Notificações motivacionais quando o aluno fica um dia sem estudar. Ficam
**desligadas** até a chave VAPID ser configurada — o app funciona normalmente sem
elas. Para ativar:

1. Plano **Blaze** habilitado e a API **Cloud Scheduler** ativada no projeto.
2. Em **Firebase Console → Cloud Messaging → Web Push certificates**, gere o par de
   chaves e copie a **chave pública (VAPID)**.
3. Cole-a em `js/firebase-sync.js`, na constante `VAPID_KEY`.
4. Publique as regras (`firestore.rules`) — já incluem `users/{uid}/push`.
5. `firebase deploy --only firestore:rules,functions` publica as proteções e sobe
   a função agendada `lembreteEstudo` (roda 21:00, fuso de Brasília). As mensagens
   ficam em `functions/index.js`.

O dispositivo só registra o token depois que a pessoa ativa **Lembretes diários**
no Perfil e concede a permissão. A permissão usada pelo timer, sozinha, não ativa
lembretes.

## Publicação do backend

O GitHub Pages publica apenas a parte estática. Regras e Functions podem ser
publicadas manualmente pela ação **firebase deploy**:

1. Crie no repositório o secret `FIREBASE_SERVICE_ACCOUNT` com o JSON de uma conta
   de serviço autorizada no projeto.
2. Abra **Actions → firebase deploy → Run workflow**. Por padrão ela publica
   apenas as regras; marque **deploy_functions** somente depois de configurar os
   secrets usados pelas Functions.

Sem esse secret, publique localmente as regras com
`firebase deploy --only firestore:rules`. Quando IA/push estiverem configurados,
use `firebase deploy --only functions`.

## Desenvolvimento

- App estático: edite os arquivos e recarregue — não há passo de build.
- `npm test` roda domínio, integração e o codec do estado remoto.
- `npm run test:rules` inicia o emulador e valida permissões reais do Firestore.
- **Testes rápidos** com jsdom: escreva o script **fora do repo** (ex.: `/tmp`) ou
  nomeie `_t_*.cjs` e **remova antes de commitar** — nada disso é versionado.
- Mantenha as regras de negócio em `js/domain.js` (puras) e a UI em `js/app.js`.

## Licença

Ver [`LICENSE`](LICENSE).
</content>
