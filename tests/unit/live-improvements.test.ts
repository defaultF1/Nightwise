import {describe,it,expect,vi} from 'vitest';
import {sampleRouteOptions} from '../../src/providers/routes';
import {fixtureScans,TUTORIAL_CHECKED_AT} from '../../src/data/activity-fixtures';
import {buildQueryPlan,analyzeRoute} from '../../src/domain/activity';
import {compareActivity} from '../../src/domain/comparison';
import {liveComponentBounds} from '../../src/domain/live-scoring';
import {balancedPlan,coveringChildren,collectScans} from '../../server/scan';
import {distanceMeters} from '../../src/domain/geometry';
import {validateLocation,locationError} from '../../src/domain/location';
import {AEOS_PIN,inPilotArea} from '../../src/domain/journey';
import {intersectRects} from '../../src/maps/viewport';
import {passingMinutes} from '../../src/domain/arrival';
import {assumedShopHours} from '../../src/domain/assumed-hours';
import {helpPoints} from '../../src/HelpPoints';
import {createRoadAnalyzer} from '../../src/domain/roads';
import type {NearbyScan} from '../../src/domain/activity-types';

function evidence(){const routes=sampleRouteOptions('Manyata Tech Park','normal').map(r=>({...r,source:'google' as const,geometryKind:'provider' as const}));const plan=buildQueryPlan(routes);const scans=fixtureScans(plan,'normal');return {routes,plan,scans,analyses:routes.map(r=>analyzeRoute(r,plan,scans,TUTORIAL_CHECKED_AT))};}
describe('live interval comparison',()=>{
 it('recommends a supported winner and explains the actual extra time',()=>{
   const {routes,analyses}=evidence();
   const cases=routes.map((r,i)=>({...r,distanceMeters:1000,durationSeconds:i?720:600,turns:i?0:10}));
   const known=analyses.map((a,i)=>({...a,distanceMeters:1000,scanCoverage:1,openPlaces:i?12:0,places:i?Array.from({length:12},(_,j)=>({id:`known-${j}`,hours:{state:'open' as const,closingSoon:false,minutesUntilClose:120},categories:['pharmacy','restaurant','bus_station'],sampleIndexes:[0],conflict:false})):[],lowActivityGapBounds:(i?[0,0]:[1000,1000]) as [number,number],helpGapBounds:(i?[0,0]:[1000,1000]) as [number,number]}));
   const roads=Object.fromEntries(cases.map((r,i)=>[r.id,{mainRoadFraction:i?1:0,maneuversPerKm:i?0:10,internalTurnsPerKm:0}]));
   const comparison=compareActivity(cases,known,roads,{allowLive:true,maxExtraMinutes:5});
   expect(comparison.recommendedId).toBe(cases[1].id);expect(comparison.message).toContain('2 extra minutes');
   expect(comparison.scoreBounds![cases[1].id][0]).toBeGreaterThan(comparison.scoreBounds![cases[0].id][1]+10);
 });
 it('publishes bounded scores for incomplete live observations without a false rank',()=>{const {routes,analyses}=evidence();const partial=analyses.map(a=>({...a,coreComparable:false,scanCoverage:.5,lowActivityGapBounds:[0,a.distanceMeters] as [number,number]}));const c=compareActivity(routes,partial,{}, {allowLive:true});expect(Object.keys(c.scoreBounds!)).toHaveLength(2);expect(c.rankedIds).toEqual([]);expect(c.recommendedId).toBeNull();expect(c.selectedId).toBe(c.fastestId);for(const [low,high]of Object.values(c.scoreBounds!)){expect(low).toBeGreaterThanOrEqual(0);expect(high).toBeGreaterThanOrEqual(low);expect(high).toBeLessThanOrEqual(100);}});
 it('retains all six fixed weights and complete uncertainty for missing roads',()=>{const {analyses}=evidence();const b=liveComponentBounds(analyses[0],{});expect(b.mainRoad).toEqual([0,1]);expect(b.simplicity).toEqual([0,1]);const c=compareActivity(evidence().routes,analyses,{}, {allowLive:true});expect(c.commonComponents).toHaveLength(6);expect(c.scoreBounds![analyses[0].routeId][1]-c.scoreBounds![analyses[0].routeId][0]).toBeGreaterThanOrEqual(35);});
 it('does not reward a missing internal-turn penalty',()=>{const {analyses}=evidence();expect(liveComponentBounds(analyses[0],{maneuversPerKm:4}).simplicity).toEqual([.19999999999999996,.6]);});
 it('does not produce a number for unavailable scans or mismatched times',()=>{const {routes,analyses}=evidence();expect(compareActivity(routes,analyses.map(a=>({...a,openPlaces:null})),{}, {allowLive:true}).scores).toEqual({});expect(compareActivity(routes,[analyses[0],{...analyses[1],checkedAt:'invalid'}],{}, {allowLive:true}).scores).toEqual({});});
 it('does not rank a single eligible option under a zero-minute preference',()=>{const {routes,analyses}=evidence();const c=compareActivity(routes,analyses,{}, {allowLive:true,maxExtraMinutes:0});expect(c.outcome).toBe('detour');expect(c.recommendedId).toBeNull();});
 it('keeps a single route score without implying comparison',()=>{const {routes,analyses}=evidence();const c=compareActivity(routes.slice(0,1),analyses.slice(0,1),{}, {allowLive:true});expect(c.outcome).toBe('single');expect(c.scoreBounds![routes[0].id]).toBeDefined();});
});
describe('bounded scan coverage',()=>{
 it('allocates limited queries across alternatives and leaves omitted intervals unknown',()=>{const {routes}=evidence();const p=balancedPlan(routes,6);expect(p.queries).toHaveLength(6);for(const route of routes){const samples=p.samplesByRoute[route.id];expect(samples.some(s=>p.queries.some(q=>q.id===s.queryId))).toBe(true);const a=analyzeRoute(route,p,[],TUTORIAL_CHECKED_AT);expect(a.activityCoverage).toBe(0);expect(a.lowActivityGapBounds![1]).toBeCloseTo(a.distanceMeters);}});
 it('covers the original disk with four smaller circles',()=>{const q={id:'q',coordinate:AEOS_PIN,radiusMeters:150};const children=coveringChildren(q);for(let angle=0;angle<360;angle+=5){const p={latitude:AEOS_PIN.latitude+150*Math.sin(angle*Math.PI/180)/111195,longitude:AEOS_PIN.longitude+150*Math.cos(angle*Math.PI/180)/(111195*Math.cos(AEOS_PIN.latitude*Math.PI/180))};expect(children.some(c=>distanceMeters(p,c.coordinate)<=c.radiusMeters)).toBe(true);}});
 it('uses category refinement within the cap',async()=>{const q={id:'q',coordinate:AEOS_PIN,radiusMeters:150};const plan={queries:[q],samplesByRoute:{},totalSamples:1};const nearby=vi.fn(async(query:typeof q)=>({scan:{queryId:query.id,observedAt:TUTORIAL_CHECKED_AT,status:query.id==='q'?'capped':'ok',places:[]} as NearbyScan,attributions:[]}));const result=await collectScans(plan,{nearby},new AbortController().signal,3);expect(result.calls).toBe(3);expect(result.scans[0].status).toBe('ok');nearby.mockClear();expect((await collectScans(plan,{nearby},new AbortController().signal,2)).calls).toBe(1);});
 it('marks a fully checked subdivision complete without shrinking its footprint',async()=>{const q={id:'q',coordinate:AEOS_PIN,radiusMeters:150};const result=await collectScans({queries:[q],samplesByRoute:{},totalSamples:1},{nearby:async query=>({scan:{queryId:query.id,observedAt:TUTORIAL_CHECKED_AT,status:query.id==='q'?'capped':'ok',places:[]},attributions:[]})},new AbortController().signal,5);expect(result.scans[0].status).toBe('ok');});
});
describe('GPS, viewport and road diagnostics',()=>{
 it('accepts an ordinary in-area location and rejects Kanpur, stale or coarse readings',()=>{const now=Date.now();const p={timestamp:now,coords:{latitude:13.061,longitude:77.595,accuracy:15}};expect(validateLocation(p,now).name).toBe('Current location');expect(()=>validateLocation({...p,timestamp:now-61000},now)).toThrow('stale');expect(()=>validateLocation({...p,coords:{...p.coords,accuracy:300}},now)).toThrow('approximate');expect(inPilotArea({latitude:26.45,longitude:80.33})).toBe(false);expect(locationError({code:'OS-PLUG-GLOC-0007'})).toContain('off');});
 it('clips nested viewports without changing the original map dimensions',()=>{expect(intersectRects([{left:20,top:-100,right:350,bottom:400},{left:0,top:70,right:390,bottom:800}])).toEqual({left:20,top:70,right:350,bottom:400});expect(intersectRects([{left:0,top:-200,right:300,bottom:-10},{left:0,top:0,right:390,bottom:800}]).bottom).toBe(0);});
 it('reports why a bridge match remains unknown',()=>{const path=[AEOS_PIN,{...AEOS_PIN,latitude:AEOS_PIN.latitude+.003}];const a=createRoadAnalyzer([{id:1,highway:'primary',path,gradeSeparated:true}])(path);expect(a.unknownReasons?.grade).toBeCloseTo(a.unknownMeters);expect(a.coverage).toBe(0);});
 it('weights passing time by step durations when complete and falls back when missing',()=>{const {routes}=evidence();const route={...routes[0],durationSeconds:1200,steps:[{distanceMeters:500,staticDurationSeconds:900},{distanceMeters:500,staticDurationSeconds:100}]};expect(passingMinutes(route,500,1000)).toBe(18);expect(passingMinutes({...route,steps:[{distanceMeters:1000}]},500,1000)).toBe(10);});
});

describe('assumed opening hours remain separate from evidence',()=>{
 const place={id:'unknown',hours:{state:'unknown' as const,closingSoon:false,minutesUntilClose:null,reason:'Google did not return usable opening and closing times.'},categories:['store'],sampleIndexes:[0],conflict:false};
 it('uses IST 9 am inclusive to 8 pm exclusive at the passing time',()=>{
   expect(assumedShopHours(place,'2026-09-10T03:29:00Z')?.open).toBe(false);
   expect(assumedShopHours(place,'2026-09-10T03:30:00Z')?.open).toBe(true);
   expect(assumedShopHours({...place,arrivalMinutes:10},'2026-09-10T14:20:00Z')?.open).toBe(false);
   expect(place.hours.state).toBe('unknown');
 });
 it('does not overwrite known closures, conflicts or a special-day uncertainty',()=>{
   expect(assumedShopHours({...place,hours:{...place.hours,state:'closed'}},TUTORIAL_CHECKED_AT)).toBeNull();
   expect(assumedShopHours({...place,conflict:true},TUTORIAL_CHECKED_AT)).toBeNull();
   expect(assumedShopHours({...place,hours:{...place.hours,reason:'Special hours are flagged around this date, but usable times are missing.'}},TUTORIAL_CHECKED_AT)).toBeNull();
 });
 it('shows the same police and hotel categories used by the help-gap analysis',()=>{
   const a=evidence().analyses[0];
   expect(helpPoints({...a,places:['police','hotel','pharmacy'].map((c,i)=>({...place,id:String(i),categories:[c],hours:{state:'open',closingSoon:false,minutesUntilClose:120}}))})).toHaveLength(3);
 });
});
