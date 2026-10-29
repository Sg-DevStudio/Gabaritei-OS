# Android: decisões de experiência a partir de Aprovado e Estudei

Data: 29/10/2026. Estado: análise de referência e direção aprovada. Primeira implementação no APK 0.4; limites e verificações em `android-design-qa.md`. Inspeção direta no Samsung S25, via ADB Wi-Fi, sem salvar, reordenar ou excluir estudos nos aplicativos de referência. Capturas pessoais e relatório visual ficam fora do Git.

## Objetivo

A rotina principal deve responder: o que estudar agora, quanto tempo dedicar, onde resolver questões e o que revisar. Dar liberdade para ajustar o plano sem perder o histórico. Aproveitar a organização de ciclo do Aprovado e a cobertura estatística do Estudei, preservando a identidade do Gabaritei e a adaptação nativa.

## Navegação recomendada

Menu lateral modal, recolhido por padrão, aproximadamente 304dp e no máximo 85% da largura. Cabeçalho com plano atual compacto e opção de troca. Destinos: Hoje; Planejamento e ciclo; Planos e disciplinas; Caderno de questões; Revisões; Estatísticas; Histórico. Perfil/preferências no fim; conquistas dentro do perfil, como pedido pelo usuário. Não exibir destino fictício sem funcionalidade.

Botão de menu com alvo de 48dp; ícone visual pode ser 24dp. Fechar ao escolher uma área, tocar no fundo ou usar Voltar. Título da área visível e foco devolvido corretamente. Guardar estado e rolagem por destino, sem reaproveitar inadvertidamente a rolagem de outra tela. Evitar rail permanente no celular. A remoção da barra inferior ganha altura, mas acrescenta um toque para trocar de área; compensar com ações diretas no início, gesto de abertura e retorno à tarefa.

## Hoje

1. Barra superior curta, menu, identificação do Gabaritei e perfil.
2. Próximo estudo ou timer em andamento: disciplina, tópico, tempo previsto/realizado e ação principal. Lápis acessível para trocar assunto.
3. Ainda hoje: apenas um próximo bloco e acesso à fila completa.
4. Revisões: quantidade pendente e uma ação; omitir cartões vazios grandes.
5. Semana e metas compactas, com edição no próprio cartão.
6. Resumo pequeno de desempenho/progresso. Frase discreta; conquistas ficam no perfil.

No estado vazio, indicar uma ação concreta: escolher plano, criar rotina ou registrar estudo. Indicadores essenciais não ficam em carrossel. O calendário até a prova continua fora do início Android conforme preferência anterior.

## Liberdade do aluno

Na disciplina: renomear, escolher cor, reordenar, pausar/retomar no ciclo, editar/incluir tópicos e arquivar. Arrastar com alça, mais alternativas Mover acima/abaixo. Menu de contexto para ações secundárias; excluir não recebe o mesmo destaque de estudar.

Preservar IDs ao renomear ou mudar ordem. Não alterar o edital base para todos os alunos: as personalizações pertencem à instância do plano. Retirar uma matéria do planejamento não apaga suas sessões. Exclusão definitiva de histórico é distinta, explica o impacto e exige confirmação. Arquivados continuam disponíveis para consulta e restauração. Respeitar os marcadores de exclusão do contrato do site.

Separar o editor de disciplinas do editor de etapas do ciclo: a mesma matéria pode aparecer em mais de uma etapa, com durações distintas, sem duplicar a disciplina no edital. Editar uma duração não deve regenerar todo o plano nem zerar o ciclo. Progresso de tempo no ciclo é diferente de progresso no edital e de percentual de acertos.

Estudo livre: registro fora do concurso, com nome, matéria/conteúdo opcionais e categoria. Permitir associar depois a um plano por ação explícita. Não misturar automaticamente com indicadores do concurso. Ao cadastrar uma nova disciplina, oferecer incluí-la na rotina; não fazê-lo silenciosamente.

## Estatísticas: cobertura e apresentação

Três vistas internas: Resumo, Evolução, Por disciplina. Filtros comuns em folha modal: plano ou visão geral, intervalo com datas e atalhos, disciplina, tópico, categoria, incluir estudos livres. Aplicar/Limpar sempre acessíveis. Mostrar chips ativos e o intervalo considerado.

| Indicador | Apresentação proposta |
|---|---|
| Questões, acertos, erros e percentual | Resumo compacto; mostrar sempre o tamanho da amostra |
| Tempo total e sessões | Total do período, sem duplicar tempo de simulados |
| Média diária | Dizer se considera dias estudados ou todos os dias do período; opção para ambos |
| Constância | Calendário/semana e sequência atual/máxima, respeitando o fuso e as datas dos estudos |
| Edital | Quantidade concluída/total e variação no período; identificar o que conta como tópico |
| Evolução | Séries de horas, questões e acertos; alternar métricas em vez de misturar escalas sem explicação |
| Ritmo por dia da semana | Separar total acumulado de média por segunda/terça etc.; não apresentar acumulado como um único dia |
| Tempo por disciplina/categoria | Barras horizontais com nome completo e valor |
| Disciplina e tópico | Questões/acertos/erros, percentual, tempo e progresso; ordenar por desempenho ou volume |
| Revisão ativa | Atalho Resolver questões no tópico, usando o link cadastrado do caderno |
| Páginas, aulas e materiais | Somente após existir registro correspondente, sem inventar conversões de horas |

Percentual global = soma de acertos / soma de questões, não média simples dos percentuais. Ausência de questões é Sem dados, não 0% de acertos. Um tópico com três questões não permite a mesma interpretação de outro com trezentas: mostrar a amostra, sem rotular automaticamente domínio. Um estudo que apenas abriu o Gran não informa quantas questões foram feitas; não creditar resultado sem registro ou integração validada.

No Estudei, a lista observada com um plano selecionado também apresentou estudo livre. A experiência do Gabaritei deve explicitar esse escopo. Não foi auditada a implementação interna dos cálculos dos aplicativos de referência.

## Estilo e acessibilidade

Azul do Gabaritei, cartões nítidos em claro e escuro, espaçamento previsível, alvos de toque confortáveis e menos contêineres aninhados. Cor consistente por disciplina, sempre acompanhada de texto. No S25, a grade semanal de sete colunas do Estudei cortou nomes: preferir faixa de dias e lista do selecionado, com grade opcional.

Manter nomes completos nos detalhes e no leitor de tela. Campos com rótulos persistentes, mensagens próximas e ações acessíveis com teclado aberto. Conferir TalkBack, fonte ampliada, contraste, áreas da câmera e navegação por gesto. Não copiar recursos gráficos ou logotipos dos aplicativos de referência; usar os assets próprios e as bibliotecas do projeto.

## Ordem de implementação proposta

1. Navegação lateral e hierarquia do início, com dados existentes e sem alterar regras do histórico.
2. Edição de disciplinas/tópicos/etapas e estudo livre, incluindo persistência, migração e compatibilidade com o site.
3. Estatísticas por assunto, filtros unificados, evolução e atalhos para revisar por questões.
4. Campos opcionais de materiais, páginas/aulas e aprofundamentos que dependem de novos registros.

Antes de modificar bancos, fazer backup; testes físicos no pacote QA separado. Testes de renomear/reordenar devem manter referências e histórico; arquivar preserva sessões; sincronização não pode ressuscitar exclusões. Dados reais do aluno não são massa de teste.

## Limites da análise

Foram inspecionados menus, ciclo, telas iniciais, planejamento, editores, registro e estatísticas. Os controles de arrastar/excluir foram observados sem alterar dados. Não foi validada persistência de edições, timers em execução, alarmes ou sincronização dos produtos de referência. Não é pesquisa com uma amostra de alunos nem auditoria completa de acessibilidade.

## Entrega 0.4 e próximas etapas

Implementados: menu lateral, hierarquia do início, metas locais, organização de disciplinas/tópicos, ajuste do tempo de blocos da agenda e de etapas já existentes do ciclo, registro livre e as três vistas estatísticas. Não foi copiado conteúdo gráfico dos aplicativos analisados.

Permanecem para etapas posteriores: criar um ciclo completo pelo app, mover estudos livres para um plano, visão estatística simultânea de vários planos, métricas de páginas/aulas e evolução de conclusão de tópicos por período. Fonte ampliada e TalkBack ainda precisam de uma rodada dedicada. A lista acima é direção de produto; não deve ser confundida com recursos integralmente entregues.
