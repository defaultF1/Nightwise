import {ServiceError} from './errors';
import type {GeoCounts,GeoKind} from './geoapify-config';
export interface GeoBudget { read():Promise<GeoCounts>; reserve(kind:GeoKind,limit:number):Promise<GeoCounts>; }
const empty=()=>({route:0,nearby:0,details:0,autocomplete:0,tiles:0});
// New provider namespace only. Existing records must never expire or be reset.
// Validation, limit check and increment are atomic across all Render instances.
export const GEO_RESERVE_SCRIPT=`
local raw=redis.call('GET',KEYS[1])
if not raw or redis.call('PTTL',KEYS[1]) ~= -1 then return {'invalid'} end
local ok,data=pcall(cjson.decode,raw)
if not ok or type(data)~='table' then return {'invalid'} end
for _,field in ipairs({'route','nearby','details','autocomplete','tiles'}) do
 local n=data[field]
 if type(n)~='number' or n<0 or n>9007199254740991 or n~=math.floor(n) then return {'invalid'} end
end
if ARGV[1]~='' then
 local limit=tonumber(ARGV[2])
 if not data[ARGV[1]] or not limit or limit<1 then return {'invalid'} end
 if data[ARGV[1]]>=limit then return {'exhausted'} end
 data[ARGV[1]]=data[ARGV[1]]+1
 raw=cjson.encode(data)
 redis.call('SET',KEYS[1],raw)
end
return {'ok',raw}
`;
export class GeoRedisBudget implements GeoBudget{
 constructor(private url:string,private token:string,private key:string,private fetcher:typeof fetch=fetch){}
 private async command(command:(string|number)[]){
  try{const r=await this.fetcher(this.url,{method:'POST',headers:{Authorization:`Bearer ${this.token}`,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(8000),redirect:'error'});if(!r.ok)throw new Error();const d=await r.json();if(d.error||!Object.hasOwn(d,'result'))throw new Error();return d.result;}
  catch{throw new ServiceError('budget-unavailable','The request allowance could not be verified. No provider request was sent.',503);}
 }
 async initialize(){await this.command(['SET',this.key,JSON.stringify(empty()),'NX']);return this.read();}
 async read(){return this.run('',0);}
 async reserve(kind:GeoKind,limit:number){return this.run(kind,limit);}
 private async run(kind:GeoKind|'',limit:number):Promise<GeoCounts>{
  const r=await this.command(['EVAL',GEO_RESERVE_SCRIPT,1,this.key,kind,limit]);
  if(Array.isArray(r)&&r[0]==='exhausted')throw new ServiceError('budget-exhausted','The team request allowance is used up. Contact your team administrator.',429);
  if(Array.isArray(r)&&r[0]==='ok'&&typeof r[1]==='string'){
   try{const data=JSON.parse(r[1]);if(Object.keys(empty()).every(k=>Number.isSafeInteger(data[k])&&data[k]>=0))return data;}catch{}
  }
  throw new ServiceError('budget-unavailable','The persistent request allowance needs recovery. No provider request was sent.',503);
 }
}
