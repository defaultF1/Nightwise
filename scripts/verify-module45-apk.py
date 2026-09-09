from pathlib import Path
import hashlib, json, re, shutil, subprocess, zipfile

root = Path(__file__).resolve().parents[1]
apk = root / 'output/apk/nightwise-module-05-pilot-debug.apk'
shutil.copyfile(root / 'output/apk/nightwise-debug.apk', apk)
sdk = root / '.tools/android-sdk/build-tools/35.0.0'
java = root / '.tools/jdk21/bin/java.exe'
signed = subprocess.run([str(java), '-jar', str(sdk / 'lib/apksigner.jar'), 'verify', '--verbose', '--print-certs', str(apk)], text=True, capture_output=True, check=True)
badging = subprocess.run([str(sdk / 'aapt.exe'), 'dump', 'badging', str(apk)], text=True, capture_output=True, check=True)
manifest = subprocess.run([str(sdk / 'aapt.exe'), 'dump', 'xmltree', str(apk), 'AndroidManifest.xml'], text=True, capture_output=True, check=True)
package_line = next(line for line in badging.stdout.splitlines() if line.startswith('package:'))
fields = dict(re.findall(r"(\w+)='([^']*)'", package_line))
assert fields['name'] == 'in.nightwise.demo' and fields['versionName'] == '0.5.0-pilot'
assert 'android.permission.ACCESS_FINE_LOCATION' in badging.stdout
assert 'android.permission.ACCESS_BACKGROUND_LOCATION' not in badging.stdout
assert 'com.google.android.geo.API_KEY' in manifest.stdout
private = (root / '.local/android-maps.properties').read_text().strip().partition('=')[2]
assert private and private in manifest.stdout
with zipfile.ZipFile(apk) as archive:
    for file in (root / 'dist').rglob('*'):
        if file.is_file():
            name = 'assets/public/' + file.relative_to(root / 'dist').as_posix()
            assert archive.read(name) == file.read_bytes(), 'APK has an outdated web asset'
    assert not any(name.endswith('.env') or name.endswith('android-maps.properties') for name in archive.namelist())
    assert b'MapsHandoff' in b''.join(archive.read(n) for n in archive.namelist() if n.endswith('.dex'))
with apk.open('rb') as inp: digest = hashlib.file_digest(inp, 'sha256').hexdigest()
record = {'file': apk.name, 'sizeBytes': apk.stat().st_size, 'sha256': digest, 'packageId': fields['name'], 'versionName': fields['versionName'], 'signatureVerified': True, 'bundledAssetsMatchCurrentBuild': True, 'androidMapKeyConfigured': True, 'backgroundLocationPermission': False, 'physicalDeviceTested': False, 'liveRoutesTested': False, 'browserMapStatus': 'BillingNotEnabledMapError', 'moduleStatus': 'Implementation checkpoint; live-service and intended-phone acceptance pending'}
(apk.parent / 'module-05-verification.json').write_text(json.dumps(record, indent=2), encoding='utf-8')
(apk.parent / 'module-05-signing.txt').write_text(signed.stdout, encoding='utf-8')
(apk.parent / 'module-05-package-verification.txt').write_text(signed.stdout + '\n' + badging.stdout, encoding='utf-8')
print(json.dumps(record, indent=2))
