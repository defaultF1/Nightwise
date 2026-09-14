import {it,expect} from 'vitest';
import {parseScan} from '../../server/google';
import {evaluateObservation} from '../../src/domain/hours';
import {placePins,visiblePlacePins,PIN_COLORS} from '../../src/maps/pins';
import {SERVICE_REGIONS,regionForPoint} from '../../src/domain/journey';
import type {ActivityAnalysis} from '../../src/domain/activity-types';
import {assumedShopHours} from '../../src/domain/assumed-hours';
const at='2026-09-14T17:00:00Z';
const allDay={periods:[{open:{day:0,hour:0,minute:0}}]};
const parse=(extra:object={})=>parseScan({places:[{id:'h',location:SERVICE_REGIONS[0].center,types:['hospital'],businessStatus:'OPERATIONAL',currentOpeningHours:allDay,regularOpeningHours:allDay,...extra}]},'q',at).scan.places[0];
it('retains explicit 24-hour current hours through analysis to hospital marker status',()=>{
 const p=parse();const hours=evaluateObservation(p,at,25);
 expect(hours).toMatchObject({state:'open',open24Hours:true,basis:'current',closingSoon:false,minutesUntilClose:null});
 const analysis={checkedAt:at,places:[{...p,hours,conflict:false}]} as unknown as ActivityAnalysis;
 expect(placePins(analysis,true)[0]).toMatchObject({kind:'hospital',status:'Open 24 hours'});
 expect(PIN_COLORS.hospital).not.toBe(PIN_COLORS.medical);
});
it('never promotes a holiday, temporary closure, stale or unknown hospital to 24 hours',()=>{
 for(const p of [parse({currentOpeningHours:{periods:[]}}),parse({businessStatus:'CLOSED_TEMPORARILY'}),parse({currentOpeningHours:undefined,regularOpeningHours:undefined}),parse({currentOpeningHours:{periods:[{open:{day:0,hour:0,truncated:true}}]}})])expect(evaluateObservation(p,at,25).open24Hours).not.toBe(true);
 expect(evaluateObservation(parse(), '2026-09-14T18:00:00Z',25).state).toBe('unknown');
 expect(evaluateObservation(parse({currentOpeningHours:{...allDay,openNow:false}}),at,25).state).toBe('unknown');
 expect(evaluateObservation(parse({currentOpeningHours:undefined}),at,25)).toMatchObject({state:'open',open24Hours:true,basis:'regular'});
 const p=parse({currentOpeningHours:undefined,regularOpeningHours:undefined,types:['hospital','pharmacy']});
 expect(assumedShopHours({...p,hours:evaluateObservation(p,at),sampleIndexes:[],conflict:false},at)).toBeNull();
});
it('merges continuous full-day periods but retains a genuine closed day',()=>{
 const periods=Array.from({length:7},(_,i)=>({open:{date:{year:2026,month:9,day:14+i},hour:0},close:{date:{year:2026,month:9,day:15+i},hour:0}}));
 expect(evaluateObservation(parse({currentOpeningHours:{periods}}),at,25).open24Hours).toBe(true);
 expect(evaluateObservation(parse({currentOpeningHours:{periods:periods.filter((_,i)=>i!==2)}}),at,25).open24Hours).not.toBe(true);
 const weekly=Array.from({length:7},(_,day)=>({open:{day,hour:0},close:{day:(day+1)%7,hour:0}}));
 expect(evaluateObservation(parse({currentOpeningHours:undefined,regularOpeningHours:{periods:weekly}}),at,25)).toMatchObject({state:'open',open24Hours:true,basis:'regular'});
});
it('reserves visible space for all four categories on dense routes and fills the marker limit',()=>{
 const places=['store','pharmacy','hospital','gas_station'].flatMap(category=>Array.from({length:40},(_,i)=>({id:`${category}-${i}`,coordinate:SERVICE_REGIONS[0].center,categories:[category],hours:{state:'open'},conflict:false})));
 const pins=visiblePlacePins({places} as unknown as ActivityAnalysis,60,true);
 expect(pins).toHaveLength(60);
 for(const kind of ['shop','medical','hospital','fuel'])expect(pins.filter(p=>p.kind===kind)).toHaveLength(15);
 expect(visiblePlacePins({places:places.filter(p=>p.categories[0]==='hospital')} as unknown as ActivityAnalysis,24,true)).toHaveLength(24);
});
it('accepts both 20 km regions without admitting cross-city or distant coordinates',()=>{
 for(const r of SERVICE_REGIONS){
  expect(r.radiusMeters).toBe(20000);
  expect(regionForPoint({...r.center,latitude:r.center.latitude+19000/111195})?.id).toBe(r.id);
  expect(regionForPoint({...r.center,latitude:r.center.latitude+21000/111195})).toBeUndefined();
 }
});
