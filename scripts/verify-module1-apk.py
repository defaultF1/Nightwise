from pathlib import Path
import hashlib
import json
import re
import shutil
import subprocess

root = Path(__file__).resolve().parents[1]
apk = root / 'output/apk/nightwise-module-01-debug.apk'
shutil.copyfile(root / 'output/apk/nightwise-debug.apk', apk)
sdk = root / '.tools/android-sdk/build-tools/35.0.0'
java = root / '.tools/jdk21/bin/java.exe'
signed = subprocess.run([str(java), '-jar', str(sdk / 'lib/apksigner.jar'), 'verify', '--verbose', '--print-certs', str(apk)], text=True, capture_output=True, check=True)
badging = subprocess.run([str(sdk / 'aapt.exe'), 'dump', 'badging', str(apk)], text=True, capture_output=True, check=True)
package_line = next(line for line in badging.stdout.splitlines() if line.startswith('package:'))
fields = dict(re.findall(r"(\w+)='([^']*)'", package_line))
assert fields['name'] == 'in.nightwise.demo'
assert fields['versionName'] == '0.1.0-module1'
with apk.open('rb') as inp:
    digest = hashlib.file_digest(inp, 'sha256').hexdigest()
record = {
    'file': apk.name, 'sizeBytes': apk.stat().st_size, 'sha256': digest,
    'packageId': fields['name'], 'versionName': fields['versionName'],
    'signatureVerified': True, 'kind': 'debug APK for Module 1 review',
    'browserChecks': '5 passed against production preview',
    'physicalDeviceTested': False, 'liveServicesConnected': False,
}
(apk.parent / 'module-01-verification.json').write_text(json.dumps(record, indent=2), encoding='utf-8')
(apk.parent / 'module-01-package-verification.txt').write_text(signed.stdout + '\n' + badging.stdout, encoding='utf-8')
print(json.dumps(record, indent=2))
