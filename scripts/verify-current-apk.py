"""Verify the current APK and publish an immutable versioned local review copy."""
from pathlib import Path
import hashlib, json, re, shutil, subprocess, zipfile

root=Path(__file__).resolve().parents[1]
source=root/'output/apk/nightwise-debug.apk'
sdk=root/'.tools/android-sdk/build-tools/35.0.0'
signed=subprocess.run([str(root/'.tools/jdk21/bin/java.exe'),'-jar',str(sdk/'lib/apksigner.jar'),'verify','--verbose',str(source)],capture_output=True,text=True,check=True)
badging=subprocess.run([str(sdk/'aapt.exe'),'dump','badging',str(source)],capture_output=True,text=True,check=True)
fields=dict(re.findall(r"(\w+)='([^']*)'",next(line for line in badging.stdout.splitlines() if line.startswith('package:'))))
assert fields['name']=='in.nightwise.demo' and fields['versionName']=='0.11.4-live-preview' and fields['versionCode']=='30'
assert 'android.permission.ACCESS_BACKGROUND_LOCATION' not in badging.stdout
private_env=dict(line.split('=',1) for line in (root/'.env').read_text(encoding='utf-8').splitlines() if '=' in line and not line.lstrip().startswith('#'))
server_key=private_env.get('GOOGLE_MAPS_SERVER_KEY','').strip().strip('"\'')
with zipfile.ZipFile(source) as z:
    for file in (root/'dist').rglob('*'):
        if file.is_file():assert z.read('assets/public/'+file.relative_to(root/'dist').as_posix())==file.read_bytes(),'Outdated web asset'
    for name in z.namelist():
        assert not name.endswith(('.env','android-maps.properties'))
        if server_key and not name.endswith('/'):assert server_key.encode() not in z.read(name),'Server credential in APK'
    packaged=b''.join(z.read(name) for name in z.namelist() if name.startswith('assets/public/assets/') and not name.endswith('/'))
    assert b'https://nightwise-f5fu.onrender.com' in packaged,'Hosted API URL missing from team APK'
target=root/'output/apk/nightwise-0.11.4-team-debug.apk'
digest=hashlib.sha256(source.read_bytes()).hexdigest()
if target.exists():assert hashlib.sha256(target.read_bytes()).hexdigest()==digest,'Do not replace an existing versioned APK'
else:shutil.copyfile(source,target)
record={'file':target.name,'sizeBytes':target.stat().st_size,'sha256':digest,'packageId':fields['name'],'versionName':fields['versionName'],'versionCode':30,'signatureVerified':True,'webAssetsMatch':True,'serverKeyAbsent':True,'backgroundLocationPermission':False,'verificationScope':'APK packaging only; native and provider acceptance are recorded separately in talks/records'}
(target.parent/'nightwise-0.11.3-team-verification.json').write_text(json.dumps(record,indent=2),encoding='utf-8')
print(json.dumps(record,indent=2))
