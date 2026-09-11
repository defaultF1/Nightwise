// Export source into an existing checkout without copying private configuration,
// generated builds, research documents, reports or device screenshots.
import {cpSync,existsSync,mkdirSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {resolve,relative,join} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const destination=resolve(process.argv[2]||'');
if(destination===root||!existsSync(join(destination,'.git')))throw new Error('Choose a separate existing Git checkout');
const folders=['src','server','tests','scripts','public','data','android/app/src/main/java','android/app/src/main/res','android/app/src/debug','android/gradle'];
const files=['README.md','package.json','package-lock.json','index.html','tsconfig.json','vite.config.ts','vitest.config.ts','playwright.config.ts','capacitor.config.ts','.gitignore','.env.example','Dockerfile','.dockerignore','Preview NightWise.cmd','Start NightWise API.cmd','android/build.gradle','android/settings.gradle','android/variables.gradle','android/gradle.properties','android/gradlew','android/gradlew.bat','android/app/build.gradle','android/app/proguard-rules.pro','android/app/src/main/AndroidManifest.xml'];
let count=0;
function copy(file){
 const name=relative(root,file);if(name.split(/[\\/]/).some(p=>['__pycache__','.local','.tools','node_modules','build'].includes(p)))return;
 if(statSync(file).isDirectory()){for(const entry of readdirSync(file))copy(join(file,entry));return;}
 const bytes=readFileSync(file);if(/AIza[\w-]{35}|-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/.test(bytes.toString('latin1')))throw new Error('Credential pattern in '+name);
 if(bytes.length>95*1024*1024)throw new Error('File too large for source hosting: '+name);
 const target=join(destination,name);mkdirSync(resolve(target,'..'),{recursive:true});cpSync(file,target);count++;
}
for(const name of [...folders,...files])if(existsSync(join(root,name)))copy(join(root,name));
console.log(JSON.stringify({files:count,privateConfigurationExcluded:true,reportsAndDeviceScreenshotsExcluded:true,credentialScanPassed:true}));
