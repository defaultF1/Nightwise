param([switch]$Install)
$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$adb = Join-Path $project '.tools/android-sdk/platform-tools/adb.exe'
# ADB 37's supported compatibility backend restored this Redmi 9's USB connection.
# This affects only this process and an ADB server it starts, not global settings.
$env:ADB_USB_LEGACY = '1'
$lines = & $adb devices
$ready = @($lines | Where-Object { $_ -match '^\S+\s+device$' })
if ($ready.Count -ne 1) { Write-Output 'Connect exactly one authorized Android phone and accept USB debugging on it.'; exit 1 }
& $adb reverse tcp:8787 tcp:8787
if ($LASTEXITCODE -ne 0) { throw 'USB API forwarding failed.' }
if ($Install) {
    & $adb install -r (Join-Path $project 'output/apk/nightwise-0.6.2-debug.apk')
    if ($LASTEXITCODE -ne 0) { throw 'APK installation failed.' }
    & $adb shell am start -n in.nightwise.demo/.MainActivity
}
Write-Output 'USB forwarding is ready. Keep the computer backend running for live comparisons.'
