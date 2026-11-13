# Android 0.21.1 — IA compacta e atalhos dos cadernos

**Complemento da validação física:** a 0.21.2 também corrige a perda de `questionLinks` ao montar o edital. A composição de links descrita abaixo precisava desse ajuste para aparecer no plano real. Veja `android-0.21.2-justificativas.md`.

A configuração de IA ocupa um único atalho no topo dos cadernos. No site, ele fica ao lado de “Criar caderno”; no Android, na barra superior dos cadernos e redações. O modelo e os detalhes da conexão aparecem apenas dentro da janela de configuração. As faixas grandes e suas repetições nas seções foram removidas.

## Links de questões

O Android já tinha logos, URLs filtradas e agrupamento para Gran, TEC e Qconcursos. A falha estava na composição: qualquer link pessoal salvo substituía todos os links padrão daquele tópico. O site já complementava links pessoais com os padrões de TEC e Qconcursos ainda não personalizados.

Agora o app aplica a mesma regra. A leitura não altera planos, sessões ou respostas. Uma plataforma editada ou removida conserva sua preferência, inclusive se o novo endereço for de outro domínio. Remover um acesso automático registra a origem do provedor para impedir que o padrão reapareça. Os marcadores antigos de remoção integral continuam sendo respeitados. Assuntos sem URL verificada não ganham um filtro inventado.

## Verificação

- 137 testes JVM aprovados, incluindo Gran pessoal com novos atalhos, plataforma removida ou redirecionada e preservação de dados.
- Compilação release e lint sem erros.
- Contratos Kotlin → site de estudos, estrutura e links preservados.
- Testes Node: 444 aprovados, 12 ignorados, nenhuma falha.
- Playwright existente, sem plugin Browser disponível: tela de cadernos em 1440 e 390 px, um único botão, troca das três seções, abertura/fechamento do diálogo e ausência de overflow horizontal ou erros de execução.
- APK instalado sobre o principal, sem desinstalar ou limpar dados; versão 0.21.1 / código 28 confirmada. A instalação inicial manteve o diretório de dados existente. A inspeção visual física depende de o aparelho estar desbloqueado.
