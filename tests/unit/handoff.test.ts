import {expect,test} from 'vitest';
import {mapsHandoff,handoffWaypoints} from '../../src/domain/handoff';
import {DEFAULT_JOURNEY} from '../../src/domain/journey';
import type {Route} from '../../src/domain/types';
const journey=DEFAULT_JOURNEY;
const places=(url:string)=>new URL(url).searchParams.get('places')!.split(';');
test('handoff always opens the Mappls direction preview with exact endpoints',()=>{
 for(const mode of ['DRIVE','TWO_WHEELER','WALK'] as const){
  const url=new URL(mapsHandoff({...journey,mode}));
  expect(url.origin+url.pathname).toBe('https://mappls.com/direction');
  const points=url.searchParams.get('places')!.split(';');
  expect(points[0]).toBe('13.062827,77.594089');
  expect(points.at(-1)).toBe('13.047697,77.619939');
 }
});
const route:Route={id:'one',label:'Route one',durationSeconds:600,distanceMeters:5000,source:'mappls',geometryKind:'provider',path:[journey.origin,{latitude:13.07,longitude:77.61},journey.destination]};
test('fastest route opens without stops even when its displayed label changes',()=>{
 expect(places(mapsHandoff(journey,{...route,label:'Most active route'},route.id))).toHaveLength(2);
 expect(places(mapsHandoff(journey,route,'another-fastest-id'))).toHaveLength(5);
});
test('selected routes carry up to three ordered road points and exact endpoints',()=>{
 const points=places(mapsHandoff(journey,route));
 expect(points).toHaveLength(5);
 expect(points[0]).toBe('13.062827,77.594089');
 expect(points.at(-1)).toBe('13.047697,77.619939');
 expect(mapsHandoff(journey,route).length).toBeLessThan(2048);
 const reverse={...journey,origin:journey.destination,destination:journey.origin};
 const reversed=handoffWaypoints(reverse,{...route,path:[...route.path].reverse()});
 const forward=handoffWaypoints(journey,route);
 reversed.forEach((p,i)=>{expect(p.latitude).toBeCloseTo(forward[2-i].latitude,6);expect(p.longitude).toBeCloseTo(forward[2-i].longitude,6);});
});
test('changing the selected alternative changes the outgoing road points',()=>{
 const other={...route,id:'two',path:[journey.origin,{latitude:13.043,longitude:77.60},journey.destination]};
 expect(places(mapsHandoff(journey,other)).join(';')).not.toBe(places(mapsHandoff(journey,route)).join(';'));
});
test('invalid, illustrative and stale geometry never transfers road points',()=>{
 for(const candidate of [{...route,source:'sample' as const},{...route,geometryKind:'illustrative' as const},{...route,path:[]},{...route,path:[{latitude:NaN,longitude:77},journey.destination]},{...route,path:[...route.path].reverse()}])expect(places(mapsHandoff(journey,candidate))).toHaveLength(2);
 expect(places(mapsHandoff(journey))).toHaveLength(2);
});
