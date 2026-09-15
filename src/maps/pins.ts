import type {ActivityAnalysis} from '../domain/activity-types';
import type {Coordinate} from '../domain/types';
import {assumedShopHours} from '../domain/assumed-hours';
import {distanceToRoute} from '../domain/route-proximity';
// Keep marker positions factual. Wider nearby evidence can belong to another street.
export const MAP_PLACE_DISTANCE_METERS=50;
export function pinsNearRoute(pins:PlacePin[],path:Coordinate[]):PlacePin[]{
 return pins.filter(pin=>distanceToRoute(pin,path)<=MAP_PLACE_DISTANCE_METERS);
}
export const PIN_COLORS={start:'#3b82f6',destination:'#ef4444',shop:'#facc15',medical:'#ec4899',hospital:'#a78bfa',fuel:'#22c55e',gap:'#fb923c',camera:'#22d3ee'} as const;
export type PlacePin=Coordinate&{name:string;kind:'shop'|'medical'|'hospital'|'fuel'|'camera';status?:string;sourceUrl?:string};
export function placePinKind(categories:string[]):PlacePin['kind']|undefined{
 if(categories.includes('hospital'))return 'hospital';
 if(categories.some(c=>['pharmacy','drugstore','doctor','medical_lab'].includes(c)))return 'medical';
 if(categories.includes('gas_station'))return 'fuel';
 if(categories.some(c=>['store','shopping_mall','supermarket','convenience_store','grocery_store','department_store','cafe','restaurant','bakery'].includes(c)))return 'shop';
}
export function placePins(analysis?:ActivityAnalysis,includeAll=false):PlacePin[]{
 return analysis?.places.flatMap(place=>{
  const kind=placePinKind(place.categories);
  const estimate=assumedShopHours(place,analysis!.checkedAt);
  return kind&&place.coordinate&&(includeAll||place.hours.state==='open'||estimate?.open)&&!place.conflict?[{...place.coordinate,name:place.name??(kind==='hospital'?'Hospital':kind==='medical'?'Medical listing':kind==='fuel'?'Fuel station':'Shop listing'),kind,...(estimate?{status:`Estimated ${estimate.open?'open':'closed'} around arrival · ${estimate.label}`} :place.hours.open24Hours&&place.hours.state==='open'?{status:place.hours.basis==='regular'?'Usually open 24 hours':'Open 24 hours'}:includeAll?{status:place.hours.state==='open'?'Listed open around arrival':place.hours.state==='closed'?'Listed closed around arrival':'Opening hours unknown'}:{})}]:[];
 })??[];
}
function evenlySpaced<T>(items:T[],limit:number){
 if(items.length<=limit)return items;
 return Array.from({length:limit},(_,index)=>items[Math.floor(index*items.length/limit)]);
}
export function visiblePlacePins(analysis?:ActivityAnalysis,limit=24,includeAll=false,path?:Coordinate[]):PlacePin[]{
 limit=Math.max(0,Math.floor(limit));
 const all=placePins(analysis,includeAll);
 const pins=path?pinsNearRoute(all,path):all;
 if(pins.length<=limit)return pins;
 const hospitals=pins.filter(pin=>pin.kind==='hospital');
 const hospitalLimit=Math.min(hospitals.length,Math.ceil(limit/4));
 const medical=pins.filter(pin=>pin.kind==='medical');
 const fuel=pins.filter(pin=>pin.kind==='fuel');
 const medicalLimit=Math.min(medical.length,limit-hospitalLimit,Math.ceil(limit/4));
 const fuelLimit=Math.min(fuel.length,limit-hospitalLimit-medicalLimit,Math.ceil(limit/4));
 const selected=[...evenlySpaced(hospitals,hospitalLimit),...evenlySpaced(medical,medicalLimit),...evenlySpaced(fuel,fuelLimit)];
 // Fill spare slots even when a route has few shops, without hiding an entire help category.
 const shops=evenlySpaced(pins.filter(pin=>pin.kind==='shop'),limit-selected.length);
 selected.push(...shops);
 const used=new Set(selected);
 return [...selected,...evenlySpaced(pins.filter(pin=>!used.has(pin)),limit-selected.length)];
}
export function pinTint(kind:keyof typeof PIN_COLORS){const hex=PIN_COLORS[kind];return{r:parseInt(hex.slice(1,3),16),g:parseInt(hex.slice(3,5),16),b:parseInt(hex.slice(5,7),16),a:1};}
