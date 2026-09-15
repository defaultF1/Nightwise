export const localGeoLimits = {route:150, nearby:300, details:100, autocomplete:150, tiles:1500};
export type GeoCounts = typeof localGeoLimits;
export type GeoKind = keyof GeoCounts;
export function readGeoConfig(env:NodeJS.ProcessEnv=process.env){
 const hosted=env.RENDER==='true'||env.NODE_ENV==='production';
 const host=env.HOST||(hosted?'0.0.0.0':'127.0.0.1');
 const publicHost=!['127.0.0.1','localhost','::1'].includes(host);
 const integer=(key:string,fallback:number,max:number)=>{const n=Number(env[key]??fallback);if(!Number.isSafeInteger(n)||n<1||n>max)throw new Error(`Invalid ${key}: use a whole number between 1 and ${max}`);return n;};
 const accessCode=env.PILOT_ACCESS_CODE||'';
 // A team code is optional for this public pilot; when set it must stay hard to guess.
 if(accessCode&&(accessCode.length<16||accessCode.length>120))throw new Error('PILOT_ACCESS_CODE must be 16–120 characters when set.');
 const redisUrl=env.UPSTASH_REDIS_REST_URL||'',redisToken=env.UPSTASH_REDIS_REST_TOKEN||'';
 if(!!redisUrl!==!!redisToken)throw new Error('Both Upstash REST settings are required.');
 if(redisUrl){let valid=false;try{const u=new URL(redisUrl);valid=u.protocol==='https:'&&u.hostname.endsWith('.upstash.io')&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==='/';}catch{}if(!valid)throw new Error('Use the HTTPS Upstash REST endpoint without a command or query.');}
 if((hosted||publicHost)&&!redisUrl)throw new Error('Hosted Geoapify requires Upstash persistent usage storage.');
 const defaults=hosted?{route:500,nearby:5000,details:500,autocomplete:500,tiles:20000}:localGeoLimits;
 const limits=Object.fromEntries(Object.entries(defaults).map(([kind,n])=>[kind,integer(`GEOAPIFY_${kind.toUpperCase()}_LIMIT`,n,kind==='tiles'?100000:20000)])) as GeoCounts;
 const origins=new Set(['http://127.0.0.1:4176','http://localhost:4176','https://localhost','http://localhost','capacitor://localhost',...(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean)]);
 if(env.RENDER_EXTERNAL_URL)origins.add(new URL(env.RENDER_EXTERNAL_URL).origin);
 return {host,hosted,port:integer('PORT',8788,65535),key:env.GEOAPIFY_API_KEY||'',accessCode,redisUrl,redisToken,
  redisKey:'nightwise:geoapify:usage:v1',limits,origins:[...origins],serveWeb:env.SERVE_WEB==='true'||hosted,
  roadFile:env.ROAD_DATA_PATH||'data/roads/north-bengaluru-22km.json'};
}
export type GeoConfig=ReturnType<typeof readGeoConfig>;
