// Explicit maintenance command, never run from a user's route request.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const query='[out:json][timeout:90];way[highway](around:22000,13.0628268,77.5940888);out tags geom;';
const source='https://overpass-api.de/api/interpreter';
let raw;
if(process.argv[2])raw=await readFile(process.argv[2],'utf8');
else {
 const response=await fetch(source+'?'+new URLSearchParams({data:query}),{headers:{'User-Agent':'Nightwise/1.0 local area research'},signal:AbortSignal.timeout(110000)});
 if(!response.ok)throw new Error(`Overpass HTTP ${response.status}`);
 raw=await response.text();
}
const data=JSON.parse(raw);
if(data.remark||!Array.isArray(data.elements)||!data.elements.length)throw new Error('Incomplete extract; existing data retained.');
const elements=data.elements.map(w=>({type:w.type,id:w.id,tags:Object.fromEntries(['highway','bridge','tunnel','layer'].filter(k=>w.tags[k]!==undefined).map(k=>[k,w.tags[k]])),geometry:w.geometry}));
const tileSize=.025,tiles=new Map();
for(const way of elements){
 const keys=new Set();
 for(let i=1;i<way.geometry.length;i++){
  const a=way.geometry[i-1],b=way.geometry[i];
  for(let x=Math.floor(Math.min(a.lon,b.lon)/tileSize);x<=Math.floor(Math.max(a.lon,b.lon)/tileSize);x++)
   for(let y=Math.floor(Math.min(a.lat,b.lat)/tileSize);y<=Math.floor(Math.max(a.lat,b.lat)/tileSize);y++)keys.add(`${x}_${y}`);
 }
 for(const key of keys){if(!tiles.has(key))tiles.set(key,[]);tiles.get(key).push(way);}
}
await mkdir('data/roads/north-bengaluru-22km-tiles',{recursive:true});
for(const [key,ways] of tiles)await writeFile(`data/roads/north-bengaluru-22km-tiles/${key}.json`,JSON.stringify({elements:ways}));
const compact=JSON.stringify({format:'nightwise-road-tiles-v1',osm3s:data.osm3s,tileSize,directory:'north-bengaluru-22km-tiles',tiles:[...tiles.keys()]});
const provenance={source,query,retrievedAt:new Date().toISOString(),sourceSha256:createHash('sha256').update(raw).digest('hex'),targetSha256:createHash('sha256').update(compact).digest('hex'),elements:elements.length,points:elements.reduce((n,w)=>n+w.geometry.length,0),tiles:tiles.size,tileSha256:Object.fromEntries(await Promise.all([...tiles.keys()].map(async key=>[key,createHash('sha256').update(await readFile(`data/roads/north-bengaluru-22km-tiles/${key}.json`)).digest('hex')]))),radiusMeters:22000,serviceRadiusMeters:20000,license:'ODbL 1.0',attribution:'© OpenStreetMap contributors',transform:'Original road coordinates and IDs, road and elevation tags only; partitioned into tiles with whole ways retained. No Google data. Extra 2 km provides boundary context; not an exhaustive road survey.'};
await mkdir('data/roads',{recursive:true});
await writeFile('data/roads/north-bengaluru-22km.json',compact);
await writeFile('data/roads/north-bengaluru-22km-provenance.json',JSON.stringify(provenance,null,2));
console.log(JSON.stringify({elements:elements.length,tiles:tiles.size,saved:true}));
