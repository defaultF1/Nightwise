import type { DeduplicatedPlace } from './activity-types';

/** User-selected planning fallback. Never replaces provider evidence or feeds confirmed-open counts. */
export function assumedShopHours(place:DeduplicatedPlace, checkedAt:string) {
  if(place.conflict || place.hours.state!=='unknown' || place.hours.reason!=='Google did not return usable opening and closing times.')return null;
  const arrival=Date.parse(checkedAt)+(place.arrivalMinutes??0)*60_000;
  if(!Number.isFinite(arrival))return null;
  const ist=new Date(arrival+330*60_000), minute=ist.getUTCHours()*60+ist.getUTCMinutes();
  return {label:'Assumed hours: 9 am–8 pm IST',open:minute>=9*60&&minute<20*60,
    explanation:'Planning estimate only. Weekly closures and holidays are unknown. Not counted as confirmed open.'};
}
