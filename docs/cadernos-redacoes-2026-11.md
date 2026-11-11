# Cadernos e redações — evolução de 11/11/2026

## Escopo solicitado por Samuel

Manter planejamento, timer, edital/provas, frequência e evolução. Concentrar a prática em Caderno de questões, reunindo os links por assunto das plataformas e os cadernos pessoais criados com IA. Retirar Revisões da navegação sem desativar sugestões ou remover registros. Criar Redações e suavizar cartões/campos no site e Android.

## Referência observada

Boa Resposta instalado no S25, pacote com.boaresposta.app. Capturas de 11/11 fora do repositório em C:/tmp/gabaritei-phone-review: 02-boa-home, 03-redacoes, 04-redacao-editor (escolha de entrada), 05-redacao (temas), 06-redacao-proposta, 07-editor. Redação: progressão tema → escrever → corrigir, editor limpo, contagem de palavras/linhas e proposta acessível. Questões: capturas 08-questao, 09-questao e 10-alternativas; progresso fixo no topo, enunciado legível, alternativas separadas e confirmação de resposta. Não foi enviada resposta na conta do usuário. Não reutilizar textos, ilustrações ou marca do terceiro. Não enviar redações nem resolver questões na conta do usuário durante a análise.

Redações: recorte aprovado explicitamente por Samuel em 11/11 (texto digitado/colado nesta versão; foto/PDF depois).

## Interface e fluxos

1. Caderno de questões: Por edital / Meus cadernos / Criar com IA. Por edital preserva os links TEC, Gran e Qconcursos já existentes. Meus cadernos têm título, disciplina, assunto e plano opcional, busca e cartões proporcionais; abrir conserva respostas e referência ao material. Visualização em cartões permite revelar a explicação sem inventar acertos.
2. Criar: material PDF/TXT/texto, formatos existentes, organização opcional. Editar identificação não regenera perguntas. Excluir envia à lixeira e restaurar recupera o caderno inteiro. Arquivados antigos continuam acessíveis. Sem exclusão permanente nesta versão.
3. Redações: tema/proposta, identificação da banca, critérios do edital opcionais, texto e contagem de palavras. Correção formativa de tema, estrutura, argumentação, coesão e norma-padrão; apresentar trechos e sugestões separados do original. Sem rubrica explícita, não inventar nota de banca. Salvar rascunho, correção e histórico privado; lixeira reversível.
4. Navegação: retirar Revisões dos menus; sugestões e histórico permanecem no planejamento. Redações terá entrada própria. Rotas antigas de cadernos/IA continuam funcionando. Manter os planos atuais.

## Contratos e regras

- RN01: cadernos existentes sem metadados de organização permanecem válidos.
- RN02: configurações aceitam disciplina (120), assunto (160), planoId (100), planoNome (160); não usar esses rótulos como instruções de sistema.
- RN03: excluidoEm vazio = ativo; data ISO = lixeira. Restaurar não altera perguntas/respostas. Arquivamento antigo é preservado.
- RN04: redação contém id, tema (240), banca (120), criterios (6000), texto (16000), avaliacao validada, criadoEm, atualizadoEm, excluidoEm. Original não é substituído pela sugestão da IA. Um texto editado exige nova correção.
- RN05: avaliação inclui resumo, critérios com observação/evidência/sugestão, ajustes com citação literal do original e próximo treino. Citações que não existem no texto invalidam a resposta. Nota de banca não é calculada sem rubrica objetiva compatível.
- RN06: Firestore somente dono autenticado em questionSets e essays. Preservar coleções e codecs de estudos existentes. Nenhum arquivo original fica salvo no caderno.
- RN07: IA somente em conta pessoal configurada; sem ativação de faturamento, modelo pago ou chave compartilhada para todos os alunos. Sem repetição automática de requisições para contornar cota.
- RN08: erro, timeout ou cota mantém material e rascunho em tela; não salva correção incompleta.

## Integração e cotas verificadas

Projeto app-gestao-estudos (450464644014). Consulta feita com a conta administradora já autenticada. A conta Google aberta no Chrome é distinta da administração técnica consultada. Não confundir login do aluno com projeto de API. Consulta Service Usage em 11/11: modelo atual com 15 requisições/minuto, 500/dia, 250000 tokens de entrada/minuto, todos por projeto/modelo. Cloud Billing desativado. Limites publicados não garantem capacidade e podem mudar. Google AI Studio na conta Chrome não encontrou esse projeto; não importar/criar projeto automaticamente.

Fontes: https://aistudio.google.com/docs/rate-limits e https://aistudio.google.com/docs/api-key . DeepSeek: https://api-docs.deepseek.com/quick_start/pricing/ declara cobrança por tokens. Chat gratuito não comprova cota gratuita de API. Integração DeepSeek fica adiada enquanto a restrição for custo zero sem cota confirmada.

## Design

Preservar identidade azul e temas existentes. Cartões 18–22 px de raio, bordas discretas, espaçamento consistente, campos legíveis, botões proporcionais e foco visível. A referência inspira hierarquia e fluxo; a tipografia lúdica/serifada e os botões gigantes do Boa Resposta não serão copiados. Corrigir densidade no desktop e toque no celular. Não criar gradientes/ilustrações adicionais.

## Implementação e aceitação

- [ ] Navegação web/Android sem entrada Revisões, sugestões preservadas.
- [ ] Hub reúne planos/links e IA, com compatibilidade das URLs antigas.
- [ ] Organização, edição, busca, lixeira/restauração e modo cartões com progresso preservado.
- [ ] Redação com validação de original/citações, correção real, persistência privada e rascunhos.
- [ ] Regras no emulador: dono permitido, terceiros/anônimos negados, cargas inválidas negadas.
- [ ] Geração/correção com material sintético, reabrir após reload, desktop/celular e temas.
- [ ] Android: testes, lint, APK assinado, atualização sem limpar dados e fluxo em aparelho.
- [ ] Publicação verificada; informar limites e o que não foi testado.

## Ajustes adicionais solicitados na execução

- Quantidade personalizada de 1 a 100; chamadas sequenciais com no máximo 20 por etapa, progresso por etapa e referências verificadas. Se uma etapa falhar, oferecer o lote parcial já validado para salvar, sem afirmar que o pedido inteiro terminou.
- Resolução em card central, com ações Voltar, Criar outras e Excluir. Biblioteca e formulário ficam fora da tela de foco.
- Confirmações dentro de um diálogo HTML do Gabaritei. Nenhum alert/confirm/prompt nativo nos fluxos do aplicativo. O aviso de fechar uma aba com dados não salvos permanece como proteção do navegador.


## Ampliação aprovada na execução

Samuel solicitou também foto/PDF em 11/11. Entrada por JPG/PNG/WebP ou PDF de até 5 páginas e 10 MB; transcrição via mesma configuração gratuita, com revisão explícita do texto antes da correção. Preservar erros de escrita e marcar [ilegível], não completar palavras. O arquivo original permanece só em memória; não salvar no Firestore. Não corrigir automaticamente após transcrever. Nova transcrição de redação corrigida cria versão para preservar o parecer anterior.

Referências das questões: mostrar “Referência da resposta: página X” em PDF, ou “Referência da resposta no material” sem paginação. Manter o trecho de apoio. Retirar aviso repetido sobre texto colado/gabarito e manter identificação IA na entrada do recurso.

## Publicação alternativa

Firebase Hosting (app-gestao-estudos.web.app) mantém uma cópia de contingência com o mesmo Auth/Firestore. Publicar somente arquivos públicos rastreados: node scripts/prepare-hosting.cjs, depois firebase deploy --only hosting --project app-gestao-estudos. Não enviar diretório completo do projeto nem dados privados. A configuração não ativa faturamento; limites do plano gratuito continuam aplicáveis. GitHub Pages permanece endereço principal do Android.


## Android nativo 0.17.0

A pedido de Samuel, os cadernos pessoais e redações deixam de depender da área web: biblioteca, resolução com uma questão por vez, cartões, geração de 1–100 questões, lixeira, redação, transcrição e parecer usam o mesmo Auth/Firestore dentro do app. O servidor não ganha chave nova nem faturamento. Links de TEC/Gran/Qconcursos ficam visíveis por tópico, com filtros existentes preservados.

Navegação ajustada: Hoje / Planejar / Estudar / Cadernos / Mais. Remover Cadernos duplicado de Mais; Redações permanece em Mais. Organizar disciplinas passa a ser uma ação dentro de Planejar e sai de Mais. As opções de revisão e os registros existentes não são apagados.


## Polimento final de redações

Em 11/11 Samuel pediu remover os grupos recolhíveis de proposta e importação. Nova redação abre escolha centralizada (arquivo ou editor). Proposta/critérios e importação usam diálogos acessíveis; fechar e Escape preservam o rascunho. Botão principal passa a “Corrigir”, sem texto técnico abaixo. Privacidade/cota permanecem em uma ação própria. Android usa a mesma nomenclatura, bibliotecas e referência literal.


O parecer da redação passa a abrir em um diálogo centralizado, com fundo desfocado, visão geral, critérios, evidências, ajustes e próximo treino. Ícones e cores identificam seções, sem atribuir nota ou gravidade inventada. Fechar devolve ao texto e a ação Ver correção reabre o mesmo parecer salvo.
