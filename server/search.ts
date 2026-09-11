import type { FastifyInstance } from 'fastify';
import type { ServerConfig } from './config';
import type { BudgetStore } from './budget';
import { ServiceError } from './errors';
import { inPilotArea, regionForPoint, SERVICE_REGIONS } from '../src/domain/journey';
import type { PlaceSuggestion, PlaceTravelEstimate, SearchDirection } from '../src/domain/search';
import type { Coordinate } from '../src/domain/types';

export function registerSearch(app:FastifyInstance, config:ServerConfig, budget:BudgetStore, fetcher:typeof fetch=fetch) {
  const sessions=new Map<string,{expires:number; ids:Set<string>; calls:number; busy:boolean; previews:Map<string,{checkedAt:string;estimates:PlaceTravelEstimate[]}>}>();
  const coordinateSchema={type:'object',additionalProperties:false,required:['latitude','longitude'],properties:{latitude:{type:'number',minimum:-90,maximum:90},longitude:{type:'number',minimum:-180,maximum:180}}};
  const sessionSchema={type:'string',pattern:'^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'};
  function enabled(){if(!config.liveEnabled||!config.searchEnabled)throw new ServiceError('search-paused','Place search is paused. Choose a supplied pin or enter coordinates.');if(!config.serverKey)throw new ServiceError('not-configured','Place search needs server configuration.');}
  function prune(){for(const [token,s]of sessions)if(s.expires<Date.now()&&!s.busy)sessions.delete(token);}
  async function provider(url:string, options:RequestInit){
    let response:Response;
    try {response=await fetcher(url,{...options,signal:AbortSignal.timeout(12000)});}catch{throw new ServiceError('search-unavailable','Search could not finish. Try again or choose a supplied pin.');}
    if(!response.ok)throw new ServiceError('search-unavailable','Google search is unavailable. Check services, restrictions and billing.');
    const text=await response.text();if(text.length>100000)throw new ServiceError('invalid-response','Search returned too much data.');
    try{return JSON.parse(text);}catch{throw new ServiceError('invalid-response','Search returned unreadable data.');}
  }
  app.post<{Body:{query:string;sessionToken:string;anchor?:Coordinate}}>('/api/places/suggest',{schema:{body:{type:'object',additionalProperties:false,required:['query','sessionToken'],properties:{query:{type:'string',minLength:3,maxLength:100},sessionToken:sessionSchema,anchor:coordinateSchema}}}},async request=>{
    enabled(); prune(); const {query,sessionToken}=request.body;
    if(query.trim().length<3)throw new ServiceError('invalid-input','Enter at least three characters.',400);
    let s=sessions.get(sessionToken);
    if(request.body.anchor&&!inPilotArea(request.body.anchor))throw new ServiceError('outside-area','Choose a starting point within the supported North Bengaluru or Kanpur area.',422);
    const region=regionForPoint(request.body.anchor!)??SERVICE_REGIONS[0];
    if(!s){if(sessions.size>=30)throw new ServiceError('search-busy','Search is busy. Try a supplied pin.',429);s={expires:Date.now()+5*60000,ids:new Set(),calls:0,busy:false,previews:new Map()};sessions.set(sessionToken,s);}
    if(s.busy||s.calls>=20)throw new ServiceError('search-limit','Close and reopen search to start a new search session.',429);
    s.busy=true;s.calls++;
    try{
      await budget.reserve('autocomplete');
      const data=await provider('https://places.googleapis.com/v1/places:autocomplete',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':config.serverKey,'X-Goog-FieldMask':'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.distanceMeters'},body:JSON.stringify({input:query.trim(),sessionToken,languageCode:'en',includedRegionCodes:['in'],...(request.body.anchor?{origin:request.body.anchor}:{}),locationRestriction:{circle:{center:{latitude:region.center.latitude,longitude:region.center.longitude},radius:region.radiusMeters}}})});
      if(data.suggestions!==undefined&&!Array.isArray(data.suggestions))throw new ServiceError('invalid-response','Search suggestions could not be read.');
      const suggestions:PlaceSuggestion[]=(data.suggestions||[]).slice(0,5).flatMap((item:any)=>{const p=item.placePrediction;
        if(typeof p?.placeId!=='string'||!/^[\w-]{1,200}$/.test(p.placeId)||typeof p.structuredFormat?.mainText?.text!=='string')return [];
        return [{id:p.placeId,title:p.structuredFormat.mainText.text.slice(0,100),address:String(p.structuredFormat.secondaryText?.text||region.city).slice(0,200),...(Number.isFinite(p.distanceMeters)&&p.distanceMeters>=0?{straightDistanceMeters:p.distanceMeters}:{})}];});
      s.ids=new Set(suggestions.map(p=>p.id));return {suggestions};
    }finally{s.busy=false;}
  });
  app.post<{Body:{sessionToken:string;placeIds:string[];anchor:Coordinate;direction:SearchDirection}}>('/api/places/preview',{schema:{body:{type:'object',additionalProperties:false,required:['sessionToken','placeIds','anchor','direction'],properties:{sessionToken:sessionSchema,placeIds:{type:'array',minItems:1,maxItems:5,uniqueItems:true,items:{type:'string',pattern:'^[A-Za-z0-9_-]{1,200}$'}},anchor:coordinateSchema,direction:{enum:['from-anchor','to-anchor']}}}}},async request=>{
    enabled();prune();const {sessionToken,placeIds,anchor,direction}=request.body,s=sessions.get(sessionToken);
    if(!inPilotArea(anchor))throw new ServiceError('outside-area','Choose a point within the supported North Bengaluru or Kanpur area.',422);
    if(!s||s.busy||placeIds.some(id=>!s.ids.has(id)))throw new ServiceError('search-expired','Search again to update travel estimates.',400);
    const cacheKey=JSON.stringify([anchor,direction,placeIds]),cached=s.previews.get(cacheKey);
    if(cached&&Date.now()-Date.parse(cached.checkedAt)<90000)return cached;
    // A matrix is billed per origin/destination pair. Reserve every element,
    // retaining one route unit for a full comparison. Never reset the ledger.
    const usage=await budget.snapshot();
    if(usage.routeLimit-usage.routeCalls<placeIds.length+1)throw new ServiceError('budget-exhausted','Travel-time preview allowance is used up. Place suggestions remain available.',429);
    await budget.reserve('route',placeIds.length);
    const fixed={waypoint:{location:{latLng:anchor}}},places=placeIds.map(placeId=>({waypoint:{placeId}}));
    const data=await provider('https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':config.serverKey,'X-Goog-FieldMask':'originIndex,destinationIndex,status,condition,distanceMeters,duration'},body:JSON.stringify({origins:direction==='from-anchor'?[fixed]:places,destinations:direction==='from-anchor'?places:[fixed],travelMode:'DRIVE',routingPreference:'TRAFFIC_AWARE',languageCode:'en-IN',units:'METRIC'})});
    if(!Array.isArray(data)||data.length>placeIds.length)throw new ServiceError('invalid-response','Travel estimates could not be read.');
    const estimates:PlaceTravelEstimate[]=placeIds.map(id=>({id,available:false})),seen=new Set<number>();
    for(const item of data){
      const index=(direction==='from-anchor'?item.destinationIndex:item.originIndex)??0,other=(direction==='from-anchor'?item.originIndex:item.destinationIndex)??0;
      if(!Number.isInteger(index)||index<0||index>=placeIds.length||other!==0||seen.has(index))throw new ServiceError('invalid-response','Travel estimates did not match the places.');
      seen.add(index);
      if(!item.status||typeof item.status!=='object'||(item.status.code??0)!==0||item.condition!=='ROUTE_EXISTS')continue;
      if(!Number.isFinite(item.distanceMeters)||item.distanceMeters<0||typeof item.duration!=='string'||!/^\d+(\.\d+)?s$/.test(item.duration))continue;
      estimates[index]={id:placeIds[index],available:true,distanceMeters:item.distanceMeters,durationSeconds:Number(item.duration.slice(0,-1))};
    }
    const result={checkedAt:new Date().toISOString(),estimates};
    if(s.previews.size>=12)s.previews.delete(s.previews.keys().next().value!);
    s.previews.set(cacheKey,result);return result;
  });
  app.post<{Body:{placeId:string;sessionToken:string}}>('/api/places/resolve',{schema:{body:{type:'object',additionalProperties:false,required:['placeId','sessionToken'],properties:{placeId:{type:'string',pattern:'^[A-Za-z0-9_-]{1,200}$'},sessionToken:sessionSchema}}}},async request=>{
    enabled();prune();const {placeId,sessionToken}=request.body;const s=sessions.get(sessionToken);
    if(!s||s.busy||!s.ids.has(placeId))throw new ServiceError('search-expired','Search again before selecting this place.',400);
    sessions.delete(sessionToken);await budget.reserve('details');
    const data=await provider(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}`,{headers:{'X-Goog-Api-Key':config.serverKey,'X-Goog-FieldMask':'id,location,formattedAddress'}});
    if(data.id!==placeId||!inPilotArea(data.location))throw new ServiceError('outside-area','Choose a place in the supported North Bengaluru or Kanpur area.',422);
    return {coordinate:data.location,address:typeof data.formattedAddress==='string'?data.formattedAddress.slice(0,250):undefined};
  });
  app.post<{Body:{placeId:string}}>('/api/places/saved',{schema:{body:{type:'object',additionalProperties:false,required:['placeId'],properties:{placeId:{type:'string',pattern:'^[A-Za-z0-9_-]{1,200}$'}}}}},async request=>{
    enabled();await budget.reserve('details');
    const data=await provider(`https://places.googleapis.com/v1/places/${encodeURIComponent(request.body.placeId)}`,{headers:{'X-Goog-Api-Key':config.serverKey,'X-Goog-FieldMask':'id,location,formattedAddress'}});
    if(data.id!==request.body.placeId||!inPilotArea(data.location))throw new ServiceError('outside-area','This saved place is unavailable or outside the supported North Bengaluru or Kanpur area.',422);
    return {coordinate:data.location,address:typeof data.formattedAddress==='string'?data.formattedAddress.slice(0,250):undefined};
  });
}
