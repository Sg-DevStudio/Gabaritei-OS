# Servidor local minimo para desenvolvimento e sincronizacao na rede.
# Uso: powershell -ExecutionPolicy Bypass -File tools/servidor.ps1 [-Porta 8123]
param([int]$Porta = 8123)

$ErrorActionPreference = 'Stop'
$raiz = [System.IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$syncDir = Join-Path $raiz 'data\sync'
$syncFile = Join-Path $syncDir 'estado.json'
$utf8SemBom = New-Object System.Text.UTF8Encoding($false)

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.ico'  = 'image/x-icon'
}

function Get-StatusText([int]$Status) {
  switch ($Status) {
    200 { 'OK' }
    204 { 'No Content' }
    400 { 'Bad Request' }
    404 { 'Not Found' }
    405 { 'Method Not Allowed' }
    500 { 'Internal Server Error' }
    default { 'OK' }
  }
}

function Send-Response($Stream, [int]$Status, [string]$ContentType, [byte[]]$Body, [hashtable]$Headers) {
  if ($null -eq $Body) { $Body = [byte[]]@() }
  if ($null -eq $Headers) { $Headers = @{} }
  $cab = "HTTP/1.1 $Status $(Get-StatusText $Status)`r`n"
  $cab += "Content-Length: $($Body.Length)`r`n"
  if ($ContentType) { $cab += "Content-Type: $ContentType`r`n" }
  $cab += "Connection: close`r`n"
  $cab += "Access-Control-Allow-Origin: *`r`n"
  $cab += "Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS`r`n"
  $cab += "Access-Control-Allow-Headers: Content-Type, Accept`r`n"
  foreach ($k in $Headers.Keys) { $cab += "${k}: $($Headers[$k])`r`n" }
  $cab += "`r`n"
  $cabBytes = [System.Text.Encoding]::ASCII.GetBytes($cab)
  $Stream.Write($cabBytes, 0, $cabBytes.Length)
  if ($Body.Length -gt 0) { $Stream.Write($Body, 0, $Body.Length) }
}

function Json-Bytes($Obj) {
  [System.Text.Encoding]::UTF8.GetBytes(($Obj | ConvertTo-Json -Depth 100))
}

function Text-Bytes([string]$Texto) {
  [System.Text.Encoding]::UTF8.GetBytes($Texto)
}

function Find-HeaderEnd([byte[]]$Bytes, [int]$Length) {
  if ($Length -lt 4) { return -1 }
  for ($i = 0; $i -le $Length - 4; $i++) {
    if ($Bytes[$i] -eq 13 -and $Bytes[$i + 1] -eq 10 -and $Bytes[$i + 2] -eq 13 -and $Bytes[$i + 3] -eq 10) {
      return $i
    }
  }
  return -1
}

function Read-Request($Stream) {
  $Stream.ReadTimeout = 8000
  $buffer = New-Object byte[] 8192
  $mem = New-Object System.IO.MemoryStream
  $headerEnd = -1

  while ($headerEnd -lt 0) {
    $lidos = $Stream.Read($buffer, 0, $buffer.Length)
    if ($lidos -le 0) { return $null }
    $mem.Write($buffer, 0, $lidos)
    $raw = $mem.ToArray()
    $headerEnd = Find-HeaderEnd $raw $raw.Length
    if ($raw.Length -gt 1048576) { throw 'Cabecalho HTTP grande demais.' }
  }

  $raw = $mem.ToArray()
  $headerText = [System.Text.Encoding]::ASCII.GetString($raw, 0, $headerEnd)
  $linhas = $headerText -split "\r?\n"
  if ($linhas.Length -eq 0) { return $null }

  $partes = $linhas[0].Split(' ')
  if ($partes.Length -lt 2) { return $null }

  $headers = @{}
  for ($i = 1; $i -lt $linhas.Length; $i++) {
    $idx = $linhas[$i].IndexOf(':')
    if ($idx -gt 0) {
      $headers[$linhas[$i].Substring(0, $idx).Trim().ToLowerInvariant()] = $linhas[$i].Substring($idx + 1).Trim()
    }
  }

  $contentLength = 0
  if ($headers.ContainsKey('content-length')) { [void][int]::TryParse($headers['content-length'], [ref]$contentLength) }

  $bodyStart = $headerEnd + 4
  $bodyMem = New-Object System.IO.MemoryStream
  if ($raw.Length -gt $bodyStart -and $contentLength -gt 0) {
    $take = [Math]::Min($raw.Length - $bodyStart, $contentLength)
    $bodyMem.Write($raw, $bodyStart, $take)
  }

  while ($bodyMem.Length -lt $contentLength) {
    $faltam = [Math]::Min($buffer.Length, $contentLength - [int]$bodyMem.Length)
    $lidos = $Stream.Read($buffer, 0, $faltam)
    if ($lidos -le 0) { break }
    $bodyMem.Write($buffer, 0, $lidos)
  }

  $target = $partes[1]
  $uri = if ($target -match '^https?://') { [System.Uri]$target } else { [System.Uri]("http://local" + $target) }
  return @{
    Method = $partes[0].ToUpperInvariant()
    Path = $uri.AbsolutePath
    Headers = $headers
    Body = $bodyMem.ToArray()
  }
}

function Handle-Sync($Req, $Stream) {
  if ($Req.Method -eq 'OPTIONS') {
    Send-Response $Stream 204 'text/plain; charset=utf-8' ([byte[]]@()) @{}
    return
  }

  if ($Req.Method -eq 'GET') {
    if (Test-Path $syncFile -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($syncFile)
      Send-Response $Stream 200 'application/json; charset=utf-8' $bytes @{ 'Cache-Control' = 'no-store' }
    } else {
      Send-Response $Stream 200 'application/json; charset=utf-8' (Json-Bytes @{ ok = $true; state = $null; updatedAt = $null; clientId = $null }) @{ 'Cache-Control' = 'no-store' }
    }
    return
  }

  if ($Req.Method -eq 'POST' -or $Req.Method -eq 'PUT') {
    try {
      $texto = [System.Text.Encoding]::UTF8.GetString($Req.Body)
      $dados = $texto | ConvertFrom-Json
      if ($null -eq $dados.state) {
        $dados = [pscustomobject]@{
          ok = $true
          state = $dados
          updatedAt = (Get-Date).ToUniversalTime().ToString('o')
          clientId = 'legacy'
        }
      }
      if ($null -eq $dados.updatedAt) { $dados | Add-Member -NotePropertyName updatedAt -NotePropertyValue ((Get-Date).ToUniversalTime().ToString('o')) }
      if ($null -eq $dados.ok) { $dados | Add-Member -NotePropertyName ok -NotePropertyValue $true }
      New-Item -ItemType Directory -Force -Path $syncDir | Out-Null
      $json = $dados | ConvertTo-Json -Depth 100
      [System.IO.File]::WriteAllText($syncFile, $json, $utf8SemBom)
      Send-Response $Stream 200 'application/json; charset=utf-8' ([System.Text.Encoding]::UTF8.GetBytes($json)) @{ 'Cache-Control' = 'no-store' }
    } catch {
      Send-Response $Stream 400 'application/json; charset=utf-8' (Json-Bytes @{ ok = $false; erro = 'JSON invalido.' }) @{ 'Cache-Control' = 'no-store' }
    }
    return
  }

  Send-Response $Stream 405 'text/plain; charset=utf-8' (Text-Bytes '405 - metodo nao permitido') @{}
}

function Handle-Static($Req, $Stream) {
  if ($Req.Method -ne 'GET' -and $Req.Method -ne 'HEAD') {
    Send-Response $Stream 405 'text/plain; charset=utf-8' (Text-Bytes '405 - metodo nao permitido') @{}
    return
  }

  $caminho = [System.Uri]::UnescapeDataString($Req.Path.TrimStart('/'))
  if ($caminho -eq '') { $caminho = 'index.html' }
  $arquivo = [System.IO.Path]::GetFullPath((Join-Path $raiz ($caminho -replace '/', [System.IO.Path]::DirectorySeparatorChar)))
  $raizComSep = $raiz.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar

  if ((Test-Path $arquivo -PathType Leaf) -and $arquivo.StartsWith($raizComSep, [System.StringComparison]::OrdinalIgnoreCase)) {
    $bytes = [System.IO.File]::ReadAllBytes($arquivo)
    $ext = [System.IO.Path]::GetExtension($arquivo).ToLowerInvariant()
    $tipo = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
    if ($Req.Method -eq 'HEAD') { $bytes = [byte[]]@() }
    Send-Response $Stream 200 $tipo $bytes @{}
  } else {
    Send-Response $Stream 404 'text/plain; charset=utf-8' (Text-Bytes '404 - nao encontrado') @{}
  }
}

function Get-LocalUrls([int]$Porta) {
  $urls = @("http://localhost:$Porta/")
  try {
    $ips = [System.Net.Dns]::GetHostAddresses($env:COMPUTERNAME) |
      Where-Object { $_.AddressFamily -eq [System.Net.Sockets.AddressFamily]::InterNetwork -and -not $_.IPAddressToString.StartsWith('169.254.') }
    foreach ($ip in $ips) { $urls += "http://$($ip.IPAddressToString):$Porta/" }
  } catch {}
  $urls | Select-Object -Unique
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Porta)
$listener.Start()

Write-Host "Servindo $raiz"
Write-Host "Abra no PC:"
Write-Host "  http://localhost:$Porta/"
$urls = Get-LocalUrls $Porta
if ($urls.Count -gt 1) {
  Write-Host "Abra no celular na mesma rede Wi-Fi:"
  $urls | Where-Object { $_ -ne "http://localhost:$Porta/" } | ForEach-Object { Write-Host "  $_" }
}
Write-Host "Sincronizacao: /api/sync"

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $req = Read-Request $stream
      if ($null -eq $req) { continue }
      if ($req.Path -eq '/api/sync') { Handle-Sync $req $stream }
      else { Handle-Static $req $stream }
    } catch {
      try {
        Send-Response $stream 500 'text/plain; charset=utf-8' (Text-Bytes '500 - erro interno') @{}
      } catch {}
    } finally {
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}
