import {test,expect,vi} from 'vitest';
import {mkdtempSync,unlinkSync,rmdirSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Geoapify} from '../../server/geoapify';

test('tile downloads overlap within four slots, keep start spacing, and skip cancelled queued requests',async()=>{
 const temp=mkdtempSync(join(tmpdir(),'nightwise-queue-')),ledger=join(temp,'usage.json');
 const provider=new Geoapify('unused-test-key');
 // Isolate usage from the running local preview. No real requests or credits used.
 Object.assign(provider,{ledgerPath:ledger,ledger:{route:0,nearby:0,details:0,autocomplete:0,tiles:0}});
 vi.useFakeTimers();
 let active=0,peak=0;const starts:number[]=[];
 vi.stubGlobal('fetch',vi.fn(async()=>{
  starts.push(Date.now());active++;peak=Math.max(peak,active);
  await new Promise(resolve=>setTimeout(resolve,1500));active--;
  return new Response(new Uint8Array([1,2,3]));
 }));
 try{
  const cancelled=new AbortController();
  const pending=Array.from({length:7},(_,i)=>provider.request(`/v1/tile/dark-matter/17/${i}/0@2x.png`,{},'tiles',i===6?cancelled.signal:new AbortController().signal));
  const done=Promise.allSettled(pending);cancelled.abort();
  await vi.advanceTimersByTimeAsync(700);
  expect(starts).toHaveLength(4);expect(active).toBe(4);
  await vi.advanceTimersByTimeAsync(6000);
  const results=await done;
  expect(peak).toBe(4);expect(starts).toHaveLength(6);
  expect(starts.slice(1).every((time,i)=>time-starts[i]>=220)).toBe(true);
  expect(results.slice(0,6).every(r=>r.status==='fulfilled')).toBe(true);
  expect(results[6].status).toBe('rejected');expect(provider.usage().tiles).toBe(6);
 }finally{
  vi.useRealTimers();vi.unstubAllGlobals();
  if(existsSync(ledger))unlinkSync(ledger);rmdirSync(temp);
 }
});
