import type {ActivityAnalysis} from '../domain/activity-types';
import type {Coordinate} from '../domain/types';
export const PIN_COLORS={start:'#3b82f6',destination:'#ef4444',shop:'#facc15',medical:'#ec4899',fuel:'#22c55e',gap:'#fb923c'} as const;
export type PlacePin=Coordinate&{name:string;kind:'shop'|'medical'|'fuel'};
export function placePinKind(categories:string[]):PlacePin['kind']|undefined{
 if(categories.some(c=>['pharmacy','drugstore','hospital','doctor','medical_lab'].includes(c)))return 'medical';
 if(categories.includes('gas_station'))return 'fuel';
 if(categories.some(c=>['store','shopping_mall','supermarket','convenience_store','grocery_store','department_store','cafe','restaurant','bakery'].includes(c)))return 'shop';
}
export function placePins(analysis?:ActivityAnalysis):PlacePin[]{
 return analysis?.places.flatMap(place=>{
  const kind=placePinKind(place.categories);
  return kind&&place.coordinate&&place.hours.state==='open'&&!place.conflict?[{...place.coordinate,name:place.name??(kind==='medical'?'Medical listing':kind==='fuel'?'Fuel station':'Shop listing'),kind}]:[];
 })??[];
}
function evenlySpaced<T>(items:T[],limit:number){
 if(items.length<=limit)return items;
 return Array.from({length:limit},(_,index)=>items[Math.floor(index*items.length/limit)]);
}
export function visiblePlacePins(analysis?:ActivityAnalysis,limit=24):PlacePin[]{
 limit=Math.max(0,Math.floor(limit));
 const pins=placePins(analysis);
 if(pins.length<=limit)return pins;
 const medical=pins.filter(pin=>pin.kind==='medical');
 const fuel=pins.filter(pin=>pin.kind==='fuel');
 const medicalLimit=Math.min(medical.length,Math.ceil(limit/4));
 const fuelLimit=Math.min(fuel.length,Math.min(limit-medicalLimit,Math.ceil(limit/4)));
 const shopLimit=Math.max(0,limit-medicalLimit-fuelLimit);
 return [...evenlySpaced(medical,medicalLimit),...evenlySpaced(fuel,fuelLimit),...evenlySpaced(pins.filter(pin=>pin.kind==='shop'),shopLimit)];
}
export function pinTint(kind:keyof typeof PIN_COLORS){const hex=PIN_COLORS[kind];return{r:parseInt(hex.slice(1,3),16),g:parseInt(hex.slice(3,5),16),b:parseInt(hex.slice(5,7),16),a:1};}
