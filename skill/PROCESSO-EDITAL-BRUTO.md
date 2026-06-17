# Processo: edital bruto → plano no app (sem IA paga)

Workflow do **admin** para transformar um edital bruto (PDF/texto) em um edital
estruturado pronto para o Gabaritei OS, **sem nenhuma dependência de IA paga**
dentro do sistema. A inteligência roda em ferramentas gratuitas (Claude.ai ou
NotebookLM) e o app só recebe o resultado em JSON e confere.

> Este documento descreve o fluxo operacional. O **contrato de dados** e as
> heurísticas detalhadas (incidência por banca, horas médias, nota de corte)
> ficam na skill `editais-esquematizados/` — em especial
> `references/contrato-json.md` e `references/contrato-edital.md`.

## Visão geral

```
Edital bruto (PDF/texto)
        │
        ▼  (1) IA gratuita (Claude.ai / NotebookLM) + prompt do app
JSON estruturado (contrato v1)
        │
        ▼  (2) Configurações → Painel do edital → Importar JSON
Tela de Conferência (ajustes manuais)
        │
        ▼  (3) Confirmar
Edital salvo no catálogo  →  aparece em "Planos disponíveis"
```

## Passo a passo

### 1. Gerar o JSON com IA gratuita
1. No app: **Configurações → Painel do edital → "Organizar edital bruto (IA grátis)"**.
2. Clique em **Copiar prompt** e abra **Claude.ai** ou **NotebookLM** (ambos gratuitos).
3. Cole o prompt e substitua `<<COLE O EDITAL AQUI>>` pelo conteúdo programático
   do edital (ou anexe o PDF no NotebookLM).
4. A IA devolve um JSON no contrato v1.

O prompt instrui a IA a:
- identificar **cargo, banca, órgão e área**;
- listar **disciplinas e tópicos**, quebrando leis grandes em blocos de 2–9h;
- estimar **incidência (%)** por tópico (0 quando não houver base);
- definir **prioridade (1–3)** do tópico e **peso (1–3)** da disciplina;
- sugerir **nota de corte estimada (%)**;
- **janela da prova (mês/ano)**: preencher SÓ se for futura — edital vigente (data
  real) ou pré-edital (previsão). Concurso já encerrado usado como base → **janela
  vazia** (a data passada vai em observações, não na janela);
- responder **apenas com o JSON**, sem comentários.

### 2. Importar e conferir
1. No app: **Configurações → Painel do edital → "Importar JSON / planilha"**.
2. Cole o JSON (ou suba `.json`/`.xlsx`/`.csv`) e clique **Conferir importação**.
3. Abre a **tela de Conferência** já preenchida: disciplinas, pesos, dificuldade,
   incidência e horas. Ajuste o que precisar (adicionar/remover disciplinas e
   tópicos, corrigir incidências, definir nível e janela da prova).

### 3. Confirmar e publicar
1. Clique **Confirmar e salvar**. O app valida o contrato (`D.validarPlano`) e
   gera IDs estáveis automaticamente quando faltarem.
2. O edital entra no **catálogo** e fica visível na aba **Planos disponíveis**,
   pronto para o aluno gerar o plano e comparar com outros concursos.

## Contrato de saída (resumo v1)

```json
{
  "versao": 1,
  "plano": { "concurso": "Órgão — Cargo", "banca": "FCC", "meta": { "corte_pct": 75 } },
  "disciplinas": [
    { "id": "POR", "nome": "Língua Portuguesa", "cor": "#3B82F6", "peso": 2, "base_teorica": "pdf",
      "topicos": [
        { "id": "POR-01", "nome": "Interpretação de texto", "incidencia_pct": 30, "prioridade": 1, "horas_estimadas": 4 }
      ] }
  ]
}
```

Campos opcionais de catálogo (preenchidos na Conferência, não exigidos no JSON):
`orgao`, `cargo`, `area`, `estado` (UF), `nivel` (facil/medio/dificil),
`emAlta` (destaque) e `janelaProva` (`{ "inicio": "AAAA-MM", "fim": "AAAA-MM" }`).

## Pedidos de edital
Pedidos chegam por e-mail (botão "Pedir um edital" no catálogo). O admin registra
e acompanha esses pedidos em **Configurações → Painel do edital → Pedidos de
edital recebidos**, marcando como atendidos conforme cadastra os editais.

## Por que assim
- **Custo zero de operação:** nenhuma chamada de API paga dentro do app.
- **Mesmo contrato** usado por uma futura automação (ex.: Firebase Functions),
  então o trabalho não é perdido se um dia o passo 1 virar "um clique".
