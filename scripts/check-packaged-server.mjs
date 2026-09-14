import {spawn} from 'node:child_process';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const temp=await mkdtemp(join(tmpdir(),'nightwise-server-check-'));
const server=spawn(process.execPath,['build-server/index.mjs'],{cwd:new URL('../',import.meta.url),windowsHide:true,stdio:'ignore',env:{...process.env,HOST:'127.0.0.1',PORT:'8789',GOOGLE_MAPS_SERVER_KEY:'',ENABLE_LIVE_REQUESTS:'false',BUDGET_LEDGER_PATH:join(temp,'counts.json')}});
try{
  let status;
  for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,200));try{const r=await fetch('http://127.0.0.1:8789/api/status',{signal:AbortSignal.timeout(1000)});status=await r.json();break;}catch{}}
  if(!status?.paused||status.ready)throw new Error('Packaged backend did not start paused');
  const record={packagedServerStarts:true,paused:true,googleRequestsMade:0,dockerImageTested:false};
  await writeFile(new URL('../talks/records/prebilling-packaged-server.json',import.meta.url),JSON.stringify(record,null,2));
  console.log(JSON.stringify(record));
}finally{const exited=new Promise(r=>server.once('exit',r));server.kill();await exited;await rm(temp,{recursive:true,force:true});}
