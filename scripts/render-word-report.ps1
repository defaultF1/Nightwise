param([Parameter(Mandatory=$true)][string]$InputDoc, [Parameter(Mandatory=$true)][string]$OutputFolder)
$ErrorActionPreference = 'Stop'
$source = (Resolve-Path -LiteralPath $InputDoc).Path
New-Item -ItemType Directory -Path $OutputFolder -Force | Out-Null
$out = (Resolve-Path -LiteralPath $OutputFolder).Path
$pdf = Join-Path $out (([IO.Path]::GetFileNameWithoutExtension($source)) + '.pdf')
$wordInstance = $null
$wordDocument = $null
try {
    $wordInstance = New-Object -ComObject Word.Application
    $wordInstance.Visible = $false
    $wordInstance.DisplayAlerts = 0
    $wordInstance.AutomationSecurity = 3
    $wordDocument = $wordInstance.Documents.Open($source, $false, $true)
    $wordDocument.ExportAsFixedFormat($pdf, 17)
    Write-Output "Word export completed: $pdf"
} finally {
    if ($null -ne $wordDocument) { $wordDocument.Close(0); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($wordDocument) }
    if ($null -ne $wordInstance) { $wordInstance.Quit(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($wordInstance) }
}
& 'C:\Users\LENOVO\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdftoppm.exe' -png -scale-to 1600 $pdf (Join-Path $out 'page')
if ($LASTEXITCODE -ne 0) { throw 'Page rasterization failed' }
