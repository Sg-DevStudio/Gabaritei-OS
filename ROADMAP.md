# Roadmap — Gabaritei OS

Documento vivo de direção do produto. Nasce da análise crítica da plataforma sob
quatro perfis de usuário (iniciante, intermediário, avançado e universitário) e da
pergunta central: **o sistema realmente ajuda o aluno a progredir e chegar bem
preparado na prova?**

> Princípio que guia as prioridades: o app hoje é um ótimo **organizador** de
> estudos, mas quase todo dado depende de **registro manual**. Reduzir essa
> fricção e personalizar por nível/horizonte é o que mais move a agulha.

---

## ✅ Concluído (já entregue / em PR)

- **Editais versionados + atualizar plano** — quando o edital muda (pré-edital →
  edital real), o plano do aluno é atualizado sem perder progresso (merge por id).
- **Ponto de partida ("O que já sei")** — diagnóstico por tópico no assistente;
  o que o aluno já domina entra direto em manutenção (revisão/questões).
- **Timer persistente** — após queda de luz/internet, volta pausado no tempo real.
- **Concluir tópico conta o estudo do dia** — registra a sessão e risca o
  calendário quando há cronômetro ativo do tópico.
- **Catálogo** — só o catálogo global real (sem os editais-exemplo embutidos);
  offline mostra aviso "fique online para ver o catálogo".
- **Tópico "novo" no Timer** — o aluno adiciona um assunto à disciplina (peso
  baixo, individual), com etiqueta verde.
- **Rotina** — máscara HH:MM nas horas (teto 12:00).
- **Editor** — salário/vagas/benefícios; remoção de caráter/nota mínima da UI.
- **Revisão dos 7 editais-base** (Petrobras, TRT4, TRT3, TRF3, Transpetro, TJSP,
  PRF): incidências, pesos, granularidade, metadados, janela e nota de corte.

---

## 🎯 Próximas fases (priorizadas por impacto × esforço)

### Fase 2 — Personalização por horizonte
**Longo prazo / sem data + aprofundamento** · impacto alto · esforço médio
- Detecção **automática** (janela vazia) **e ajustável** no assistente.
- Modo "sem data definida": foco em **cobertura + retenção** (sem contagem
  regressiva falsa); métricas viram "% do edital coberto" e "tudo revisado".
- **Fase de aprofundamento** após a teoria: questões + simulados + revisão
  espaçada nos tópicos de maior incidência, até o edital sair.
- Transição suave para **reta final** quando a data/edital aparece (reusa
  editais versionados).

### Fase 3 — Evolução do estudo
- **Revisão adaptativa por desempenho** (impacto alto · esforço médio): errou
  muito → antecipa a revisão; acertou → espaça mais. Hoje o espaçamento é quase
  fixo.
- **Modo reta final automático** (impacto alto · esforço médio): nas últimas
  semanas, intensifica questões/simulados/revisão.

### Fase 4 — Onboarding e técnica (ganhos baratos)
- **Orientação de técnica por sessão** (impacto médio-alto · esforço **baixo**):
  dizer *como* estudar cada bloco (ler → resumir → questões → revisar; active
  recall). Resolve a maior dor do iniciante.
- **Onboarding guiado** (impacto médio · esforço baixo): primeira semana
  assistida; reduzir jargão do assistente para o novato (modo simples).

### Apostas maiores (decidir com calma)
- **Modo acadêmico / universitário** (impacto alto, público novo · esforço alto):
  criar disciplinas próprias com **vários eventos de prova/entrega com data**
  (em vez de uma prova única), reusando ~80% do motor (timer, revisões,
  cronograma, desempenho).
- **Banco de questões / simulado real** (impacto altíssimo · esforço alto): hoje
  o desempenho depende de registro manual de acertos. Resolver/treinar questões
  dentro do app (próprio ou via importação) seria transformador.

---

## 🔍 Pontos críticos de arquitetura (a endereçar ao longo das fases)

1. **Dependência de input manual** — maior risco do produto; reduzir fricção.
2. **Sem banco de questões integrado** — o app organiza, mas não é onde o estudo
   acontece.
3. **Revisão adaptativa por desempenho** subaproveitada.
4. **Reta final** não dispara nada automaticamente.
5. **Onboarding raso** (só pede nome) — não ensina fluxo nem técnica.
6. **Métrica preditiva** pouco proeminente ("no seu ritmo, chega a ~X% até a
   prova").

---

## 🧹 Pendências pequenas / dívidas

- **Comparação de editais** — separar visualmente "reaproveitamento de conteúdo"
  (overlap) de "cabe no tempo?" (carga × prazo), que hoje confundem; alinhar o
  "(31%)" (mistura contagem de tópicos com % em horas). *(Decisão atual: manter o
  fallback de 6 meses quando não há data, avisando.)*
- **Editais versionados + tópico "novo"** — quando ambos estiverem na main, fazer
  o merge de edital **preservar** os tópicos `adicionadoPeloUsuario`.
- **PRF** — improbidade (Lei 8.429) aparece em ETI-08 e ADM-08; revisar quando
  sair o edital real.
- **Editais** — completar nota de corte / salário-vagas pendentes por edital
  conforme fontes forem confirmadas.

---

*Atualize este arquivo conforme as fases avançam. Itens concluídos sobem para a
seção ✅.*
