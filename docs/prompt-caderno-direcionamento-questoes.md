# Prompt reutilizável — caderno de direcionamento para questões

Preencha os campos iniciais e copie o bloco abaixo. Para revisar um caderno existente, informe o plano e mantenha o trabalho restrito a ele até a validação.

```text
Crie ou revise um caderno de direcionamento para questões no Gabaritei OS.

ENTRADAS
- Concurso, órgão e região: [preencher]
- Cargo, área e especialidade: [preencher]
- Plano cadastrado/identificador: [informar ou localizar no sistema]
- Edital e retificações: [link oficial ou arquivo; se ausente, pesquisar]
- Bancas para treinamento: [preencher; na ausência, usar a banca do edital]
- Período e escolaridade do filtro: [preencher ou conferir no plano]
- Trabalho solicitado: [criar / revisar]

OBJETIVO
O aluno deve escolher seu plano, abrir a disciplina, clicar no assunto e começar a resolver questões já filtradas. O caderno deve permitir revisar todo o conteúdo do concurso de forma organizada e ativa, seguindo a ordem do edital. Faça o trabalho concreto no sistema; não entregue apenas uma proposta.

1. CONFIRA O PLANO E O EDITAL
Confirme concurso, cargo, área, especialidade, região e edição antes de modificar dados. Use o edital oficial vigente e suas retificações para conferir todas as disciplinas, tópicos e subtópicos. Não misture programas de cargos diferentes nem reutilize caderno de outro concurso como fallback. Preserve os identificadores dos conteúdos equivalentes, o progresso, as sessões e os links pessoais. Conteúdo retirado do edital deve manter seu histórico identificado, sem continuar como matéria vigente. Não invente incidências, notas de corte, datas ou estimativas oficiais.

2. PESQUISE AS CATEGORIAS REAIS DO GRAN
Consulte o catálogo e a árvore de assuntos do próprio Gran Questões. Pesquise pelo nome, por sinônimos, pela lei e por seus títulos/capítulos/artigos. Confira o nome e os ancestrais de cada categoria para não confundir assuntos homônimos, diplomas ou ramos do Direito. Um MCP pode ajudar na busca, mas seu resultado deve ser confrontado com o catálogo oficial. Nunca invente códigos, deduza IDs pela sequência numérica ou aceite correspondência automática só pela semelhança do nome.

3. ESCOLHA O RECORTE MAIS PRECISO
Use uma categoria correspondente ao assunto solicitado sempre que ela existir. Se o subtópico reúne vários assuntos, selecione as categorias específicas necessárias e gere UM único link que as reúna. Não acrescente a disciplina inteira, a lei inteira ou um ancestral amplo junto com seus filhos: isso pode ampliar o resultado e anular a precisão dos filtros.

Exemplos:
- “Lei 8.112 — remoção, redistribuição e substituição”: usar os capítulos correspondentes, e não a Lei 8.112 inteira.
- “LBI — direito ao trabalho, arts. 34 a 38”: usar a categoria de direito ao trabalho, e não todo o Estatuto.
- “Regência verbal, nominal e crase”: reunir as categorias correspondentes em um só link, sem incluir Português inteiro.

Só utilize um filtro amplo quando não houver categoria adequada para o recorte após pesquisar a hierarquia e termos equivalentes. Registre o motivo e identifique esse filtro como amplo. Se apenas parte do tópico tiver correspondência, informe a cobertura parcial e o que falta. Se não houver nem uma categoria ampla pertinente, deixe o tema para complemento; não coloque um link de assunto diferente para aparentar cobertura. Redação e materiais sem questões correspondentes também devem ser tratados com honestidade.

4. MONTE E VALIDE OS LINKS
Preserve as bancas escolhidas e confira escolaridade, anos e exclusão de anuladas/desatualizadas conforme o plano. Abra amostras representativas no Gran e confira os assuntos realmente selecionados e a pertinência das questões, especialmente leis e títulos compostos. Verifique todos os IDs e parâmetros contra o catálogo. Resposta HTTP 200, URL bem formada ou teste local não provam que o filtro está correto. Se o filtro específico não tiver questões para a combinação de banca/ano/nível, informe essa situação; não amplie o assunto silenciosamente para aumentar o volume. Não prometa que cada questão foi validada ou que todos os resultados seguem a legislação atual sem ter conferido isso.

5. INTEGRE AO GABARITEI
O caderno pertence ao seu plano. Deve ser acessível em Detalhes do plano, abaixo da apresentação da trilha e acima de “Disciplinas e tópicos”, e também em Planejamento. Não crie uma aba lateral independente de Trilha de questões. Planos sem caderno devem mostrar um card central com mensagem clara, contato e retorno aos planos, sem abrir o caderno de outro concurso.

Mantenha o padrão visual compacto: disciplinas recolhíveis, busca, contagem de subtópicos ao lado do nome da disciplina e um acesso por subtópico. No computador, botão “Resolver no Gran ↗”; no celular, logo do Gran com nome acessível. Não repita a banca em cada linha. Não crie metas fixas como “0/200 feitos”: o aluno resolve quantas questões quiser. Ajuda deve ficar em “Como usar?”, com explicação curta em um popover/modal acessível por clique, foco e, quando adequado, hover.

Disponibilize um único modo “Editar caderno” para o aluno adicionar, editar ou substituir links em qualquer subtópico, inclusive de NotebookLM, TEC, Qconcursos e outras plataformas. Preserve links pessoais por usuário e plano. Não sobrescreva edições pessoais ao atualizar a base. O material de outra plataforma continua sujeito ao acesso exigido por ela; não prometa importação de acertos/erros ou abertura no app Android sem validar esse comportamento.

6. CONCLUA COM EVIDÊNCIAS
Compare o caderno inteiro com o programa do plano: nenhum assunto pode desaparecer sem justificativa. Gere um registro revisável contendo tópico, códigos, nomes das categorias, fonte, data da conferência, classificação (específico/amplo/parcial/pendente) e motivo de cada exceção. Teste identidade do plano, URLs, preservação dos links pessoais e navegação em computador e celular. Acrescente verificações que impeçam regressão para filtros de disciplina ou lei inteira nos casos corrigidos. Não altere outros cadernos nesta etapa. Publique apenas quando houver autorização na conversa e confirme a versão efetivamente disponível.

Ao terminar, informe de forma breve: o que mudou, quantidade de assuntos com filtros específicos, amplos e pendentes, como foi validado e as limitações reais. Liste as pendências claramente. Só depois passe ao próximo caderno, conforme combinado com o usuário.
```
