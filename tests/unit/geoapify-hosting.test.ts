import {test,expect,vi} from 'vitest';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readGeoConfig} from '../../server/geoapify-config';
import {GeoRedisBudget} from '../../server/geoapify-budget';
import {Geoapify} from '../../server/geoapify';
import {createGeoapifyServer} from '../../server/geoapify-app';
import {serveGeoWeb} from '../../server/geoapify-web';
import {resolveApiBase} from '../../src/providers/api-base';
const code='test-team-code-123456';
const env={NODE_ENV:'production',GEOAPIFY_API_KEY:'test-key',PILOT_ACCESS_CODE:code,UPSTASH_REDIS_REST_URL:'https://test.upstash.io',UPSTASH_REDIS_REST_TOKEN:'test-token',RENDER_EXTERNAL_URL:'https://team.onrender.com'};
const counts={route:11,nearby:20,details:2,autocomplete:5,tiles:40};
test('production requires secrets and persistent counters; keeps provider namespace separate',()=>{
 const c=readGeoConfig(env);expect(c.host).toBe('0.0.0.0');expect(c.origins).toContain('https://team.onrender.com');expect(c.redisKey).not.toBe('nightwise:pilot-budget:v1');expect(c.serveWeb).toBe(true);
 expect(readGeoConfig({...env,PORT:'10000'}).port).toBe(10000);
 expect(()=>readGeoConfig({...env,PILOT_ACCESS_CODE:''})).toThrow(/PILOT_ACCESS_CODE/);
 expect(()=>readGeoConfig({...env,UPSTASH_REDIS_REST_URL:'',UPSTASH_REDIS_REST_TOKEN:''})).toThrow(/Upstash/);
 expect(()=>readGeoConfig({...env,GEOAPIFY_TILE_LIMIT:'-1',GEOAPIFY_TILES_LIMIT:'-1'})).toThrow(/GEOAPIFY_TILES_LIMIT/);
});
test('web stays same-origin; native builds use explicit hosted API and never silently call old provider',()=>{
 expect(resolveApiBase(true,false,'https://team.onrender.com')).toBe('');
 expect(resolveApiBase(true,true,'https://localhost','','https://team.onrender.com/')).toBe('https://team.onrender.com');
 expect(()=>resolveApiBase(true,true,'https://localhost')).toThrow(/hosted API URL/);
});
test('public website and health load, paid endpoints require team code, CORS permits web and native',async()=>{
 const root=mkdtempSync(join(tmpdir(),'nightwise-web-'));
 writeFileSync(join(root,'index.html'),'<html>Nightwise hosted test</html>');
 const request=vi.spyOn(Geoapify.prototype,'request').mockResolvedValue(new Uint8Array([1,2,3]));
 const app=await createGeoapifyServer('test-key',readGeoConfig(env),{read:async()=>counts,reserve:async()=>counts});
 await serveGeoWeb(app,root);
 try{
  expect((await app.inject('/')).body).toContain('Nightwise hosted test');
  expect((await app.inject('/api/health')).json()).toEqual({ok:true,provider:'geoapify'});
  expect((await app.inject('/api/status')).json()).toMatchObject({ready:true,accessCodeRequired:true,budgetStorage:'upstash'});
  for(const [method,url] of [['POST','/api/compare'],['POST','/api/places/suggest'],['POST','/api/location/address'],['POST','/api/feedback'],['GET','/api/tiles/dark-matter/13/5860/3794']]){
   expect((await app.inject({method:method as 'GET'|'POST',url})).statusCode).toBe(401);
  }
  expect(request).not.toHaveBeenCalled();
  expect((await app.inject({method:'POST',url:'/api/access',headers:{'x-nightwise-code':code}})).statusCode).toBe(200);
  expect((await app.inject({method:'POST',url:'/api/access',headers:{'x-nightwise-code':'wrong'}})).statusCode).toBe(401);
  for(const origin of ['https://team.onrender.com','https://localhost'])expect((await app.inject({method:'OPTIONS',url:'/api/compare',headers:{origin,'access-control-request-method':'POST','access-control-request-headers':'content-type,x-nightwise-code'}})).statusCode).toBe(204);
  expect((await app.inject({method:'POST',url:'/api/access',headers:{origin:'https://untrusted.example','x-nightwise-code':code}})).statusCode).toBe(403);
  const tile=await app.inject({url:'/api/tiles/dark-matter/13/5860/3794',headers:{'x-nightwise-code':code}});expect(tile.statusCode).toBe(200);expect(tile.headers.vary).toContain('X-Nightwise-Code');
  expect((await app.inject('/api/not-real')).statusCode).toBe(404);
  for(const url of ['/.env','/%2e%2e/package.json','/server/geoapify-index.ts'])expect([400,404]).toContain((await app.inject(url)).statusCode);
 }finally{await app.close();request.mockRestore();rmSync(root,{recursive:true,force:true});}
});
test('Redis initialization preserves existing counts, read/reserve failures fail closed',async()=>{
 const commands:any[]=[];
 const fetcher=vi.fn(async(_url:any,init:any)=>{const command=JSON.parse(init.body);commands.push(command);return new Response(JSON.stringify({result:command[0]==='SET'?null:['ok',JSON.stringify(counts)]}));});
 const store=new GeoRedisBudget('https://test.upstash.io','secret','nightwise:geoapify:usage:v1',fetcher);
 expect(await store.initialize()).toEqual(counts);expect(commands[0].at(-1)).toBe('NX');
 expect(await store.reserve('tiles',100)).toEqual(counts);expect(commands.at(-1).slice(-2)).toEqual(['tiles',100]);
 fetcher.mockResolvedValueOnce(new Response(JSON.stringify({result:['exhausted']})));
 await expect(store.reserve('route',1)).rejects.toThrow(/allowance is used up/);
 fetcher.mockResolvedValueOnce(new Response(JSON.stringify({result:['invalid']})));
 await expect(store.read()).rejects.toThrow(/recovery/);
 fetcher.mockRejectedValueOnce(new Error('secret connection details'));
 await expect(store.read()).rejects.toThrow('The request allowance could not be verified. No provider request was sent.');
});
test('provider spends nothing if persistent reservation fails',async()=>{
 const upstream=vi.fn();vi.stubGlobal('fetch',upstream);
 const provider=new Geoapify('test-key',{read:async()=>counts,reserve:async()=>{throw new Error('Budget offline');}});
 try{await expect(provider.request('/test',{},'route',new AbortController().signal)).rejects.toThrow('Budget offline');expect(upstream).not.toHaveBeenCalled();}finally{vi.unstubAllGlobals();}
});
