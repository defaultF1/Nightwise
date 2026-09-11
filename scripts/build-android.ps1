$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$env:JAVA_HOME = Join-Path $project '.tools/jdk21'
$env:ANDROID_HOME = Join-Path $project '.tools/android-sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:ANDROID_USER_HOME = Join-Path $project '.tools/android-user'
$env:GRADLE_USER_HOME = Join-Path $project '.tools/gradle-cache'
$env:PATH = "$env:JAVA_HOME\bin;C:\Program Files\nodejs;$env:PATH"
Push-Location $project
try {
    & 'C:/Program Files/nodejs/npm.cmd' run android:sync
    if ($LASTEXITCODE -ne 0) { throw 'Web build or Capacitor sync failed' }
    Push-Location (Join-Path $project 'android')
    try {
        & .\gradlew.bat :app:assembleDebug --no-daemon --max-workers=1
        if ($LASTEXITCODE -ne 0) { throw 'Android compilation failed' }
    } finally { Pop-Location }
    $out = Join-Path $project 'output/apk'
    New-Item -ItemType Directory -Path $out -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $project 'android/app/build/outputs/apk/debug/app-debug.apk') -Destination (Join-Path $out 'nightwise-debug.apk')
    # Use .NET directly so restricted PowerShell module paths do not break packaging.
    $apkPath = Join-Path $out 'nightwise-debug.apk'
    $apkStream = [IO.File]::OpenRead($apkPath)
    $apkHasher = [Security.Cryptography.SHA256]::Create()
    try {
        $apkHash = [BitConverter]::ToString($apkHasher.ComputeHash($apkStream)).Replace('-', '').ToLowerInvariant()
        [PSCustomObject]@{ Algorithm = 'SHA256'; Hash = $apkHash; Path = $apkPath }
    } finally { $apkStream.Dispose(); $apkHasher.Dispose() }
} finally { Pop-Location }
