import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import OpeningHours from 'opening_hours';
import type { Route, Coordinate, TravelMode } from '../src/domain/types';
import type { LiveJourney } from '../src/domain/journey';
import { AEOS_PIN } from '../src/domain/journey';
import { distanceMeters, validCoordinate } from '../src/domain/geometry';
import type { PlaceObservation, QueryPlan, NearbyScan } from '../src/domain/activity-types';
import { ServiceError } from './errors';

type Feature = { properties: Record<string, any>; geometry?: {type:string;coordinates:any} };
const TTL=5*60_000;
export const geoArea=(p:Coordinate)=>validCoordinate(p)&&distanceMeters(p,AEOS_PIN)<=20000;
export const geoMode=(mode:TravelMode)=>mode==='WALK'?'walk':mode==='TWO_WHEELER'?'motorcycle':'drive';
export function geoCategories(p:Record<string,any>):string[]{
 const c:string[]=Array.isArray(p.categories)?p.categories:[],raw=p.datasource?.raw??{};
 if(c.includes('healthcare.hospital')||raw.amenity==='hospital')return ['hospital'];
 if(c.includes('healthcare.pharmacy')||raw.amenity==='pharmacy')return ['pharmacy'];
 if(c.some(x=>x.startsWith('healthcare')))return ['doctor'];
 if(c.includes('service.vehicle.fuel')||raw.amenity==='fuel')return ['gas_station'];
 if(c.some(x=>x.startsWith('public_transport')))return ['transit_station'];
 if(c.some(x=>x.startsWith('accommodation')))return ['hotel'];
 if(c.some(x=>x.startsWith('catering.cafe')))return ['cafe'];
 if(c.some(x=>x.startsWith('catering')))return ['restaurant'];
 if(c.some(x=>x.startsWith('commercial')))return ['store'];
 return [];
}
export function geoPlace(f:Feature,at:string):PlaceObservation|null{
 const p=f.properties,coordinate={latitude:p.lat,longitude:p.lon},categories=geoCategories(p);
 if(!geoArea(coordinate)||!categories.length||typeof p.place_id!=='string')return null;
 const raw=p.datasource?.raw??{};
 if(['private','no'].includes(raw.access))return null;
 const expression=typeof p.opening_hours==='string'?p.opening_hours:typeof raw.opening_hours==='string'?raw.opening_hours:undefined;
 const place:PlaceObservation={id:`geo_${p.place_id}`,name:String(p.name??p.address_line1??categories[0]).slice(0,100),coordinate,categories,observedAt:at,provider:'geoapify'};
 if(expression){
  place.schedule={currentWeek:[],regularWeek:[expression],specialDates:[]};
  // Holiday calendars and ambiguous/appointment expressions must never imply confirmed closure.
  if(/\b(PH|SH)\b|sunrise|sunset|appointment|call|\?\?/i.test(expression))return place;
  try {
   const start=new Date(at),end=new Date(start.getTime()+8*86400000);
   const hours=new OpeningHours(expression,{lat:coordinate.latitude,lon:coordinate.longitude,address:{country_code:'in',state:'Karnataka'}},0);
   const intervals=hours.getOpenIntervals(start,end);
   if(intervals.some(i=>i[2]))return place;
   const nextOpen=intervals.find(i=>i[0]>start)?.[0],nextClose=intervals.find(i=>i[1]>start)?.[1];
   if(nextOpen)place.schedule!.nextOpenTime=nextOpen.toISOString();
   if(nextClose)place.schedule!.nextCloseTime=nextClose.toISOString();
   place.calendarHours={from:start.toISOString(),until:end.toISOString(),periods:intervals.map(i=>({from:i[0].toISOString(),until:i[1].toISOString()})),regular:true,...(expression.trim()==='24/7'?{alwaysOpen:true}:{})};
  }catch{/* Unsupported hours stay unknown rather than guessed closed. */}
 }
 return place;
}
export function geoRoutes(data:any,variant:string):Route[]{
 if(!Array.isArray(data.features))throw new ServiceError('invalid-response','Route geometry was not returned.');
 return data.features.slice(0,3).flatMap((f:Feature)=>{
  const p=f.properties,parts=f.geometry?.type==='MultiLineString'?f.geometry.coordinates:f.geometry?.type==='LineString'?[f.geometry.coordinates]:[];
  const path:Coordinate[]=parts.flatMap((part:any[])=>part.map(([longitude,latitude])=>({latitude,longitude})));
  if(path.length<2||path.length>4000||path.some(q=>!validCoordinate(q)||distanceMeters(q,AEOS_PIN)>22000)||!Number.isFinite(p.time)||p.time<=0||!Number.isFinite(p.distance)||p.distance<=0||p.distance>100000)return [];
  const steps=(p.legs??[]).flatMap((leg:any,i:number)=>(leg.steps??[]).map((s:any)=>({distanceMeters:s.distance,staticDurationSeconds:s.time,maneuver:String(s.instruction?.type??''),path:(parts[i]??[]).slice(s.from_index,s.to_index+1).map(([longitude,latitude]:number[])=>({latitude,longitude}))})));
  return [{id:`geo:${createHash('sha256').update(JSON.stringify(path)).digest('hex').slice(0,12)}`,label:variant,durationSeconds:p.time,distanceMeters:p.distance,path,steps,turns:steps.filter((s:any)=>/left|right|uturn/i.test(s.maneuver)).length,source:'geoapify' as const,geometryKind:'provider' as const}];
 });
}
export class Geoapify {
 private cache=new Map<string,{at:number;value:any}>();
 private tail:Promise<unknown>=Promise.resolve();
 private ledgerPath='.local/geoapify-usage.json';
 private ledger:{route:number;nearby:number;details:number;autocomplete:number;tiles:number};
 constructor(private key:string){
  mkdirSync('.local',{recursive:true});
  this.ledger=existsSync(this.ledgerPath)?JSON.parse(readFileSync(this.ledgerPath,'utf8')):{route:0,nearby:0,details:0,autocomplete:0,tiles:0};
  if(Object.values(this.ledger).some(v=>!Number.isSafeInteger(v)||v<0))throw new Error('Invalid local Geoapify usage ledger');
 }
 usage(){return {...this.ledger};}
 snapshot(){return {routeCalls:this.ledger.route,nearbyCalls:this.ledger.nearby,routeLimit:150,nearbyLimit:300,remainingComparisons:Math.max(0,Math.floor((150-this.ledger.route)/3))};}
 async request(path:string,params:Record<string,string>,kind:keyof Geoapify['ledger'],signal:AbortSignal,refresh=false):Promise<any>{
  const cacheKey=path+JSON.stringify(params),cached=this.cache.get(cacheKey);
  if(!refresh&&cached&&Date.now()-cached.at<(kind==='tiles'?86400000:TTL))return structuredClone(cached.value);
  const run=async()=>{
   signal.throwIfAborted();
   const again=this.cache.get(cacheKey);if(!refresh&&again&&Date.now()-again.at<(kind==='tiles'?86400000:TTL))return structuredClone(again.value);
   const caps={route:150,nearby:300,details:100,autocomplete:150,tiles:1500};
   if(this.ledger[kind]>=caps[kind])throw new ServiceError('budget-exhausted','The local provider allowance is used up. Existing results remain available.',429);
   this.ledger[kind]++;writeFileSync(this.ledgerPath,JSON.stringify(this.ledger));
   const host=kind==='tiles'?'https://maps.geoapify.com':'https://api.geoapify.com';
   let response:Response;
   try{response=await fetch(`${host}${path}?${new URLSearchParams({...params,apiKey:this.key})}`,{signal:AbortSignal.any([signal,AbortSignal.timeout(20000)])});}
   catch{throw new ServiceError('unavailable','The map provider could not be reached. Please retry.');}
   if(!response.ok)throw new ServiceError('provider-error',response.status===401||response.status===403?'The local provider key was rejected.':'The map provider could not complete this request.');
   const value=kind==='tiles'?new Uint8Array(await response.arrayBuffer()):await response.json();
   if(kind!=='tiles')value._nightwiseFetchedAt=new Date().toISOString();
   if(this.cache.size>=2000)this.cache.delete(this.cache.keys().next().value!);
   this.cache.set(cacheKey,{at:Date.now(),value});return structuredClone(value);
  };
  // Serial requests + spacing keep us below the free service's 5 requests/second.
  const result=this.tail.then(run);this.tail=result.catch(()=>{}).then(()=>new Promise(r=>setTimeout(r,220)));return result;
 }
 async routes(journey:LiveJourney,signal:AbortSignal,refresh=false,preview=false){
  const routes:Route[]=[];
  for(const variant of preview?['balanced']:journey.mode==='WALK'?['balanced','short']:['balanced','short','less_maneuvers']){
   const data=await this.request('/v1/routing',{waypoints:`${journey.origin.latitude},${journey.origin.longitude}|${journey.destination.latitude},${journey.destination.longitude}`,mode:geoMode(journey.mode),type:variant,traffic:'approximated',details:'instruction_details',format:'geojson'},'route',signal,refresh);
   for(const route of geoRoutes(data,variant)){
    if(distanceMeters(route.path[0],journey.origin)>250||distanceMeters(route.path.at(-1)!,journey.destination)>250)continue;
    if(!routes.some(r=>r.id===route.id))routes.push(route);
   }
  }
  routes.sort((a,b)=>a.durationSeconds-b.durationSeconds);
  return routes.slice(0,3).map((r,i)=>({...r,label:i?`Alternative ${i}`:'Fastest'}));
 }
 async scans(plan:QueryPlan,signal:AbortSignal,refresh=false):Promise<NearbyScan[]>{
  // Group route samples in small grid boxes: one result set can serve shared road sections.
  const tiles=new Map<string,typeof plan.queries>();
  for(const q of plan.queries){const k=`${Math.floor(q.coordinate.latitude/.02)}:${Math.floor(q.coordinate.longitude/.02)}`;tiles.set(k,[...(tiles.get(k)??[]),q]);}
  const scans:NearbyScan[]=[];
  for(const queries of tiles.values()){
   const lat=queries.map(q=>q.coordinate.latitude),lon=queries.map(q=>q.coordinate.longitude);
   const rect=`rect:${Math.min(...lon)-.0015},${Math.min(...lat)-.0015},${Math.max(...lon)+.0015},${Math.max(...lat)+.0015}`;
   const places:PlaceObservation[]=[];let status:NearbyScan['status']='ok';
   for(const categories of ['commercial,catering','healthcare,service.vehicle.fuel,accommodation,public_transport']){
    try{
     for(let offset=0;offset<300;offset+=100){
      const data=await this.request('/v2/places',{categories,filter:rect,limit:'100',offset:String(offset)},'nearby',signal,refresh);
      if(!Array.isArray(data.features))throw new Error('Invalid places response');
      if(data.features.length===100&&offset===200)status='capped';
      const at=data._nightwiseFetchedAt??new Date().toISOString();
      places.push(...data.features.flatMap((f:Feature)=>{const p=geoPlace(f,at);return p?[p]:[];}));
      if(data.features.length<100)break;
     }
    }catch{signal.throwIfAborted();status='failed';}
   }
   for(const q of queries)scans.push({queryId:q.id,observedAt:new Date().toISOString(),status,places:[...new Map(places.filter(p=>distanceMeters(q.coordinate,p.coordinate)<=150).map(p=>[p.id,p])).values()]});
  }
  return scans;
 }
}
