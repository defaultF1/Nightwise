import {expect,test} from 'vitest';
import {mapsHandoff,handoffWaypoints} from '../../src/domain/handoff';
import {DEFAULT_JOURNEY} from '../../src/domain/journey';
import type {Route} from '../../src/domain/types';
const journey=DEFAULT_JOURNEY;
test('Google Maps preserves car, motorbike and walking choices',()=>{
 for(const [mode,expected] of [['DRIVE','driving'],['TWO_WHEELER','two-wheeler'],['WALK','walking']] as const){
  expect(new URL(mapsHandoff({...journey,mode})).searchParams.get('travelmode')).toBe(expected);
 }
});
const route:Route={id:'one',label:'Route one',durationSeconds:600,distanceMeters:5000,source:'google',geometryKind:'provider',path:[journey.origin,{latitude:13.07,longitude:77.61},journey.destination]};
test('fastest route opens without stops even when its displayed label changes',()=>{
 expect(new URL(mapsHandoff(journey,{...route,label:'Most active route'},route.id)).searchParams.has('waypoints')).toBe(false);
 expect(new URL(mapsHandoff(journey,route,'another-fastest-id')).searchParams.get('waypoints')?.split('|')).toHaveLength(3);
});
test('selected routes carry up to three ordered road points and exact endpoints',()=>{
 const url=new URL(mapsHandoff(journey,route));
 expect(url.searchParams.get('waypoints')?.split('|')).toHaveLength(3);
 expect(url.searchParams.get('origin')).toBe('13.062827,77.594089');
 expect(url.searchParams.get('destination')).toBe('13.047697,77.619939');
 expect(url.searchParams.has('dir_action')).toBe(false);
 expect(url.toString().length).toBeLessThan(2048);
 const reverse={...journey,origin:journey.destination,destination:journey.origin};
 const reversed=handoffWaypoints(reverse,{...route,path:[...route.path].reverse()});
 const forward=handoffWaypoints(journey,route);
 reversed.forEach((p,i)=>{expect(p.latitude).toBeCloseTo(forward[2-i].latitude,6);expect(p.longitude).toBeCloseTo(forward[2-i].longitude,6);});
});
test('changing the selected alternative changes the outgoing road points',()=>{
 const other={...route,id:'two',path:[journey.origin,{latitude:13.043,longitude:77.60},journey.destination]};
 expect(new URL(mapsHandoff(journey,other)).searchParams.get('waypoints')).not.toBe(new URL(mapsHandoff(journey,route)).searchParams.get('waypoints'));
});
test('invalid, illustrative and stale geometry never transfers road points',()=>{
 for(const candidate of [{...route,source:'sample' as const},{...route,geometryKind:'illustrative' as const},{...route,path:[]},{...route,path:[{latitude:NaN,longitude:77},journey.destination]},{...route,path:[...route.path].reverse()}])expect(new URL(mapsHandoff(journey,candidate)).searchParams.has('waypoints')).toBe(false);
 expect(new URL(mapsHandoff(journey)).searchParams.has('waypoints')).toBe(false);
});
