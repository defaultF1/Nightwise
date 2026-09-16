import { describe,it,expect } from 'vitest';
import { distanceMeters,pathLength,samplePolyline } from '../../src/domain/geometry';
import { evaluateHours,isFresh } from '../../src/domain/hours';
import { buildQueryPlan,analyzeRoute } from '../../src/domain/activity';
import { compareActivity,componentValues } from '../../src/domain/comparison';
import { analyzeComparison } from '../../src/domain/analyze-comparison';
import { fixtureScans,fixtureRoadEvidence,TUTORIAL_CHECKED_AT as now } from '../../src/data/activity-fixtures';
import { sampleRouteOptions } from '../../src/providers/routes';
import type { Route } from '../../src/domain/types';
import type { NearbyScan,OpeningHours,ActivityAnalysis,PlaceObservation } from '../../src/domain/activity-types';
const p=(meters:number,north=0)=>({latitude:north/111195.0802335329,longitude:meters/111195.0802335329});
function route(length=1000,id='r'):Route{return {id,label:id,durationSeconds:600,distanceMeters:length,path:[p(0),p(length)],source:'sample',geometryKind:'illustrative'};}
function setup(length=1000){const r=route(length);const plan=buildQueryPlan([r]);const scans:NearbyScan[]=plan.queries.map(q=>({queryId:q.id,observedAt:now,status:'ok',places:[]}));return {r,plan,scans};}
const open:OpeningHours={timeZone:'Asia/Kolkata',alwaysOpen:true};
function place(id:string,meters:number,hours:OpeningHours|undefined=open):PlaceObservation{return {id,coordinate:p(meters),categories:['pharmacy'],hours,observedAt:now};}
describe('polyline sampling',()=>{
 it('includes both endpoints and the actual final partial distance',()=>{const points=samplePolyline([p(0),p(1050)],200);expect(points).toHaveLength(7);expect(points.map(s=>Math.round(s.distanceMeters))).toEqual([0,200,400,600,800,1000,1050]);expect(points.at(-1)?.coordinate).toEqual(p(1050));});
 it('measures bends along the path rather than the endpoint chord',()=>{const path=[p(0),p(1000),p(1000,1000)];expect(pathLength(path)).toBeCloseTo(2000,1);expect(distanceMeters(path[0],path[2])).toBeLessThan(1500);expect(samplePolyline(path,500).at(-1)?.distanceMeters).toBeCloseTo(2000,1);});
 it('preserves loops and handles repeated vertices without NaN',()=>{const points=samplePolyline([p(0),p(0),p(300),p(300),p(0)],200);expect(points).toHaveLength(4);expect(points.at(-1)?.coordinate).toEqual(p(0));expect(points.every(s=>Number.isFinite(s.coordinate.longitude))).toBe(true);});
 it('handles short and zero-length paths and enforces sample bounds',()=>{expect(samplePolyline([p(0),p(10)])).toHaveLength(2);expect(samplePolyline([p(0),p(0)])).toHaveLength(1);expect(()=>samplePolyline([p(0),p(30_000)],200,120)).toThrow(/budget/);expect(()=>samplePolyline([p(0),p(10)],0)).toThrow();});
 it('interpolates across the dateline without crossing the globe',()=>{const points=samplePolyline([{latitude:0,longitude:179.999},{latitude:0,longitude:-179.999}],100);expect(points.at(-1)?.distanceMeters).toBeCloseTo(222.39,1);expect(Math.abs(points[1].coordinate.longitude)).toBeGreaterThan(179.99);});
 it('reuses identical queries across alternatives and repeated endpoints',()=>{const a=route(),b={...a,id:'b'};const plan=buildQueryPlan([a,b]);expect(plan.totalSamples).toBe(plan.queries.length*2);expect(()=>buildQueryPlan([route(10000),{...route(10000,'b'),path:[p(0,1000),p(10000,1000)]}],200,30)).toThrow(/budget/);});
});
describe('opening hours',()=>{
 it('keeps absent invalid and stale information unknown',()=>{expect(evaluateHours(undefined,now).state).toBe('unknown');expect(evaluateHours({timeZone:'Invalid/Zone',alwaysOpen:true},now).state).toBe('unknown');expect(isFresh('2026-09-09T14:00:00Z',now)).toBe(false);expect(isFresh('2026-09-09T15:05:00Z',now)).toBe(false);expect(isFresh(now,now)).toBe(true);});
 it('evaluates Bengaluru time including close boundaries',()=>{const hours={timeZone:'Asia/Kolkata',periods:[{openDay:3,openMinute:1200,closeDay:3,closeMinute:1235}]};expect(evaluateHours(hours,now,22)).toMatchObject({state:'closed',closingSoon:false,minutesUntilClose:null});expect(evaluateHours(hours,'2026-09-09T15:05:00Z').state).toBe('closed');});
 it('handles overnight and week-wrap periods',()=>{const h={timeZone:'Asia/Kolkata',periods:[{openDay:6,openMinute:1380,closeDay:0,closeMinute:120}]};expect(evaluateHours(h,'2026-09-12T19:30:00Z')).toMatchObject({state:'open',minutesUntilClose:60});expect(evaluateHours(h,'2026-09-12T21:00:00Z').state).toBe('closed');});
 it('merges adjacent hours instead of predicting a false early close',()=>{const h={timeZone:'Asia/Kolkata',periods:[{openDay:3,openMinute:1080,closeDay:3,closeMinute:1235},{openDay:3,openMinute:1235,closeDay:3,closeMinute:1380}]};expect(evaluateHours(h,now,22)).toMatchObject({state:'open',closingSoon:false,minutesUntilClose:128});});
 it('requires explicit always-open evidence and rejects zero-length periods',()=>{expect(evaluateHours(open,now).state).toBe('open');expect(evaluateHours({timeZone:'Asia/Kolkata',periods:[]},now).state).toBe('unknown');expect(evaluateHours({timeZone:'Asia/Kolkata',periods:[{openDay:3,openMinute:0,closeDay:3,closeMinute:0}]},now).state).toBe('unknown');});
});
describe('observations and distance-weighted coverage',()=>{
 it('counts an open petrol pump once as a help point and excludes closed or unknown pumps',()=>{
  const {r,plan,scans}=setup(400);
  const pump={...place('pump',100),categories:['gas_station','pharmacy']};
  scans[0].places=[pump,{...place('unknown-pump',0),categories:['gas_station'],hours:undefined},{...place('closed-pump',0,{timeZone:'Asia/Kolkata',periods:[{openDay:3,openMinute:0,closeDay:3,closeMinute:60}]}),categories:['gas_station']}];
  scans[1].places=[structuredClone(pump)];
  const a=analyzeRoute(r,plan,scans,now);
  expect(a.potentialHelpPoints).toBe(1);expect(a.openPlaces).toBe(1);expect(a.unknownHours).toBe(1);expect(a.closedPlaces).toBe(1);
 });
 it('connects deduplicated open transport listings to distance-normalized scoring',()=>{
  const {r,plan,scans}=setup(400);
  const station={...place('station',100),categories:['transit_station','bus_station']};
  scans[0].places=[station];scans[1].places=[structuredClone(station)];
  const a=analyzeRoute(r,plan,scans,now);
  expect(a.openTransportPoints).toBe(1);expect(a.potentialHelpPoints).toBe(0);
  expect(componentValues(a).transport).toBeCloseTo(2/3,5);
  for(const scan of scans)scan.status='failed';
  expect(analyzeRoute(r,plan,scans,now).openTransportPoints).toBeNull();
 });
 it('does not treat unknown transport hours as evidence of operation',()=>{
  const {r,plan,scans}=setup(400);
  scans[0].places=[{...place('station',0),categories:['transit_station'],hours:undefined}];
  const a=analyzeRoute(r,plan,scans,now);
  expect(a.openTransportPoints).toBe(0);expect(a.coreComparable).toBe(false);expect(componentValues(a).transport).toBe(0);
 });
 it('deduplicates place identity while retaining sample associations',()=>{const {r,plan,scans}=setup(400);scans[0].places=[place('same',100)];scans[1].places=[place('same',100)];const a=analyzeRoute(r,plan,scans,now);expect(a.openPlaces).toBe(1);expect(a.potentialHelpPoints).toBe(1);expect(a.places[0].sampleIndexes).toEqual([0,1]);});
 it('filters off-route observations beyond the query radius',()=>{const {r,plan,scans}=setup(400);scans[0].places=[place('far',1000)];expect(analyzeRoute(r,plan,scans,now).openPlaces).toBe(0);});
 it('conflicting hours are unknown rather than optimistically open',()=>{const {r,plan,scans}=setup(400);scans[0].places=[place('same',100)];scans[1].places=[place('same',100,{timeZone:'Asia/Kolkata',periods:[{openDay:3,openMinute:0,closeDay:3,closeMinute:60}]})];const a=analyzeRoute(r,plan,scans,now);expect(a.unknownHours).toBe(1);expect(a.openPlaces).toBe(0);expect(a.coreComparable).toBe(false);});
 it('unavailable scans produce null counts and no score',()=>{const {r,plan,scans}=setup();for(const s of scans)s.status='failed';const a=analyzeRoute(r,plan,scans,now);expect(a.openPlaces).toBeNull();expect(a.potentialHelpPoints).toBeNull();expect(a.longestLowActivityMeters).toBeNull();expect(a.scanCoverage).toBe(0);});
 it('stale and capped searches cannot count as fully assessed',()=>{for(const state of ['stale','capped'] as const){const {r,plan,scans}=setup();if(state==='stale')scans[1].observedAt='2026-09-09T14:00:00Z';else scans[1].status='capped';const a=analyzeRoute(r,plan,scans,now);expect(a.scanCoverage).toBeCloseTo(.6,5);expect(a.longestLowActivityMeters).toBeNull();expect(a.coreComparable).toBe(false);}});
 it('weights the final partial interval by distance rather than sample count',()=>{const {r,plan,scans}=setup(1050);scans.at(-1)!.status='failed';const a=analyzeRoute(r,plan,scans,now);expect(a.scanCoverage).toBeCloseTo(1000/1050,5);});
 it('unknown sections split low-activity gaps',()=>{const {r,plan,scans}=setup(1000);scans[2].status='failed';const a=analyzeRoute(r,plan,scans,now);expect(a.segments.map(s=>s.state)).toEqual(['low','unknown','unknown','low','low']);expect(a.longestObservedLowActivityMeters).toBeCloseTo(400,4);expect(a.longestLowActivityMeters).toBeNull();});
 it('duplicate search records are excluded conservatively',()=>{const {r,plan,scans}=setup();const a=analyzeRoute(r,plan,[...scans,scans[0]],now);expect(a.scanCoverage).toBeLessThan(1);expect(a.limitations.join(' ')).toContain('Conflicting search');});
 it('empty completed searches mean observed absence, not unavailable evidence',()=>{const {r,plan,scans}=setup();const a=analyzeRoute(r,plan,scans,now);expect(a.openPlaces).toBe(0);expect(a.longestLowActivityMeters).toBeCloseTo(1000,5);expect(a.coreComparable).toBe(true);});
});
function evidence(r:Route,overrides:Partial<ActivityAnalysis>={}):ActivityAnalysis {const plan=buildQueryPlan([r]);return {...analyzeRoute(r,plan,plan.queries.map(q=>({queryId:q.id,observedAt:now,status:'ok',places:[]})),now),openPlaces:4,potentialHelpPoints:1,staffedPlaceProxy:4,longestObservedHelpGapMeters:0,longestObservedLowActivityMeters:200,...overrides};}
describe('comparison invariants',()=>{
 it('uses all six weighted signals when comparable inputs exist',()=>{
  const a=route(1000,'a'),b={...route(1000,'b'),durationSeconds:660};
  const result=compareActivity([a,b],[evidence(a,{openTransportPoints:0}),evidence(b,{openPlaces:8,potentialHelpPoints:2,staffedPlaceProxy:8,longestObservedLowActivityMeters:0,openTransportPoints:3})],{a:{mainRoadFraction:.5,maneuversPerKm:5},b:{mainRoadFraction:1,maneuversPerKm:0}});
  expect(result.commonComponents).toHaveLength(6);expect(result.scores.b).toBeCloseTo(79.375);
  expect(result.scores.a).toBeCloseTo(25/3+10+15*(.75*.5+.25/3)+13+7.5,5);
  expect(result.selectedId).toBe('b');expect(result.componentScores.b.transport).toBe(.75);
  expect(result.message).toContain('transport locations');
 });
 it('makes an unavailable signal absent from every score without substituting zero',()=>{
  const a=route(1000,'a'),b=route(1000,'b');
  const result=compareActivity([a,b],[evidence(a,{openTransportPoints:3}),evidence(b,{openTransportPoints:null})],{a:{mainRoadFraction:1}});
  expect(result.commonComponents).toEqual(['openDensity','helpDensity','gapContinuity']);
  expect(result.scores.a).toBe(result.scores.b);expect(result.componentScores.b.transport).toBeUndefined();
  expect(result.componentScores.a.transport).toBe(.75);
 });
 it('scores every tutorial scenario from observed signals while preserving the detour gate',()=>{
  for(const [scenario,outcome,componentCount] of [['normal','more-activity',6],['similar','similar',6],['detour','detour',6],['unknown','insufficient',2],['capped','more-activity',6],['closing','more-activity',6]] as const){
   const routes=sampleRouteOptions('Manyata Tech Park',scenario);
   const result=analyzeComparison(routes,plan=>fixtureScans(plan,scenario),now,fixtureRoadEvidence(routes,scenario));
   expect(result.comparison.outcome,scenario).toBe(outcome);
   expect(result.comparison.commonComponents,scenario).toHaveLength(componentCount);
   expect(Object.keys(result.comparison.scores),scenario).toHaveLength(routes.length);
   if(scenario==='unknown'){expect(result.comparison.recommendedId).toBeNull();expect(result.comparison.message).toContain('not enough shop-opening data');}
  }
  expect(fixtureRoadEvidence([{...route(),source:'google'}],'normal')).toEqual({});
 });
 it('normalizes counts by distance and does not reward a longer equal-density route',()=>{const a=route(1000,'a'),b=route(2000,'b');const ea=evidence(a),eb=evidence(b,{openPlaces:8,potentialHelpPoints:2,staffedPlaceProxy:8});expect(componentValues(ea).openDensity).toBe(componentValues(eb).openDensity);expect(componentValues(ea).helpDensity).toBe(componentValues(eb).helpDensity);expect(compareActivity([a,b],[ea,eb]).outcome).toBe('similar');});
 it('uses the same available factors and denominator for every route',()=>{const a=route(1000,'a'),b=route(1000,'b'),ea=evidence(a),eb=evidence(b);const result=compareActivity([a,b],[ea,eb],{a:{mainRoadFraction:1}});expect(result.commonComponents).toEqual(['openDensity','helpDensity','gapContinuity','transport']);expect(result.scores.a).toBe(result.scores.b);});
 it('moves in the expected direction for more open evidence and a longer gap',()=>{const r=route(),base=evidence(r);expect(componentValues({...base,openPlaces:6}).openDensity).toBeGreaterThan(componentValues(base).openDensity!);expect(componentValues({...base,longestObservedLowActivityMeters:800}).gapContinuity).toBeLessThan(componentValues(base).gapContinuity!);});
 it('scores partially covered routes from what was seen and keeps the fastest when similar',()=>{const a=route(1000,'a'),b={...route(1000,'b'),durationSeconds:900};const result=compareActivity([a,b],[evidence(a),evidence(b,{coreComparable:false})]);expect(result.outcome).toBe('similar');expect(Object.keys(result.scores)).toHaveLength(2);expect(result.selectedId).toBe('a');});
 it('does not force a large detour despite stronger activity',()=>{const a=route(1000,'a'),b={...route(1000,'b'),durationSeconds:1800};const result=compareActivity([a,b],[evidence(a,{openPlaces:0,potentialHelpPoints:0,longestLowActivityMeters:1000}),evidence(b,{openPlaces:8,potentialHelpPoints:2,staffedPlaceProxy:8,longestLowActivityMeters:0})]);expect(result.outcome).toBe('detour');expect(result.recommendedId).toBeNull();expect(result.selectedId).toBe('a');});
 it('scores live-derived and soon-closing observations from what was seen',()=>{const a=route(1000,'a'),b=route(1000,'b');for(const changes of [{source:'live' as const},{closingSoon:1}]){const c=compareActivity([a,b],[evidence(a),evidence(b,changes)]);expect(c.outcome).toBe('similar');expect(Object.keys(c.scores)).toHaveLength(2);}});
 it('does not compare observations evaluated at different times',()=>{const a=route(1000,'a'),b=route(1000,'b');expect(compareActivity([a,b],[evidence(a),evidence(b,{checkedAt:'2026-09-09T16:00:00Z'})]).outcome).toBe('insufficient');});
 it('does not call the fastest strongest when a three-route comparison has a small advantage elsewhere',()=>{const a=route(1000,'a'),b={...route(1000,'b'),durationSeconds:650},c={...route(1000,'c'),durationSeconds:700};const result=compareActivity([a,b,c],[evidence(a),evidence(b,{openPlaces:5}),evidence(c,{openPlaces:0,potentialHelpPoints:0,longestLowActivityMeters:1500})]);expect(result.outcome).toBe('similar');expect(result.message).not.toContain('also has the strongest');expect(result.recommendedId).toBeNull();});
 it('handles zero and one candidate without comparative claims',()=>{expect(compareActivity([],[]).outcome).toBe('empty');const r=route();expect(compareActivity([r],[evidence(r)]).outcome).toBe('single');});
 it('calculates actual fixture evidence for the normal and limited journeys',()=>{for(const origin of ['Manyata Tech Park','Sahakar Nagar'] as const){const routes=sampleRouteOptions(origin,'normal');const result=analyzeComparison(routes,plan=>fixtureScans(plan,'normal'),now);expect(result.analyses.every(a=>a.coreComparable)).toBe(true);expect(result.analyses[1].openPlaces!).toBeGreaterThan(result.analyses[0].openPlaces!);const limited=analyzeComparison(routes,plan=>fixtureScans(plan,'limited'),now);expect(limited.analyses.some(a=>!a.coreComparable)).toBe(true);expect(Object.keys(limited.comparison.scores)).toHaveLength(routes.length);}});
});
