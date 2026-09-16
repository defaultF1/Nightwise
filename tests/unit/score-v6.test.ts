import {expect,test} from 'vitest';
import {compareActivity,componentValues,densityValue,WEIGHTS,WALK_WEIGHTS} from '../../src/domain/comparison';
import type {ActivityAnalysis,DeduplicatedPlace} from '../../src/domain/activity-types';
import type {Route} from '../../src/domain/types';
const route:Route={id:'a',label:'A',source:'geoapify',geometryKind:'provider',distanceMeters:1000,durationSeconds:600,path:[{latitude:13.06,longitude:77.59},{latitude:13.06,longitude:77.60}]};
function listing(id:string,index:number,known=false,category='store'):DeduplicatedPlace{return {id,coordinate:route.path[0],categories:[category],sampleIndexes:[index],conflict:false,arrivalMinutes:0,hours:{state:known?'open':'unknown',closingSoon:false,minutesUntilClose:null,reason:'Opening and closing times were not provided.'}};}
function analysis(places:DeduplicatedPlace[]):ActivityAnalysis{return {routeId:'a',source:'live',checkedAt:'2026-09-16T12:00:00+05:30',distanceMeters:1000,scanCoverage:1,hoursCoverage:places.length?places.filter(p=>p.hours.state!=='unknown').length/places.length:1,activityCoverage:1,openPlaces:places.filter(p=>p.hours.state==='open').length,closedPlaces:0,unknownHours:places.filter(p=>p.hours.state==='unknown').length,potentialHelpPoints:0,staffedPlaceProxy:0,openTransportPoints:0,closingSoon:0,longestHelpGapMeters:null,longestObservedHelpGapMeters:1000,longestLowActivityMeters:null,longestObservedLowActivityMeters:1000,lowActivityOpenThreshold:2,totalLowActivityMeters:null,totalObservedLowActivityMeters:1000,segments:Array.from({length:5},(_,i)=>({fromMeters:i*200,toMeters:(i+1)*200,state:'unknown' as const})),places,limitations:[],coreComparable:false};}
const score=(a:ActivityAnalysis,mode:'WALK'|'DRIVE'='WALK')=>compareActivity([route],[a],{}, {mode,allowLive:true,allowEstimates:true});

test('one available signal never turns a walking route into 100/100',()=>{
 const a={...analysis(Array.from({length:100},(_,i)=>listing(String(i),0))),segments:[],potentialHelpPoints:null,staffedPlaceProxy:null,openTransportPoints:null};
 const result=score(a);
 expect(result.scores.a).toBeGreaterThan(0);expect(result.scores.a).toBeLessThan(30);
 expect(result.weights).toEqual(WALK_WEIGHTS);
 expect(Math.round(result.scores.a)).not.toBe(100);
});
test('busy routes continue to differ beyond the old eight-per-kilometre ceiling',()=>{
 expect(densityValue(40)).toBeGreaterThan(densityValue(16));expect(densityValue(16)).toBeGreaterThan(densityValue(8));
 expect(densityValue(8)).toBe(.5);expect(densityValue(1000)).toBeLessThan(1);
});
test('busy estimated listings can support activity without producing a perfect total or recommendation',()=>{
 const a=analysis(Array.from({length:120},(_,i)=>listing(String(i),i%6)));
 const c=score(a);expect(c.componentScores.a.openDensity).toBeGreaterThan(.35);expect(c.componentScores.a.openDensity).toBeLessThan(1);expect(c.componentScores.a.gapContinuity).toBe(1);
 expect(c.scores.a).toBeLessThan(50);expect(c.estimated).toBe(true);expect(c.recommendedId).toBeNull();
});
test('places spread along the route beat the same count clustered at one end',()=>{
 const cluster=analysis(Array.from({length:12},(_,i)=>listing(String(i),0)));
 const spread=analysis(Array.from({length:12},(_,i)=>listing(String(i),i%6)));
 expect(score(spread).scores.a).toBeGreaterThan(score(cluster).scores.a);
 expect(score(spread).componentScores.a.openDensity).toBeCloseTo(score(cluster).componentScores.a.openDensity!,8);
});
test('scheduled openings earn more than defaults; duplicates and closing-soon places add no credit',()=>{
 const assumed=analysis([listing('a',0),listing('b',3)]);
 const supplied={...assumed,places:assumed.places.map(p=>({...p,hours:{...p.hours,state:'open' as const}}))};
 expect(score(supplied).scores.a).toBeGreaterThan(score(assumed).scores.a);
 const duplicate={...assumed,places:[...assumed.places,assumed.places[0]]};expect(score(duplicate).scores.a).toBeCloseTo(score(assumed).scores.a);
 const closing={...assumed,places:assumed.places.map(p=>({...p,hours:{...p.hours,state:'open' as const,closingSoon:true}}))};
 expect(score(closing).componentScores.a.openDensity).toBe(0);
 expect(assumed.places[0].hours.state).toBe('unknown');
});
test('unknown hospital hours never imply an open help point',()=>{
 const a=analysis([listing('hospital',0,false,'hospital'),listing('shop',1)]);
 expect(score(a).componentScores.a.helpDensity).toBe(0);
 const known={...a,places:[listing('hospital',0,true,'hospital'),listing('shop',1)]};
 expect(score(known).componentScores.a.helpDensity).toBeGreaterThan(0);
});
test('scan coverage cannot improve a score and perfect main-road data cannot improve walking',()=>{
 const a=analysis([listing('shop',0)]);
 expect(score({...a,scanCoverage:.85}).scores.a).toBeLessThan(score(a).scores.a);
 const c=compareActivity([route],[a],{a:{mainRoadFraction:1}}, {allowLive:true,allowEstimates:true,mode:'WALK'});
 expect(c.scores.a).toBe(score(a).scores.a);expect(c.commonComponents).not.toContain('mainRoad');
 expect(Object.values(WEIGHTS).reduce((s,n)=>s+n,0)).toBe(100);expect(Object.values(WALK_WEIGHTS).reduce((s,n)=>s+n,0)).toBe(100);
});
test('short routes have a 500-metre density floor and invalid lengths never score',()=>{
 const a=analysis([listing('s',0,true)]);
 expect(componentValues({...a,distanceMeters:50}).openDensity).toBe(componentValues({...a,distanceMeters:500}).openDensity);
 for(const distanceMeters of [0,NaN,Infinity,-1])expect(componentValues({...a,distanceMeters})).toEqual({});
});

test('estimated credit is applied to listings once before saturation',()=>{
 const a=analysis(Array.from({length:8},(_,i)=>listing(String(i),i%6)));
 const c=score(a);
 expect(c.componentScores.a.openDensity).toBeCloseTo(2.8/(2.8+8));
 const supplied=analysis(a.places.map(p=>({...p,hours:{...p.hours,state:'open' as const}})));
 expect(score(supplied).componentScores.a.openDensity).toBeGreaterThan(c.componentScores.a.openDensity!);
});

test('well-distributed estimated shops are not all treated as a continuous empty stretch',()=>{
 // Three listings per checkpoint supply 2.1 weighted listings per interval.
 const a=analysis(Array.from({length:18},(_,i)=>listing(String(i),i%6)));
 expect(score(a).componentScores.a.gapContinuity).toBe(1);
 const clustered={...a,places:a.places.map(p=>({...p,sampleIndexes:[0]}))};
 expect(score(clustered).componentScores.a.gapContinuity).toBeLessThan(.25);
});

test('unmapped roads do not manufacture a zero main-road observation',()=>{
 const a=analysis([listing('s',0,true)]);
 expect(componentValues(a,{mainMeters:0,internalMeters:0,unknownMeters:1000}).mainRoad).toBeUndefined();
 expect(componentValues(a,{mainMeters:0,internalMeters:100,unknownMeters:900}).mainRoad).toBeUndefined();
 expect(componentValues(a,{mainMeters:0,internalMeters:1000,unknownMeters:0}).mainRoad).toBe(0);
 expect(componentValues(a,{mainMeters:600,internalMeters:0,unknownMeters:400}).mainRoad).toBe(.6);
});
