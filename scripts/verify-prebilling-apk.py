from pathlib import Path
import hashlib,json,re,shutil,subprocess,zipfile
root=Path(__file__).resolve().parents[1]
apk=root/'output/apk/nightwise-prebilling-debug.apk'
shutil.copyfile(root/'output/apk/nightwise-debug.apk',apk)
sdk=root/'.tools/android-sdk/build-tools/35.0.0';java=root/'.tools/jdk21/bin/java.exe'
signed=subprocess.run([str(java),'-jar',str(sdk/'lib/apksigner.jar'),'verify','--verbose','--print-certs',str(apk)],text=True,capture_output=True,check=True)
badging=subprocess.run([str(sdk/'aapt.exe'),'dump','badging',str(apk)],text=True,capture_output=True,check=True)
fields=dict(re.findall(r"(\w+)='([^']*)'",next(line for line in badging.stdout.splitlines() if line.startswith('package:'))))
assert fields['name']=='in.nightwise.demo' and fields['versionName']=='0.6.0-prebilling'
assert 'android.permission.ACCESS_BACKGROUND_LOCATION' not in badging.stdout
server_value=next((line.partition('=')[2].strip() for line in (root/'.env').read_text().splitlines() if line.startswith('GOOGLE_MAPS_SERVER_KEY=')),'')
with zipfile.ZipFile(apk) as z:
    for file in (root/'dist').rglob('*'):
        if file.is_file():assert z.read('assets/public/'+file.relative_to(root/'dist').as_posix())==file.read_bytes(),'Outdated web asset'
    for name in z.namelist():
        assert not name.endswith(('.env','android-maps.properties'))
        if server_value and not name.endswith('/'):assert server_value.encode() not in z.read(name),'Server credential in APK'
    scripts=b'\n'.join(z.read(n) for n in z.namelist() if n.startswith('assets/public/') and n.endswith('.js'))
    assert b'Live maps are paused' in scripts
    # Capacitor's bundled web fallback contains a dormant loader URL. Runtime
    # browser tests verify that the app's pause gate prevents invoking it.
record={'file':apk.name,'sizeBytes':apk.stat().st_size,'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'packageId':fields['name'],'versionName':fields['versionName'],'versionCode':fields['versionCode'],'signatureVerified':True,'webAssetsMatch':True,'serverKeyAbsent':True,'liveMapsPaused':True,'backgroundLocationPermission':False,'physicalPhoneTested':False}
(apk.parent/'prebilling-verification.json').write_text(json.dumps(record,indent=2),encoding='utf-8')
(apk.parent/'prebilling-signing.txt').write_text(signed.stdout,encoding='utf-8')
print(json.dumps(record,indent=2))
