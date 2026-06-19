# 001 — Análise de erro por tipo nos simulados

- **Status:** implementado
- **PR(s):** #112
- **Atualizado em:** 2026-06-19

## Contexto / Problema
O simulado registrava só acertos/total por disciplina. O feedback de remediação
era genérico ("revise a teoria"), sem distinguir **por que** o aluno erra —
lacuna conceitual, erro de cálculo, leitura/interpretação ou desatenção. Tipos de
erro diferentes pedem remediações diferentes; tratar tudo igual desperdiça estudo.

## Objetivo (o quê / por quê)
Ao preencher o gabarito por disciplina, permitir classificar o **tipo de erro
predominante** e, a partir disso, mostrar uma **remediação dirigida** + a
distribuição de onde o aluno mais perde ponto. Sucesso = o aluno sabe *o que
fazer* com os erros, não só *quantos* errou.

## Não-objetivos
- Classificar erro questão a questão (fricção alta); fica no nível da disciplina.
- Inferir o tipo automaticamente.

## Comportamento esperado
- No formulário do simulado, cada disciplina tem um seletor opcional: 📖 Conceitual,
  🧮 Cálculo, 🔍 Interpretação, 🎯 Desatenção.
- Só conta quando há erro na disciplina (`certas < total`).
- Na tela de Simulados: tag do tipo por linha + card "Análise de erros — onde você
  perde ponto" (barras por tipo, predominante em destaque com a dica, e quantos
  erros seguem sem classificar).

## Modelo de dados
- `state.simulados[].acertos[].tipoErro` (opcional): `'conceitual' | 'calculo' | 'interpretacao' | 'atencao'`.
- Retrocompat: ausência do campo = não classificado.

## Decisões / trade-offs
- **Ponderar pelo nº de erros** da disciplina (10 erros conceituais > 2 de cálculo):
  um clique por disciplina vira distribuição real, sem fricção por questão.

## Verificação
- [x] Testes de domínio em `tests/erros-simulado.test.js` (`analisarErrosSimulados`,
  `remediacaoErro`): ponderação, dominante, classificado vs total, tipo sem erro
  real não conta.
- [x] Verificação manual: registrar simulado com erros classificados e conferir o card.

## Tarefas
- [x] `domain.analisarErrosSimulados` + `remediacaoErro` + `TIPOS_ERRO`.
- [x] Coluna no formulário do simulado e persistência de `tipoErro`.
- [x] Card de análise + tag por linha na tela de Simulados.
- [x] Testes.

## Referências
- `js/domain.js`: `analisarErrosSimulados`, `remediacaoErro`, `TIPOS_ERRO`.
- `js/app.js`: `abrirNovoSimulado`, `telaSimulados`.
- `tests/erros-simulado.test.js`.
