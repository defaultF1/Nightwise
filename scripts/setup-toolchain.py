"""Download portable official Android build tools into this project's D: folder."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / '.tools'
DOWNLOADS = DEST / 'downloads'
DOWNLOADS.mkdir(parents=True, exist_ok=True)

def fetch(url, name):
    target = DOWNLOADS / name
    print('Downloading ' + name, flush=True)
    req = urllib.request.Request(url, headers={'User-Agent': 'NightWise development setup'})
    with urllib.request.urlopen(req, timeout=90) as response, target.open('wb') as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)
    print(f'Downloaded {name}: {target.stat().st_size} bytes', flush=True)
    return target

def extract(archive, folder, strip_first=False):
    folder.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as source:
        for member in source.infolist():
            rel = Path(*Path(member.filename).parts[1:]) if strip_first else Path(member.filename)
            if str(rel) == '.':
                continue
            target = (folder / rel).resolve()
            if not target.is_relative_to(folder.resolve()):
                raise ValueError('Archive path leaves tool folder')
            if member.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with source.open(member) as inp, target.open('wb') as out:
                    while chunk := inp.read(1024 * 1024):
                        out.write(chunk)

def jdk():
    base = 'https://aka.ms/download-jdk/microsoft-jdk-21.0.12.1-windows-x64.zip'
    checksum = fetch(base + '.sha256sum.txt', 'jdk21.sha256.txt').read_text().split()[0].lower()
    archive = fetch(base, 'microsoft-jdk21.zip')
    digest = hashlib.file_digest(archive.open('rb'), 'sha256').hexdigest()
    if digest != checksum:
        raise ValueError('JDK checksum mismatch')
    extract(archive, DEST / 'jdk21', strip_first=True)
    print('JDK21 checksum verified and extracted', flush=True)

def android():
    archive = fetch('https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip', 'android-commandline.zip')
    digest = hashlib.file_digest(archive.open('rb'), 'sha256').hexdigest()
    if digest != '90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a':
        raise ValueError('Android tools checksum mismatch')
    extract(archive, DEST / 'android-sdk' / 'cmdline-tools' / 'latest', strip_first=True)
    print('Android command-line tools checksum verified and extracted', flush=True)

if __name__ == '__main__':
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = [pool.submit(jdk), pool.submit(android)]
        for result in results:
            result.result()
