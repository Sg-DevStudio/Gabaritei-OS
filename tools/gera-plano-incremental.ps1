# Regenera os cronogramas do plano TRF3 do usuario com a regra INCREMENTAL
# (Fase 3.2 da skill): 5 disciplinas-base juntas desde a semana 1, entrada
# progressiva das demais, disciplina concluida segue em questoes/revisao,
# ordem pedagogica respeitada. Script ASCII; textos acentuados vem do .txt.
param(
  [string]$Fonte = "$env:USERPROFILE\Downloads\plano_trf3_tecnico.json"
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$saidaRepo = Join-Path $repo 'data\plano-trf3-tecnico.json'

$marcosTxt = @{}
foreach ($l in (Get-Content (Join-Path $PSScriptRoot 'marcos-incremental.txt') -Encoding UTF8)) {
  if ($l.Trim() -eq '') { continue }
  $p = $l.Split('|', 2); $marcosTxt[$p[0]] = $p[1]
}

$json = Get-Content $Fonte -Raw -Encoding UTF8 | ConvertFrom-Json

# ----- ordem pedagogica (pre-requisito antes; incidencia decide horas, nao a ordem) -----
$ordem = @{
  ADM = @('ADM-11','ADM-09','ADM-05','ADM-08','ADM-10','ADM-01','ADM-02','ADM-03','ADM-04','ADM-06','ADM-07')
  CON = @('CON-05','CON-02','CON-04','CON-01','CON-03','CON-06','CON-07')
  POR = @('POR-01','POR-02','POR-04','POR-05','POR-03')
  RLM = @('RLM-01','RLM-02','RLM-03','RLM-04')
  PPE = @('PPE-04','PPE-03','PPE-02','PPE-01','PPE-05')
  PCI = @('PCI-08','PCI-01','PCI-03','PCI-02','PCI-06','PCI-04','PCI-05','PCI-07')
  DEF = @('DEF-01','DEF-02','DEF-04','DEF-03')
  PRE = @('PRE-03','PRE-01','PRE-02')
  TRI = @('TRI-03','TRI-02','TRI-01')
}

# ----- janelas por ritmo: [semana de entrada, semana-alvo de conclusao] -----
$janelaSust = @{ ADM=@(1,20); CON=@(1,18); POR=@(1,26); RLM=@(1,22); PPE=@(1,14); PCI=@(8,26); DEF=@(12,16); PRE=@(16,24); TRI=@(19,27) }
$janelaHard = @{ ADM=@(1,12); CON=@(1,11); POR=@(1,16); RLM=@(1,13); PPE=@(1,9);  PCI=@(5,16); DEF=@(8,11);  PRE=@(10,15); TRI=@(12,16) }

$horasTopico = @{}; $nomeDisc = @{}
foreach ($d in $json.disciplinas) {
  $nomeDisc[$d.id] = $d.nome
  foreach ($t in $d.topicos) { $horasTopico[$t.id] = [double]$t.horas_estimadas }
}

$inicioPlano = [datetime]::ParseExact('2026-06-08', 'yyyy-MM-dd', $null)

function GeraCronograma($janela, $nSemanas, $totaisSemanas, $registraSugerida) {
  # estado por disciplina
  $st = @{}
  foreach ($id in $ordem.Keys) {
    $fila = New-Object System.Collections.Queue
    foreach ($tid in $ordem[$id]) { $fila.Enqueue(@{ id = $tid; resta = $horasTopico[$tid] }) }
    $st[$id] = @{ fila = $fila; atual = $null; fim = 0; manutIdx = 0 }
  }
  $semanas = New-Object System.Collections.ArrayList
  $idsOrdenados = @('ADM','CON','POR','RLM','PPE','PCI','DEF','PRE','TRI')

  for ($w = 1; $w -le $nSemanas; $w++) {
    $marcos = New-Object System.Collections.ArrayList
    if ($w -eq 1) { [void]$marcos.Add($marcosTxt['ini']) }

    $ativas = @()
    foreach ($id in $idsOrdenados) {
      if ($janela[$id][0] -eq $w -and $w -gt 1) { [void]$marcos.Add(($marcosTxt['entra'] -f $nomeDisc[$id])) }
      $temFila = ($st[$id].fila.Count -gt 0 -or $null -ne $st[$id].atual)
      if ($janela[$id][0] -le $w -and $temFila) { $ativas += $id }
    }

    # taxa necessaria por disciplina (deadline-driven); escala se passar da capacidade
    $taxas = @{}; $somaTaxa = 0.0
    foreach ($id in $ativas) {
      $resta = 0.0
      if ($st[$id].atual) { $resta += $st[$id].atual.resta }
      foreach ($t in $st[$id].fila) { $resta += $t.resta }
      $semanasRestantes = [math]::Max(1, $janela[$id][1] - $w + 1)
      $taxas[$id] = $resta / $semanasRestantes
      $somaTaxa += $taxas[$id]
    }
    $cap = 0.0; foreach ($id in $ordem.Keys) { foreach ($tid in $ordem[$id]) { $cap += $horasTopico[$tid] } }
    $cap = [math]::Ceiling($cap / $nSemanas) + 1
    $fator = if ($somaTaxa -gt $cap) { $cap / $somaTaxa } else { 1.0 }

    $blocos = New-Object System.Collections.ArrayList
    foreach ($id in $idsOrdenados) {
      if ($ativas -notcontains $id) { continue }
      $horas = $taxas[$id] * $fator
      if ($horas -le 0) { continue }
      if (-not $st[$id].atual -and $st[$id].fila.Count -gt 0) { $st[$id].atual = $st[$id].fila.Dequeue() }
      if (-not $st[$id].atual) { continue }
      $topicoSemana = $st[$id].atual.id
      if ($registraSugerida -and -not $script:sugerida.ContainsKey($topicoSemana)) { $script:sugerida[$topicoSemana] = $w }
      [void]$blocos.Add([ordered]@{ disciplina = $id; topico = $topicoSemana; tipo = 'teoria' })
      [void]$blocos.Add([ordered]@{ disciplina = $id; topico = $topicoSemana; tipo = 'questoes' })
      # consome horas, avancando topicos
      while ($horas -gt 0 -and $st[$id].atual) {
        $consome = [math]::Min($horas, $st[$id].atual.resta)
        $st[$id].atual.resta -= $consome
        $horas -= $consome
        if ($st[$id].atual.resta -le 0.01) {
          if ($registraSugerida -and -not $script:sugerida.ContainsKey($st[$id].atual.id)) { $script:sugerida[$st[$id].atual.id] = $w }
          $st[$id].atual = if ($st[$id].fila.Count -gt 0) { $st[$id].fila.Dequeue() } else { $null }
          if (-not $st[$id].atual) {
            $st[$id].fim = $w
            [void]$marcos.Add(($marcosTxt['fim_disc'] -f $nomeDisc[$id]))
          }
        }
      }
    }

    # disciplinas concluidas: contato permanente (1 bloco/semana, alterna questoes/revisao)
    foreach ($id in $idsOrdenados) {
      if ($st[$id].fim -gt 0 -and $st[$id].fim -lt $w) {
        $tids = $ordem[$id]
        $tid = $tids[$st[$id].manutIdx % $tids.Count]
        $st[$id].manutIdx++
        $tipo = if (($w % 2) -eq 0) { 'questoes' } else { 'revisao' }
        [void]$blocos.Add([ordered]@{ disciplina = $id; topico = $tid; tipo = $tipo })
      }
    }

    if ($totaisSemanas -contains $w) { [void]$marcos.Add($marcosTxt['total']) }
    if ($w -eq $nSemanas) { [void]$marcos.Add($marcosTxt['final']) }

    [void]$semanas.Add([ordered]@{
      semana = $w
      inicio = $inicioPlano.AddDays(7 * ($w - 1)).ToString('yyyy-MM-dd')
      blocos = $blocos.ToArray()
      marcos = $marcos.ToArray()
    })
  }
  return $semanas.ToArray()
}

$script:sugerida = @{}
$cronSust = GeraCronograma $janelaSust 28 @(14, 19, 24, 27) $true
$cronHard = GeraCronograma $janelaHard 17 @(8, 12, 15) $false

# ----- monta o JSON final preservando disciplinas/meta/radar do usuario -----
$discFinal = New-Object System.Collections.ArrayList
foreach ($d in $json.disciplinas) {
  $tops = New-Object System.Collections.ArrayList
  foreach ($t in $d.topicos) {
    $sug = if ($script:sugerida.ContainsKey($t.id)) { $script:sugerida[$t.id] } else { $t.semana_sugerida }
    [void]$tops.Add([ordered]@{
      id = $t.id; nome = $t.nome; incidencia_pct = $t.incidencia_pct
      prioridade = $t.prioridade; horas_estimadas = $t.horas_estimadas; semana_sugerida = $sug
    })
  }
  [void]$discFinal.Add([ordered]@{
    id = $d.id; nome = $d.nome; cor = $d.cor; peso = $d.peso
    base_teorica = $d.base_teorica; topicos = $tops.ToArray()
  })
}

$saida = [ordered]@{
  versao = 1
  gerado_em = '2026-06-12'
  plano = [ordered]@{
    concurso = $json.plano.concurso
    banca = $json.plano.banca
    cota = $json.plano.cota
    meta = [ordered]@{
      corte_pct = $json.plano.meta.corte_pct
      corte_fonte = $json.plano.meta.corte_fonte
      minimos = [ordered]@{ gerais = $json.plano.meta.minimos.gerais; especificas = $json.plano.meta.minimos.especificas; media = $json.plano.meta.minimos.media }
    }
    radar = [ordered]@{
      janela_edital = @($json.plano.radar.janela_edital)
      janela_prova = @($json.plano.radar.janela_prova)
      confianca = $json.plano.radar.confianca
      reavaliar_em = $json.plano.radar.reavaliar_em
    }
    ritmos = [ordered]@{
      ativo = 'sustentavel'
      sustentavel = [ordered]@{ h_semana = $json.plano.ritmos.sustentavel.h_semana; semanas = 28 }
      hardcore = [ordered]@{ dias = 120; h_semana_exigidas = $json.plano.ritmos.hardcore.h_semana_exigidas }
    }
  }
  disciplinas = $discFinal.ToArray()
  cronograma = [ordered]@{ sustentavel = $cronSust; hardcore = $cronHard }
}

$texto = ConvertTo-Json -InputObject $saida -Depth 12
New-Item -ItemType Directory -Force (Join-Path $repo 'data') | Out-Null
[System.IO.File]::WriteAllText($saidaRepo, $texto, (New-Object System.Text.UTF8Encoding($false)))

# backup do original + atualiza o arquivo do usuario
$backup = [System.IO.Path]::ChangeExtension($Fonte, $null) + 'original.json'
if (-not (Test-Path $backup)) { Copy-Item $Fonte $backup }
[System.IO.File]::WriteAllText($Fonte, $texto, (New-Object System.Text.UTF8Encoding($false)))

# ----- verificacao -----
Write-Host '=== Verificacao ==='
$ids = @{}; foreach ($d in $saida.disciplinas) { foreach ($t in $d.topicos) { $ids[$t.id] = $true } }
foreach ($par in @(@('sustentavel', $cronSust), @('hardcore', $cronHard))) {
  $nome = $par[0]; $cron = $par[1]
  $ruins = 0; $minDisc = 99
  foreach ($s in $cron) {
    $discsSemana = @{}
    foreach ($b in $s.blocos) {
      if (-not $ids[$b.topico]) { $ruins++ }
      $discsSemana[$b.disciplina] = $true
    }
    if ($discsSemana.Count -lt $minDisc) { $minDisc = $discsSemana.Count }
  }
  Write-Host ("{0}: {1} semanas | topicos invalidos: {2} | minimo de disciplinas por semana: {3}" -f $nome, $cron.Count, $ruins, $minDisc)
}
Write-Host 'Disciplinas por semana (sustentavel):'
foreach ($s in $cronSust) {
  $discs = ($s.blocos | ForEach-Object { $_.disciplina } | Select-Object -Unique) -join ','
  Write-Host ("  S{0:00} ({1}): {2}" -f $s.semana, $s.inicio, $discs)
}
Write-Host ("Arquivos: {0} e {1}" -f $saidaRepo, $Fonte)
