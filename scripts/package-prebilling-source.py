from pathlib import Path
import hashlib,json,re,zipfile
root=Path(__file__).resolve().parents[1];out=root/'output/handoff';out.mkdir(parents=True,exist_ok=True)
files=set()
for folder in ['src','server','tests','scripts','public','data','planning','research','talks']:
    files.update(p for p in (root/folder).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
for folder in ['android/app/src/main/java','android/app/src/main/res','android/app/src/debug','android/gradle']:
    files.update(p for p in (root/folder).rglob('*') if p.is_file())
for name in ['AGENTS.md','README.md','package.json','package-lock.json','index.html','tsconfig.json','vite.config.ts','vitest.config.ts','playwright.config.ts','capacitor.config.ts','.gitignore','.env.example','Dockerfile','.dockerignore','Preview NightWise.cmd','Start NightWise API.cmd','android/build.gradle','android/settings.gradle','android/variables.gradle','android/gradle.properties','android/gradlew','android/gradlew.bat','android/app/build.gradle','android/app/proguard-rules.pro','android/app/src/main/AndroidManifest.xml']:
    p=root/name
    if p.is_file():files.add(p)
for p in files:
    rel=p.relative_to(root)
    assert p.name=='.env.example' or not p.name.startswith('.env')
    assert not any(part in {'.local','.tools','node_modules','build','dist'} for part in rel.parts)
    assert p.suffix.lower() not in {'.jks','.keystore','.p12','.log','.pyc'}
    raw=p.read_bytes()
    assert not re.search(rb'AIza[0-9A-Za-z_-]{35}',raw),'Credential-shaped value in source file: '+str(rel)
    if p.suffix=='.docx':
        with zipfile.ZipFile(p) as z:
            assert not any(re.search(rb'AIza[0-9A-Za-z_-]{35}',z.read(n)) for n in z.namelist()),'Credential-shaped value in Word file'
manifest=[{'path':p.relative_to(root).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(files)]
target=out/'nightwise-prebilling-source.zip'
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in sorted(files):z.write(p,'Nightwise/'+p.relative_to(root).as_posix())
    z.writestr('Nightwise/SOURCE-MANIFEST.json',json.dumps(manifest,indent=2))
with zipfile.ZipFile(target) as z:
    assert z.testzip() is None
    for entry in manifest:assert hashlib.sha256(z.read('Nightwise/'+entry['path'])).hexdigest()==entry['sha256']
record={'file':target.name,'files':len(files),'sizeBytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'credentialScanPassed':True,'privateEnvironmentExcluded':True,'signingKeysExcluded':True,'entryHashesVerified':True}
(out/'source-verification.json').write_text(json.dumps(record,indent=2),encoding='utf-8');print(json.dumps(record,indent=2))
