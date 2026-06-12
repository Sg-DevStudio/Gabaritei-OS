# Radar de data do concurso (Fase 2)

## Objetivo

Produzir uma **janela estimada** para o edital e a prova, com nível de confiança, para
servir de prazo-alvo do cronograma. Nunca apresentar como certeza.

## Hierarquia de sinais (peso decrescente)

### Nível 1 — Oficiais (peso alto)
- Autorização do concurso publicada (D.O.U. / portaria do ministério supervisor).
- Banca contratada / contrato assinado / extrato de dispensa para banca.
- Comissão organizadora formada.
- Previsão na LOA / LDO ou em plano de contratações do órgão.
- Declaração formal de dirigente (em ofício, audiência, nota oficial).

Regras de bolso quando há sinal oficial:
- Autorização publicada → edital tipicamente em **até 6 meses** (prazo legal comum).
- Banca contratada → edital em geral em **1–3 meses**.
- Edital publicado → prova em geral em **2–4 meses** (confira o cronograma do edital).

### Nível 2 — Imprensa especializada (peso médio-alto)
Folha Dirigida, JC Concursos, portais de notícias de concursos dos grandes cursos.
Verifique a fonte da matéria: se ela só repete um rumor de rede social, rebaixe para
o nível 4. Se cita documento ou declaração oficial, herda peso do nível 1.

### Nível 3 — Professores/cursinhos com histórico naquele concurso (peso médio)
Sinal valioso, mas **condicionado à verificação de histórico**: antes de dar peso a
um canal/professor, confirme que ele tem trajetória real com aquele órgão/banca
(turmas específicas anteriores, aprovados declarados, presença em edições passadas).
Professor genérico de "notícias de concursos" sem ligação com o órgão = nível 4.
Lançamento de turma específica para o concurso por um curso grande também é sinal
(cursos investem quando têm informação de que o certame vem).

### Nível 4 — Rumores em redes sociais (peso baixo)
Reddit (r/concursos), Instagram, YouTube genérico, grupos de Telegram/WhatsApp
relatados. Uso correto: **triangulação e antena** — se vários rumores independentes
apontam a mesma janela E existe ao menos um sinal de nível 1–3 compatível, a confiança
sobe. Rumor isolado nunca sustenta estimativa.

## Buscas típicas

Combine (sempre com o ano corrente): `"concurso [órgão]" autorização`, `"concurso
[órgão]" banca definida`, `[órgão] edital previsão`, `concurso [órgão] notícias`,
busca no site do próprio órgão e no D.O.U. Em seguida, 1–2 buscas de sinal social:
`concurso [órgão] reddit`, `[órgão] concurso youtube`. Aplique o protocolo
checagem-fatos: abrir a fonte, conferir a data, distinguir fato de especulação.

## Formato de saída

```
RADAR — Concurso [órgão/cargo]
Janela estimada do edital: [mês/ano – mês/ano]
Prova estimada: [mês/ano – mês/ano]
Confiança: ALTA | MÉDIA | BAIXA

Sinais encontrados:
✔ [Nível 1] Autorização publicada em DD/MM (fonte)
✔ [Nível 3] Prof. X (histórico: aprovados no órgão em 20XX) estima edital em ...
✖ Banca ainda não contratada
~ [Nível 4] Rumores no Reddit convergem para o 1º semestre (sinal fraco)

Premissas e riscos: [ex.: depende de aprovação orçamentária; órgão atrasou em 2022]
Reavaliar em: [sugestão de quando rodar o radar de novo — ex.: 60 dias ou quando
sair notícia de banca]
```

Confiança ALTA = pelo menos um sinal de nível 1 recente e consistente. MÉDIA = nível
2–3 convergentes sem contradição oficial. BAIXA = só nível 3–4 ou sinais conflitantes
— nesse caso, monte o cronograma em "modo preparação contínua" (plano completo sem
data, com simulados mensais) e recomende reavaliar o radar periodicamente.
