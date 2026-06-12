# Gera data/exemplo-trf3.json a partir de tools/topicos-trf3.txt
# seguindo o contrato JSON v1 da skill treinador-concursos.
# Script ASCII puro (PS 5.1); todo texto acentuado vem do .txt (UTF-8).

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$fonte = Join-Path $PSScriptRoot 'topicos-trf3.txt'
$saida = Join-Path $raiz 'data\exemplo-trf3.json'

$cfg = @{}
$disciplinas = New-Object System.Collections.ArrayList
$atual = $null

foreach ($linha in (Get-Content $fonte -Encoding UTF8)) {
  if ($linha.Trim() -eq '') { continue }
  $p = $linha.Split('|')
  switch ($p[0]) {
    'C' { $cfg[$p[1]] = $p[2] }
    'D' {
      $atual = [ordered]@{ id = $p[1]; nome = $p[2]; cor = $p[3]; peso = [int]$p[4]; base_teorica = $p[5]; topicos = (New-Object System.Collections.ArrayList) }
      [void]$disciplinas.Add($atual)
    }
    'T' {
      [void]$atual.topicos.Add(@{ w = [double]$p[1]; prio = [int]$p[2]; nome = $p[3] })
    }
  }
}

# --- IDs sequenciais (ordem do edital) + incidencia normalizada p/ somar 100 ---
foreach ($d in $disciplinas) {
  $somaW = 0; foreach ($t in $d.topicos) { $somaW += $t.w }
  $n = 0
  foreach ($t in $d.topicos) {
    $n++
    $t.id = '{0}-{1:00}' -f $d.id, $n
    $t.inc = [int][math]::Round($t.w * 100 / $somaW)
  }
  $somaInc = 0; foreach ($t in $d.topicos) { $somaInc += $t.inc }
  $maior = $d.topicos | Sort-Object w -Descending | Select-Object -First 1
  $maior.inc += (100 - $somaInc)
  foreach ($t in $d.topicos) {
    $t.horas = [int][math]::Max(1, [math]::Min(6, [math]::Round($t.inc * 0.35)))
  }
}

$totalHoras = 0
foreach ($d in $disciplinas) { foreach ($t in $d.topicos) { $totalHoras += $t.horas } }

# --- agenda por ritmo: round-robin entre disciplinas, prioridade > incidencia ---
function Agendar($disciplinas, $nSemanas, $campo) {
  $cap = [math]::Ceiling($totalHoras / $nSemanas)
  $filas = @{}
  foreach ($d in $disciplinas) {
    $filas[$d.id] = New-Object System.Collections.Queue
    foreach ($t in ($d.topicos | Sort-Object @{e={$_.prio}}, @{e={-$_.inc}})) { $filas[$d.id].Enqueue($t) }
  }
  $semana = 1; $horasSemana = 0
  $resta = $true
  while ($resta) {
    $resta = $false
    foreach ($d in $disciplinas) {
      if ($filas[$d.id].Count -eq 0) { continue }
      $resta = $true
      $t = $filas[$d.id].Dequeue()
      if ($horasSemana + $t.horas -gt $cap -and $horasSemana -gt 0 -and $semana -lt $nSemanas) {
        $semana++; $horasSemana = 0
      }
      $t[$campo] = $semana
      $horasSemana += $t.horas
    }
  }
}

Agendar $disciplinas 28 'semSust'
Agendar $disciplinas 17 'semHard'

# --- monta cronogramas ---
$inicioPlano = [datetime]::ParseExact('2026-06-08', 'yyyy-MM-dd', $null)

function MontaCronograma($disciplinas, $nSemanas, $campo, $marcosParcial, $marcosTotal, $semanaFinal) {
  $semanas = New-Object System.Collections.ArrayList
  for ($w = 1; $w -le $nSemanas; $w++) {
    $blocos = New-Object System.Collections.ArrayList
    foreach ($d in $disciplinas) {
      foreach ($t in $d.topicos) {
        if ($t[$campo] -eq $w) {
          [void]$blocos.Add([ordered]@{ disciplina = $d.id; topico = $t.id; tipo = 'teoria' })
          [void]$blocos.Add([ordered]@{ disciplina = $d.id; topico = $t.id; tipo = 'questoes' })
        }
      }
    }
    $marcos = New-Object System.Collections.ArrayList
    if ($w -eq 1) { [void]$marcos.Add($cfg['marco_anki']) }
    if ($marcosParcial -contains $w) { [void]$marcos.Add($cfg['marco_parcial']) }
    if ($marcosTotal -contains $w) { [void]$marcos.Add($cfg['marco_total']) }
    if ($w -eq $semanaFinal) { [void]$marcos.Add($cfg['marco_final']) }
    [void]$semanas.Add([ordered]@{
      semana = $w
      inicio = $inicioPlano.AddDays(7 * ($w - 1)).ToString('yyyy-MM-dd')
      blocos = $blocos.ToArray()
      marcos = $marcos.ToArray()
    })
  }
  return $semanas.ToArray()
}

$cronSust = MontaCronograma $disciplinas 28 'semSust' @(12, 16, 20, 24) @(18, 22, 26) 28
$cronHard = MontaCronograma $disciplinas 17 'semHard' @(6, 10) @(12, 15) 17

# --- objeto final no contrato v1 ---
$discFinal = New-Object System.Collections.ArrayList
foreach ($d in $disciplinas) {
  $tops = New-Object System.Collections.ArrayList
  foreach ($t in $d.topicos) {
    [void]$tops.Add([ordered]@{
      id = $t.id; nome = $t.nome; incidencia_pct = $t.inc
      prioridade = $t.prio; horas_estimadas = $t.horas; semana_sugerida = $t.semSust
    })
  }
  [void]$discFinal.Add([ordered]@{
    id = $d.id; nome = $d.nome; cor = $d.cor; peso = $d.peso
    base_teorica = $d.base_teorica; topicos = $tops.ToArray()
  })
}

$json = [ordered]@{
  versao = 1
  gerado_em = '2026-06-11'
  plano = [ordered]@{
    concurso = $cfg['concurso']
    banca = $cfg['banca']
    cota = $cfg['cota']
    meta = [ordered]@{
      corte_pct = 75
      corte_fonte = $cfg['corte_fonte']
      minimos = [ordered]@{ gerais = 40; especificas = 40; media = 6.0 }
    }
    radar = [ordered]@{
      janela_edital = @('2026-07', '2027-06')
      janela_prova = @('2027-01', '2027-06')
      confianca = 'media'
      reavaliar_em = '2026-08-10'
    }
    ritmos = [ordered]@{
      ativo = 'sustentavel'
      sustentavel = [ordered]@{ h_semana = 19; semanas = 28 }
      hardcore = [ordered]@{ dias = 120; h_semana_exigidas = 32 }
    }
  }
  disciplinas = $discFinal.ToArray()
  cronograma = [ordered]@{ sustentavel = $cronSust; hardcore = $cronHard }
  links = @(
    [ordered]@{ titulo = $cfg['link1_titulo']; url = $cfg['link1_url']; custo = $cfg['link1_custo'] },
    [ordered]@{ titulo = $cfg['link2_titulo']; url = $cfg['link2_url']; custo = $cfg['link2_custo'] }
  )
}

New-Item -ItemType Directory -Force (Join-Path $raiz 'data') | Out-Null
$texto = ConvertTo-Json -InputObject $json -Depth 12
[System.IO.File]::WriteAllText($saida, $texto, (New-Object System.Text.UTF8Encoding($false)))

# --- verificacao ---
Write-Host "=== Verificacao ==="
$totalTopicos = 0
foreach ($d in $disciplinas) {
  $somaInc = 0; foreach ($t in $d.topicos) { $somaInc += $t.inc }
  $totalTopicos += $d.topicos.Count
  Write-Host ("{0}: {1} topicos, incidencia soma {2}" -f $d.id, $d.topicos.Count, $somaInc)
}
Write-Host ("TOTAL: {0} topicos / {1}h de teoria estimada" -f $totalTopicos, $totalHoras)
Write-Host ("Cronograma sustentavel: {0} semanas | hardcore: {1} semanas" -f $cronSust.Count, $cronHard.Count)

# todos os blocos apontam para topicos existentes?
$ids = @{}
foreach ($d in $disciplinas) { foreach ($t in $d.topicos) { $ids[$t.id] = $true } }
$orfaos = 0
foreach ($c in @($cronSust, $cronHard)) {
  foreach ($s in $c) { foreach ($b in $s.blocos) { if (-not $ids[$b.topico]) { $orfaos++ } } }
}
Write-Host ("Blocos com topico inexistente: {0}" -f $orfaos)
Write-Host ("Arquivo gerado: {0} ({1:N0} bytes)" -f $saida, (Get-Item $saida).Length)
