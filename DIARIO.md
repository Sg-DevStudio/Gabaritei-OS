# Diário do projeto — Plataforma de Estudos para Concursos

Registro diário dos passos do projeto: o que foi feito, decisões tomadas e o que vem
a seguir. **Como usar:** ao trabalhar no projeto, crie uma entrada com a data do dia
(mais recente em cima), risque itens do backlog quando concluídos e anote fricções de
uso real — elas alimentam a evolução do app.

Documentos-irmãos: [plano-projeto-plataforma-estudos.md](plano-projeto-plataforma-estudos.md)
(constituição, spec, brief, tasks) · [README.md](README.md) (uso do app).

---

## Próximos passos (backlog)

- [ ] **Publicar no GitHub Pages**: Settings → Pages → branch `main`, pasta `/ (root)`;
      testar a URL no celular e instalar como PWA ("Adicionar à tela inicial").
- [ ] **Gerar o JSON oficial do TRF3** pela skill (`"exporta meu plano TRF3 em JSON
      para o app"`) e importar no lugar do exemplo — o histórico é preservado pelos IDs.
- [ ] **Validar na própria rotina por 2 semanas** (estratégia da Constituição):
      registrar sessões reais e anotar aqui o que atrapalhar o fluxo de ≤30s.
- [ ] **Backup semanal**: exportar o .json quando o app avisar (aviso aparece após 7 dias).
- [ ] **Reavaliar o radar de data em 10/08/2026** (pedir à skill para rodar a Fase 2
      de novo e reimportar o plano se a janela mudar).
- [ ] **Fila "Depois" do plano** (só após validar o MVP): calendário mensal completo,
      mais cortes de estatística, geração de simulado, múltiplos planos.
- [ ] **Visão de longo prazo** (seção 5 do plano): beta fechado com colegas →
      migração localStorage → Supabase + Vercel (o contrato JSON versionado barateia isso).

---

## Entradas

### 12/06/2026 (noite) — topbar fixo, calendário automático e editais esquematizados
- **Menu superior fixo** (desktop e mobile): modo escuro, Configurações (engrenagem)
  e Perfil (modal com nome e conta). O botão de tema deixou de ser flutuante.
- **Aba "Plano e dados" virou "Configurações"**: removidos os cards de ferramentas
  gratuitas e os links do plano (já existem na tela Hoje); a importação agora aceita
  .xlsx e .csv além de JSON.
- **Calendário do Planejamento preenche sozinho**: ao importar um plano ou gerar o
  cronograma, todas as semanas viram blocos na agenda (semanal e mensal). Planos
  antigos com cronograma e agenda vazia são preenchidos na primeira visita à aba.
- **Histórico separado do plano**: alternância "Plano de estudos" × "Site inteiro"
  (com coluna do plano de origem de cada sessão).
- **Editais esquematizados** (em Configurações; no futuro, só para admin): cadastro
  de editais com tópicos detalhados, banca e nota de corte estimada (JSON/Excel/CSV);
  botão "Criar plano personalizado" gera o plano com a meta de corte do edital e abre
  o ajuste de rotina. Os editais também aparecem no catálogo do Planejamento.
- Verificado no preview (desktop e 375px): zero erros de console; ciclo completo
  cadastrar edital → criar plano → calendário preenchido → excluir testado e limpo.

### 12/06/2026 (tarde) — planejamento manual, visual novo e plano incremental
- **Skill atualizada** (v2 no repo, `skill/` + `.skill` reempacotado): sem links de
  plataformas nos entregáveis; edição de plano via JSON (round-trip preservando IDs);
  cronograma agora é **hierárquico e incremental** (3–5 disciplinas-base na semana 1,
  entrada progressiva, concluída vira questões/revisão, ordem pedagógica inviolável);
  entrega em Word (.docx) estilo Blueprint, conteúdo acima de estética.
- **Plano TRF3 regenerado** (`data/plano-trf3-tecnico.json` + Downloads, original
  preservado): semanas 1–7 com RLM/CON/ADM/PPE/POR juntas; PCI entra na S8, DEF na
  S12, PRE na S16, TRI na S19; mínimo de 5 disciplinas por semana; sem links.
- **App — Planejamento manual**: novo calendário semanal/mensal com arrastar-e-soltar
  de disciplinas para os dias (toque no celular), blocos editáveis, disciplina manual
  (funciona sem plano importado), integrado à fila da tela Hoje.
- **App — visual**: sidebar azul-marinho com ícones, heatmap de constância central
  estilo GitHub na tela Hoje, % de acertos com mensagem motivacional por faixa,
  **modo escuro completo** (botão flutuante, persistido), raios maiores e chips.
- Verificado no navegador (claro/escuro, mobile/desktop), zero erros no console.

### 12/06/2026 — repositório e organização
- Criado o repositório `SamuelGomes01/App_Gest-o_Estudos` (GitHub) e movidos todos os
  arquivos do projeto para dentro dele.
- Criado este diário para registrar passos anteriores e futuros.
- Primeiro commit do código completo + push para `main`.
- Configuração do preview local ajustada para o novo caminho
  (`tools/servidor.ps1` serve a raiz do repositório na porta 8123).

### 11/06/2026 — implementação completa (Ondas 1–4, T001–T012)
- **Onda 1**: shell PWA (manifest, service worker, ícones), tokens CSS do brief
  (papel/tinta/caneta azul, IBM Plex Sans+Mono, bolhas ○◐●), `store.js`
  (localStorage + backup) e importação do plano com preview e validação campo a campo.
- **Onda 2**: tela Hoje com fila RN06, timer cronômetro/pomodoro com recuperação de
  sessão interrompida, registro de sessão em ≤3 toques com RN02/RN04/RN07.
- **Onda 3**: revisões automáticas 24h/7d/30d (RN01) com reabertura por desempenho
  (RN03); simulados com semáforo contra a meta de corte (RN05) e "piores → fila".
- **Onda 4**: estatísticas (KPIs, heatmap de bolhas, 2 gráficos Chart.js), edital
  verticalizado com incidência por tópico, frase do dia e janela da prova (radar).
- Gerado `data/exemplo-trf3.json` no contrato v1: 10 disciplinas, 288 tópicos,
  cronogramas sustentável (28 sem.) e hardcore (17 sem.), incidências somando 100.
- **Verificação**: 20/20 asserts das regras RN01–RN08 no navegador; fluxos F1–F4
  ponta a ponta em mobile (375px) e desktop (1280px); caminhos infelizes testados
  (JSON inválido, registro duplicado, acertos > feitas, timer interrompido);
  zero erros no console. 1 bug encontrado e corrigido (modal RN07 fechado pelo
  formulário de registro).

### 10/06/2026 — planejamento (metodologia construtor-de-sistemas, fases 0–6)
- Constituição: projeto pessoal, PWA em HTML/CSS/JS puro + GitHub Pages, dados em
  localStorage com export/import, sem login na v1, frases motivacionais entram.
- Especificação: problema, critérios de sucesso observáveis, fluxos F1–F4 com
  caminhos infelizes, contrato de dados e regras RN01–RN08.
- Brief de design aprovado: mundo visual da prova de concurso, tom sóbrio e
  convidativo, bolha de cartão-resposta como assinatura, duas plataformas de
  primeira classe.
- Plano técnico, 12 tasks em 4 ondas e auditoria de consistência (RNs × tasks 100%).
- Definido o contrato JSON v1 com a skill `treinador-concursos` (camada de
  inteligência: incidência, radar de data, nota de corte, plano em 2 velocidades).
