# Estudos — Plataforma de Gestão de Estudos para Concursos

Sistema pessoal (PWA) que gera planos de estudos personalizados a partir de editais
esquematizados (produzidos pela skill `editais-esquematizados`): cronograma e
calendário automáticos, registro de sessões com timer, revisões automáticas
24h/7d/30d, simulados comparados com a nota de corte e estatísticas de constância.

> Posicionamento: o Estudei organiza o SEU esforço; este sistema organiza o seu
> esforço **contra o concurso real** — o que cai, quanto precisa acertar e até quando.

## Como usar

1. **Abrir o app**
   - Local: `powershell -ExecutionPolicy Bypass -File tools/servidor.ps1` e acesse
     `http://localhost:8123/` (ou publique a pasta no GitHub Pages).
   - No celular, abra o app publicado no GitHub Pages e entre com Google em
     *Plano e backup* para sincronizar PC/celular pela nuvem do Firebase.
   - Em desenvolvimento local, também dá para abrir o endereço de rede mostrado pelo
     servidor (algo como `http://192.168.x.x:8123/`) enquanto estiver no mesmo Wi-Fi.
     Nesse modo, PC e celular usam `/api/sync` como alternativa local.
   - No celular, use "Adicionar à tela inicial" (PWA instalável, abre offline).
2. **Importar o plano** (tela *Plano e backup*): cole ou envie o JSON gerado pela
   skill — peça no Claude: *"exporta meu plano TRF3 em JSON para o app"*.
   O arquivo [data/exemplo-trf3.json](data/exemplo-trf3.json) (TRF3 Técnico, FCC,
   10 disciplinas, 288 tópicos) já está pronto para testar.
3. **Operar o dia** (tela *Hoje*): a fila vem pronta — revisões vencidas → blocos da
   semana → tópicos reabertos. Toque em **Timer** para cronometrar (cronômetro ou
   pomodoro 25/5) ou em **Registrar** para lançar direto (≤3 toques).
4. **Backup semanal**: o Firebase mantém os aparelhos alinhados quando você está logado,
   mas o backup continua sendo a cópia de segurança. O app avisa quando o backup passa
   de 7 dias — exporte o `.json` em *Plano e backup*.
5. **Ferramentas de apoio**: em *Plano e backup*, abra Notion para organizar notas e
   NotebookLM para conversar com PDFs, aulas, questões e resumos do curso.

## Regras de negócio implementadas (domain.js)

| RN | Regra |
|----|-------|
| RN01 | Teoria concluída agenda revisões em +1d, +7d e +30d |
| RN02 | Desempenho = acertos ÷ feitas acumulado; disciplina pondera pela incidência |
| RN03 | Revisão de 30d com <70% reabre o tópico e o devolve à fila |
| RN04 | Streak: dia conta com ≥1 sessão; atual + recorde (heatmap de bolhas) |
| RN05 | Semáforo: verde ≥ meta · amarelo ≥ meta−10pp · vermelho abaixo |
| RN06 | Fila do dia ordena: revisões vencidas → blocos da semana → reabertos |
| RN07 | Sessão com >50% de erro sugere reestudo (o usuário decide) |
| RN08 | Reimportar plano preserva todo o histórico; tópico removido vira órfão |

## Firebase

Para a sincronização em nuvem funcionar no GitHub Pages:

1. Em **Authentication > Sign-in method**, habilite **Google**.
2. Em **Authentication > Settings > Authorized domains**, confirme `localhost` e adicione
   `samuelgomes01.github.io`.
3. Em **Firestore Database**, crie o banco em modo produção.
4. Em **Rules**, publique regras permitindo que cada conta leia/escreva apenas seus dados:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Estrutura

```
index.html          shell único (SPA por hash)
manifest.json, sw.js, icons/   PWA
css/styles.css      tokens do brief (papel/tinta/caneta, IBM Plex, bolhas ○◐●)
js/store.js         localStorage: schema, migrations, export/import
js/sync.js          sincroniza PC/celular via /api/sync do servidor local
js/firebase-sync.js sincroniza PC/celular via Firebase Auth + Firestore
js/domain.js        RN01–RN08 puras (testáveis sem DOM)
js/app.js           roteamento + telas
js/timer.js         cronômetro/pomodoro com recuperação, limite e alerta
js/charts.js        2 gráficos (Chart.js via CDN)
js/frases.js        frase do dia (determinística por data)
data/exemplo-trf3.json   plano real TRF3 no contrato JSON v1
tools/              gerador do JSON de exemplo + servidor local de desenvolvimento
```

## Contrato JSON (v1)

Editais esquematizados seguem `references/contrato-edital.md` e planos completos
seguem `references/contrato-json.md` da skill `editais-esquematizados`
(`versao: 1`). Atualizações usam os mesmos IDs de tópico — é assim que o
histórico sobrevive à reimportação.

## Fora do escopo da v1

Sincronização colaborativa entre usuários, flashcards completos (Anki cobre),
geração de questões, notificações push, features sociais.
Plano completo do projeto: [plano-projeto-plataforma-estudos.md](plano-projeto-plataforma-estudos.md).
