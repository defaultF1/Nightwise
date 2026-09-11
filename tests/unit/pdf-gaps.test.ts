import {describe,it,expect} from 'vitest';
import {analyzeRoute,buildQueryPlan} from '../../src/domain/activity';
import {componentValues,compareActivity} from '../../src/domain/comparison';
import {gapMarkers} from '../../src/domain/gap-markers';
import {parseRoutes} from '../../server/google';
import {createRoadAnalyzer} from '../../src/domain/roads';
import type {Route} from '../../src/domain/types';
import type {NearbyScan} from '../../src/domain/activity-types';
const now='2026-09-09T15:00:00Z';
const p=(m:number)=>({latitude:13,longitude:77.6+m/108347});
const route:Route={id:'a',label:'A',path:[p(0),p(1000)],distanceMeters:1000,durationSeconds:600,source:'sample',geometryKind:'illustrative'};
function evidence(count:number,category='cafe',unknown=false){
 const plan=buildQueryPlan([route]);
 const scans:NearbyScan[]=plan.queries.map((q,i)=>({queryId:q.id,observedAt:now,status:'ok',places:Array.from({length:count},(_,j)=>({id:`${i}-${j}`,coordinate:q.coordinate,categories:[category],hours:unknown?undefined:{timeZone:'Asia/Kolkata',alwaysOpen:true},observedAt:now}))}));
 return {plan,scans,analysis:analyzeRoute(route,plan,scans,now)};
}
describe('PDF gap completion',()=>{
 it('matches turn geometry to internal roads and withholds unmatched turn evidence',()=>{
  const analyze=createRoadAnalyzer([{id:1,highway:'residential',path:route.path}]);
  const steps=[{distanceMeters:1000,maneuver:'TURN_LEFT',path:route.path}];
  expect(analyze(route.path,steps)).toMatchObject({internalTurns:1,unknownTurns:0});
  expect(analyze(route.path,steps).internalTurnsPerKm).toBeGreaterThan(.99);
  expect(analyze(route.path,[{distanceMeters:1000,maneuver:'TURN_LEFT'}])).toMatchObject({internalTurns:0,unknownTurns:1});
  expect(analyze(route.path,[{distanceMeters:1000,maneuver:'TURN_LEFT'}]).internalTurnsPerKm).toBeUndefined();
 });
 it('retains route step distances and maneuvers from a provider-shaped response',()=>{
  const encode=(points:typeof route.path)=>{let lat=0,lng=0;let text='';for(const point of points){const a=Math.round(point.latitude*1e5),b=Math.round(point.longitude*1e5);for(let value of [a-lat,b-lng]){value=value<0?~(value<<1):value<<1;while(value>=32){text+=String.fromCharCode((32|(value&31))+63);value>>=5;}text+=String.fromCharCode(value+63);}lat=a;lng=b;}return text;};
  const steps=[{distanceMeters:400,navigationInstruction:{maneuver:'STRAIGHT'}},{distanceMeters:600,navigationInstruction:{maneuver:'TURN_LEFT'}}];
  const parsed=parseRoutes({routes:[{duration:'600s',distanceMeters:1000,polyline:{encodedPolyline:encode(route.path)},legs:[{steps}]}]})[0];
  expect(parsed.steps).toEqual([{distanceMeters:400,maneuver:'STRAIGHT'},{distanceMeters:600,maneuver:'TURN_LEFT'}]);expect(parsed.turns).toBe(1);
 });
 it('distinguishes sparse activity from two open listings and never treats unknown hours as absence',()=>{
  expect(evidence(1).analysis.totalLowActivityMeters).toBeGreaterThan(990);
  expect(evidence(2).analysis.totalLowActivityMeters).toBe(0);
  expect(evidence(1,'cafe',true).analysis.longestLowActivityMeters).toBeNull();
 });
 it('counts staffing categories separately from help points without asserting actual staffing',()=>{
  const a=evidence(2).analysis;
  expect(a.staffedPlaceProxy).toBe(a.openPlaces);expect(a.potentialHelpPoints).toBe(0);
  expect(evidence(2,'transit_station').analysis.staffedPlaceProxy).toBe(0);
 });
 it('finds a help gap even where cafes keep general activity high',()=>{
  const a=evidence(2).analysis;expect(a.longestLowActivityMeters).toBe(0);expect(a.longestHelpGapMeters).toBeGreaterThan(990);
  expect(evidence(2,'gas_station').analysis.longestHelpGapMeters).toBe(0);
 });
 it('unknown scans split help gaps and withhold a whole-route gap claim',()=>{
  const {plan,scans}=evidence(0);scans[2].status='failed';
  const a=analyzeRoute(route,plan,scans,now);expect(a.longestHelpGapMeters).toBeNull();expect(a.longestObservedHelpGapMeters).toBeLessThan(610);
 });
 it('penalizes a long help gap at equal counts and turns onto internal roads at equal total turn rates',()=>{
  const a={...evidence(2,'pharmacy').analysis,longestObservedHelpGapMeters:0};
  expect(componentValues({...a,longestObservedHelpGapMeters:1800}).helpDensity).toBeLessThan(componentValues(a).helpDensity!);
  expect(componentValues(a,{maneuversPerKm:3,internalTurnsPerKm:3}).simplicity).toBeLessThan(componentValues(a,{maneuversPerKm:3,internalTurnsPerKm:0}).simplicity!);
 });
 it('returns a deterministic full activity ranking independent of input order',()=>{
  const b={...route,id:'b',durationSeconds:650},c={...route,id:'c',durationSeconds:700};
  const a=evidence(2,'pharmacy').analysis;
  const result=compareActivity([c,route,b],[{...a,routeId:'c',openPlaces:0},a,{...a,routeId:'b'}]);
  expect(result.rankedIds).toEqual(['a','b','c']);
  expect(compareActivity([route,b],[a,{...a,routeId:'b',coreComparable:false}]).rankedIds).toEqual(['a','b']);
 });
 it('does not apply internal-road adjustment unequally when one road input is missing',()=>{
  const a=evidence(2).analysis,b={...route,id:'b'};
  const result=compareActivity([route,b],[a,{...a,routeId:'b'}],{a:{maneuversPerKm:3,internalTurnsPerKm:3},b:{maneuversPerKm:3}});
  expect(result.scores.a).toBe(result.scores.b);
 });
 it('groups low-activity stretches and positions a single label along their geometry',()=>{
  const a=evidence(0).analysis,labels=gapMarkers(route,a);
  expect(labels).toHaveLength(1);expect(labels[0].label).toContain('Low activity');expect(labels[0].longitude).toBeCloseTo(p(500).longitude,4);
  expect(gapMarkers(route,evidence(2).analysis)).toEqual([]);
  expect(gapMarkers(route,{...a,routeId:'unrelated'})).toEqual([]);
 });
});
