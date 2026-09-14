import {describe,it,expect} from 'vitest';
import {parseScan,PLACE_FIELDS} from '../../server/google';
import {regularHours} from '../../server/opening-hours';
import {evaluateObservation} from '../../src/domain/hours';
const at='2026-09-09T15:00:00Z'; // Wednesday 20:30 IST
const weekly={periods:Array.from({length:7},(_,day)=>({open:{day,hour:9},close:{day,hour:22}})),weekdayDescriptions:['Wednesday: 9:00 AM – 10:00 PM']};
const parse=(extra:any={})=>parseScan({places:[{id:'p',displayName:{text:'Test pharmacy'},location:{latitude:13.06,longitude:77.6},types:['pharmacy'],businessStatus:'OPERATIONAL',regularOpeningHours:weekly,...extra}]},'q',at).scan.places[0];
const date=(day:number,hour:number)=>({date:{year:2026,month:9,day},hour});
it('uses fresh schedules for a future departure without treating them as stale',()=>{
 const future='2026-09-09T17:00:00Z'; // 22:30 IST, after the weekly closing time.
 expect(evaluateObservation(parse(),future,0,at)).toMatchObject({state:'closed',basis:'regular'});
 expect(evaluateObservation(parse(),future).state).toBe('unknown');
 const onlyNow=parse({regularOpeningHours:undefined,currentOpeningHours:{openNow:true}});
 expect(evaluateObservation(onlyNow,future,0,at).state).toBe('unknown');
});
describe('Google weekly schedules and exceptions',()=>{
 it('requests both full schedule objects, without a wildcard',()=>{expect(PLACE_FIELDS.split(',')).toContain('places.currentOpeningHours');expect(PLACE_FIELDS.split(',')).toContain('places.regularOpeningHours');expect(PLACE_FIELDS).not.toContain('*');});
 it('uses regular hours as an explicitly labelled fallback',()=>{expect(evaluateObservation(parse(),at,20)).toMatchObject({state:'open',basis:'regular',minutesUntilClose:70});});
 it('supports Wednesday changing to 10 AM–9 PM',()=>{const changed={periods:weekly.periods.map(p=>p.open.day===3?{open:{day:3,hour:10},close:{day:3,hour:21}}:p)};expect(evaluateObservation(parse({regularOpeningHours:changed}),at,20)).toMatchObject({state:'open',minutesUntilClose:10,closingSoon:true});expect(evaluateObservation(parse({regularOpeningHours:changed}),at,30).state).toBe('closed');});
 it('supports a weekly Wednesday closure without guessing other missing data',()=>{const p=parse({regularOpeningHours:{periods:weekly.periods.filter(p=>p.open.day!==3)}});expect(evaluateObservation(p,at,10)).toMatchObject({state:'closed',basis:'regular'});expect(evaluateObservation(parse({regularOpeningHours:undefined}),at,10).state).toBe('unknown');});
 it('current dated holiday closure overrides regular opening',()=>{const p=parse({currentOpeningHours:{periods:[],specialDays:[{date:{year:2026,month:9,day:9}}],weekdayDescriptions:['Wednesday: Closed']}});expect(evaluateObservation(p,at,10)).toMatchObject({state:'closed',basis:'current'});expect(p.schedule?.specialDates).toEqual(['2026-09-09']);expect(p.schedule?.currentWeek).toEqual(['Wednesday: Closed']);});
 it('uses special current closing time instead of the usual 10 PM',()=>{const p=parse({currentOpeningHours:{periods:[{open:date(9,10),close:date(9,21)}]}});expect(evaluateObservation(p,at,40)).toMatchObject({state:'closed',basis:'current'});});
 it('does not replace malformed current or flagged special hours with a weekly guess',()=>{expect(evaluateObservation(parse({currentOpeningHours:{periods:[{open:date(9,10)}]}}),at,10).state).toBe('unknown');expect(evaluateObservation(parse({currentOpeningHours:{specialDays:[{date:{year:2026,month:9,day:9}}]}}),at,10).state).toBe('unknown');});
 it('current status wins and a weekly conflict remains unknown',()=>{expect(evaluateObservation(parse({currentOpeningHours:{openNow:false}}),at,10).state).toBe('unknown');expect(evaluateObservation(parse({currentOpeningHours:{openNow:true,nextCloseTime:'2026-09-09T15:20:00Z'}}),at,10)).toMatchObject({state:'open',basis:'current',minutesUntilClose:10});expect(evaluateObservation(parse({currentOpeningHours:{openNow:true,nextCloseTime:'2026-09-09T15:20:00Z'}}),at,30).state).toBe('unknown');});
 it('keeps a place closed before its next known opening without guessing after it',()=>{const p=parse({currentOpeningHours:{openNow:false,nextOpenTime:'2026-09-09T15:30:00Z'}});expect(evaluateObservation(p,at,20)).toMatchObject({state:'closed',basis:'current'});expect(evaluateObservation(p,at,35).state).toBe('unknown');});
 it('recognizes 24-hour and explicitly never-open regular schedules',()=>{expect(regularHours({periods:[{open:{day:0,hour:0}}]})).toMatchObject({alwaysOpen:true});expect(evaluateObservation(parse({regularOpeningHours:{periods:[]}}),at,10)).toMatchObject({state:'closed',basis:'regular'});expect(regularHours({periods:[{open:{day:3,hour:9}}]})).toBeUndefined();});
 it('handles overnight hours and Sunday wrap-around',()=>{const p=parse({regularOpeningHours:{periods:[{open:{day:3,hour:21},close:{day:4,hour:2}}]}});expect(evaluateObservation(p,at,60)).toMatchObject({state:'open',basis:'regular',minutesUntilClose:270});const sun='2026-09-12T19:00:00Z';const weekend={...parse({regularOpeningHours:{periods:[{open:{day:6,hour:22},close:{day:0,hour:2}}]}}),observedAt:sun};expect(evaluateObservation(weekend,sun,10).state).toBe('open');});
 it('excludes stale schedules and closed businesses',()=>{expect(evaluateObservation(parse(), '2026-09-09T16:00:00Z',10).state).toBe('unknown');expect(evaluateObservation(parse({businessStatus:'CLOSED_TEMPORARILY'}),at,10)).toMatchObject({state:'closed',basis:'business-status'});});
});
