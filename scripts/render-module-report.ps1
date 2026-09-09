param([Parameter(Mandatory=$true)][string]$InputDoc)
$ErrorActionPreference = 'Stop'
$project = Split-Path -Parent $PSScriptRoot
$renderer = Join-Path $project '.tools/report-renderer-portable/LibreOffice/program'
$runtime = 'C:/Users/LENOVO/.cache/codex-runtimes/codex-primary-runtime/dependencies'
if (-not (Test-Path -LiteralPath (Join-Path $renderer 'soffice.exe'))) { throw 'The project-private report renderer is not ready.' }
$env:PATH = "$renderer;$runtime/native/poppler/Library/bin;$env:PATH"
$outputDir = Join-Path $project ('tmp/docx-qa/' + [IO.Path]::GetFileNameWithoutExtension($InputDoc))
& "$runtime/python/python.exe" 'C:/Users/LENOVO/.codex/plugins/cache/openai-primary-runtime/documents/26.905.11957/skills/documents/render_docx.py' $InputDoc --output_dir $outputDir --dpi 144 --emit_pdf --verbose
if ($LASTEXITCODE -ne 0) { throw 'Document rendering failed. Inspect the renderer output before retrying.' }
Write-Output "Inspect every page image in $outputDir before delivering the Word document."
