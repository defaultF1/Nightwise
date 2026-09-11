"""Verify a versioned review APK without overwriting prior module packages."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import zipfile

parser=argparse.ArgumentParser()
parser.add_argument('--module',required=True,choices=['02','03','04','05','06','07'])
parser.add_argument('--revision',type=lambda value: value if re.fullmatch(r'[a-z0-9-]+',value) else parser.error('Revision must contain lowercase letters, digits or hyphens'))
parser.add_argument('--expected-version',required=True)
parser.add_argument('--browser-checks',type=int,required=True)
parser.add_argument('--unit-checks',type=int)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
label=args.module+('-'+args.revision if args.revision else '')
apk=root/f'output/apk/nightwise-module-{label}-debug.apk'
if apk.exists():
    raise SystemExit('A versioned APK already exists. Preserve it and choose a new reviewed revision.')
shutil.copyfile(root/'output/apk/nightwise-debug.apk',apk)
sdk=root/'.tools/android-sdk/build-tools/35.0.0'
java=root/'.tools/jdk21/bin/java.exe'
signed=subprocess.run([str(java),'-jar',str(sdk/'lib/apksigner.jar'),'verify','--verbose','--print-certs',str(apk)],text=True,capture_output=True,check=True)
badging=subprocess.run([str(sdk/'aapt.exe'),'dump','badging',str(apk)],text=True,capture_output=True,check=True)
line=next(line for line in badging.stdout.splitlines() if line.startswith('package:'))
fields=dict(re.findall(r"(\w+)='([^']*)'",line))
assert fields['name']=='in.nightwise.demo'
assert fields['versionName']==args.expected_version
with zipfile.ZipFile(apk) as archive:
    names=archive.namelist()
    for asset in ['route-unavailable.png','connection-retry.png','evidence-unknown.png','activity-explained-v2.png']:
        assert any(name.endswith('/assets/illustrations/'+asset) for name in names),asset
    assert any(name.endswith('/assets/launch/nightwise-launch-poster.png') for name in names)
    clip='assets/launch/nightwise-launch-navy-concept.mp4'
    clip_name=next(name for name in names if name.endswith('/'+clip))
    assert archive.read(clip_name)==(root/'public'/clip).read_bytes()
    entry=re.search(r'src="/(assets/index-[^"]+\.js)"',(root/'dist/index.html').read_text(encoding='utf-8')).group(1)
    entry_name=next(name for name in names if name.endswith('/'+entry))
    assert archive.read(entry_name)==(root/'dist'/entry).read_bytes()
with apk.open('rb') as source:
    sha=hashlib.file_digest(source,'sha256').hexdigest()
record={'file':apk.name,'sizeBytes':apk.stat().st_size,'sha256':sha,'packageId':fields['name'],'versionName':fields['versionName'],'signatureVerified':True,'bundledIllustrationsVerified':4,'browserChecksPassed':args.browser_checks,'unitChecksPassed':args.unit_checks,'physicalDeviceTested':False,'liveServicesConnected':False,'kind':'Private debug APK for tutorial review'}
record['currentWebBundleVerified']=True
record['launchVideoVerified']=True
(apk.parent/f'module-{label}-verification.json').write_text(json.dumps(record,indent=2),encoding='utf-8')
(apk.parent/f'module-{label}-package-verification.txt').write_text(signed.stdout+'\n'+badging.stdout,encoding='utf-8')
print(json.dumps(record,indent=2))
