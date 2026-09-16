import {test,expect} from 'vitest';
import {compareActivity} from '../../src/domain/comparison';
import {groupCounts,groupSummary} from '../../src/domain/category-counts';
import type {ActivityAnalysis,DeduplicatedPlace} from '../../src/domain/activity-types';
import type {Route} from '../../src/domain/types';

const route:Route={id:'a',label:'Fastest',source:'geoapify',geometryKind:'provider',path:[{latitude:13.06,longitude:77.59},{latitude:13.06,longitude:77.60}],distanceMeters:1000,durationSeconds:300};
const p=(id:string,category='store'):DeduplicatedPlace=>({id,name:id,coordinate:route.path[0],categories:[category],sampleIndexes:[0],conflict:false,arrivalMinutes:0,hours:{state:'unknown',closingSoon:false,minutesUntilClose:null,reason:'Opening and closing times were not provided.'}});
const analysis={routeId:'a',source:'live',checkedAt:'2026-09-15T12:00:00+05:30',distanceMeters:1000,scanCoverage:1,hoursCoverage:0,openPlaces:0,places:[p('s'),p('h','hospital'),p('f','gas_station')]} as ActivityAnalysis;
const roads={a:{mainRoadFraction:.6,maneuversPerKm:2}};

test('explicit opt-in uses fixed allocations and reduced credit for default hours',()=>{
 const before=structuredClone(analysis);
 const c=compareActivity([route],[analysis],roads,{allowLive:true,allowEstimates:true});
 expect(c.estimated).toBe(true);expect(c.commonComponents).toEqual(['openDensity','mainRoad','simplicity']);
 expect(c.componentScores.a.openDensity).toBeCloseTo(.7/8.7);
 expect(c.scores.a).toBeCloseTo(25*(.7/8.7)+15*.6+10*.8);
 expect(c.recommendedId).toBeNull();expect(c.selectedId).toBe('a');
 expect(analysis).toEqual(before);
 expect(compareActivity([route],[analysis],roads,{allowLive:true}).scores).toEqual({});
});

test('returned closure overrides default hours and future passing time changes the estimate',()=>{
 const closed={...analysis,places:[{...p('s'),hours:{...p('s').hours,state:'closed' as const}},p('f','gas_station')]};
 expect(compareActivity([route],[closed],roads,{allowLive:true,allowEstimates:true}).componentScores.a.openDensity).toBeCloseTo(.35/8.35);
 const late={...analysis,checkedAt:'2026-09-15T19:59:00+05:30',places:[{...p('s'),arrivalMinutes:2},p('f','gas_station')]};
 expect(compareActivity([route],[late],roads,{allowLive:true,allowEstimates:true}).componentScores.a.openDensity).toBeCloseTo(.35/8.35);
});

test('failed scans, absent listings and switched-off scoring cannot produce an estimated score',()=>{
 for(const a of [{...analysis,scanCoverage:0},{...analysis,places:[]}])expect(compareActivity([route],[a],roads,{allowLive:true,allowEstimates:true}).scores).toEqual({});
 expect(compareActivity([route],[analysis],roads,{allowEstimates:true}).scores).toEqual({});
});

test('unresolved hospital hours stay in found totals without an unknown summary label',()=>{
 const count=groupCounts(analysis,['hospital']);
 expect(count).toMatchObject({total:1,unknown:1,open:0});
 expect(groupSummary(count)).toBe('1 found');
 expect(analysis.places[1].hours.state).toBe('unknown');
});
