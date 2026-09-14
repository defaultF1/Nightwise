import type { DeduplicatedPlace } from './activity-types';
const SHOP_CATEGORIES=new Set(['store','shopping_mall','supermarket','convenience_store','grocery_store','department_store','cafe','restaurant','bakery']);
/** User-selected planning fallback. Never replaces provider evidence or feeds confirmed-open counts. */
export function assumedShopHours(place:DeduplicatedPlace, checkedAt:string) {
  if(place.conflict || place.hours.state!=='unknown' || place.hours.reason!=='Google did not return usable opening and closing times.')return null;
  if(place.categories.includes('hospital'))return null;
  const medical=place.categories.some(c=>['pharmacy','drugstore'].includes(c));
  const fuel=place.categories.includes('gas_station');
  // Do not give hospital services, police, hotels or transit generic shop hours.
  if(!medical&&!fuel&&place.categories.some(c=>['hospital','doctor','medical_lab','police','hotel','transit_station','bus_station','bus_stop','train_station','subway_station','light_rail_station'].includes(c)))return null;
  if(!medical&&!fuel&&!place.categories.some(c=>SHOP_CATEGORIES.has(c)))return null;
  if(!Number.isFinite(place.arrivalMinutes??0)||(place.arrivalMinutes??0)<0)return null;
  const arrival=Date.parse(checkedAt)+(place.arrivalMinutes??0)*60_000;
  if(!Number.isFinite(arrival))return null;
  const ist=new Date(arrival+330*60_000), minute=ist.getUTCHours()*60+ist.getUTCMinutes();
  const opens=medical?10*60:9*60,closes=medical?23*60:20*60;
  const open=fuel||minute>=opens&&minute<closes;
  return {label:medical?'10 am–11 pm IST':fuel?'24 hours':'9 am–8 pm IST',open,
    explanation:'Google did not return opening hours. This category schedule is a planning estimate; weekly closures and holidays are unknown.'};
}
