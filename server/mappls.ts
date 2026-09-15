import type { Coordinate, Route, MapplsPlace } from '../src/domain/types';
import type { LiveJourney } from '../src/domain/journey';
import { inServiceMapArea } from '../src/domain/journey';
import { validateRoutes } from '../src/providers/routes';
import { ServiceError } from './errors';
import type { BudgetStore, BudgetKind } from './budget';

type Json = Record<string, any>;
export function parseMapplsRoutes(data: Json): Route[] {
  if (data.code !== 'Ok' || !Array.isArray(data.routes)) throw new ServiceError('invalid-response','Mappls could not find routes for these pins.');
  const seen = new Set<string>();
  const routes: Route[] = data.routes.slice(0,3).map((r: Json, i: number): Route => {
    const coords = r.geometry?.coordinates;
    if (r.geometry?.type !== 'LineString' || !Array.isArray(coords)) throw new ServiceError('invalid-response','Mappls route geometry is missing.');
    const path = coords.map((p: unknown): Coordinate => {
      if (!Array.isArray(p) || p.length < 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) throw new ServiceError('invalid-response','Mappls route geometry is invalid.');
      return {latitude:p[1],longitude:p[0]};
    });
    if (path.some(p=>!inServiceMapArea(p))) throw new ServiceError('outside-area','This route leaves the supported city map area.',422);
    const steps: Json[] = (r.legs ?? []).flatMap((l: Json)=>Array.isArray(l.steps)?l.steps:[]);
    return {id:`mappls:${i}`,label:'',source:'mappls',geometryKind:'provider',path,
      distanceMeters:r.distance,durationSeconds:r.duration,
      ...(steps.length?{turns:steps.filter(s=>/turn|roundabout|rotary/.test(s.maneuver?.type??'')).length}:{}),
    };
  }).filter(r=>{const k=JSON.stringify(r.path);if(seen.has(k))return false;seen.add(k);return true;});
  routes.sort((a,b)=>a.durationSeconds-b.durationSeconds);
  routes.forEach((r,i)=>r.label=i?`Alternative ${i}`:'Fastest route');
  return validateRoutes(routes);
}

export function encodeMapplsPath(path: Coordinate[]): string {
  let lat=0,lng=0,out='';
  const part=(delta:number)=>{let v=delta<0?~(delta<<1):delta<<1;let s='';while(v>=32){s+=String.fromCharCode((32|(v&31))+63);v>>>=5;}return s+String.fromCharCode(v+63);};
  for(const p of path){const a=Math.round(p.latitude*1e5),b=Math.round(p.longitude*1e5);out+=part(a-lat)+part(b-lng);lat=a;lng=b;}
  return out;
}
export const MAPPLS_CATEGORIES = [
  {code:'TRNPMP',kind:'fuel'}, {code:'HLTHSP',kind:'hospital'}, {code:'HLTMDS',kind:'medical'},
  {code:'FODRST',kind:'shop'}, {code:'FODCOF',kind:'shop'}, {code:'SHPGRC',kind:'shop'},
] as const;

export class MapplsProvider {
  private cache = new Map<string,{at:number;data:Json}>();
  constructor(private key:string,private budget:BudgetStore,private fetcher:typeof fetch=fetch){}
  async request(base:string,params:Record<string,string>,kind:BudgetKind,signal:AbortSignal,refresh=false):Promise<Json>{
    const url=new URL(base);url.search=new URLSearchParams(params).toString();
    const cacheKey=url.toString(),cached=this.cache.get(cacheKey);
    if(!refresh&&cached&&Date.now()-cached.at<300000)return structuredClone(cached.data);
    signal.throwIfAborted();await this.budget.reserve(kind);
    url.searchParams.set('access_token',this.key);
    try{
      const res=await this.fetcher(url.toString(),{signal:AbortSignal.any([signal,AbortSignal.timeout(20000)]),redirect:'error'});
      if(!res.ok)throw new ServiceError(res.status===401||res.status===403?'provider-access':'provider-unavailable',res.status===401||res.status===403?'Mappls access is unavailable for this feature. Check its API allocation.':'Mappls could not finish the request. Please try again.');
      const text=await res.text();if(text.length>2000000)throw new Error();
      const data=JSON.parse(text);
      if(!data||typeof data!=='object'||data.error)throw new Error();
      if(this.cache.size>=400)this.cache.delete(this.cache.keys().next().value!);
      this.cache.set(cacheKey,{at:Date.now(),data});return structuredClone(data);
    }catch(e){if(signal.aborted)throw new DOMException('Cancelled','AbortError');if(e instanceof ServiceError)throw e;throw new ServiceError('provider-unavailable','Mappls returned an unreadable response or timed out.');}
  }
  async routes(journey:LiveJourney,signal:AbortSignal,refresh=false){
    if(journey.departureTime)throw new ServiceError('departure-unavailable','This Mappls plan supports Leave now. Future traffic estimates are not enabled.',422);
    const profile=journey.mode==='WALK'?'walking':journey.mode==='TWO_WHEELER'?'biking':'driving';
    const resource=profile==='walking'?'route_adv':'route_eta';
    const points=[journey.origin,journey.destination].map(p=>`${p.longitude},${p.latitude}`).join(';');
    return parseMapplsRoutes(await this.request(`https://route.mappls.com/route/direction/${resource}/${profile}/${points}`,{geometries:'geojson',steps:'true',alternatives:'true'},'route',signal,refresh));
  }
  async alongRoute(route:Route,signal:AbortSignal,refresh=false,maxCalls=12){
    const places=new Map<string,MapplsPlace>();let complete=true,calls=0;
    const path=encodeMapplsPath(route.path);
    // Only the displayed route paths are queried, at most two pages per category,
    // and page two only when Mappls reports more results than one page holds.
    for(const category of MAPPLS_CATEGORIES){
      let reportedPages=1;
      for(let page=1;page<=Math.min(reportedPages,2);page++){
        if(calls>=maxCalls){complete=false;break;}
        signal.throwIfAborted();calls++;
        try{
          const data=await this.request('https://search.mappls.com/search/places/along-route',{path,category:category.code,buffer:'150',page:String(page),geometries:'polyline5'},'nearby',signal,refresh);
          if(!Array.isArray(data.suggestedPOIs))throw new Error();
          const total=Number(data.pageInfo?.totalPages);
          reportedPages=Number.isInteger(total)&&total>0?total:(data.suggestedPOIs.length>=10?2:1);
          if(reportedPages>2)complete=false;
          for(const p of data.suggestedPOIs){
            if(typeof p.place_id!=='string'||!/^[a-z0-9]{6}$/i.test(p.place_id)||typeof p.poi!=='string')continue;
            places.set(p.place_id,{id:p.place_id,name:p.poi.slice(0,150),address:String(p.address??'').slice(0,250),category:category.code,kind:category.kind,
              ...(Number.isFinite(p.distance)&&p.distance>=0?{alongRouteMeters:Math.round(p.distance)}:{}),
              ...(typeof p.hourOfOperation==='string'&&p.hourOfOperation.trim()?{openingHours:p.hourOfOperation.slice(0,400)}:{})});
          }
        }catch{if(signal.aborted)throw new DOMException('Cancelled','AbortError');complete=false;break;}
      }
    }
    return {places:[...places.values()].sort((a,b)=>(a.alongRouteMeters??Infinity)-(b.alongRouteMeters??Infinity)),complete};
  }
}
