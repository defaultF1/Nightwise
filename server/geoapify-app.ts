import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { appendFileSync } from 'node:fs';
import { Geoapify, geoArea } from './geoapify';
import { ServiceError } from './errors';
import { AEOS_PIN, type LiveJourney } from '../src/domain/journey';
import { distanceMeters } from '../src/domain/geometry';
import { buildQueryPlan, analyzeRoute } from '../src/domain/activity';
import { compareActivity } from '../src/domain/comparison';
import { loadRoadAnalyzer } from './roads';
import type { LiveResult } from '../src/domain/live-contract';

export async function createGeoapifyServer(key:string){
 const app=Fastify({logger:false,bodyLimit:8192});
 const provider=new Geoapify(key);
 const origins=['http://127.0.0.1:4176','http://localhost:4176'];
 await app.register(cors,{origin:origins});
 await app.register(rateLimit,{max:300,timeWindow:'1 minute'});
 app.addHook('onRequest',async(req,reply)=>{if(req.headers.origin&&!origins.includes(req.headers.origin))return reply.code(403).send({message:'This local preview origin is not enabled.'});});
 app.setErrorHandler((e,_req,reply)=>{const known=e instanceof ServiceError;reply.code(known?e.status:400).send({message:known?e.message:'Check the journey and try again.'});});
 const sessions=new Map<string,{at:number;points:Map<string,any>}>();
 const point=(p:any)=>{if(!p||!geoArea(p))throw new ServiceError('outside-area','This local preview supports the 20 km area around AEOS and Manyata. Choose a starting pin here.',422);};
 const mode=(m:any)=>{if(!['DRIVE','WALK','TWO_WHEELER'].includes(m))throw new ServiceError('invalid-input','Choose car, motorbike or walking.',422);};
 const departure=(d:any)=>{if(d!==undefined&&(typeof d!=='string'||!Number.isFinite(Date.parse(d))||Date.parse(d)<Date.now()||Date.parse(d)>Date.now()+5*3600000))throw new ServiceError('invalid-input','Choose a time from now to five hours ahead.',422);};
 const placeId=(id:any)=>{if(typeof id!=='string'||!/^geo_[a-f0-9]{1,600}$/.test(id))throw new ServiceError('invalid-input','This saved place belongs to a different provider. Please search again.',422);return id.slice(4);};
 app.get('/api/status',async()=>({ready:!!key,configured:!!key,paused:false,provider:'geoapify',searchEnabled:!!key,searchPreviewEnabled:true,activityEnabled:true,scoringEnabled:true,accessCodeRequired:false,maxQueries:120,serviceRadiusMeters:20000,serviceRegions:[{id:'north-bengaluru',city:'Bengaluru',radiusMeters:20000}],budgetStorage:'local Geoapify ledger',budgetReady:true,providerCalls:provider.usage()}));
 app.get<{Params:{style:string;z:string;x:string;y:string}}>('/api/tiles/:style/:z/:x/:y',async(req,reply)=>{
  const {style,z,x,y}=req.params;
  if(!['positron','dark-matter','dark-matter-brown'].includes(style)||![z,x,y].every(v=>/^\d+$/.test(v))||+z>19||+x>=2**+z||+y>=2**+z)throw new ServiceError('invalid-input','Invalid map tile.',400);
  const bytes=await provider.request(`/v1/tile/${style}/${z}/${x}/${y}.png`,{},'tiles',AbortSignal.timeout(60000));
  return reply.header('Cache-Control','private, max-age=86400').type('image/png').send(Buffer.from(bytes));
 });
 app.post<{Body:Record<string,any>}>('/api/places/suggest',async req=>{
  const b=req.body;point(b?.anchor??AEOS_PIN);
  if(typeof b?.query!=='string'||b.query.trim().length<3||b.query.length>100||typeof b.sessionToken!=='string'||b.sessionToken.length>60)throw new ServiceError('invalid-input','Enter at least three characters.',400);
  for(const [k,s]of sessions)if(Date.now()-s.at>300000)sessions.delete(k);
  if(sessions.size>=40&&!sessions.has(b.sessionToken))throw new ServiceError('busy','Close and reopen search.',429);
  const d=await provider.request('/v1/geocode/autocomplete',{text:b.query.trim(),filter:`circle:${AEOS_PIN.longitude},${AEOS_PIN.latitude},20000`,bias:`proximity:${b.anchor?.longitude??AEOS_PIN.longitude},${b.anchor?.latitude??AEOS_PIN.latitude}`,limit:'5',lang:'en'},'autocomplete',AbortSignal.timeout(15000));
  const points=new Map<string,any>();
  const suggestions=(d.features??[]).flatMap((f:any)=>{const p=f.properties,coordinate={latitude:p.lat,longitude:p.lon};if(!geoArea(coordinate)||!p.place_id)return [];const id=`geo_${p.place_id}`;points.set(id,{coordinate,address:p.formatted,name:p.name??p.address_line1});return [{id,title:String(p.name??p.address_line1??'Place').slice(0,100),address:String(p.address_line2??p.formatted??'Bengaluru').slice(0,200),straightDistanceMeters:distanceMeters(b.anchor??AEOS_PIN,coordinate)}];});
  sessions.set(b.sessionToken,{at:Date.now(),points});return {suggestions};
 });
 app.post<{Body:Record<string,any>}>('/api/places/resolve',async req=>{const b=req.body;placeId(b?.placeId);const s=sessions.get(b.sessionToken),p=s?.points.get(b.placeId);if(!p||!s||Date.now()-s.at>300000)throw new ServiceError('expired','Search again before choosing this place.',400);return p;});
 app.post<{Body:Record<string,any>}>('/api/places/saved',async req=>{
  const id=placeId(req.body?.placeId),d=await provider.request('/v2/place-details',{id,features:'details'},'details',AbortSignal.timeout(15000)),p=d.features?.[0]?.properties;
  const coordinate={latitude:p?.lat,longitude:p?.lon};point(coordinate);return {coordinate,address:p.formatted};
 });
 app.post<{Body:Record<string,any>}>('/api/places/preview',async(req,reply)=>{
  const abort=new AbortController(),closed=()=>{if(!reply.raw.writableEnded)abort.abort();};reply.raw.on('close',closed);
  const signal=AbortSignal.any([abort.signal,AbortSignal.timeout(55000)]);
  try{
  const b=req.body;point(b?.anchor);mode(b?.mode??'DRIVE');departure(b?.departureTime);
  const s=sessions.get(b.sessionToken);
  if(!s||Date.now()-s.at>300000||!Array.isArray(b.placeIds)||!b.placeIds.length||b.placeIds.length>5||!['from-anchor','to-anchor'].includes(b.direction)||b.placeIds.some((id:string)=>!s.points.has(id)))throw new ServiceError('expired','Search again for travel estimates.',400);
  const estimates=[];
  for(const id of b.placeIds){
   signal.throwIfAborted();
   const found=s.points.get(id),fixed={...b.anchor,name:'Journey point'},other={...found.coordinate,name:found.name??'Place'};
   try{const routes=await provider.routes({origin:b.direction==='from-anchor'?fixed:other,destination:b.direction==='from-anchor'?other:fixed,mode:b.mode??'DRIVE'},signal,false,true),r=routes[0];estimates.push(r?{id,available:true,distanceMeters:r.distanceMeters,durationSeconds:r.durationSeconds}:{id,available:false});}catch{estimates.push({id,available:false});}
  }
  return {checkedAt:new Date().toISOString(),estimates};
  }finally{reply.raw.off('close',closed);}
 });
 app.post<{Body:Record<string,any>}>('/api/location/address',async req=>{
  point(req.body);const d=await provider.request('/v1/geocode/reverse',{lat:String(req.body.latitude),lon:String(req.body.longitude),format:'json'},'details',AbortSignal.timeout(12000));return {address:d.results?.[0]?.formatted};
 });
 let busy=false;
 app.post<{Body:LiveJourney&{refresh?:boolean}}>('/api/compare',async(req,reply)=>{
  const j=req.body;point(j?.origin);point(j?.destination);mode(j?.mode);departure(j?.departureTime);
  if(distanceMeters(j.origin,j.destination)<100)throw new ServiceError('invalid-input','Choose places at least 100 metres apart.',422);
  if(busy)throw new ServiceError('busy','A comparison is already running. Please wait.',429);
  busy=true;const abort=new AbortController(),closed=()=>{if(!reply.raw.writableEnded)abort.abort();};reply.raw.on('close',closed);
  const signal=AbortSignal.any([abort.signal,AbortSignal.timeout(120000)]);
  try{
   const before=provider.usage(),routes=await provider.routes(j,signal,j.refresh===true);
   const plan=buildQueryPlan(routes,200,2000),scans=routes.length?await provider.scans(plan,signal,j.refresh===true):[],checkedAt=new Date().toISOString();
   const analyses=routes.map(r=>analyzeRoute(r,plan,scans,j.departureTime??checkedAt,checkedAt));
   const analyzeRoads=loadRoadAnalyzer('data/roads/north-bengaluru-22km.json',routes.map(r=>r.path));
   const roadAnalyses=Object.fromEntries(routes.map(r=>[r.id,analyzeRoads(r.path,r.steps)]));
   const roads=Object.fromEntries(routes.map(r=>[r.id,{...roadAnalyses[r.id],maneuversPerKm:(r.turns??0)/(r.distanceMeters/1000)}]));
   const comparison=compareActivity(routes,analyses,j.mode==='WALK'?{}:roads,{allowLive:true});
   const now=provider.usage();
   return {provider:'geoapify',routes,analyses,roadAnalyses,comparison,checkedAt,activityStatus:analyses.every(a=>a.coreComparable)?'complete':'partial',notices:[
    'Routes, places and opening hours: Geoapify / OpenStreetMap. Travel times use approximated traffic, not live traffic measurements.',
    'Distinct routes are requested using balanced, shortest and fewer-turn preferences, with one avoid-highways fallback when needed; duplicate or substantially overlapping fallback geometry is removed. Three alternatives are not guaranteed.',
    'Departure time is used to evaluate listed shop hours. This provider does not supply a verified traffic forecast for your departure.',
    'Listings are incomplete. No mapped businesses does not prove a road is empty; unknown opening hours are not confirmed open. CCTV and signal layers are planned separately.',
    'Request totals are local API calls, not exact billable credits. View Geoapify statistics for credit usage.'
   ],attributions:[{name:'Powered by Geoapify',uri:'https://www.geoapify.com/'},{name:'© OpenStreetMap contributors',uri:'https://www.openstreetmap.org/copyright'}],usage:provider.snapshot(),requestUsage:{routeCalls:now.route-before.route,nearbyCalls:now.nearby-before.nearby,detailsCalls:now.details-before.details,scope:'Local Geoapify requests; shared road areas are reused.'}} satisfies LiveResult;
  }finally{busy=false;reply.raw.off('close',closed);}
 });
 app.post<{Body:Record<string,any>}>('/api/feedback',async req=>{if(!['up','down'].includes(req.body?.rating))throw new ServiceError('invalid-input','Invalid feedback.',400);appendFileSync('.local/geoapify-feedback.jsonl',JSON.stringify({rating:req.body.rating,at:new Date().toISOString()})+'\n');return {ok:true};});
 return app;
}
