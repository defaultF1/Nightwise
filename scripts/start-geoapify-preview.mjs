import { spawn } from 'node:child_process';
const env={...process.env,VITE_MAP_PROVIDER:'geoapify',VITE_API_BASE_URL:'',VITE_ANDROID_API_BASE_URL:'',NIGHTWISE_LOCAL_API:'http://127.0.0.1:8788'};
const child=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4176','--strictPort'],{env,stdio:'inherit',windowsHide:true});
for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>child.kill());
child.on('exit',code=>process.exit(code??0));
