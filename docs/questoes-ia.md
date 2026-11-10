# Questões com IA

Primeira versão para uso pessoal no Gabaritei OS.

## Fluxo

PDF até 10 MB, com seleção de até 20 páginas e trecho final até 5 MB; TXT ou texto colado entre 150 e 30.000 caracteres. A geração oferece 10/20 questões, dificuldade e foco de conteúdo. Formatos: múltipla escolha com 4/5 alternativas e certo/errado. O resultado deve passar pela validação de estrutura, quantidade, gabaritos, alternativas, duplicatas e referências antes de aparecer. Citações textuais são conferidas contra o texto enviado; referências de PDFs são limitadas às páginas enviadas e traduzidas para a numeração do original.

O aluno pode resolver, conferir o comentário, salvar o progresso, reabrir, arquivar e restaurar. Questões geradas não registram sessões de estudo nem alteram automaticamente as estatísticas dos planos.

## Integração e custos

Gemini Developer API direto em modo pessoal, sem Cloud Billing vinculado. Modelo fixado em gemini-3.5-flash-lite, com cota gratuita. Nunca ativar faturamento ou escolher um modelo pago automaticamente. A cota do provedor pode variar; ao esgotar, informar o erro e manter os cadernos disponíveis. Não prometer quantidade diária fixa.

O módulo de geração é carregado apenas quando usado. Firebase Auth obrigatório para ler users/{uid}/privateSettings/ai: credencial restrita à API Gemini, provisionada por administrador somente para a conta pessoal. Regras permitem apenas leitura individual pelo dono, sem listagem ou escrita cliente. O navegador autenticado recebe essa chave e a envia ao Google no cabeçalho x-goog-api-key; ela não é um segredo inacessível ao próprio dono. Nunca embutir a chave no código público, URLs, cadernos, exportações ou logs. Esta arquitetura pessoal não deve ser aberta a vários usuários com uma chave compartilhada; uso público requer outro desenho de proteção e cotas. O proxy Firebase AI Logic foi descartado após timeouts nos testes reais. A biblioteca PDF-Lib é vendorizada com sua licença e carregada somente ao selecionar PDF.

O arquivo original fica apenas na memória da página e é enviado à IA após o clique em Gerar. A interface informa o uso do material pelo provedor no plano gratuito. Não guardar PDFs no Firestore.

## Persistência

Coleção privada users/{uid}/questionSets/{id}. Regras exigem dono autenticado, campos conhecidos, quantidade 10/20 e conteúdo com tamanho limitado. Coleção independente do codec legado de estudos para preservar compatibilidade com versões anteriores do Android e do site. Arquivar é reversível; não há exclusão permanente na interface.

## Android

Novo item Mais → Questões com IA. A mesma aba autenticada do Gabaritei abre em Chrome Custom Tabs, com retorno ao app. Não é uma implementação duplicada em Compose. O login da aba web pode ser necessário na primeira abertura em um aparelho.

## Verificação

Testes de contrato das questões, correção, persistência e seleção de páginas. Regras verificadas em emulador com dono, outra conta e acesso anônimo. QA local usa material fictício e transporte simulado; validar também uma geração real em produção sem dados pessoais. Nunca limpar dados do app principal para testar.
