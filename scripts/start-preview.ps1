$ErrorActionPreference = 'Stop'
$previewRoot = Split-Path -Parent $PSScriptRoot
$previewUrl = 'http://127.0.0.1:4173/'
try {
    $previewResponse = Invoke-WebRequest -UseBasicParsing -Uri $previewUrl -TimeoutSec 3
    if ($previewResponse.Content -match 'NightWise') {
        Write-Output "NightWise is already available at $previewUrl"
        exit 0
    }
    throw 'Port 4173 is serving a different application.'
} catch {
    if ($_.Exception.Message -match 'different application') { throw }
}
$previewNode = (Get-Command node.exe -ErrorAction Stop).Source
$previewVite = Join-Path $previewRoot 'node_modules/vite/bin/vite.js'
if (!(Test-Path -LiteralPath (Join-Path $previewRoot 'dist/index.html'))) {
    throw 'Build the app first with npm run build from the Nightwise folder.'
}
$previewLogs = Join-Path $previewRoot 'tmp/preview'
New-Item -ItemType Directory -Path $previewLogs -Force | Out-Null
$previewProcess = Start-Process -FilePath $previewNode -ArgumentList @(('"' + $previewVite + '"'), 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort') -WorkingDirectory $previewRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $previewLogs 'stdout.log') -RedirectStandardError (Join-Path $previewLogs 'stderr.log') -PassThru
$previewProcess.Id | Set-Content -LiteralPath (Join-Path $previewLogs 'process-id.txt')
for ($previewAttempt = 0; $previewAttempt -lt 30; $previewAttempt++) {
    Start-Sleep -Milliseconds 500
    try {
        $previewResponse = Invoke-WebRequest -UseBasicParsing -Uri $previewUrl -TimeoutSec 2
        if ($previewResponse.Content -match 'NightWise') { Write-Output "NightWise is available at $previewUrl"; exit 0 }
    } catch { }
    if ($previewProcess.HasExited) { throw "Preview failed to start. Read $previewLogs/stderr.log" }
}
throw "Preview did not respond. Read $previewLogs/stderr.log"
