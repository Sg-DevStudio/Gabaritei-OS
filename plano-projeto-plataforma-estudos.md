# Projeto: Plataforma de Estudos para Concursos
### Documento de planejamento — Constituição + Especificação (rascunho para revisão)
*Metodologia: construtor-de-sistemas (SDD) · Porte: G · Versão 0.1 — jun/2026*

---

## 1. Visão e diferencial

Sistema pessoal de organização de estudos para concursos, no modelo Estudei/Aprovado
(cronograma, registro de sessões, acertos/erros, estatísticas), **mais a camada de
inteligência que nenhum dos dois tem**: análise do concurso específico — incidência por
tópico, radar de data do edital, nota de corte do último nomeado, priorização e plano
em duas velocidades — gerada pela skill `treinador-concursos` e importada pelo app.

> **Posicionamento em uma frase:** o Estudei organiza o SEU esforço; este sistema
> organiza o seu esforço **contra o concurso real** — o que cai, quanto precisa
> acertar e até quando.

---

## 2. Arquitetura em duas camadas

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│  CAMADA 1 — MOTOR (Claude)  │  JSON   │  CAMADA 2 — PAINEL (webapp)  │
│  skill treinador-concursos  │ ──────► │  operação diária do estudo   │
│  · edital esquematizado     │ importa │  · calendário/cronograma     │
│  · incidência por tópico    │         │  · timer + registro sessão   │
│  · radar de data            │         │  · acertos/erros por tópico  │
│  · nota de corte / meta     │         │  · fila de revisões 24h/7/30 │
│  · cronograma 2 velocidades │         │  · estatísticas e gráficos   │
└─────────────────────────────┘         └──────────────────────────────┘
        roda no Claude                     roda no navegador (grátis)
        (busca web + IA)                   atualização: skill re-exporta
```

**Por que separar:** a inteligência exige busca na web e raciocínio de IA — embutir
isso no app exigiria API paga rodando continuamente. A skill já existe, já foi testada
(TRF3) e exporta o plano uma vez; o app opera esse plano todo dia, offline e de graça.

### Contrato JSON entre as camadas (v0 — a refinar no spec)

```json
{
  "plano": {
    "concurso": "TRF3 — Técnico Judiciário, Área Administrativa",
    "banca": "FCC",
    "cota": "negros",
    "meta": { "corte_estimado_pct": 75, "corte_fonte": "lista FCC 2024", "minimos": {"gerais": 0.4, "especificas": 0.4} },
    "radar": { "janela_edital": ["2026-07", "2027-06"], "confianca": "media", "reavaliar_em": "2026-08" },
    "ritmos": { "sustentavel_h_semana": 19, "hardcore_dias": 120 }
  },
  "disciplinas": [
    {
      "id": "ADM", "nome": "Direito Administrativo", "cor": "#2E7D5B",
      "peso": 2, "base_teorica": "pdf",
      "topicos": [
        { "id": "ADM-01", "nome": "Atos administrativos", "incidencia_pct": 15,
          "prioridade": 1, "semana_sugerida": 2, "horas_estimadas": 6 }
      ]
    }
  ],
  "cronograma": [
    { "semana": 1, "inicio": "2026-06-15", "blocos": [
      { "disciplina": "POR", "topico": "POR-01", "tipo": "teoria" },
      { "disciplina": "ADM", "topico": "ADM-01", "tipo": "questoes" }
    ]}
  ]
}
```

---

## 3. Constituição (regras do projeto)

| Item | Decisão | Status |
|---|---|---|
| Contexto | Projeto **pessoal** (samuelgomes01), não institucional | ✅ definido |
| Stack v1 | **HTML/CSS/JS puro (PWA) + GitHub Pages**; dados em `localStorage` + export/import JSON (backup manual) | ✅ decidido (10/06/2026) |
| Usuários | **Só Samuel** na v1, sem login. Estratégia validada: testar na própria realidade → depois abrir para outros usuários (migração Supabase + Vercel já mapeada na seção Evolução) | ✅ decidido |
| Gráficos | Chart.js via CDN (mesma lib do Dashboard Financeiro) | ✅ |
| Revisão espaçada | Implementação própria da regra 24h/7d/30d (a regra da skill), NÃO o SM-2 completo do Anki — flashcards continuam no Anki | ✅ |
| Frases motivacionais | **Entram na v1** (decisão do dono) — frase diária no Home, rotativa, com curadoria voltada a concurso | ✅ decidido |
| Qualidade | Sem credencial hardcoded; formatos BR (dd/mm/aaaa); responsivo mobile (registro de sessão pelo celular); código legível | ✅ |
| Identidade | Própria — **não clonar o visual do Estudei** (funcionalidade não tem dono; trade dress tem). Brief na seção 6 | ✅ |

---

## 4. Especificação

### 4.1 Problema
Hoje o plano TRF3 existe em PDF (estático) e o registro do estudo real (tempo,
questões, erros) não existe em lugar nenhum — ou exigiria assinar o Estudei
(R$/mês) sem ganhar a camada de inteligência. Sem registro, não há como saber se o
desempenho está convergindo para a meta de corte nem quais tópicos precisam voltar.

### 4.2 Critérios de sucesso (observáveis)
- Registrar uma sessão de estudo (disciplina, tópico, tempo, questões certas/erradas)
  em **menos de 30 segundos** ao fim do estudo.
- A fila "o que estudar hoje" aparece pronta ao abrir o app: blocos do cronograma +
  revisões 24h/7d/30d vencidas, sem nenhum cálculo manual.
- Em qualquer momento, ver a distância entre o desempenho atual por disciplina e a
  meta de corte (ex.: "ADM 84% ✅ · POR 61% ⚠ meta 75%").
- Importar o JSON gerado pela skill e ter o plano inteiro (288 tópicos TRF3)
  carregado sem digitação manual.
- Funcionar no celular (registro) e no PC (análise) sem instalação.

### 4.3 Contexto de uso
Dispositivo: **ambos** (celular = timer e registro; desktop = estatísticas e
planejamento) · Usuários: 1 · Frequência: diária (2× por dia em média).

### 4.4 Fluxos principais

**F1 — Operar o dia (o fluxo de 90% do uso)**
1. Abre o app → tela "Hoje": blocos do cronograma da semana corrente + revisões vencidas.
2. Toca num bloco → inicia timer (cronômetro ou pomodoro).
3. Encerra → registra: tempo (auto), questões feitas, acertos, erros, observação opcional.
4. Sistema atualiza: progresso do tópico, % da disciplina, streak, metas semanais; se o
   tópico foi marcado "teoria concluída", agenda revisões 24h/7d/30d automaticamente.
- *Caminhos infelizes:* fechou o navegador com timer rodando (persistir início no
  localStorage e recuperar); registro sem questões (válido — sessão só de teoria);
  registro duplicado no mesmo bloco (perguntar se é sessão adicional).

**F2 — Importar/atualizar plano**
1. Cola o JSON da skill (ou faz upload do arquivo) → preview do que vai entrar.
2. Confirma → plano criado com disciplinas, tópicos, incidências, cronograma, meta, radar.
3. Atualização (novo edital, radar novo): importar de novo **preservando o histórico**
   de sessões/desempenho — só a estrutura do plano muda.
- *Infelizes:* JSON inválido (apontar o campo); tópico do histórico que sumiu no plano
  novo (manter órfão marcado, nunca apagar registro).

**F3 — Registrar simulado**
1. Novo simulado (parcial/total) → informa acertos por disciplina.
2. Sistema compara com a meta de corte e lista os 3 piores tópicos → botão "mandar
   para a fila da semana".

**F4 — Revisar (fila de revisões)**
1. Tela Revisões: vencidas e próximas, agrupadas por dia.
2. Concluir revisão → registra desempenho se houve questões; <70% de acerto na revisão
   de 30d reabre o tópico (RN da skill).

### 4.5 Contrato de dados (entidades principais)

| Entidade | Campos-chave |
|---|---|
| **Plano** | id, concurso, banca, cota, meta (corte %, mínimos), radar (janela, confiança), ritmo ativo |
| **Disciplina** | id, planoId, nome, sigla, cor (hex), peso, baseTeorica (pdf/video) |
| **Tópico** | id, disciplinaId, nome, incidenciaPct, prioridade, horasEstimadas, status (pendente/em curso/teoria concluída/dominado), semanaSugerida |
| **Sessão** | id, data, topicoId, tipo (teoria/questões/revisão/simulado), duraçãoMin, qFeitas, qCertas, obs |
| **Revisão** | id, topicoId, tipo (24h/7d/30d), dataAgendada, dataConcluída, resultadoPct |
| **Simulado** | id, data, tipo (parcial/total), acertosPorDisciplina[], comparativoMeta |
| **MetaSemanal** | semana, horasAlvo, questõesAlvo, horasFeitas, questõesFeitas |

*Dados reais de exemplo: usar o plano TRF3 já gerado (10 disciplinas, 288 tópicos) —
nada de lorem ipsum.*

### 4.6 Regras de negócio
- **RN01** — Ao marcar tópico como "teoria concluída", criar 3 revisões: +1d, +7d, +30d.
- **RN02** — Desempenho do tópico = certas ÷ feitas acumulado; da disciplina = média
  ponderada pelos tópicos com registro.
- **RN03** — Se revisão de 30d tiver resultado <70%, status do tópico volta a "em curso"
  e ele entra na fila da semana.
- **RN04** — Streak: dia conta se houver ≥1 sessão registrada; exibir atual e recorde
  (heatmap estilo Estudei/GitHub).
- **RN05** — Semáforo de meta: disciplina verde se desempenho ≥ meta de corte; amarelo
  se entre meta−10pp e meta; vermelho abaixo.
- **RN06** — Tela "Hoje" ordena: revisões vencidas → blocos do cronograma da semana →
  tópicos reabertos por simulado.
- **RN07** — Sessão >50% de erro em questões do dia: sugerir reestudo (não automático —
  o usuário decide).
- **RN08** — Reimportar plano nunca apaga Sessões/Revisões/Simulados existentes.

### 4.7 Mapa funcional — Estudei vs este sistema

| Funcionalidade (vista nos prints) | v1 (MVP) | Depois | Não fazer |
|---|---|---|---|
| Home: cards tempo/desempenho/progresso | ✅ | | |
| Constância (streak + heatmap) | ✅ | | |
| Painel por disciplina (tempo, ✓, ✗, %) | ✅ | | |
| Metas semanais (horas, questões) | ✅ | | |
| Countdown da prova | ✅ (alimentado pelo radar — diferencial: mostra a JANELA estimada, não exige data certa) | | |
| Edital verticalizado com progresso | ✅ (com % de incidência por tópico — diferencial) | | |
| Planejamento/calendário com sessões | ✅ simplificado (semana, não mês arrastável) | 🔜 calendário completo | |
| Cronômetro / Timer / Pomodoro | ✅ | | |
| Revisões | ✅ (automáticas — no Estudei é manual) | | |
| Simulados | ✅ registro + comparação com corte | 🔜 geração de simulado | |
| Estatísticas (gráficos) | ✅ 2 gráficos (evolução semanal, desempenho×meta) | 🔜 mais cortes | |
| Histórico de sessões | ✅ lista simples | | |
| Múltiplos planos | | 🔜 (estrutura já suporta) | |
| Biblioteca de materiais | | | ❌ (links ficam no plano da skill) |
| Convide e ganhe / social | | | ❌ |
| Frases motivacionais | ✅ frase do dia no Home (curadoria própria, foco concurso/disciplina) | | |

### 4.8 Fora do escopo (v1)
Login/multiusuário em nuvem · sincronização entre usuários · flashcards completos (Anki
cobre) · geração de questões · notificações push · app nativo · qualquer feature
social. **Escopo não escrito aqui não entra sem revisar este documento.**

---

## 5. Evolução: multiusuário e rentabilização (visão, não escopo)

Rota técnica quando a v1 estiver validada no uso próprio: `localStorage` → **Supabase**
(Postgres + auth, free tier) com o mesmo contrato de dados; frontend migra de GitHub
Pages para **Vercel**. O contrato JSON versionado é o que torna essa migração barata.

Rota de produto: v1 (você) → beta fechado (colegas concurseiros, feedback) → decisão
de monetizar. **Ponto de atenção jurídico para quando chegar lá:** como servidor
federal, a exploração comercial direta tem vedações (art. 117, X, da Lei 8.112 —
gerência/administração de sociedade). Existem caminhos lícitos (ex.: participação
como sócio cotista sem gerência, licenciamento), mas isso se planeja com calma na
hora certa — nada disso bloqueia construir e validar agora.

---

## 6. Brief de design (Fase 3 — para aprovação)

**Subject e tom.** O sistema vem do mundo da **prova de concurso**: cartão-resposta,
caneta esferográfica azul "de corpo transparente" (a que todo edital exige), gabarito,
folha branca. Tom: sóbrio e operacional, **mas convidativo** (ajuste aprovado em
10/06): cantos suavemente arredondados (8px, não pílula), respiro generoso no mobile,
papel levemente quente, copy que acolhe ("Bom dia — 3 blocos e 2 revisões te esperam"),
e micro-celebrações contidas: bolha que se preenche com tinta, streak que pisca ao
crescer, confete discreto ao bater a meta semanal. Convidativo pela clareza e pelo
feedback, não por mascote ou cores berrantes. É a antítese do Estudei sem ser frio.

**Plataformas (requisito de aprovação).** Desktop e mobile são **ambos de primeira
classe**, com layouts próprios: desktop = cockpit denso com sidebar (análise,
planejamento); mobile = navegação por abas no rodapé (Hoje · Timer · Revisões ·
Estatísticas), uma tarefa por tela, alvos de toque ≥44px, timer em tela cheia.
Critério de pronto: TODO fluxo principal executável nas duas plataformas — não há
"versão completa" e "versão de consulta".

**Densidade.** Desktop = cockpit denso (tabelas eficientes, números tabulares, pouco
espaço perdido — como seus painéis). Mobile = uma coisa só por tela: "Hoje", timer
grande, registro em 3 toques.

**Paleta (derivada do material da prova):**
- `#F7F8F6` Papel — fundo
- `#1A1B1E` Tinta — texto e elementos principais
- `#2148C0` Caneta azul — ação primária, links, destaque (a cor da esferográfica do edital)
- `#1E7D46` Correto — acertos, metas atingidas
- `#C03B2B` Errado — erros, alertas (vermelho de caneta de corretor)
- `#9A9DA3` Grafite — secundários, bordas, estados desabilitados

**Tipografia.** **IBM Plex Sans** (UI e texto) + **IBM Plex Mono** (todos os números:
timer, estatísticas, percentuais, contadores — com `tabular-nums`). O mono nos números
dá o ar de documento oficial/gabarito e resolve alinhamento de tabelas. Sem fonte
decorativa: a personalidade vem do mono + da assinatura.

**Assinatura (o único elemento memorável).** A **bolha de cartão-resposta** como
linguagem universal de progresso: tópico pendente ○, em curso ◐, concluído ●. O
heatmap de constância é uma fileira de bolhas preenchidas; concluir uma revisão
"preenche a bolha" com uma micro-animação de tinta (única animação do sistema).
Todo o resto fica quieto e disciplinado.

**Estados desenhados.** Vazio = convite ("Nenhum plano ainda — importe o JSON gerado
pelo Claude"); carregando = bolha pulsando; erro = diz o campo e como corrigir;
timer interrompido = recuperação automática com aviso. Modo escuro apenas na tela do
timer (estudo noturno), como no print de referência.

**Copy.** Botões dizem o que fazem: "Registrar sessão", "Preencher gabarito" (registro
de simulado), "Importar plano". Verbo se mantém no feedback ("Registrar" → "Sessão
registrada"). Nada de "Potencialize seus estudos".

---

## 7. Riscos do projeto (honestos)

| Risco | Mitigação |
|---|---|
| Construir a ferramenta comer o tempo de estudo (o objetivo é o TRF3, não o app) | Timebox: MVP em **2 fins de semana**; o que não couber vai para "Depois" sem discussão |
| Perda de dados no localStorage (limpar cache do navegador apaga tudo) | Sync local quando o servidor está rodando + export JSON com 1 clique + lembrete semanal de backup |
| Plano da skill mudar de formato e quebrar a importação | Versionar o contrato JSON (`"versao": 1`) nos dois lados |
| Recriar o Anki por tentação | Proibido na constituição — flashcard é do Anki |

---

## 8. Plano técnico (Fase 4)

### Stack
| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | HTML/CSS/JS puro, sem framework e sem build | Constituição; padrão dominado (Dashboard Financeiro); deploy = push |
| Dados | `localStorage` com camada `store.js`, Firebase Auth + Firestore para nuvem e sincronização local opcional via `/api/sync` | Isolar o storage mantém o app simples/offline; Firebase resolve PC/celular no GitHub Pages; sync local fica como apoio de desenvolvimento |
| Gráficos | Chart.js via CDN | Já dominada; leve |
| PWA | `manifest.json` + service worker (cache estático) | Instalável no celular; abre offline |
| Hospedagem | GitHub Pages (`samuelgomes01`) | Grátis; padrão existente |

### Estrutura de arquivos
```
estudos-app/
├── index.html          # shell único (SPA por hash: #hoje, #plano, #stats...)
├── manifest.json
├── sw.js               # cache de estáticos
├── css/styles.css      # tokens do brief (paleta, tipos) no topo como variáveis
├── js/
│   ├── store.js        # localStorage: schema, CRUD, migrations, export/import JSON
│   ├── sync.js         # sincronização local PC/celular via /api/sync
│   ├── firebase-sync.js # sincronização em nuvem via Firebase Auth + Firestore
│   ├── domain.js       # RN01–RN08 puras (testáveis sem DOM)
│   ├── app.js          # roteamento + renderização das telas
│   ├── timer.js        # cronômetro/pomodoro + recuperação, limite e alerta
│   ├── charts.js       # gráficos
│   └── frases.js       # frase do dia (array curado, rotação determinística por data)
├── data/exemplo-trf3.json   # plano real exportado pela skill (dado de exemplo vivo)
└── tools/servidor.ps1       # servidor local estático + API /api/sync para uso na rede
```

### Decisões técnicas
| Decisão | Alternativas | Motivo |
|---|---|---|
| RNs isoladas em `domain.js` puro | lógica espalhada nas telas | Testável; migração futura leva as regras intactas |
| SPA por hash, sem router lib | múltiplas páginas | PWA simples, sem dependência |
| Timer persiste `inicioEm` no localStorage a cada tick | só em memória | F1 caminho infeliz: fechar navegador não perde a sessão |
| Sync local via servidor PowerShell | login/Supabase já na v1 | Resolve PC/celular no mesmo Wi-Fi sem conta, custo ou backend externo |
| Firebase Auth + Firestore para GitHub Pages | manter só `/api/sync` local | GitHub Pages é estático; Firebase permite o mesmo histórico no PC e celular com login Google |
| Timer atualiza título da aba + alerta | manter aviso só dentro da tela | Ajuda quando o usuário estuda com outra aba aberta e define tempo máximo |
| Frase do dia determinística (índice = dia do ano % n) | aleatória | Mesma frase o dia todo em qualquer dispositivo |

### Riscos técnicos
| Risco | Prob. | Mitigação |
|---|---|---|
| localStorage limpo pelo navegador | média | Export JSON 1 clique + aviso se último backup > 7 dias |
| iOS/Safari limitar PWA/SW | baixa | App funciona 100% sem SW; SW é só conforto |
| Plano TRF3 com 288 tópicos pesar na renderização | baixa | Render por disciplina colapsada (como o Estudei faz) |

---

## 9. Tasks (Fase 5)

**Onda 1 — Fundação**
- [x] T001 — Estrutura de arquivos + shell PWA + tokens CSS do brief → *verificado em 11/06/2026: app servido localmente, SW registrado, manifest + ícones OK*
- [x] T002 — `store.js` com schema do contrato de dados + export/import JSON de backup → *verificado: export marca `ultimoBackup`; restauração valida o arquivo*
- [x] T003 — Importação do plano (F2): upload/colar JSON v1, preview, RN08 (preserva histórico) → *verificado: `exemplo-trf3.json` carrega 288 tópicos; mesclagem preserva sessões/revisões e marca órfãos*

**Onda 2 — Núcleo diário**
- [x] T004 — Tela Hoje com ordenação RN06 (revisões vencidas → blocos da semana → reabertos) → *verificado no navegador com os 3 tipos presentes*
- [x] T005 — Timer (cronômetro + pomodoro) com recuperação de sessão interrompida → *verificado: reload com pomodoro rodando recuperou o tempo e reabriu no timer*
- [x] T006 — Registro de sessão em ≤3 toques + RN02 (desempenho), RN04 (streak), RN07 (sugestão de reestudo) → *verificado: 20/20 asserts das RNs + modal RN07 com 70% de erro; duplicado pede confirmação*

**Onda 3 — Ciclos de retenção**
- [x] T007 — Revisões automáticas: RN01 (gera 24h/7d/30d ao concluir teoria) + RN03 (<70% na de 30d reabre tópico) → *verificado: revisões em 12/06, 18/06 e 11/07; 30d com 50% reabriu o tópico*
- [x] T008 — Simulados (F3): registro por disciplina, comparação com meta (RN05 semáforo), "piores → fila" → *verificado: 80/70/60% pintaram verde/amarelo/vermelho contra meta 75%*

**Onda 4 — Painel e polish**
- [x] T009 — Home/Estatísticas: cards, heatmap de constância (bolhas), 2 gráficos Chart.js → *verificado: ambos os gráficos renderizam; aviso desenhado para offline sem CDN*
- [x] T010 — Edital verticalizado com bolhas ○◐● e % de incidência por tópico → *verificado: status, incidência, desempenho e tag "reaberto" refletem o store*
- [x] T011 — Frase do dia + countdown/janela da prova (do radar) → *verificado: janela jan–jun/2027 exibida com confiança e data de reavaliação*
- [x] T012 — Checklist de entrega da metodologia: fluxos ponta a ponta nas DUAS plataformas, caminhos infelizes, estados vazio/carregando/erro, formatos BR → *verificado: F1–F4 executados em 375px e 1280px, zero erros no console*

**Onda 5 — Pós-MVP: sincronização, timer e experiência**
- [x] T013 — Sincronização local PC/celular: servidor local expõe `/api/sync`, `js/sync.js` sincroniza o estado quando o app roda na mesma rede, tela *Plano e backup* mostra status e o service worker não cacheia a API.
- [x] T014 — Timer com presença no navegador: título da aba acompanha a contagem, campo opcional de tempo máximo, aviso sonoro/vibração e notificação quando o limite é atingido.
- [x] T015 — Modernização visual geral: tokens refinados, navegação mais polida, cards/KPIs mais agradáveis, fila do dia mais legível, timer escuro mais premium, modais/toasts/inputs/tabelas com acabamento melhor e mobile mais confortável.
- [x] T016 — Apoio ao estudo: curadoria ampliada de frases motivacionais com pensadores variados e seção de links gratuitos para Notion e NotebookLM, deixando integração futura mapeada.

**Onda 6 — Sincronização em nuvem**
- [x] T017 — Firebase no app estático: `js/firebase-sync.js` inicializa o projeto `app-gestao-estudos`, autentica com Google e sincroniza o estado em `users/{uid}/state/current` no Firestore.
- [x] T018 — Tela *Plano e backup* atualizada: botões de entrar/sair com Google, status da conta, sincronização manual e fallback para `/api/sync` local quando não houver login.
- [ ] T019 — Console Firebase: habilitar provedor Google, criar Firestore Database, publicar regras por usuário e adicionar `samuelgomes01.github.io` nos domínios autorizados.

**Dependências:** T002→T003→T004; T005,T006 dependem de T002; T007,T008 dependem de T006; Onda 4 depende das anteriores.

---

## 10. Auditoria de consistência (Fase 6)

- Toda RN mapeada: RN01/RN03→T007 · RN02/RN04/RN07→T006 · RN05→T008 · RN06→T004 · RN08→T003 ✅
- Fluxos F1→T004-T006 · F2→T003 · F3→T008 · F4→T007 ✅
- Brief compatível com a stack (fontes IBM Plex via Google Fonts CDN; única dependência externa junto com Chart.js — app degrada para fonte de sistema se offline) ✅
- Sem dependência circular; localStorage é ponto único de falha **conhecido e mitigado** (T002 export + aviso de backup) ✅
- Contradição vigiada: "MVP em 2 fins de semana" × 12 tasks — Onda 1+2 no primeiro, 3+4 no segundo; se estourar, T009-T011 deslizam sem culpa ✅

---

## 11. Status das fases (atualizado em 12/06/2026)

1. ~~Constituição~~ ✅ PWA + localStorage, pessoal sem login, frases motivacionais na v1.
2. ~~Brief de design~~ ✅ aprovado com ajuste "convidativo" e exigência das duas plataformas (seção 6).
3. ~~Saída JSON na skill `treinador-concursos`~~ ✅ contrato v1 em `references/contrato-json.md`.
4. ~~Plano técnico, Tasks e Auditoria~~ ✅ seções 8–10.
5. ~~Implementação — Ondas 1 a 4 (T001–T012)~~ ✅ concluída e verificada no Claude Code
   em 11/06/2026 (ver checkboxes da seção 9). O `data/exemplo-trf3.json` foi gerado no
   contrato v1 (10 disciplinas, 288 tópicos, cronogramas sustentável 28 sem. e hardcore
   17 sem.) — substituível a qualquer momento pelo export real da skill.
6. ~~Pós-MVP: sincronização local, timer com alerta, modernização visual e ferramentas de apoio~~ ✅ concluído em 12/06/2026 (ver Onda 5).
7. **Sincronização em nuvem:** código Firebase integrado ao app; falta concluir a configuração no Console Firebase (ver T019).
8. **[PRÓXIMO] Publicação:** publicar a nova versão no GitHub Pages e validar login + sync no PC/celular.
