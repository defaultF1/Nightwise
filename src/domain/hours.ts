import type { HoursEvaluation, OpeningHours, PlaceObservation } from './activity-types';

export const EVIDENCE_MAX_AGE_MS=15*60_000;
const WEEK=7*1440;
const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const unknown=(reason?:string):HoursEvaluation=>({state:'unknown',closingSoon:false,minutesUntilClose:null,...(reason?{reason}:{})});
export function isFresh(observedAt:string,checkedAt:string):boolean{
  const age=Date.parse(checkedAt)-Date.parse(observedAt);
  return Number.isFinite(age)&&age>=-60_000&&age<=EVIDENCE_MAX_AGE_MS;
}
export function evaluateObservation(place: PlaceObservation, at: string, arrivalMinutes = 0): HoursEvaluation {
  if (!Number.isFinite(arrivalMinutes) || arrivalMinutes < 0 || !Number.isFinite(Date.parse(at))) return unknown();
  if (!isFresh(place.observedAt,at)) return unknown('These opening hours need a fresh check.');
  const arrival = Date.parse(at) + arrivalMinutes * 60000;
  if(['CLOSED_TEMPORARILY','CLOSED_PERMANENTLY','FUTURE_OPENING'].includes(place.businessStatus??''))return {state:'closed',closingSoon:false,minutesUntilClose:null,basis:'business-status',reason:'Google lists this business as temporarily closed, permanently closed or not yet open.'};
  if (place.calendarHours) {
    const h = place.calendarHours;
    if (arrival < Date.parse(h.from) || arrival >= Date.parse(h.until)) return unknown();
    const period = h.periods.find(p => Date.parse(p.from) <= arrival && arrival < Date.parse(p.until));
    if (!period) return {state:'closed',closingSoon:false,minutesUntilClose:null,basis:'current'};
    const remaining = (Date.parse(period.until)-arrival)/60000;
    return {state:'open',closingSoon:remaining<=15,minutesUntilClose:remaining,basis:'current'};
  }
  const h = place.currentHours;
  if(h){
    if(!isFresh(h.observedAt,at))return unknown('These opening hours need a fresh check.');
    if(!h.openNow){
      const opens=Date.parse(h.nextOpenTime??'');
      if(arrivalMinutes===0||Number.isFinite(opens)&&arrival<opens)return {state:'closed',closingSoon:false,minutesUntilClose:null,basis:'current'};
      if(Number.isFinite(opens))return unknown('Opening is listed, but the closing time after arrival is unavailable.');
    }else{
      const remaining=(Date.parse(h.nextCloseTime??'')-Date.parse(at))/60000;
      if(Number.isFinite(remaining))return remaining>arrivalMinutes?{state:'open',closingSoon:remaining<=arrivalMinutes+15,minutesUntilClose:remaining-arrivalMinutes,basis:'current'}:unknown('The current opening period ends before you pass; later hours are unavailable.');
      if(arrivalMinutes===0)return {state:'open',closingSoon:false,minutesUntilClose:null,basis:'current'};
    }
  }
  if(place.currentScheduleInvalid)return unknown('Google returned an incomplete current schedule.');
  // Do not let typical weekly hours override a reported special day, including overnight carry-over.
  const day=new Date(arrival+330*60000).toISOString().slice(0,10);
  const previousDay=new Date(arrival+330*60000-86400000).toISOString().slice(0,10);
  if(place.schedule?.specialDates.some(d=>d===day||d===previousDay))return unknown('Special hours are flagged around this date, but usable times are missing.');
  if(h&&place.hours){
    const typicalNow=evaluateHours(place.hours,at);
    if(typicalNow.state!=='unknown'&&(typicalNow.state==='open')!==h.openNow)return unknown('Current status differs from the regular weekly schedule.');
  }
  const typical=evaluateHours(place.hours,at,arrivalMinutes);
  return place.hoursOrigin==='google-regular'&&typical.state!=='unknown'?{...typical,basis:'regular',reason:'Based on regular weekly hours; special-day changes are not confirmed.'}:typical.state==='unknown'?unknown('Google did not return usable opening and closing times.'):typical;
}
export function evaluateHours(hours:OpeningHours|undefined,at:string,arrivalMinutes=0):HoursEvaluation {
  if(!hours||!Number.isFinite(Date.parse(at))||!Number.isFinite(arrivalMinutes)||arrivalMinutes<0)return unknown();
  let local:number;
  try{
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:hours.timeZone,weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(Date.parse(at)+arrivalMinutes*60000));
    const value=(type:string)=>parts.find(p=>p.type===type)?.value??'';
    const day=days.indexOf(value('weekday'));
    if(day<0)return unknown();local=day*1440+Number(value('hour'))*60+Number(value('minute'));
  }catch{return unknown();}
  if(hours.alwaysOpen)return {state:'open',closingSoon:false,minutesUntilClose:null};
  if(hours.alwaysClosed)return {state:'closed',closingSoon:false,minutesUntilClose:null};
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
  return {state:'open',closingSoon:until<=15,minutesUntilClose:until};
}
