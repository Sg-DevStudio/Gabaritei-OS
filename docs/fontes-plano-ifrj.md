# IFRJ — Assistente em Administração

## Documento usado

PDF fornecido pelo usuário: `edital_no_03.2022_concurso_publico_tae_-_retificado.pdf` (43 páginas).

SHA-256: `c123dc688f3019f2f552bf259f2be2cc4e6fe16065a5a5ef97114ffee769851e`.

- Anexo III, página 30: cargo de nível D; 8 questões de Português, 7 de Legislação e Ética, 5 de Informática e 30 de Conhecimentos Específicos.
- Anexo IV, página 31: 1 ponto por questão; mínimos de 3/3/2/12 pontos por disciplina e 30 pontos no total. São requisitos eliminatórios, não notas de corte de classificação.
- Anexo VIII, página 36: conteúdo das três disciplinas comuns.
- Anexo VIII, página 41: conteúdo específico de Assistente em Administração.

O plano tem quatro disciplinas e 51 tópicos. Preserva as referências legais históricas do documento, inclusive a Lei nº 8.666/1993, com observação sobre a revogação e necessidade de revisão no próximo edital. Não usa o conteúdo previsto IFPA/IDECAN que antes existia no JSON.

Os pesos 8/7/5/30 correspondem ao número de pontos por disciplina dos Anexos III e IV: 16%/14%/10%/60%. Todos os itens valem 1 ponto. O editor aceita pesos inteiros positivos sem o limite artificial de 5. Os percentuais dos tópicos distribuem 100% de forma equilibrada em cada disciplina; não representam frequência medida em provas. Prioridades, horas, semanas e meta inicial de 80% são editáveis e explicitados como estimativas. Não há data futura, salário ou número de vagas presumidos.

## Distribuição e edição

Incluído em `CATALOGO_EDITAIS_BASE`, disponível para todas as contas independentemente do catálogo remoto. Usa o fluxo existente: alunos editam uma cópia pessoal em Configurações → Planos específicos, sem alterar o modelo público nem a conta de outros alunos. O administrador pode publicar uma atualização pelo fluxo existente.

`data/edital-ifrj-assistente-administracao.json` é a cópia exportável; o mesmo objeto está empacotado em `data/catalogo-editais.js` para carregamento síncrono. Testes conferem a igualdade para evitar divergências. O catálogo e a capa são incluídos no pré-cache da PWA.

## Capa localizada na internet

- Símbolo dos Institutos Federais usado para identificar o IFRJ.
- Fonte: https://github.com/Mede1ro/TCC/blob/46ca43cc06edf964bb4fe902d2acab2ad377f378/assets/logo.svg
- Identificação como logo do IFRJ: https://github.com/Mede1ro/TCC/blob/46ca43cc06edf964bb4fe902d2acab2ad377f378/admin/login.php
- Arquivo local: `assets/carreiras/capa-ifrj-assistente.svg`, preservado sem alterações.
- Texto alternativo: “Símbolo dos Institutos Federais, identificando o plano do IFRJ”.

Texto alternativo e atribuição são preservados ao salvar cópias pessoais do edital.

## Revisão dos pesos em 02/10/2026

A tentativa de pesquisa no Qconcursos foi bloqueada pelo proxy do ambiente (HTTP 403); não se atribui a esta revisão uma pesquisa externa concluída. A referência usada é o PDF retificado fornecido pelo usuário.

O ciclo agora divide a cota de cada disciplina em vários blocos quando ultrapassa o máximo por sessão, em vez de descartar o tempo excedente. Para 600 minutos disponíveis e todos os tópicos pendentes, sem desempenho prévio e com blocos de 30 a 75 minutos, a sugestão é 95 minutos de Português, 85 de Legislação e Ética, 60 de Informática e 360 de Conhecimentos Específicos (arredondamento de 5 minutos por cota). O baixo desempenho continua recebendo reforço e tópicos já estudados reduzem a cota de conteúdo pendente.

O arredondamento, a duração mínima e a rampa de entrada de disciplinas podem afastar temporariamente a distribuição das proporções de prova. Se o tempo disponível não comportar o mínimo de todas as matérias, o ciclo conserva a cobertura e o mínimo dos blocos. Casos sem divisão possível entre mínimo e máximo reduzem a cota até uma duração viável.

A atualização do modelo não sobrescreve pesos de cópias pessoais nem ciclos já gerados: o aluno pode atualizar o edital do seu plano e gerar novamente o ciclo. Percentuais de incidência por assunto e notas dos últimos nomeados continuam sem apuração empírica.
