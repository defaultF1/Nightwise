import {describe,it,expect} from 'vitest';
import {calendarHours} from '../../server/opening-hours';
import {evaluateObservation,evaluateHours} from '../../src/domain/hours';
import {makeFavourite} from '../../src/domain/favourites';
import {DEFAULT_JOURNEY} from '../../src/domain/journey';
import {compareActivity} from '../../src/domain/comparison';
import {analyzeComparison} from '../../src/domain/analyze-comparison';
import {fixtureScans,fixtureRoadEvidence,TUTORIAL_CHECKED_AT} from '../../src/data/activity-fixtures';
import {sampleRouteOptions} from '../../src/providers/routes';
const at='2026-09-09T15:00:00Z'; // Wednesday 20:30 IST
const point=(day:number,hour:number,minute=0)=>({date:{year:2026,month:9,day},hour,minute});
describe('arrival-time schedules',()=>{
 it('uses Wednesday exceptions and excludes a shop after closing',()=>{
  const h=calendarHours({periods:[{open:point(9,10),close:point(9,21)}]},at);
  const p={id:'p',coordinate:DEFAULT_JOURNEY.origin,categories:['pharmacy'],observedAt:at,calendarHours:h};
  expect(evaluateObservation(p,at,10)).toMatchObject({state:'open',minutesUntilClose:20});
  expect(evaluateObservation(p,at,30).state).toBe('closed');
 });
 it('handles opening after departure and overnight periods',()=>{
  const h=calendarHours({periods:[{open:point(9,21),close:point(10,2)}]},at);
  const p={id:'p',coordinate:DEFAULT_JOURNEY.origin,categories:[],observedAt:at,calendarHours:h};
  expect(evaluateObservation(p,at,10).state).toBe('closed');
  expect(evaluateObservation(p,at,35).state).toBe('open');
 });
 it('keeps missing or malformed dated periods unknown',()=>{
  expect(calendarHours({periods:[{open:point(31,10),close:point(31,21)}]},at)).toBeUndefined();
  expect(calendarHours({},at)).toBeUndefined();
  expect(evaluateHours(undefined,at,15).state).toBe('unknown');
 });
 it('distinguishes a current observation from an arrival forecast',()=>{
  const p={id:'p',coordinate:DEFAULT_JOURNEY.origin,categories:[],observedAt:at,currentHours:{openNow:true,observedAt:at}};
  expect(evaluateObservation(p,at).state).toBe('open');
  expect(evaluateObservation(p,at,10).state).toBe('unknown');
 });
 it('uses the right day for weekly hours after midnight',()=>{
  expect(evaluateHours({timeZone:'Asia/Kolkata',periods:[{openDay:4,openMinute:0,closeDay:4,closeMinute:60}]},'2026-09-09T18:20:00Z',20)).toMatchObject({state:'open',minutesUntilClose:50});
 });
});
it('saves only a user label and ID for a Google favourite',()=>{
 const p=makeFavourite('Office',{...DEFAULT_JOURNEY.origin,name:'Google business',address:'Provider address',placeId:'abc'});
 expect(p).toMatchObject({label:'Office',placeId:'abc'});expect(p).not.toHaveProperty('point');expect(JSON.stringify(p)).not.toContain('Provider address');
});
it('respects a fastest-only preference without hiding alternatives',()=>{
 const routes=sampleRouteOptions('AEOS','normal');
 const a=analyzeComparison(routes,p=>fixtureScans(p,'normal'),TUTORIAL_CHECKED_AT,fixtureRoadEvidence(routes,'normal'));
 const c=compareActivity(routes,a.analyses,fixtureRoadEvidence(routes,'normal'),{maxExtraMinutes:0});
 expect(c.selectedId).toBe(c.fastestId);expect(c.rankedIds).toHaveLength(routes.length);
});
