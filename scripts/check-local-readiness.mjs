import { readFile, stat, access } from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const present=async path=>{try{await access(new URL(path,root));return true;}catch{return false;}};
const api=await fetch('http://127.0.0.1:8787/api/status',{signal:AbortSignal.timeout(5000)}).then(r=>r.json()).catch(()=>null);
const preview=await fetch('http://127.0.0.1:4173/',{signal:AbortSignal.timeout(5000)}).then(r=>r.ok).catch(()=>false);
const ledger=JSON.parse(await readFile(new URL('.local/pilot-budget.json',root),'utf8'));
const report={checkedAt:new Date().toISOString(),preview,api,usage:{routeCalls:ledger.routeCalls,nearbyCalls:ledger.nearbyCalls,autocompleteCalls:ledger.autocompleteCalls||0,detailsCalls:ledger.detailsCalls||0},roadDataPresent:await present('data/roads/north-bengaluru-overpass.json'),latestApkPresent:await present('output/apk/nightwise-prebilling-debug.apk'),googleRequestsMadeByThisCheck:0};
console.log(JSON.stringify(report,null,2));
if(!preview||!api||!api.paused)process.exitCode=1;
