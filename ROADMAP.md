# Gabaritei OS — Especificação funcional & Roadmap

> **Documento vivo.** Descreve **como o sistema deve funcionar** — regras de
> negócio, modelo de dados e o comportamento de cada aba/feature — e, ao final, a
> direção do produto. Serve de referência única (uma "constituição funcional") para
> evoluir o app sem reintroduzir bugs nem perder a intenção de cada decisão.
>
> Convenções de implementação e memória do projeto ficam em `CLAUDE.md`.

---

## 1. Visão geral

App **PWA estático** (HTML/CSS/JS puro, sem build) de **planos de estudo para
concursos**. O aluno escolhe um edital, o sistema gera um cronograma
personalizado, agenda revisões (curva do esquecimento), acompanha desempenho e o
guia do diagnóstico inicial até a reta final.

**Princípio-guia:** o app é um ótimo **organizador**; o maior risco é depender de
**registro manual**. Toda evolução deve reduzir fricção e personalizar por
**nível** (bagagem), **horizonte** (tempo até a prova) e **desempenho**.

### Stack & arquitetura
- **Front:** `index.html` + `js/*.js` (IIFE + globais em `window`), sem framework/bundler.
- **Domínio puro:** `js/domain.js` (`window.Dominio`) — regras de negócio testáveis, sem DOM.
- **UI:** `js/app.js` — telas, render por string + `innerHTML` (sempre com `esc()`), eventos.
- **Persistência:** `js/store.js` (localStorage, schema v2) + `js/firebase-sync.js` (sync/login).
- **Gráficos:** `js/charts.js` · **Timer:** `js/timer.js` · **Frases:** `js/frases.js`.
- **Servidor:** `functions/` (Cloud Functions: IA de flashcards, push) + `firestore.rules`.
- **Dados:** `data/*.json` (editais fallback/exemplo) + catálogo global no Firebase.

---

## 2. Modelo de dados (`state`, schema v2)

Vários planos em `state.planos[]`; o **plano ativo** é "hidratado" por referência
em `state.plano`/`disciplinas`/`cronogramas` (trocar a camada de persistência é o
que uma migração futura exige).

```
state = {
  versao: 2,
  planos: [ { id, criadoEm, plano, disciplinas, cronogramas, links } ],
  planoAtivoId,
  // slots hidratados do plano ativo (referência para dentro de planos[]):
  plano, disciplinas, cronogramas, links,
  sessoes:   [ {id, planoId, data, topicoId, tipo, duracaoMin, qFeitas, qCertas, obs, origemRegistroRapido} ],
  revisoes:  [ {id, planoId, topicoId, tipo, dataAgendada, dataConcluida, resultadoPct} ],
  simulados: [ {id, planoId, data, tipo, acertos:[{disciplinaId, certas, total}]} ],
  agenda:    [ {id, planoId, data, disciplinaId, topicoId|null, duracaoMin, obs, feito, gerado} ],
  editais:   [ {id, titulo, banca, notaCorte, criadoEm, disciplinas} ],
  flashcards:[ {id, planoId, disciplinaId, nome, cards:[{id, frente, verso, sr}]} ],
  config: { metaQuestoesSemana:100, tema, onboarding*, googleCalendar, ... }
}
```

### Entidades-chave
- **Disciplina:** `{ id, nome, cor, peso, dificuldade('facil'|'media'|'dificil'), topicos[] }`.
- **Tópico:** `{ id, nome, incidencia_pct, prioridade, horas_estimadas, status, reaberto, orfao, adicionadoPeloUsuario }`.
- **Status do tópico (máquina de estados):**
  `pendente` → `em_curso` → `teoria_concluida` → `dominado`.
  `reaberto` é um **flag** (não um status) que devolve o tópico à fila por desempenho baixo.
- **Plano (`state.plano`):** `{ concurso, banca, meta:{corte_pct}, radar:{janela_prova:[ini,fim], reavaliar_em}, ritmoAtivo, ritmos{}, ordemAtaque, modoPlanejamento('cronograma'|'ciclo'), ciclo, pontoPartida, modoRetaFinal?, modoAprofundamento?, aprofundamentoConvidado? }`.
- **`janela_prova`** (`[inicio, fim]` em `AAAA-MM`): referência de cronograma/revisões.
  **Só preencher quando aponta para o FUTURO** (edital vigente ou previsão). Concurso
  encerrado usado só como base de conteúdo → janela **vazia** (ver `CLAUDE.md`).

---

## 3. Persistência, sync e segurança

- **Local-first:** tudo em `localStorage` (`estudos.v1`); funciona offline.
- **Sync Firebase:** ao logar (Google), o estado sincroniza em `users/{uid}/state/current`.
- **Firestore rules:** estado por-usuário só do dono; catálogo público é **leitura aberta**
  (vitrine/demo) e **escrita só do admin**; `pedidosEdital` com `create` validado.
- **Cloud Functions** (`onCall`, exigem auth): geração de flashcards por IA (chave do
  Gemini no **Secret Manager**, nunca no client) e envio de push.
- **Modo demo:** carrega `data/exemplo-trf3.json`, `modoDemo=true` → **nada é salvo/sincronizado**.
- **Admin:** `casar70@gmail.com` (publica/edita o catálogo global).

---

## 4. Regras de negócio (núcleo — `domain.js`, funções puras)

| # | Regra | Comportamento |
|---|-------|---------------|
| **RN01** | Teoria concluída agenda revisões | Ao concluir a teoria de um tópico, agenda a curva **24h · 3d · 7d · 14d · 30d**. |
| **RN02** | Desempenho acumulado | `%` de acerto por tópico/disciplina/geral, ponderado por incidência (disciplina) e peso (geral). |
| **RN03** | Revisão 30d fraca reabre | Revisão de **30d** com `<70%` **reabre** o tópico (volta para a fila). |
| **RN03b** | Reforço de teoria | **3 desempenhos seguidos `<65%`** sinalizam revisar a teoria (sugestão; não reabre sozinho). |
| **RN04** | Streak/constância | Um dia conta na sequência com **≥1 sessão** registrada. |
| **RN05** | Semáforo | Compara o desempenho com a **meta de corte** do plano (verde/amarelo/vermelho). |
| **RN06** | Fila do dia | Ordem: **revisões vencidas → conteúdo do dia (agenda) → reabertos**. |
| **RN07** | Sugestão de reestudo | Sessão com **>50% de erro** oferece mandar o tópico de volta à fila (aluno decide). |
| **RN08** | Reimportar preserva histórico | Atualizar/mesclar edital mantém sessões, revisões e progresso (merge por id). |
| **RN09** | Esforço & projeção | **Esforço do edital = Σ horas_estimadas × 1.8** (folga p/ revisão/questões); projeta a conclusão no **ritmo real**. |
| **RN10** | Check-in semanal | Planejado × realizado da última semana; **déficit é redistribuído** nas semanas restantes. |

### Regras do motor de plano (cronograma)
1. **Blocos antifadiga:** todo bloco cai em um tempo permitido — **30/45/60/75/90/120 min** (`TEMPOS_BLOCO`).
2. **Ordem de ataque:** *Ordem do edital* **ou** *Incidência (80/20)* — ataca primeiro o que mais cai.
3. **Distribuição por dificuldade:** disciplina `difícil` recebe mais tempo; `fácil`, menos.
4. **Manutenção:** tópicos já concluídos saem da teoria e entram em **revisão/questões** (antecipação para quem já domina parte).
5. **Intercalação:** alterna grupos cognitivos para não empilhar matérias parecidas.
6. **Recálculo adaptativo semanal:** a cada nova semana o cronograma das semanas seguintes é refeito pelo **progresso real**.

### Revisão adaptativa por desempenho
- **Espaçamento dinâmico** (`fatorEspacamentoRevisao`): compõe um fator por revisão concluída —
  `≥85% ×1.25` · `≥70% ×1.1` · `≥50% ×0.85` · `<50% ×0.6` (limitado a **0.4–2.2**).
  **Vai bem → espaça; vai mal → aproxima** as próximas revisões pendentes.
- As **questões do estudo do dia a dia** também realimentam o fator (média das últimas 3 sessões de questões do tópico, fora as de revisão).
- **`ajustePosRevisao`:** `<50%` reabre + sobe prioridade + reforço em 2d; `<70%` sobe prioridade + reforço em 3d (reabre se for 30d); `≥85%` em 30d → marca **dominado**.
- **Transparência:** cada revisão pendente mostra etiqueta — ⏩ *antecipada*, 🌱 *espaçada* ou ＋ *reforço* (`estadoAdaptacaoRevisao`).

---

## 5. Telas / abas — como cada uma funciona

### 🏠 Hoje (`#hoje`)
Centro do dia. Mostra saudação, frase, **card de data provável** (countdown), mapa de
**constância** (streak), KPIs da semana (horas, questões, margem de acerto) e a
**fila "O que estudar hoje"** — foca no **conteúdo do DIA** (agenda do dia + revisões
vencidas + ciclo/reabertos), não na semana inteira.
- **Registrar:** bolinha (registro rápido de 1 toque, assume tempo planejado) ou botão
  "Registrar" (detalhado). A sessão cai na **data do bloco**; o calendário risca o bloco
  correspondente (`blocoAgendaConcluido` = `feito` OU tópico concluído OU sessão no dia).
- **Modais automáticos:** "🎉 Meta do dia concluída" (1×/dia) e o convite ao
  **aprofundamento** ao concluir o plano (ver §6).
- **Banners de modo:** 🏁 reta final ou 🎓 aprofundamento, conforme o horizonte (§6).
- **Dia livre:** estado vazio com "Adiantar próxima matéria" e "Ver a semana toda".

### 📚 Planos (`#planos`)
Catálogo de editais (global do Firebase; offline avisa para ficar online). O aluno
escolhe o concurso → cria o plano → cai no **assistente** (§6). Comparação/conciliação
de editais (cabe no tempo? reaproveita conteúdo?) e combinação de dois editais.

### 🗓️ Planejamento (`#planejamento`)
Plano atual, **check-in semanal** (RN10) com projeção de conclusão no ritmo real,
**calendário/agenda** (semana e mês, com arrastar-e-soltar), e ações do plano:
**Editar plano** (reabre o assistente preenchido), **Edital**, **Excluir**,
**Recalcular plano agora**, e **Ativar modo reta final** (manual). O controle do modo
**aprofundamento** aparece aqui só quando ativo (sem ativação manual — ver §6).

### ⏱️ Timer (`#timer`)
Cronômetro de estudo por tópico (inclui **Pomodoro** e limite planejado).
**Persistente:** após queda de luz/recarregar, volta **pausado** no tempo real.
Concluir um tópico pelo timer **registra a sessão do dia** e risca o calendário.
Permite adicionar um **tópico "novo"** à disciplina (peso baixo, etiqueta verde).

### 🔁 Revisões (`#revisoes`)
Duas abas: **Agendadas** (ciclo 24h·3d·7d·14d·30d, agrupado em Vencidas/Hoje/Próximas/
Mais adiante, com **etiquetas de adaptação** e aviso de revisão "depois da prova") e
**Flashcards** (repetição espaçada SM-2; geração por **IA** colando material).
Card de **prontidão para a prova** (as revisões cabem antes da data?).

### 📄 Edital (`#edital`)
Conteúdo do plano por disciplina/tópico: status, incidência, desempenho, conclusão de
teoria, e o detalhe de cada tópico/disciplina.

### 📝 Simulados (`#simulados`)
Registro de simulados (acertos por disciplina) que alimentam desempenho e conquistas.

### 📊 Desempenho (`#stats`)
Gráficos de evolução, série semanal, piores tópicos, heatmap. No iPad/mobile usa o
layout compacto.

### 🕘 Histórico (`#historico`)
Lista de sessões registradas (auditoria/edição).

### ⚙️ Ajustes (`#ajustes`) e ⋯ Mais (`#mais`)
Conta/sync, tema claro/escuro, backup, meta de questões, notificações; "Mais" é o menu
de atalhos no celular.

---

## 6. Features transversais

### Assistente de plano (5 passos)
1. **Rotina** — dias/horas da semana **+** tempo por bloco (mín/máx, inline com rótulo).
2. **Dificuldade** — como o aluno se sente em cada disciplina (entra na distribuição).
3. **O que já sei** (ponto de partida) — diagnóstico **por tópico** (`Nunca vi`/`Já estudei`/
   `Já domino`); default conservador. O que é "domino" entra direto em manutenção. O nível
   geral (zero/intermediário/avançado) só ajusta o **default** da estratégia.
4. **Prazo** — **projeção dinâmica** (não estimativa fixa): "no seu ritmo de Xh/sem e com o
   que já sabe, você cobre o edital em ~N meses", comparada à data da prova
   (✅ sobra tempo · 🟡 em cima · 🟠 não fecha → sugere +horas ou foco 80/20). Se há
   `janela_prova`, o plano mira nela; sem data, segue o ritmo natural (long-term).
5. **Estratégia** — Cronograma flexível × Ciclo de estudos; Ordem do edital × Incidência.

### Modo reta final 🏁
- **Liga sozinho** quando faltam **≤ 6 semanas** para a prova (`SEMANAS_RETA_FINAL`) e pode ser
  **ativado manualmente** no Planejamento (modal + confirmação) — útil sem data marcada.
- **Foco:** consolidar — banner no Hoje com prontidão, **chips para treinar questões dos
  pontos fracos**, atalhos para simulado/revisão. Menos teoria nova.

### Modo aprofundamento 🎓 (automático)
- **Proposto automaticamente** ao **concluir todo o cronograma** (ou 100% do edital),
  havendo **tempo até a prova** e **fora** da reta final. Aparece um modal parabenizando.
- **Ao aceitar:** subentende **"já estudei" para todos os tópicos** (pendente/em_curso →
  `teoria_concluida`; `dominado` preservado; órfãos/ORF ignorados), agenda revisões e ativa o modo.
- **Foco:** cobertura + retenção + aprofundar a alta incidência (banner no Hoje, % de cobertura).
- **Exclusão mútua:** reta final **sobrepõe** o aprofundamento (foco oposto). Nas últimas
  semanas o aprofundamento fica **dormente** (some de banner e card) e volta se a prova for
  empurrada para além de 6 semanas. Aparece **uma vez por plano** (`aprofundamentoConvidado`).

### Ciclo de estudos (alternativa ao cronograma)
Fila ponderada de matérias (peso × incidência, com reforço para desempenho baixo) com meta
de tempo por bloco; ao fechar a volta, recomeça. Sem datas fixas — roda no ritmo do aluno.

### Registro de sessão
Duração, questões feitas/acertos, observação e "teoria finalizada". Aviso de **duplicata**
por **mesma data/tópico/tipo** (a data respeita o bloco). Registro rápido (bolinha) não
sofre re-render por cima da animação do check.

### Editais & catálogo
Catálogo global (Firebase), **versionamento** (pré-edital → edital real **atualiza o plano
sem perder progresso**, merge por id — RN08), **conciliação/comparação** (overlap de
conteúdo vs. caber no tempo) e **combinação** de dois editais. Skill geradora em
`skill/editais-esquematizados/`.

### Conquistas & constância
Selos com raridade curada (streak, volume de questões, horas, % do edital…), micro-
celebrações (confete) ao bater metas/recordes; heatmap de constância.

### PWA & notificações
`manifest.json` + `sw.js` (instalável/offline). Push para lembrete de estudo/timer
(`registrarPush` + Cloud Function); permissão pedida sob demanda.

---

## 7. Estados de horizonte (resumo de prioridade)

Em qualquer momento, **um** foco rege o Hoje, nesta prioridade:

1. **Reta final** (prova ≤ 6 semanas, ou manual) → consolidar.
2. **Aprofundamento** (plano concluído, com tempo, fora da reta final) → reter + aprofundar.
3. **Plano normal** → seguir o cronograma e as revisões.

---

## ✅ Concluído (em produção / mergeado)

- Assistente de plano reordenado com **projeção dinâmica de prazo** (rotina + bagagem + data).
- **Ponto de partida** por tópico ("O que já sei").
- **Revisão adaptativa por desempenho** + realimentação pelas questões do dia + transparência.
- **Modo reta final** (automático ≤6 sem + ativação manual) e **modo aprofundamento** (automático ao concluir, com exclusão mútua).
- **Flashcards** com SM-2 + **geração por IA** (Cloud Function/Gemini).
- **Timer persistente** (volta pausado) e "concluir tópico conta o estudo do dia".
- **Editais versionados** (atualizar plano sem perder progresso) + catálogo global.
- **PWA** (offline/instalável) e **tema claro/escuro**.
- Correções de registro (sessão na data do bloco; agenda não some ao marcar) e de UX mobile.

## 🎯 Próximas fases

### Engenharia / qualidade (prioridade alta)
- **Suíte de testes versionada + CI** (converter os testes jsdom ad-hoc; GitHub Actions) — o maior gap atual.
- **Quebrar `js/app.js`** (monolito ~9k linhas) em módulos por tela; avaliar build leve (esbuild) e lint/format.
- **Endurecer XSS** (helper de template que escapa por padrão) + **CSP**.
- Formalizar SDD: `CLAUDE.md` → `constitution.md`; `spec.md` por feature; contract tests para as RNxx.

### Produto
- **Lembretes inteligentes** (push diário + revisão vencida) — a infra já existe; alto impacto em retenção.
- **Resumo semanal** (horas, questões, % de acerto, tópicos fracos) — reusa as stats.
- **IA além de flashcards:** gerar **questões por tópico** (embrião de banco de questões) e **importar edital colando o texto** (reduz a fricção de entrada).
- **Insight preditivo** mais proeminente ("no seu ritmo, ~X% do edital até a prova").
- **Modo acadêmico/universitário** (vários eventos de prova/entrega com data) — aposta maior.

## 🧹 Pendências / dívidas
- Comparação de editais: separar visualmente "reaproveitamento" (overlap) de "cabe no tempo" (carga × prazo).
- Merge de edital deve **preservar** tópicos `adicionadoPeloUsuario`.
- Completar nota de corte / salário-vagas por edital conforme fontes confirmadas.

---

*Atualize este documento conforme o sistema evolui: regras e telas mudaram → reflita aqui
antes (ou junto) do código. É a fonte da verdade do comportamento esperado.*
