import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
// Repackage the already-collected OSM response; no download or Google content.
const source='research/evidence/2026-09-10/osm-roads-10km.json';
const raw=readFileSync(source),data=JSON.parse(raw);
if(data.remark||!Array.isArray(data.elements))throw new Error('Incomplete OSM source');
const elements=data.elements.filter(w=>w.type==='way'&&w.tags?.highway&&Array.isArray(w.geometry)).map(w=>({type:'way',id:w.id,tags:Object.fromEntries(['highway','bridge','tunnel','layer'].filter(k=>w.tags[k]!==undefined).map(k=>[k,w.tags[k]])),geometry:w.geometry}));
const target='data/roads/north-bengaluru-10km.json';
writeFileSync(target,JSON.stringify({version:data.version,osm3s:data.osm3s,elements}));
writeFileSync('data/roads/north-bengaluru-10km-provenance.json',JSON.stringify({sourceSha256:createHash('sha256').update(raw).digest('hex'),source,sourceProvenance:JSON.parse(readFileSync('research/evidence/2026-09-10/osm-roads-provenance.json')),transform:'Retain way ID, highway, bridge, tunnel, layer and original geometry only; no new coordinates or Google data',elements:elements.length,points:elements.reduce((n,w)=>n+w.geometry.length,0),license:'ODbL 1.0',attribution:'© OpenStreetMap contributors',targetSha256:createHash('sha256').update(readFileSync(target)).digest('hex')},null,2));
console.log(JSON.stringify({elements:elements.length,bytes:readFileSync(target).length}));
