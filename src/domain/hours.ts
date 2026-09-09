import type { HoursEvaluation, OpeningHours, PlaceObservation } from './activity-types';

export const EVIDENCE_MAX_AGE_MS=15*60_000;
const WEEK=7*1440;
const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const unknown=():HoursEvaluation=>({state:'unknown',closingSoon:false,minutesUntilClose:null});
export function isFresh(observedAt:string,checkedAt:string):boolean{
  const age=Date.parse(checkedAt)-Date.parse(observedAt);
  return Number.isFinite(age)&&age>=-60_000&&age<=EVIDENCE_MAX_AGE_MS;
}
export function evaluateObservation(place: PlaceObservation, at: string, arrivalMinutes = 0): HoursEvaluation {
  if (!place.currentHours) return evaluateHours(place.hours, at, arrivalMinutes);
  const h = place.currentHours;
  if (!isFresh(h.observedAt, at)) return unknown();
  if (!h.openNow) return { state: 'closed', closingSoon: false, minutesUntilClose: null };
  const remaining = (Date.parse(h.nextCloseTime ?? '') - Date.parse(at)) / 60000;
  // An openNow value alone cannot establish availability through this journey.
  if (!Number.isFinite(remaining) || remaining <= 0) return unknown();
  return { state: 'open', closingSoon: remaining <= arrivalMinutes + 15, minutesUntilClose: remaining };
}
export function evaluateHours(hours:OpeningHours|undefined,at:string,arrivalMinutes=0):HoursEvaluation {
  if(!hours||!Number.isFinite(Date.parse(at))||!Number.isFinite(arrivalMinutes)||arrivalMinutes<0)return unknown();
  let local:number;
  try{
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:hours.timeZone,weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(at));
    const value=(type:string)=>parts.find(p=>p.type===type)?.value??'';
    const day=days.indexOf(value('weekday'));
    if(day<0)return unknown();local=day*1440+Number(value('hour'))*60+Number(value('minute'));
  }catch{return unknown();}
  if(hours.alwaysOpen)return {state:'open',closingSoon:false,minutesUntilClose:null};
  if(!hours.periods?.length)return unknown();
  const intervals:{start:number;end:number}[]=[];
  for(const period of hours.periods){
    const {openDay,openMinute,closeDay,closeMinute}=period;
    if(![openDay,closeDay].every(n=>Number.isInteger(n)&&n>=0&&n<7)||![openMinute,closeMinute].every(n=>Number.isInteger(n)&&n>=0&&n<1440))return unknown();
    const start=openDay*1440+openMinute;let end=closeDay*1440+closeMinute;
    if(end===start)return unknown();
    if(end<start)end+=WEEK;
    for(const shift of [-WEEK,0,WEEK])intervals.push({start:start+shift,end:end+shift});
  }
  intervals.sort((a,b)=>a.start-b.start);
  const merged:typeof intervals=[];
  for(const interval of intervals){const last=merged.at(-1);if(last&&interval.start<=last.end)last.end=Math.max(last.end,interval.end);else merged.push({...interval});}
  const match=merged.find(i=>i.start<=local&&local<i.end);
  if(!match)return {state:'closed',closingSoon:false,minutesUntilClose:null};
  const until=match.end-local;
  return {state:'open',closingSoon:until<=arrivalMinutes+15,minutesUntilClose:until};
}
