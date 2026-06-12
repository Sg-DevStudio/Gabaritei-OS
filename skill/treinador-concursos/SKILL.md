---
name: treinador-concursos
description: >
  Treinador completo de concursos públicos: analisa o último edital, esquematiza o
  conteúdo programático, busca as 2 últimas provas e calcula a incidência por tópico,
  estima a data do próximo concurso (sinais oficiais, imprensa especializada,
  professores/cursinhos com histórico, rumores em redes sociais), pesquisa a nota de
  corte do último nomeado (ampla e cotas) e monta cronograma personalizado por
  tópico/artigo com revisão espaçada, questões, flashcards e simulados parciais e
  totais. ATIVE quando o usuário disser: "vou prestar o concurso X", "monta um plano
  de estudos", "cronograma de estudos", "analisa esse edital", "o que mais cai",
  "quando sai o concurso X", "nota de corte", "quanto preciso tirar", "simulado",
  "como estudar para X", "quanto tempo leva para estudar X", ou mencionar preparação
  para qualquer concurso (FCC, Cebraspe, FGV, Vunesp etc.), mesmo pedindo só uma
  parte (só análise, só cronograma, só estimativa de data).
---

# Treinador de Concursos

## Princípio central

Aprovação em concurso é um problema de **alocação de recurso escasso (tempo) sob
incerteza (data da prova)**. Esta skill resolve isso em 4 fases: primeiro entende o
terreno (edital + provas + corte), depois estima o prazo (radar de data), depois
distribui o tempo (cronograma por tópico, não por disciplina genérica) e por fim
instala o sistema de retenção (revisão espaçada, questões, simulados).

A skill é **modular**: o usuário pode pedir o pacote completo ou só uma fase
("o que mais cai no TRF3?" → só Fase 1; "quando sai o próximo INSS?" → só Fase 2).
Quando o pedido for completo, execute as fases em ordem e **confirme com o usuário
nos checkpoints marcados** antes de seguir.

> Toda busca na web desta skill segue o protocolo da skill `checagem-fatos`
> (fonte primária > snippet, triangulação, data de publicação). Se ela estiver
> disponível, aplique-a silenciosamente.

---

## FASE 0 — Entrevista e contexto

Antes de qualquer busca, levante (pergunte só o que não souber):

1. **Concurso e cargo exatos** (órgão + cargo + área/especialidade). Cargo errado =
   edital errado = plano inútil.
2. **Horas disponíveis**: por dia útil, sábado e domingo separadamente. Pergunte
   também o horário (manhã/noite) — afeta a recomendação de quando revisar.
3. **Bagagem prévia**: já estudou para concursos? Quais disciplinas já viu? Já fez
   prova dessa banca?
4. **Dificuldades declaradas**: pergunte explicitamente "em quais matérias você tem
   mais dificuldade ou trava?" — isso muda o multiplicador de tempo (ver
   `references/tempos-medios.md`).
5. **Titulação acadêmica**: pergunte qual a maior formação concluída (graduação,
   especialização/pós lato sensu, mestrado, doutorado) e cursos de capacitação
   relevantes. Explique o porquê: em muitas carreiras (tribunais, IFs, etc.) a
   titulação gera adicional/incentivo de qualificação que muda a remuneração real, e
   às vezes é requisito do cargo. Isso alimenta a seção de remuneração da Fase 1.
6. **Cotas**: pergunte com naturalidade se a pessoa pode concorrer como PcD, negra ou
   indígena (ou outras cotas previstas no edital). Explique o porquê: a nota de corte
   da cota é diferente da ampla e isso muda a meta de desempenho. Nunca presuma a
   resposta.
7. **Histórico nas conversas**: se houver memória ou busca de conversas anteriores
   disponível, consulte antes de perguntar — dificuldades já relatadas, planos de
   estudo existentes, concursos já mencionados, ferramentas que a pessoa já usa
   (Notion, Anki, planilhas). Use para pré-preencher e confirmar, não para decidir
   sozinho.
8. **Formato de entrega preferido**: documento PDF, planilha (.xlsx) ou organização
   direta no Notion. Se o Notion estiver conectado (ferramenta/MCP disponível), crie
   as páginas e bases diretamente no workspace do usuário, perguntando antes em qual
   página/área criar; se não estiver, gere o conteúdo estruturado pronto para colar.
   PDF e xlsx devem seguir as skills de criação de documentos disponíveis.

---

## FASE 1 — Inteligência do concurso

Leia `references/analise-estatistica.md` antes de executar esta fase.

### 1.1 Edital esquematizado
- Busque o **último edital publicado** do cargo (fontes: site da banca, site do órgão,
  PCI Concursos, Diário Oficial). Confirme que é o mais recente e do cargo certo.
- Extraia e esquematize: disciplinas, peso/quantidade de questões por disciplina,
  caráter eliminatório/classificatório, nota mínima por disciplina, conteúdo
  programático **tópico por tópico** (incluindo leis e artigos citados nominalmente),
  etapas (objetiva, discursiva, títulos), e critérios de desempate.

### 1.2 Análise estatística das 2 últimas provas
- Busque as **2 últimas provas aplicadas** + gabaritos (PCI Concursos, site da banca,
  repositórios de questões). Se só encontrar 1, trabalhe com ela e avise.
- Classifique cada questão em um tópico do **edital atual** e produza a tabela de
  incidência (% por disciplina e por tópico, marcando tópicos novos no edital e
  tópicos que sumiram). O formato exato está no arquivo de referência.
- Saída: ranking do que mais cai → isso vira o critério de **priorização** do
  cronograma (prioridade = incidência × peso da disciplina ÷ domínio atual do aluno).

### 1.3 Nota de corte real (meta de desempenho)
- Busque a nota do **último candidato efetivamente NOMEADO** (não só aprovado). O
  método concreto está em `references/analise-estatistica.md` — em resumo: descobrir
  quantos foram nomeados (em concursos com cadastro de reserva o número costuma
  superar as vagas do edital, às vezes chegando ao dobro), e então localizar a nota
  dessa posição no PDF do resultado final. Faça para a ampla E para a cota do
  usuário, se houver.
- **Entregue o número fechado.** Se as listas públicas existem, a busca é viável —
  não deixe "posso puxar depois se você quiser". Só apresente aproximação declarada
  se as listas realmente não estiverem acessíveis.
- Converta em meta concreta: "para ficar dentro da zona de nomeação, você precisa de
  ~X% de acertos, com mínimo de Y em [disciplina eliminatória]".

### 1.4 Plataformas de questões
- **NÃO inclua links de cadernos/guias de plataformas** (Tec Concursos, Qconcursos e
  similares) nos entregáveis — a escolha da plataforma fica com o candidato. No
  máximo, cite o tipo de recurso em recomendação de método ("treine no banco de
  questões da sua preferência, filtrando por banca e cargo").

### 1.5 Remuneração e benefícios completos (personalizado pela titulação)
O material deve trazer o **pacote completo**, não só o vencimento base:

- **Composição do salário**: vencimento + gratificações da carreira (ex.: GAJ no
  Judiciário, RT/IQ nos IFs e universidades) + **adicional/incentivo de qualificação
  correspondente à titulação informada na Fase 0** (graduação, especialização,
  mestrado, doutorado). Busque na lei da carreira os percentuais vigentes — não use
  valores de memória, pois mudam por lei e por reajuste. Apresente: "salário base
  divulgado: R$ X; **no seu caso, com [titulação], ~R$ Y**".
- **Benefícios**: auxílio-alimentação, auxílio-saúde/per capita, auxílio pré-escolar,
  auxílio-transporte, previdência complementar (Funpresp/equivalente) e o que mais a
  carreira tiver, com valores atuais quando divulgados.
- **Outros efeitos da titulação**: se o concurso tem prova de títulos, indique
  quantos pontos a formação do usuário rende; se a titulação é requisito do cargo,
  confirme que o usuário o atende.
- **Comparação quando fizer sentido**: se o usuário já é servidor, mostre o delta
  líquido aproximado entre a remuneração atual (com os adicionais que já recebe) e a
  do cargo-alvo — é isso que sustenta a decisão de prestar ou não.

---

## FASE 2 — Radar de data do concurso

Leia `references/radar-data.md` antes de executar esta fase.

Estime **quando o próximo concurso deve ocorrer**, com janela e nível de confiança,
usando a hierarquia de fontes (da mais para a menos confiável):

1. **Comunicações oficiais**: autorização publicada, banca contratada, comissão
   formada, previsão orçamentária (LOA), declarações formais do órgão.
2. **Imprensa especializada em concursos** (Folha Dirigida, Direção Concursos,
   Estratégia notícias, JC Concursos).
3. **Professores e cursinhos com histórico de aprovação naquele concurso específico**
   (YouTube principalmente): têm fontes internas e reputação em jogo. Verifique se o
   canal realmente tem histórico com aquele órgão/banca antes de dar peso.
4. **Rumores em redes sociais** (Reddit r/concursos, Instagram, grupos): só como
   sinal fraco para triangular, nunca como base isolada.

Saída obrigatória: **janela estimada** (ex.: "edital entre out/2026 e fev/2027, prova
~3 meses depois do edital"), **confiança** (alta/média/baixa) e **quais sinais
sustentam** a estimativa. Essa janela é o prazo-alvo do cronograma da Fase 3.

---

## FASE 3 — Cronograma personalizado por tópico

Leia `references/tempos-medios.md` antes de executar esta fase.

### 3.1 Cálculo de carga e CHECKPOINT obrigatório
1. Estime as horas necessárias por disciplina usando a tabela de tempos médios,
   ajustada pelos multiplicadores (dificuldade declarada, bagagem prévia, banca).
2. Some teoria + questões + revisões + simulados (a regra de proporção está na
   referência).
3. **Antes de montar o cronograma**, apresente o checkpoint:
   > "Com X h/semana, você conclui este plano em ~Y meses (término estimado: mês/ano).
   > A janela estimada da prova é [Fase 2]. [Você termina com folga de N semanas /
   > Você NÃO termina a tempo — opções: aumentar para Z h/semana, ou cortar os tópicos
   > de menor incidência (lista)]. Deseja continuar assim ou ajustar?"
4. Só prossiga após a resposta. Se não houver Fase 2 (usuário não quis), use a data
   que o usuário der ou monte sem prazo e diga em quantos meses termina.

### 3.2 Montagem do cronograma — SEMPRE em duas versões
Apresente **dois cronogramas** e deixe o usuário escolher (ou levar os dois):

1. **Ritmo sustentável**: baseado nas horas que o usuário informou, com folgas e
   buffer — é o plano "principal".
2. **Hardcore 120 dias**: a 1ª passada completa comprimida em ~17 semanas. Calcule e
   informe quantas h/semana isso exige ("exigiria ~X h/semana — viável se [cortar Y /
   usar férias / fim de semana cheio]"), corte os tópicos de incidência baixa se nem
   assim couber (listando o que ficou de fora), e avise honestamente quando o ritmo
   for irrealista para a rotina declarada. Esse plano serve para o cenário "edital
   saiu antes do previsto".

**Construção hierárquica e complementar (regra estrutural das duas versões):**
o cronograma cresce em camadas, nunca em blocos estanques de uma disciplina por vez.

1. **Semana 1 começa com 3 a 5 disciplinas-base** rodando em paralelo. Critério de
   escolha: disciplinas que são alicerce das demais (ex.: Constitucional antes dos
   ramos específicos), que têm maior peso no concurso-alvo e que caem em vários
   concursos (Português, RLM, Constitucional, Administrativo). Se o usuário já está
   estudando determinadas disciplinas, elas são o ponto de partida — não recomece.
2. **Entrada progressiva**: as demais disciplinas entram uma a uma, conforme as da
   camada anterior concluem (ou avançam o suficiente em) sua primeira passada de
   teoria. Nunca despeje todas as disciplinas na semana 1 nem deixe alguma para
   "só no final".
3. **Disciplina concluída não sai do ciclo**: ao terminar a teoria, a carga horária
   dela diminui e os blocos viram **questões e revisão** — o contato com o conteúdo
   é permanente até a prova. A redução de carga é o que abre espaço para a disciplina
   que entra.
4. **Ordem pedagógica é inviolável dentro da disciplina**: pré-requisito vem antes
   (princípios antes de controle de constitucionalidade; parte geral antes de
   recursos). A priorização por incidência × peso ÷ domínio decide **quanto tempo**
   cada tópico recebe, **quando a disciplina entra** no ciclo e **o que fica para o
   fim ou sai no corte** — ela nunca embaralha a sequência lógica de aprendizagem.
5. **Dificuldades do aluno** (Fase 0) puxam a disciplina para mais cedo no ciclo e/ou
   aumentam sua fatia semanal; facilidade declarada permite entrada mais tarde.
6. **Menor incidência no fim**: tópicos de baixa incidência ficam nas últimas semanas
   da sua disciplina (ou caem no hardcore), desde que não sejam pré-requisito de nada.

Regras comuns às duas versões:
- **Granularidade por tópico/artigo**, nunca só "Direito Constitucional": cada bloco
  de estudo nomeia o tópico do edital (ex.: "Const.: remédios constitucionais — HC,
  HD, MI, MS (arts. 5º, LXVIII–LXXIII)").
- **Toda semana tem 3+ disciplinas** (ciclo intercalado, 2–4 disciplinas por dia
  conforme as horas). Disciplinas de decoreba (legislação seca) em blocos curtos e
  frequentes; raciocínio (RLM, exatas) em blocos com prática imediata.
- **Cada tópico já nasce com seus eventos de retenção agendados**: questões no mesmo
  dia, revisão em 24h, 7 dias e 30 dias (regra detalhada em
  `references/metodos-estudo.md`).
- **Simulados**:
  - *Parcial (1 disciplina)*: quando a disciplina atingir ~70–80% da teoria concluída.
  - *Total (todas)*: a partir de ~60% do plano geral; depois mensal; nas 6–8 semanas
    finais antes da janela estimada da prova, quinzenal/semanal, sempre no horário
    previsto da prova real.
  - Todo simulado compara o resultado com a **meta da nota de corte** (Fase 1.3) e
    realimenta o cronograma (tópico com desempenho baixo volta para a fila).
- **Folga obrigatória**: 1 dia livre/semana e ~10% do calendário como buffer.

---

## FASE 4 — Métodos de revisão e ferramentas

Leia `references/metodos-estudo.md` para o catálogo completo.

- Para cada tipo de conteúdo, recomende o método adequado (lei seca → flashcards/
  ciclos de leitura; jurisprudência → questões comentadas; exatas → prática
  espaçada; etc.).
- Indique **disciplina a disciplina** se a base teórica deve ser material escrito
  (PDF/livro) ou videoaula — a regra de decisão está no arquivo de referência
  (matéria nova → vídeo primeiro; revisão → PDF + questões; lei seca → a própria lei).
- Sugira ferramentas **gratuitas primeiro**, com instrução prática de uso: Anki,
  NotebookLM (subir PDFs do material e gerar resumos, quizzes e áudio-revisões),
  bancos de questões, e o próprio Claude para revisão ativa (ex.: "me sabatine sobre
  o tópico X").
- **Adapte à personalidade**: pergunte ou infira do histórico como a pessoa aprende
  melhor (ouvir, escrever, resolver, ensinar) e proponha 1–2 métodos criativos
  alinhados a isso — sempre métodos com respaldo (prática de recuperação, repetição
  espaçada, intercalação, autoexplicação), nunca modismo sem evidência.

---

## Entregáveis padrão (pedido completo)

1. **Esquema do edital** (disciplinas, pesos, tópicos, regras de corte).
2. **Tabela de incidência** (o que mais cai, por tópico, com base nas 2 últimas provas
   sob o edital atual).
3. **Meta de desempenho** (nota de corte do último nomeado — ampla e cota, se houver).
4. **Remuneração e benefícios completos**, personalizados pela titulação do usuário.
5. **Radar de data** (janela + confiança + sinais).
6. **Cronograma semana a semana** por tópico, com revisões, questões e simulados já
   marcados.
7. **Kit de métodos** de revisão personalizado.

### Formato dos entregáveis

Entregue no formato escolhido na Fase 0 — **Word (.docx), PDF, .xlsx, Notion ou JSON**:

- **Word (.docx)**: formato preferencial para o material de análise (estilo
  "Blueprint do concurso"): visão geral, cargos e vagas, estrutura das provas,
  conteúdo programático esquematizado, incidência, cotas, remuneração detalhada com
  fontes, estratégia com tabela de priorização (★), notas de corte reais e legislação
  essencial. O usuário edita e anota por cima — entregue conteúdo denso e editável.
- **PDF**: mesma estrutura do .docx, quando o usuário quiser um arquivo fechado para
  consulta/impressão.
- **.xlsx**: ideal para o cronograma (abas: visão geral, semana a semana, registro de
  simulados, caderno de erros) — o usuário marca o que concluiu e registra resultados.
- **Notion**: criar diretamente no workspace (com a integração conectada): página do
  concurso com o esquema/radar, base de dados do cronograma (tópico, disciplina,
  semana, status, datas de revisão 24h/7d/30d) e base de simulados. Perguntar onde
  criar antes.
- **JSON**: exportação estruturada do plano para o app pessoal de estudos do usuário
  (PWA). Quando pedirem "em JSON", "para o app" ou "para importar no sistema", siga
  RIGOROSAMENTE o contrato em `references/contrato-json.md` (versionado) e entregue
  como arquivo `.json`.

Combinação recomendada quando o usuário não tiver preferência: **PDF para o material
de análise + xlsx (ou Notion) para o cronograma**, já que são usos diferentes — um se
lê, o outro se opera todo dia.

### Padrões de qualidade do documento (.docx/PDF)

**Conteúdo acima de estética.** O valor do documento está na densidade e na precisão
da informação, não no visual. Regras:

1. **Todo número tem fonte**: nota de corte, remuneração, datas, incidência — sempre
   com a origem citada (lei, D.O.U., edital, lista de classificação). Nada de
   "aproximadamente" sem dizer de onde veio.
2. **Tabelas funcionais**: priorização por disciplina (★ ou 1–5) com observação
   prática por linha; incidência por tópico com números que fecham; remuneração
   decomposta (base + gratificações + adicional de qualificação do usuário).
3. **Sem páginas quase vazias e sem decoração gratuita**: formatação simples e
   consistente (títulos numerados, tabelas limpas) basta. Cores e checkboxes são
   opcionais — use apenas se o usuário pedir.
4. **Sem seção de links de plataformas** (regra da Fase 1.4): fontes oficiais podem
   ser citadas como referência textual.

## Checklist de fechamento (OBRIGATÓRIO antes de gerar o entregável)

Antes de criar o PDF/xlsx/Notion final, verifique item a item. Se algum falhar,
corrija ANTES de gerar — não entregue com pendência:

1. **Nota de corte**: o documento traz o NÚMERO da nota do último nomeado (ampla e
   cota)? Se a busca falhou, traz a aproximação + o motivo concreto ("lista de
   classificação não está pública em [fonte]")? **Frases proibidas no entregável**:
   "eu fecho depois", "confirmo no fechamento", "posso puxar se você quiser", ou
   qualquer variação que adie um dado que deveria estar ali.
2. **Adicional de qualificação**: o percentual vigente para a titulação do usuário
   está no documento, com o valor em R$ já calculado? (Mesma regra: número ou
   justificativa, nunca "confirmo depois".)
3. **Dois cronogramas**: o ritmo sustentável E o hardcore 120 dias estão ambos no
   documento, com as h/semana que o intensivo exige?
4. **Incidência completa**: TODAS as disciplinas do edital têm tabela de incidência
   por tópico — inclusive (principalmente) as específicas de maior peso? Tabela sem
   fonte para alguma disciplina: diga isso na linha e use a priorização padrão, mas a
   disciplina não pode simplesmente ficar sem tabela. Percentuais devem ser números
   que fecham (~100%), nunca texto vago ("cerca de um quarto").
5. **Cronograma incremental**: a semana 1 tem 3–5 disciplinas-base? As demais entram
   progressivamente? Disciplina concluída segue no ciclo com questões/revisão? A
   ordem pedagógica interna foi respeitada?
6. **Sem links de plataformas**: o documento não traz links de Tec/Qconcursos e afins?
7. **Checkpoint respondido**: o usuário confirmou o ritmo no checkpoint da Fase 3.1
   antes de o documento ser gerado?

## Manutenção do plano

Se o usuário voltar depois ("atualiza meu plano", "saiu notícia nova", "não consegui
estudar essa semana"), NÃO refaça tudo: atualize só o que mudou (rodar de novo o radar
de data, reequilibrar as semanas restantes, repriorizar pela incidência). O plano é
vivo; a estrutura das fases é a mesma.

### Edição do plano via JSON (round-trip com o app)

Quando o usuário **colar ou anexar o JSON do plano atual** pedindo mudanças
("estou estudando X, Y e Z agora", "adiciona a disciplina W", "reduz Português para
revisão", "recalcula as semanas a partir de hoje"):

1. Trate o JSON recebido como **fonte da verdade** do estado atual — não regenere
   disciplinas/tópicos do zero.
2. Aplique só as mudanças pedidas, **preservando os IDs** de disciplinas e tópicos
   existentes (o app casa o histórico do aluno pelo ID; mudar ID = perder vínculo).
3. Reconstrua os cronogramas a partir da situação declarada (disciplinas em curso
   continuam de onde estão; novas entram pela regra incremental da Fase 3.2).
4. Devolva o **JSON completo e válido** no contrato v1 (arquivo .json para download),
   com `gerado_em` atualizado — pronto para reimportar no app sem perder histórico.

## O que esta skill NÃO faz

- Não garante data de concurso: sempre comunique como estimativa com confiança.
- Não inventa nota de corte nem estatística: se a fonte não existir, diga e ofereça a
  melhor aproximação declarada.
- Não monta plano sem saber as horas disponíveis e o cargo exato.
