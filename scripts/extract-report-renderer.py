"""Read the official MSI as an archive without invoking the Windows Installer service."""
from pathlib import Path
import ctypes
from ctypes import wintypes
import hashlib
import msilib
import os
import shutil
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
archive = root / '.tools/downloads/LibreOffice_26.2.6_Win_x86-64.msi'
with archive.open('rb') as inp:
    if hashlib.file_digest(inp, 'sha256').hexdigest() != 'f9877032fd908beb9c0ddf06df4af5c2e85f419c42e14876c4cce5aae5fb2660':
        raise RuntimeError('Archive verification failed')
dest = root / '.tools/report-renderer-portable'
cabdir = root / '.tools/report-renderer-cabs'
raw = cabdir / 'raw'
raw.mkdir(parents=True, exist_ok=True)
dest.mkdir(parents=True, exist_ok=True)
db = msilib.OpenDatabase(str(archive), msilib.MSIDBOPEN_READONLY)
def rows(sql):
    view = db.OpenView(sql)
    view.Execute(None)
    output = []
    while (record := view.Fetch()) is not None:
        output.append([record.GetString(i) for i in range(1, record.GetFieldCount() + 1)])
    view.Close()
    return output

msi = ctypes.WinDLL('msi')
handle = wintypes.UINT
msi.MsiOpenDatabaseW.argtypes = [wintypes.LPCWSTR, wintypes.LPCWSTR, ctypes.POINTER(handle)]
msi.MsiDatabaseOpenViewW.argtypes = [handle, wintypes.LPCWSTR, ctypes.POINTER(handle)]
msi.MsiViewExecute.argtypes = [handle, handle]
msi.MsiViewFetch.argtypes = [handle, ctypes.POINTER(handle)]
msi.MsiRecordReadStream.argtypes = [handle, wintypes.UINT, ctypes.c_void_p, ctypes.POINTER(wintypes.DWORD)]
database = handle()
assert msi.MsiOpenDatabaseW(str(archive), None, ctypes.byref(database)) == 0
for [cabinet] in ([] if '--assemble-only' in sys.argv else rows('SELECT `Cabinet` FROM `Media`')):
    if not cabinet:
        continue
    name = cabinet.removeprefix('#')
    target = cabdir / name
    if not target.resolve().is_relative_to(cabdir.resolve()):
        raise ValueError('Cabinet name outside workspace')
    view, record = handle(), handle()
    assert msi.MsiDatabaseOpenViewW(database, "SELECT `Data` FROM `_Streams` WHERE `Name`='" + name.replace("'", "''") + "'", ctypes.byref(view)) == 0
    assert msi.MsiViewExecute(view, 0) == 0
    assert msi.MsiViewFetch(view, ctypes.byref(record)) == 0
    print('Extracting cabinet ' + name, flush=True)
    buffer = ctypes.create_string_buffer(1024 * 1024)
    with target.open('wb') as out:
        while True:
            size = wintypes.DWORD(len(buffer))
            assert msi.MsiRecordReadStream(record, 1, buffer, ctypes.byref(size)) == 0
            if not size.value:
                break
            out.write(buffer.raw[:size.value])
    msi.MsiCloseHandle(record)
    msi.MsiCloseHandle(view)
    with (cabdir / (name + '.log')).open('w') as log:
        subprocess.run(['expand.exe', '-F:*', str(target), str(raw)], check=True, stdout=log, stderr=subprocess.STDOUT, creationflags=subprocess.CREATE_NO_WINDOW)
msi.MsiCloseHandle(database)
directories = {name: (parent, value) for name, parent, value in rows('SELECT `Directory`, `Directory_Parent`, `DefaultDir` FROM `Directory`')}
components = dict(rows('SELECT `Component`, `Directory_` FROM `Component`'))
cache = {}
def directory(name):
    if name in cache:
        return cache[name]
    parent, value = directories[name]
    leaf = value.split(':')[0].split('|')[-1]
    base = directory(parent) if parent else dest
    result = base if leaf in ('.', 'SourceDir', 'TARGETDIR') else base / leaf
    if not result.resolve().is_relative_to(dest.resolve()):
        raise ValueError('Payload path outside renderer folder')
    cache[name] = result
    return result
files = rows('SELECT `File`, `Component_`, `FileName` FROM `File`')
created_folders = set()
for index, (file_id, component, file_name) in enumerate(files):
    if index % 1000 == 0:
        print(f'Assembling renderer {index}/{len(files)}', flush=True)
    folder = directory(components[component])
    if folder not in created_folders:
        folder.mkdir(parents=True, exist_ok=True)
        created_folders.add(folder)
    source = raw / file_id
    friendly_name = file_name.split('|')[-1]
    if friendly_name in ('.', '..') or any(c in friendly_name for c in '/\\:'):
        raise ValueError('Invalid payload file name')
    # The parent was already resolved and validated once in directory().
    destination = folder / friendly_name
    if destination.exists():
        if destination.stat().st_size != source.stat().st_size:
            shutil.copyfile(source, destination)
    else:
        # Both folders are private immutable tools on D:. Hard links avoid duplicating the payload.
        os.link(source, destination)
print(f'Extracted {len(files)} files without installing a desktop application', flush=True)
print('\n'.join(str(p) for p in dest.rglob('soffice.exe')), flush=True)
