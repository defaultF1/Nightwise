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
test('Mappls gets the chosen origin, ordered route guides and destination rather than only current GPS',()=>{
 const geo={...route,source:'geoapify' as const};
 const fastest=new URL(mapsHandoff(journey,geo,geo.id,'mappls'));
 expect(fastest.origin+fastest.pathname).toBe('https://mappls.com/direction');
 expect(fastest.searchParams.get('places')!.split(';')).toHaveLength(5);
 const alternative=new URL(mapsHandoff(journey,geo,'other','mappls'));
 const points=alternative.searchParams.get('places')!.split(';');
 expect(points).toHaveLength(5);expect(points[0]).toBe('13.062827,77.594089');expect(points.at(-1)).toBe('13.047697,77.619939');
 expect(points.slice(1,-1)).toEqual(handoffWaypoints(journey,geo).map(p=>`${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`));
 expect(alternative.searchParams.get('mode')).toBe('driving');
 expect(alternative.searchParams.get('region')).toBe('ind');
 expect(alternative.searchParams.has('isNav')).toBe(false);
 expect(new URL(mapsHandoff(journey,{...geo,path:[...geo.path].reverse()},'other','mappls')).searchParams.get('places')!.split(';')).toHaveLength(2);
});

test('Mappls route sharing carries walking and motorbike modes with all ordered points',()=>{
 for(const [mode,expected] of [['DRIVE','driving'],['TWO_WHEELER','biking'],['WALK','walking']] as const){
  for(const fastestId of [route.id,'other']){
   const url=new URL(mapsHandoff({...journey,mode},{...route,source:'geoapify'},fastestId,'mappls'));
   expect(url.searchParams.get('mode')).toBe(expected);
   const points=url.searchParams.get('places')!.split(';');
   expect(points).toHaveLength(5);
   expect(points[0]).toBe('13.062827,77.594089');expect(points.at(-1)).toBe('13.047697,77.619939');
  }
 }
});

test('walking Google handoff keeps exact endpoints and uses stops only for alternatives',()=>{
 const walk={...journey,mode:'WALK' as const};
 for(const fastestId of [route.id,'other']){
  const url=new URL(mapsHandoff(walk,{...route,source:'geoapify'},fastestId));
  expect(url.searchParams.get('travelmode')).toBe('walking');
  expect(url.searchParams.get('origin')).toBe('13.062827,77.594089');
  expect(url.searchParams.get('destination')).toBe('13.047697,77.619939');
  expect(url.searchParams.has('waypoints')).toBe(fastestId!==route.id);
 }
});
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
