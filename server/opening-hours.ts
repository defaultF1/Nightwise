import type { OpeningHours, PlaceObservation, PlaceSchedule } from '../src/domain/activity-types';
// Bengaluru's local calendar is UTC+05:30 throughout the year.
const OFFSET = 330 * 60000;
function pointTime(p: any): number | null {
  const d=p?.date;
  if (!d || !Number.isInteger(d.year) || !Number.isInteger(d.month) || !Number.isInteger(d.day)) return null;
  const hour=p.hour??0,minute=p.minute??0;
  if (!Number.isInteger(hour)||hour<0||hour>23||!Number.isInteger(minute)||minute<0||minute>59) return null;
  const value=Date.UTC(d.year,d.month-1,d.day,hour,minute);
  const date=new Date(value);
  if(date.getUTCFullYear()!==d.year||date.getUTCMonth()!==d.month-1||date.getUTCDate()!==d.day)return null;
  return value-OFFSET;
}
export function calendarHours(hours: any, observedAt: string): PlaceObservation['calendarHours'] {
  if (!Array.isArray(hours?.periods) || !Number.isFinite(Date.parse(observedAt))) return undefined;
  const local=new Date(Date.parse(observedAt)+OFFSET);
  const start=Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate())-OFFSET;
  const end=start+7*86400000;
  const periods: {from:string;until:string}[]=[];
  let alwaysOpen=false;
  for(const p of hours.periods){
    const from=pointTime(p.open),until=pointTime(p.close);
    // Google's documented 24/7 representation. A truncated/date-specific entry is not this sentinel.
    if(hours.periods.length===1&&p.open?.day===0&&(p.open.hour??0)===0&&(p.open.minute??0)===0&&!p.open.date&&!p.open.truncated&&!p.close){
      alwaysOpen=true;
      periods.push({from:new Date(start).toISOString(),until:new Date(end).toISOString()});continue;
    }
    if(from===null||until===null||until<=from)return undefined;
    periods.push({from:new Date(from).toISOString(),until:new Date(until).toISOString()});
  }
  periods.sort((a,b)=>Date.parse(a.from)-Date.parse(b.from));
  const merged:typeof periods=[];
  for(const p of periods){const last=merged.at(-1);if(last&&Date.parse(p.from)<=Date.parse(last.until)){if(Date.parse(p.until)>Date.parse(last.until))last.until=p.until;}else merged.push({...p});}
  alwaysOpen=alwaysOpen||merged.some(p=>Date.parse(p.from)<=start&&Date.parse(p.until)>=end);
  return {from:new Date(start).toISOString(),until:new Date(end).toISOString(),periods:merged,...(alwaysOpen?{alwaysOpen:true}:{})};
}

export function regularHours(hours: any): OpeningHours | undefined {
  if (!Array.isArray(hours?.periods)) return undefined;
  if (!hours.periods.length) return {timeZone:'Asia/Kolkata',alwaysClosed:true};
  const result: OpeningHours = {timeZone:'Asia/Kolkata',periods:[]};
  for (const p of hours.periods) {
    const valid=(v:any)=>v&&Number.isInteger(v.day)&&v.day>=0&&v.day<=6&&Number.isInteger(v.hour??0)&&(v.hour??0)>=0&&(v.hour??0)<24&&Number.isInteger(v.minute??0)&&(v.minute??0)>=0&&(v.minute??0)<60&&!v.truncated;
    if(!valid(p.open))return undefined;
    if(hours.periods.length===1&&p.open.day===0&&(p.open.hour??0)===0&&(p.open.minute??0)===0&&!p.close)return {timeZone:'Asia/Kolkata',alwaysOpen:true};
    if(!valid(p.close))return undefined;
    const openMinute=(p.open.hour??0)*60+(p.open.minute??0),closeMinute=(p.close.hour??0)*60+(p.close.minute??0);
    if(p.open.day===p.close.day&&openMinute===closeMinute)return undefined;
    result.periods!.push({openDay:p.open.day,openMinute,closeDay:p.close.day,closeMinute});
  }
  return result;
}
export function scheduleDetails(current:any,regular:any):PlaceSchedule {
  const descriptions=(h:any)=>Array.isArray(h?.weekdayDescriptions)?h.weekdayDescriptions.filter((v:unknown)=>typeof v==='string').slice(0,7):[];
  const timestamp=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v))?v:undefined;
  const specialDates:string[]=Array.isArray(current?.specialDays)?current.specialDays.flatMap((v:any)=>{
    const t=pointTime({date:v.date});return t===null?[]:[new Date(t+OFFSET).toISOString().slice(0,10)];
  }):[];
  return {currentWeek:descriptions(current),regularWeek:descriptions(regular),specialDates,nextOpenTime:timestamp(current?.nextOpenTime),nextCloseTime:timestamp(current?.nextCloseTime)};
}
