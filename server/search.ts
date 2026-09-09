import type { FastifyInstance } from 'fastify';
import type { ServerConfig } from './config';
import type { Budget } from './budget';
import { ServiceError } from './errors';
import { inBengaluru } from '../src/domain/journey';
import type { PlaceSuggestion } from '../src/domain/search';

export function registerSearch(app:FastifyInstance, config:ServerConfig, budget:Budget, fetcher:typeof fetch=fetch) {
  const sessions=new Map<string,{expires:number; ids:Set<string>; calls:number; busy:boolean}>();
  const sessionSchema={type:'string',pattern:'^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$'};
  function enabled(){if(!config.liveEnabled||!config.searchEnabled)throw new ServiceError('search-paused','Bengaluru search is paused. Choose a supplied pin or enter coordinates.');if(!config.serverKey)throw new ServiceError('not-configured','Bengaluru search needs server configuration.');}
  function prune(){for(const [token,s]of sessions)if(s.expires<Date.now()&&!s.busy)sessions.delete(token);}
  async function provider(url:string, options:RequestInit){
    let response:Response;
    try {response=await fetcher(url,{...options,signal:AbortSignal.timeout(12000)});}catch{throw new ServiceError('search-unavailable','Search could not finish. Try again or choose a supplied pin.');}
    if(!response.ok)throw new ServiceError('search-unavailable','Google search is unavailable. Check services, restrictions and billing.');
    const text=await response.text();if(text.length>100000)throw new ServiceError('invalid-response','Search returned too much data.');
    try{return JSON.parse(text);}catch{throw new ServiceError('invalid-response','Search returned unreadable data.');}
  }
  app.post<{Body:{query:string;sessionToken:string}}>('/api/places/suggest',{schema:{body:{type:'object',additionalProperties:false,required:['query','sessionToken'],properties:{query:{type:'string',minLength:3,maxLength:100},sessionToken:sessionSchema}}}},async request=>{
    enabled(); prune(); const {query,sessionToken}=request.body;
    if(query.trim().length<3)throw new ServiceError('invalid-input','Enter at least three characters.',400);
    let s=sessions.get(sessionToken);
    if(!s){if(sessions.size>=30)throw new ServiceError('search-busy','Search is busy. Try a supplied pin.',429);s={expires:Date.now()+5*60000,ids:new Set(),calls:0,busy:false};sessions.set(sessionToken,s);}
    if(s.busy||s.calls>=6)throw new ServiceError('search-limit','Close and reopen search to start a new search session.',429);
    s.busy=true;s.calls++;
    try{
      budget.reserve('autocomplete');
      const data=await provider('https://places.googleapis.com/v1/places:autocomplete',{method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':config.serverKey,'X-Goog-FieldMask':'suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat'},body:JSON.stringify({input:query.trim(),sessionToken,languageCode:'en',includedRegionCodes:['in'],locationRestriction:{rectangle:{low:{latitude:12.75,longitude:77.35},high:{latitude:13.25,longitude:77.85}}}})});
      if(data.suggestions!==undefined&&!Array.isArray(data.suggestions))throw new ServiceError('invalid-response','Search suggestions could not be read.');
      const suggestions:PlaceSuggestion[]=(data.suggestions||[]).slice(0,5).flatMap((item:any)=>{const p=item.placePrediction;
        if(typeof p?.placeId!=='string'||!/^[\w-]{1,200}$/.test(p.placeId)||typeof p.structuredFormat?.mainText?.text!=='string')return [];
        return [{id:p.placeId,title:p.structuredFormat.mainText.text.slice(0,100),address:String(p.structuredFormat.secondaryText?.text||'Bengaluru').slice(0,200)}];});
      s.ids=new Set(suggestions.map(p=>p.id));return {suggestions};
    }finally{s.busy=false;}
  });
  app.post<{Body:{placeId:string;sessionToken:string}}>('/api/places/resolve',{schema:{body:{type:'object',additionalProperties:false,required:['placeId','sessionToken'],properties:{placeId:{type:'string',pattern:'^[A-Za-z0-9_-]{1,200}$'},sessionToken:sessionSchema}}}},async request=>{
    enabled();prune();const {placeId,sessionToken}=request.body;const s=sessions.get(sessionToken);
    if(!s||s.busy||!s.ids.has(placeId))throw new ServiceError('search-expired','Search again before selecting this place.',400);
    sessions.delete(sessionToken);budget.reserve('details');
    const data=await provider(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}`,{headers:{'X-Goog-Api-Key':config.serverKey,'X-Goog-FieldMask':'id,location,formattedAddress'}});
    if(data.id!==placeId||!inBengaluru(data.location))throw new ServiceError('outside-area','Choose a place within Bengaluru.',422);
    return {coordinate:data.location};
  });
}
