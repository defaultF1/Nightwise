import { describe, it, expect, afterEach, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Budget } from '../../server/budget';
import { readConfig } from '../../server/config';
import { createServer } from '../../server/app';
import { decodePolyline, parseScan, parseRoutes } from '../../server/google';
import { DEFAULT_JOURNEY, AEOS_PIN, MANYATA_PIN } from '../../src/domain/journey';
import { evaluateObservation } from '../../src/domain/hours';
import { mapsHandoff } from '../../src/domain/handoff';
import type { Coordinate } from '../../src/domain/types';
import { analyzeRoute, buildQueryPlan } from '../../src/domain/activity';
import { compareActivity } from '../../src/domain/comparison';

const folders: string[] = [];
afterEach(() => { for (const f of folders.splice(0)) rmSync(f, { recursive: true, force: true }); });
function ledger() { const f = mkdtempSync(join(tmpdir(), 'nightwise-unit-')); folders.push(f); return join(f, 'counts.json'); }
function config(extra: NodeJS.ProcessEnv = {}) { return readConfig({ ENABLE_LIVE_REQUESTS: 'true', ROAD_DATA_PATH:'missing-test-road-file', GOOGLE_MAPS_SERVER_KEY: 'test-key-not-real', BUDGET_LEDGER_PATH: ledger(), ...extra }); }
function encode(path: Coordinate[]) {
  let lat = 0, lng = 0, out = '';
  function part(delta: number) { let value = delta < 0 ? ~(delta << 1) : delta << 1; while (value >= 32) { out += String.fromCharCode((32 | (value & 31)) + 63); value >>>= 5; } out += String.fromCharCode(value + 63); }
  for (const p of path) { const a = Math.round(p.latitude * 1e5), b = Math.round(p.longitude * 1e5); part(a-lat); part(b-lng); lat=a; lng=b; } return out;
}
const path = [{ latitude: 13.06, longitude: 77.60 }, { latitude: 13.0605, longitude: 77.60 }, { latitude: 13.061, longitude: 77.601 }];
const response = { routes: [ { duration: '120s', distanceMeters: 170, polyline: { encodedPolyline: encode(path) }, legs: [{ steps: [{ navigationInstruction: { maneuver: 'DEPART' } }, { navigationInstruction: { maneuver: 'TURN_LEFT' } }] }] } ] };
const request = { method: 'POST' as const, url: '/api/compare', payload: DEFAULT_JOURNEY };

describe('persistent request allowance', () => {
  it('counts attempted requests across restarts and refuses overspend', () => {
    const file = ledger(); let b = new Budget(file, 2, 3); b.reserve('route'); b.reserve('nearby', 2); b.close();
    b = new Budget(file, 2, 3); expect(b.snapshot().routeCalls).toBe(1); expect(b.canScan(2)).toBe(false);
    b.reserve('route'); expect(() => b.reserve('route')).toThrow(/allowance/); expect(() => b.reserve('nearby', 2)).toThrow(/allowance/); expect(JSON.parse(readFileSync(file,'utf8'))).toEqual({routeCalls:2,nearbyCalls:2,autocompleteCalls:0,detailsCalls:0}); b.close();
  });
  it('does not allow two processes to own the same allowance', () => { const file=ledger(); const b=new Budget(file,10,600); expect(()=>new Budget(file,10,600)).toThrow(/locked/); b.close(); });
  it('requires an access code before binding a hosted service', () => { expect(()=>readConfig({HOST:'0.0.0.0'})).toThrow(/access/i); expect(readConfig({HOST:'0.0.0.0',PILOT_ACCESS_CODE:'private-team-code-123'}).host).toBe('0.0.0.0'); });
});
describe('Google response boundary', () => {
  it('decodes route geometry and includes actual turn evidence', () => { expect(decodePolyline(encode(path))).toEqual(path); const routes=parseRoutes(response); expect(routes[0]).toMatchObject({source:'google',geometryKind:'provider',turns:1,label:'Fastest'}); });
  it('rejects truncated, oversized and outside-city geometry', () => { expect(()=>decodePolyline('~~~~~')).toThrow(); expect(()=>decodePolyline('x'.repeat(50001))).toThrow(); expect(()=>parseRoutes({routes:[{...response.routes[0],polyline:{encodedPolyline:encode([{latitude:0,longitude:0},{latitude:1,longitude:1}])}}]})).toThrow(/area/); });
  it('deduplicates identical route alternatives and handles no alternatives', () => { expect(parseRoutes({routes:[response.routes[0],response.routes[0]]})).toHaveLength(1); expect(parseRoutes({})).toEqual([]); });
  it('keeps capped searches and malformed places out of full coverage', () => { const now=new Date().toISOString(); const p={id:'p',location:path[0],types:['cafe'],businessStatus:'OPERATIONAL',currentOpeningHours:{openNow:true,nextCloseTime:'2030-01-01T00:00:00Z'}}; expect(parseScan({places:Array.from({length:20},(_,i)=>({...p,id:String(i)}))},'q',now).scan.status).toBe('capped'); expect(parseScan({places:[{...p,location:{latitude:NaN,longitude:77}}]},'q',now).scan.status).toBe('failed'); });
  it('never converts openNow without a known close horizon into a forecast', () => { const now='2026-09-09T15:00:00Z'; const observation=parseScan({places:[{id:'p',location:path[0],types:['pharmacy'],businessStatus:'OPERATIONAL',currentOpeningHours:{openNow:true}}]},'q',now).scan.places[0]; expect(evaluateObservation(observation,now).state).toBe('open'); expect(evaluateObservation(observation,now,10).state).toBe('unknown'); observation.currentHours!.nextCloseTime='2026-09-09T15:10:00Z'; expect(evaluateObservation(observation,now,20).state).toBe('unknown'); expect(evaluateObservation(observation,'2026-09-09T16:00:00Z').state).toBe('unknown'); });
});
describe('live backend', () => {
  it('configuration checks cost nothing and never return secrets', async () => { const calls=vi.fn(); const app=await createServer(config(),calls); try { const res=await app.inject('/api/status'); expect(res.statusCode).toBe(200); expect(res.body).not.toContain('test-key'); expect(calls).not.toHaveBeenCalled(); } finally { await app.close(); } },15000);
  it('refuses missing credentials, invalid inputs, disallowed origins and missing access code before provider calls', async () => {
    const calls=vi.fn(); const app=await createServer(config({GOOGLE_MAPS_SERVER_KEY:''}),calls);
    try { expect((await app.inject(request)).statusCode).toBe(503); expect((await app.inject({...request,payload:{...DEFAULT_JOURNEY,mode:'WALK'}})).statusCode).toBe(400); expect((await app.inject({...request,headers:{origin:'https://untrusted.example'}})).statusCode).toBe(403); expect(calls).not.toHaveBeenCalled(); } finally { await app.close(); }
    const secured=await createServer(config({PILOT_ACCESS_CODE:'secret-pilot-code'}),calls); try { expect((await secured.inject(request)).statusCode).toBe(401); expect(calls).not.toHaveBeenCalled(); } finally { await secured.close(); }
  });
  it('returns real-provider routes without inventing activity when scans are off', async () => { const calls=vi.fn(async()=>new Response(JSON.stringify(response))); const app=await createServer(config(),calls); try { const res=await app.inject(request); expect(res.statusCode).toBe(200); const body=res.json(); expect(body.activityStatus).toBe('disabled'); expect(body.analyses[0].openPlaces).toBeNull(); expect(body.comparison.scores).toEqual({}); expect(body.usage.routeCalls).toBe(1); expect(calls).toHaveBeenCalledTimes(1); const options=calls.mock.calls[0] as unknown as [string,RequestInit]; expect(String(options[0])).toContain('routes.googleapis.com'); } finally { await app.close(); } });
  it('counts a failed provider call and never retries or leaks the error body', async () => { const calls=vi.fn(async()=>new Response('private-provider-message',{status:403})); const app=await createServer(config({PILOT_ROUTE_LIMIT:'1'}),calls); try { const first=await app.inject(request); expect(first.json().code).toBe('provider-access'); expect(first.body).not.toContain('private-provider'); expect((await app.inject(request)).statusCode).toBe(429); expect(calls).toHaveBeenCalledTimes(1); } finally { await app.close(); } });
  it('uses the remaining bounded allowance and keeps unscanned distance unknown', async () => { const calls=vi.fn(async()=>new Response(JSON.stringify(response))); const app=await createServer(config({ENABLE_ACTIVITY_ANALYSIS:'true',PILOT_NEARBY_LIMIT:'1'}),calls); try { const res=await app.inject(request); expect(res.json().activityStatus).toBe('partial'); expect(res.json().usage.nearbyCalls).toBe(1); expect(res.json().analyses[0].scanCoverage).toBeLessThan(1); expect(calls).toHaveBeenCalledTimes(2); } finally { await app.close(); } });
  it('analyzes live scans with no stored provider data and reports total low distance', async () => { const calls=vi.fn(async(url: string|URL|Request)=>new Response(JSON.stringify(String(url).includes('routes.googleapis')?response:{places:[]}))); const conf=config({ENABLE_ACTIVITY_ANALYSIS:'true'}); const app=await createServer(conf,calls); try { const res=await app.inject(request); expect(res.statusCode).toBe(200); const body=res.json(); expect(body.activityStatus).toBe('complete'); expect(body.analyses[0].totalLowActivityMeters).toBeGreaterThan(100); expect(body.usage.nearbyCalls).toBeGreaterThan(0); expect(Object.keys(JSON.parse(readFileSync(conf.ledgerPath,'utf8'))).sort()).toEqual(['autocompleteCalls','detailsCalls','nearbyCalls','routeCalls']); } finally { await app.close(); } });
  it('reuses recent nearby results without spending the allowance again', async () => {
    const calls=vi.fn(async(_url:string|URL|Request)=>new Response(JSON.stringify(response)));
    const app=await createServer(config({ENABLE_ACTIVITY_ANALYSIS:'true'}),calls);
    try {
      const first=await app.inject(request); expect(first.statusCode).toBe(200);
      const spentNearby=first.json().usage.nearbyCalls; expect(spentNearby).toBeGreaterThan(0);
      const second=await app.inject(request); expect(second.statusCode).toBe(200);
      expect(second.json().usage.nearbyCalls).toBe(spentNearby);
      expect(second.json().usage.routeCalls).toBe(2);
      expect(calls.mock.calls.filter(c=>String(c[0]).includes('searchNearby')).length).toBe(spentNearby);
    } finally { await app.close(); }
  });
  it('stores anonymous feedback without touching the Google allowance', async () => {
    const calls=vi.fn(); const app=await createServer(config(),calls);
    try {
      const res=await app.inject({method:'POST',url:'/api/feedback',payload:{rating:'up',routeLabel:'Fastest',city:'Kanpur'}});
      expect(res.statusCode).toBe(200); expect(res.json().ok).toBe(true);
      expect((await app.inject({method:'POST',url:'/api/feedback',payload:{rating:'sideways'}})).statusCode).toBe(400);
      expect(calls).not.toHaveBeenCalled();
    } finally { await app.close(); }
  });
  it('serializes comparisons so concurrent callers cannot reserve past the allowance', async () => { let release!:()=>void; let entered!:()=>void; const started=new Promise<void>(r=>entered=r); const paused=new Promise<void>(r=>release=r); const calls=vi.fn(async()=>{entered();await paused;return new Response(JSON.stringify(response));}); const app=await createServer(config(),calls); try { const first=app.inject(request); await started; const second=await app.inject(request); expect(second.statusCode).toBe(429); expect(second.json().code).toBe('busy'); release(); expect((await first).statusCode).toBe(200); expect(calls).toHaveBeenCalledTimes(1); } finally { release?.(); await app.close(); } });
});
describe('phone handoff and live score gate', () => {
  it('uses exact supplied endpoints and never transfers illustrative geometry', () => { const url=new URL(mapsHandoff(DEFAULT_JOURNEY)); expect(url.searchParams.get('origin')).toBe('13.062827,77.594089'); expect(url.searchParams.get('destination')).toBe('13.047697,77.619939'); expect(url.searchParams.has('waypoints')).toBe(false); expect(url.searchParams.has('dir_action')).toBe(false); });
  it('adds at most three ordered on-route points to a live preview', () => { const route={...parseRoutes(response)[0],path:[AEOS_PIN,MANYATA_PIN],distanceMeters:3300}; const url=new URL(mapsHandoff(DEFAULT_JOURNEY,route)); expect(url.searchParams.get('waypoints')!.split('|').length).toBeLessThanOrEqual(3); expect(url.toString().length).toBeLessThan(2048); expect(new URL(mapsHandoff(DEFAULT_JOURNEY,{...route,source:'sample',geometryKind:'illustrative'})).searchParams.has('waypoints')).toBe(false); });
  it('keeps live ranks off by default even with full scans', () => { const routes=[...parseRoutes(response),{...parseRoutes(response)[0],id:'second',durationSeconds:140}]; const plan=buildQueryPlan(routes); const now=new Date().toISOString(); const scans=plan.queries.map(q=>({queryId:q.id,observedAt:now,status:'ok' as const,places:[]})); const analyses=routes.map(r=>analyzeRoute(r,plan,scans,now)); expect(compareActivity(routes,analyses).scores).toEqual({}); expect(Object.keys(compareActivity(routes,analyses,{}, {allowLive:true}).scores)).toHaveLength(2); });
});

describe('targeted missing-hours enrichment',()=>{
 for(const succeeds of [true,false])it(`preserves shared detail accounting when enrichment ${succeeds?'succeeds':'fails'}`,async()=>{
   const raw={id:'missing-hours',location:path[1],types:['pharmacy'],businessStatus:'OPERATIONAL'};
   const calls=vi.fn(async(url:string|URL|Request)=>{
     if(String(url).includes('routes.googleapis'))return new Response(JSON.stringify(response));
     if(String(url).includes('/places/missing-hours'))return succeeds?new Response(JSON.stringify({...raw,currentOpeningHours:{openNow:true,nextCloseTime:new Date(Date.now()+3600000).toISOString()}})):new Response('private-provider-error',{status:503});
     return new Response(JSON.stringify({places:[raw]}));
   });
   const app=await createServer(config({ENABLE_ACTIVITY_ANALYSIS:'true',ENABLE_EXPERIMENTAL_SCORING:'true',PILOT_DETAILS_LIMIT:'1'}),calls);
   try {const res=await app.inject(request),body=res.json();expect(res.statusCode).toBe(200);expect(body.usage.detailsCalls).toBe(1);expect(body.requestUsage.detailsCalls).toBe(1);expect(body.analyses[0].places[0].hours.state).toBe(succeeds?'open':'unknown');expect(Object.keys(body.comparison.scores).length).toBeGreaterThan(0);expect(res.body).not.toContain('private-provider-error');}finally{await app.close();}
 });
});
