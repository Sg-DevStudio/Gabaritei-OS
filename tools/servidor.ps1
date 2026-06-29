param([int]$Porta = 8124)

# Servidor estático simples para o preview local do app (HTML/CSS/JS puro).
$raiz = Split-Path -Parent $PSScriptRoot
Set-Location $raiz
python -m http.server $Porta --bind 127.0.0.1
