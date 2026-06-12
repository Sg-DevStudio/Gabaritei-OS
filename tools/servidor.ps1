# Servidor estatico minimo para desenvolvimento local (sem Node).
# Uso: powershell -ExecutionPolicy Bypass -File tools/servidor.ps1 [-Porta 8123]
param([int]$Porta = 8123)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'application/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.ico'  = 'image/x-icon'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Porta/")
$listener.Start()
Write-Host "Servindo $raiz em http://localhost:$Porta/"

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $caminho = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ($caminho -eq '') { $caminho = 'index.html' }
  $arquivo = Join-Path $raiz ($caminho -replace '/', '\')
  try {
    if ((Test-Path $arquivo -PathType Leaf) -and ([System.IO.Path]::GetFullPath($arquivo)).StartsWith($raiz)) {
      $bytes = [System.IO.File]::ReadAllBytes($arquivo)
      $ext = [System.IO.Path]::GetExtension($arquivo).ToLower()
      $ctx.Response.ContentType = if ($mime[$ext]) { $mime[$ext] } else { 'application/octet-stream' }
      $ctx.Response.StatusCode = 200
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $ctx.Response.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes('404 - nao encontrado')
      $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
    }
  } catch {
    $ctx.Response.StatusCode = 500
  }
  $ctx.Response.Close()
}
