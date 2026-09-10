import {it,expect,vi} from 'vitest';
import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {DEFAULT_JOURNEY,SERVICE_REGIONS,inPilotArea,sameServiceRegion} from '../../src/domain/journey';
import {validateLocation} from '../../src/domain/location';
import {createServer} from '../../server/app';import {readConfig} from '../../server/config';
import {createRoadAnalyzer} from '../../src/domain/roads';
import {parseScan,parseRoutes} from '../../server/google';
const center=SERVICE_REGIONS[1].center;
it('accepts fresh precise Kanpur GPS and retains the Bengaluru tutorial preset',()=>{
 const p=validateLocation({timestamp:Date.now(),coords:{...center,accuracy:20}});expect(p.name).toBe('Current location');expect(inPilotArea(center)).toBe(true);expect(DEFAULT_JOURNEY.origin.name).toBe('AEOS');expect(DEFAULT_JOURNEY.destination.name).toBe('Manyata Tech Park');expect(sameServiceRegion(center,DEFAULT_JOURNEY.destination)).toBe(false);expect(inPilotArea({latitude:26.85,longitude:80.95})).toBe(false);
});
it('classifies Kanpur roads using the local latitude scale',()=>{
 expect(inPilotArea({latitude:386.48,longitude:80.30})).toBe(false);
 const path=[center,{latitude:center.latitude,longitude:center.longitude+.006}];const analyze=createRoadAnalyzer([{id:1,highway:'primary',path}]);const r=analyze(path);expect(r.coverage).toBeGreaterThan(.95);expect(r.mainMeters).toBeGreaterThan(500);
});
it('retains Kanpur shop evidence and accepts provider road geometry',()=>{
 const observedAt=new Date().toISOString();const scan=parseScan({places:[{id:'pharmacy',displayName:{text:'Test pharmacy'},location:center,types:['pharmacy'],businessStatus:'OPERATIONAL'}]},'q',observedAt);
 expect(scan.scan.places).toHaveLength(1);
 const points=[center,{latitude:center.latitude+.001,longitude:center.longitude+.003}];
 let lat=0,lng=0,encoded='';const part=(v:number)=>{let n=v<0?~(v<<1):v<<1;while(n>=32){encoded+=String.fromCharCode((32|(n&31))+63);n>>=5;}encoded+=String.fromCharCode(n+63);};
 for(const p of points){const a=Math.round(p.latitude*1e5),b=Math.round(p.longitude*1e5);part(a-lat);part(b-lng);lat=a;lng=b;}
 const routes=parseRoutes({routes:[{duration:'120s',distanceMeters:400,polyline:{encodedPolyline:encoded}}]});expect(routes[0].path).toEqual(points);expect(routes[0].geometryKind).toBe('provider');
});
it('restricts Kanpur autocomplete to its city and rejects cross-city comparisons before provider use',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'nightwise-kanpur-'));const fetcher=vi.fn(async()=>new Response(JSON.stringify({suggestions:[]})));
 const app=await createServer(readConfig({ENABLE_LIVE_REQUESTS:'true',ENABLE_PLACE_SEARCH:'true',GOOGLE_MAPS_SERVER_KEY:'mock',ROAD_DATA_PATH:'missing',KANPUR_ROAD_DATA_PATH:'missing',BUDGET_LEDGER_PATH:join(dir,'budget.json')}),fetcher);
 try{
  const r=await app.inject({method:'POST',url:'/api/places/suggest',payload:{query:'Sharda Nagar school',anchor:center,sessionToken:'12345678-1234-4123-8123-123456789abc'}});expect(r.statusCode).toBe(200);
  const options=(fetcher.mock.calls[0] as unknown as [string,RequestInit])[1];expect(JSON.parse(String(options.body)).locationRestriction.circle).toEqual({center,radius:20000});
  const cross=await app.inject({method:'POST',url:'/api/compare',payload:{...DEFAULT_JOURNEY,origin:{name:'GPS',...center}}});expect(cross.statusCode).toBe(422);expect(fetcher).toHaveBeenCalledTimes(1);
 }finally{await app.close();rmSync(dir,{recursive:true,force:true});}
});
