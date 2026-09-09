import type { PlaceObservation } from '../src/domain/activity-types';
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
  if (!Array.isArray(hours?.periods)) return undefined;
  const local=new Date(Date.parse(observedAt)+OFFSET);
  const start=Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate())-OFFSET;
  const end=start+7*86400000;
  const periods: {from:string;until:string}[]=[];
  for(const p of hours.periods){
    const from=pointTime(p.open),until=pointTime(p.close);
    // Google's documented 24/7 representation. A truncated/date-specific entry is not this sentinel.
    if(hours.periods.length===1&&p.open?.day===0&&(p.open.hour??0)===0&&(p.open.minute??0)===0&&!p.open.date&&!p.open.truncated&&!p.close){
      periods.push({from:new Date(start).toISOString(),until:new Date(end).toISOString()});continue;
    }
    if(from===null||until===null||until<=from)return undefined;
    periods.push({from:new Date(from).toISOString(),until:new Date(until).toISOString()});
  }
  return {from:new Date(start).toISOString(),until:new Date(end).toISOString(),periods};
}
