import type { FastifyInstance } from 'fastify';
import type { ServerConfig } from './config';
import { MapplsProvider } from './mappls';
import { ServiceError } from './errors';
import { inPilotArea, regionForPoint, SERVICE_REGIONS } from '../src/domain/journey';
import type { Coordinate } from '../src/domain/types';
import type { PlaceSuggestion } from '../src/domain/search';

export function registerMapplsSearch(app:FastifyInstance,config:ServerConfig,provider:MapplsProvider){
  const sessions=new Map<string,{at:number;anchor:Coordinate;places:PlaceSuggestion[]}>();
  const point={type:'object',additionalProperties:false,required:['latitude','longitude'],properties:{latitude:{type:'number',minimum:-90,maximum:90},longitude:{type:'number',minimum:-180,maximum:180}}};
  const token={type:'string',pattern:'^[a-f0-9-]{36}$'};
  const pin={type:'string',pattern:'^[a-zA-Z0-9]{6}$'};
  function enabled(){if(!config.liveEnabled||!config.searchEnabled||!config.serverKey)throw new ServiceError('search-paused','Place search is unavailable. Choose a supplied pin or enter coordinates.');}
  app.post<{Body:{query:string;sessionToken:string;anchor?:Coordinate}}>('/api/places/suggest',{schema:{body:{type:'object',additionalProperties:false,required:['query','sessionToken'],properties:{query:{type:'string',minLength:3,maxLength:100},sessionToken:token,anchor:point}}}},async req=>{
    enabled();for(const [id,s]of sessions)if(Date.now()-s.at>=300000)sessions.delete(id);
    if(sessions.size>=100&&!sessions.has(req.body.sessionToken))throw new ServiceError('busy','Search is busy. Try again shortly.',429);
    const anchor=req.body.anchor??SERVICE_REGIONS[0].center,region=regionForPoint(anchor);
    if(!region)throw new ServiceError('outside-area','Choose a pin within the Bengaluru or Kanpur service area.',422);
    const data=await provider.request('https://search.mappls.com/search/places/autosuggest/json',{query:req.body.query.trim().slice(0,45),location:`${anchor.latitude},${anchor.longitude}`,region:'IND'},'autocomplete',AbortSignal.timeout(20000));
    if(!Array.isArray(data.suggestedLocations))throw new ServiceError('invalid-response','Mappls search returned no readable suggestions.');
    const places:PlaceSuggestion[]=data.suggestedLocations.filter((p:any)=>typeof p.eLoc==='string'&&/^[a-z0-9]{6}$/i.test(p.eLoc)&&typeof p.placeName==='string').slice(0,5).map((p:any)=>({id:p.eLoc,title:p.placeName.slice(0,100),address:String(p.placeAddress??region.city).slice(0,200),...(Number.isFinite(p.distance)?{straightDistanceMeters:p.distance}:{})}));
    sessions.set(req.body.sessionToken,{at:Date.now(),anchor,places});return {suggestions:places};
  });
  async function resolve(id:string,anchor:Coordinate,address?:string){
    // Standard Mappls search uses PINs. Routing to the PIN supplies its road
    // access point; do not present that snapped point as the building centroid.
    const data=await provider.request(`https://route.mappls.com/route/direction/route_eta/driving/${anchor.longitude},${anchor.latitude};${id}`,{geometries:'geojson',alternatives:'false',steps:'false'},'route',AbortSignal.timeout(20000));
    const p=data.waypoints?.[1]?.location;
    const coordinate={latitude:p?.[1],longitude:p?.[0]};
    if(data.code!=='Ok'||!inPilotArea(coordinate)||regionForPoint(coordinate)?.id!==regionForPoint(anchor)?.id)throw new ServiceError('outside-area','This place is outside the selected service area. Choose a nearby result.',422);
    return {coordinate,address:`Road access point — confirm the entrance.${address?' '+address:''}`};
  }
  app.post<{Body:{placeId:string;sessionToken:string}}>('/api/places/resolve',{schema:{body:{type:'object',additionalProperties:false,required:['placeId','sessionToken'],properties:{placeId:pin,sessionToken:token}}}},async req=>{
    enabled();const s=sessions.get(req.body.sessionToken),p=s?.places.find(p=>p.id===req.body.placeId);
    if(!s||!p||Date.now()-s.at>=300000)throw new ServiceError('search-expired','Search again before selecting this place.',400);
    const result=await resolve(p.id,s.anchor,p.address);sessions.delete(req.body.sessionToken);return result;
  });
  app.post<{Body:{placeId:string;anchor?:Coordinate}}>('/api/places/saved',{schema:{body:{type:'object',additionalProperties:false,required:['placeId'],properties:{placeId:pin,anchor:point}}}},async req=>{
    enabled();return resolve(req.body.placeId,req.body.anchor??SERVICE_REGIONS[0].center);
  });
  app.post('/api/places/preview',async()=>{throw new ServiceError('preview-unavailable','Choose a place to calculate the journey time.',422);});
}
