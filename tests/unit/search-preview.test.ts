import {afterEach,expect,it,vi} from 'vitest';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';import{tmpdir}from'node:os';import{join}from'node:path';
import{createServer}from'../../server/app';import{readConfig}from'../../server/config';import{AEOS_PIN}from'../../src/domain/journey';
const dirs:string[]=[];afterEach(()=>{for(const d of dirs.splice(0))rmSync(d,{recursive:true,force:true});});
const sessionToken='12345678-1234-4123-8123-123456789abc',anchor={latitude:AEOS_PIN.latitude,longitude:AEOS_PIN.longitude};
const predictions={suggestions:['one','two'].map(placeId=>({placePrediction:{placeId,distanceMeters:500,structuredFormat:{mainText:{text:placeId},secondaryText:{text:'Bengaluru'}}}}))};
const suggest={method:'POST' as const,url:'/api/places/suggest',payload:{query:'Bengaluru',sessionToken,anchor}};
const preview={method:'POST' as const,url:'/api/places/preview',payload:{sessionToken,placeIds:['one','two'],anchor,direction:'from-anchor'}};
it('search estimates respect mode and departure without reusing another mode',async()=>{
 const {app,fetcher}=await setup('20');
 try{
  await app.inject(suggest);const departureTime=new Date(Date.now()+3600000).toISOString();
  for(const mode of ['DRIVE','WALK','TWO_WHEELER']){
   expect((await app.inject({...preview,payload:{...preview.payload,mode,departureTime}})).statusCode).toBe(200);
   const body=JSON.parse(String((fetcher.mock.calls.at(-1) as unknown as [string,RequestInit])[1].body));
   expect(body.travelMode).toBe(mode);expect(body.departureTime).toBe(departureTime);
   expect(body.routingPreference).toBe(mode==='WALK'?undefined:'TRAFFIC_AWARE');
  }
  expect(fetcher).toHaveBeenCalledTimes(4);
 }finally{await app.close();}
});
async function setup(limit='10',elements:any[]=[{destinationIndex:1,status:{},condition:'ROUTE_EXISTS',distanceMeters:7000,duration:'1000s'},{status:{},condition:'ROUTE_EXISTS',distanceMeters:6000,duration:'900s'}]){
 const dir=mkdtempSync(join(tmpdir(),'nightwise-preview-'));dirs.push(dir);const ledger=join(dir,'counts.json');const fetcher=vi.fn(async(url:any)=>new Response(JSON.stringify(String(url).includes('autocomplete')?predictions:elements)));
 const app=await createServer(readConfig({API_PROVIDER:'google',ENABLE_LIVE_REQUESTS:'true',ENABLE_PLACE_SEARCH:'true',GOOGLE_MAPS_SERVER_KEY:'fake',ROAD_DATA_PATH:'missing',BUDGET_LEDGER_PATH:ledger,PILOT_ROUTE_LIMIT:limit}),fetcher);return{app,fetcher,ledger};
}
it('uses Google geodesic distance for suggestions and maps unordered route elements by index',async()=>{
 const {app,fetcher,ledger}=await setup();try{expect((await app.inject(suggest)).json().suggestions[0].straightDistanceMeters).toBe(500);const r=await app.inject(preview);expect(r.statusCode).toBe(200);expect(r.json().estimates).toEqual([{id:'one',available:true,distanceMeters:6000,durationSeconds:900},{id:'two',available:true,distanceMeters:7000,durationSeconds:1000}]);expect(JSON.parse(readFileSync(ledger,'utf8'))).toMatchObject({routeCalls:2,detailsCalls:0});const options=(fetcher.mock.calls[1] as unknown as [string,RequestInit])[1];expect(JSON.parse(String(options.body))).toMatchObject({origins:[{waypoint:{location:{latLng:anchor}}}],destinations:[{waypoint:{placeId:'one'}},{waypoint:{placeId:'two'}}],routingPreference:'TRAFFIC_AWARE'});expect((options.headers as any)['X-Goog-FieldMask']).toContain('status');await app.inject(preview);expect(fetcher).toHaveBeenCalledTimes(2);}finally{await app.close();}
});
it('calculates searched starting points toward the chosen destination',async()=>{const{app,fetcher}=await setup('10',[{originIndex:1,status:{},condition:'ROUTE_EXISTS',distanceMeters:9000,duration:'1500s'}]);try{await app.inject(suggest);const r=await app.inject({...preview,payload:{...preview.payload,direction:'to-anchor'}});expect(r.json().estimates).toEqual([{id:'one',available:false},{id:'two',available:true,distanceMeters:9000,durationSeconds:1500}]);expect(JSON.parse(String((fetcher.mock.calls[1] as unknown as [string,RequestInit])[1].body))).toMatchObject({origins:[{waypoint:{placeId:'one'}},{waypoint:{placeId:'two'}}],destinations:[{waypoint:{location:{latLng:anchor}}}]});}finally{await app.close();}});
it('keeps failed route elements unknown rather than guessing a time',async()=>{const{app}=await setup('10',[{status:{code:5},condition:'ROUTE_NOT_FOUND',distanceMeters:1234,duration:'99s'},{destinationIndex:1,condition:'ROUTE_EXISTS',distanceMeters:1000,duration:'60s'}]);try{await app.inject(suggest);expect((await app.inject(preview)).json().estimates.every((p:any)=>!p.available)).toBe(true);}finally{await app.close();}});
it('rejects unoffered IDs and out-of-area anchors before charging',async()=>{const{app,fetcher}=await setup();try{expect((await app.inject(preview)).statusCode).toBe(400);await app.inject(suggest);expect((await app.inject({...preview,payload:{...preview.payload,placeIds:['unknown']}})).statusCode).toBe(400);expect((await app.inject({...preview,payload:{...preview.payload,anchor:{latitude:28.6,longitude:77.2}}})).statusCode).toBe(422);expect(fetcher).toHaveBeenCalledTimes(1);}finally{await app.close();}});
it('keeps the existing route cap and charges no matrix when allowance is too small',async()=>{const{app,fetcher}=await setup('2');try{await app.inject(suggest);expect((await app.inject(preview)).statusCode).toBe(429);expect(fetcher).toHaveBeenCalledTimes(1);}finally{await app.close();}});
it('rejects duplicate matrix indices instead of assigning an ETA to the wrong shop',async()=>{const{app}=await setup('10',[{status:{},condition:'ROUTE_EXISTS',distanceMeters:1000,duration:'60s'},{status:{},condition:'ROUTE_EXISTS',distanceMeters:2000,duration:'120s'}]);try{await app.inject(suggest);expect((await app.inject(preview)).statusCode).toBe(503);}finally{await app.close();}});
