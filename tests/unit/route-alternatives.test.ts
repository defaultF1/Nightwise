import {expect,test} from 'vitest';
import {alternativeProbes,substantialBacktracking} from '../../src/domain/route-alternatives';
import {DEFAULT_JOURNEY} from '../../src/domain/journey';
import type {Route} from '../../src/domain/types';
const a=DEFAULT_JOURNEY.origin,b=DEFAULT_JOURNEY.destination;
const route:Route={id:'r',label:'Route',source:'geoapify',geometryKind:'provider',durationSeconds:500,distanceMeters:3500,path:[a,b]};
test('bounded probes offer two sides and do not alter original road geometry',()=>{
 const before=structuredClone(route);expect(alternativeProbes(route)).toHaveLength(2);expect(route).toEqual(before);
 expect(alternativeProbes({...route,path:[a,{...a,latitude:a.latitude+.001}]})).toEqual([]);
});
test('out-and-back excursions are rejected while a through route remains usable',()=>{
 expect(substantialBacktracking(route)).toBe(false);
 expect(substantialBacktracking({...route,path:[a,b,a,b]})).toBe(true);
});
