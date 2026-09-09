"""Extract a project-private renderer when the Windows runtime has no bundled LibreOffice."""
from pathlib import Path
import hashlib
import subprocess
import urllib.request

root = Path(__file__).resolve().parents[1]
archive = root / '.tools/downloads/LibreOffice_26.2.6_Win_x86-64.msi'
url = 'https://download.documentfoundation.org/libreoffice/stable/26.2.6/win/x86_64/LibreOffice_26.2.6_Win_x86-64.msi'
print('Downloading project-local report renderer', flush=True)
with urllib.request.urlopen(url, timeout=90) as source, archive.open('wb') as out:
    while chunk := source.read(1024 * 1024):
        out.write(chunk)
with archive.open('rb') as source:
    digest = hashlib.file_digest(source, 'sha256').hexdigest()
if digest != 'f9877032fd908beb9c0ddf06df4af5c2e85f419c42e14876c4cce5aae5fb2660':
    raise ValueError('Renderer checksum mismatch')
target = root / '.tools/report-renderer'
target.mkdir(parents=True, exist_ok=True)
print('Verified checksum; extracting an administrative image without desktop installation', flush=True)
process = subprocess.run(['msiexec.exe', '/a', str(archive), '/qn', 'TARGETDIR=' + str(target), '/L*v', str(root / '.tools/logs/report-renderer-extract.log')], creationflags=subprocess.CREATE_NO_WINDOW)
print(f'Extraction exit code {process.returncode}', flush=True)
if process.returncode:
    raise SystemExit(process.returncode)
print('\n'.join(str(p) for p in target.rglob('soffice.exe')), flush=True)
