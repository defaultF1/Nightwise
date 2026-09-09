$ErrorActionPreference = 'Stop'
$apiRoot = Split-Path -Parent $PSScriptRoot
try {
    $apiStatus = Invoke-RestMethod 'http://127.0.0.1:8787/api/status' -TimeoutSec 2
    if ($null -ne $apiStatus.ready) { Write-Output 'NightWise API is already running.'; exit 0 }
} catch {}
$apiLogs = Join-Path $apiRoot 'tmp/api'
New-Item -ItemType Directory -Path $apiLogs -Force | Out-Null
$apiEntry = Join-Path $apiRoot 'node_modules/tsx/dist/cli.mjs'
$apiProcess = Start-Process -FilePath 'C:/Program Files/nodejs/node.exe' -ArgumentList @(('"' + $apiEntry + '"'), 'server/index.ts') -WorkingDirectory $apiRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $apiLogs 'stdout.log') -RedirectStandardError (Join-Path $apiLogs 'stderr.log') -PassThru
$apiProcess.Id | Set-Content -LiteralPath (Join-Path $apiLogs 'process-id.txt')
Write-Output 'NightWise API started in the background. Check Settings > Live service > Check connection.'
