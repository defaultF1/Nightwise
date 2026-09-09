$ErrorActionPreference = 'Stop'
# Python captures normal native stderr warnings without PowerShell 5 treating them as terminating errors.
& 'C:\Users\LENOVO\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' (Join-Path $PSScriptRoot 'install-android-sdk.py')
if ($LASTEXITCODE -ne 0) { throw 'SDK installation failed; inspect .tools/logs' }
