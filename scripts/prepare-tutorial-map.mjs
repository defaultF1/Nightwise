// Reproducible ODbL derivative of the saved Overpass highway extract.
// Tutorial geometry only: the extract does not contain turn-restriction relations.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const input=process.argv[2]??'research/evidence/2026-09-10/osm-roads-10km.json';
const bytes=readFileSync(input),raw=JSON.parse(bytes);
const points=new Map(),adj=new Map();
const speeds={motorway:55,trunk:45,primary:35,secondary:30,tertiary:25,unclassified:20,residential:18,living_street:10,service:10,motorway_link:25,trunk_link:25,primary_link:20,secondary_link:20,tertiary_link:18};
const dist=(a,b)=>Math.hypot((a[0]-b[0])*111195,(a[1]-b[1])*111195*Math.cos((a[0]+b[0])*Math.PI/360));
const allowed=w=>speeds[w.tags?.highway]&&!['no','private'].includes(w.tags?.motor_vehicle??w.tags?.vehicle??w.tags?.access)&&!w.tags?.construction;
function add(a,b,way,length,speed){if(!adj.has(a))adj.set(a,[]);adj.get(a).push({to:b,way,length,cost:length/(speed/3.6)});}
for(const w of raw.elements.filter(allowed)){
  w.nodes.forEach((n,i)=>points.set(n,[w.geometry[i].lat,w.geometry[i].lon]));
  for(let i=1;i<w.nodes.length;i++){
    const a=w.nodes[i-1],b=w.nodes[i],d=dist(points.get(a),points.get(b));
    const oneway=w.tags.oneway??(w.tags.junction==='roundabout'||w.tags.highway==='motorway'?'yes':'no');
    if(oneway!=='-1')add(a,b,w.id,d,speeds[w.tags.highway]);
    if(!['yes','1','true'].includes(oneway))add(b,a,w.id,d,speeds[w.tags.highway]);
  }
}
const pins={aeos:[13.0628268,77.5940888],manyata:[13.047697,77.619939]};
const nearest=p=>[...points.keys()].filter(n=>adj.has(n)).reduce((best,n)=>dist(p,points.get(n))<dist(p,points.get(best))?n:best,[...adj.keys()][0]);
const nodes={aeos:nearest(pins.aeos),manyata:nearest(pins.manyata)};
// Heap-based Dijkstra. Alternatives penalize previous edges; geometry is never interpolated.
function path(start,end,penalties){
  const costs=new Map([[start,0]]),prev=new Map(),heap=[[0,start]];
  const push=v=>{heap.push(v);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p][0]<=v[0])break;heap[i]=heap[p];i=p;}heap[i]=v;};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1][0]<heap[c][0])c++;if(heap[c][0]>=last[0])break;heap[i]=heap[c];i=c;}heap[i]=last;}return top;};
  while(heap.length){const [cost,id]=pop();if(cost!==costs.get(id))continue;if(id===end)break;
    for(const e of adj.get(id)??[]){const next=cost+e.cost*(penalties.get(`${id}:${e.to}`)??1);if(next<(costs.get(e.to)??Infinity)){costs.set(e.to,next);prev.set(e.to,{from:id,...e});push([next,e.to]);}}
  }
  if(!prev.has(end))throw Error('No connected road path');
  const ids=[end],edges=[];let id=end;while(id!==start){const e=prev.get(id);edges.push(e);id=e.from;ids.push(id);}ids.reverse();edges.reverse();
  return {coordinates:ids.map(n=>points.get(n)),nodeIds:ids,wayIds:[...new Set(edges.map(e=>e.way))],distanceMeters:Math.round(edges.reduce((s,e)=>s+e.length,0)),durationSeconds:Math.ceil(edges.reduce((s,e)=>s+e.cost,0)/60)*60,edges};
}
const journeys={};
for(const [name,start,end] of [['forward',nodes.aeos,nodes.manyata],['reverse',nodes.manyata,nodes.aeos]]){
  const penalties=new Map(),routes=[];
  for(let i=0;i<12&&routes.length<3;i++){
    const r=path(start,end,penalties),key=r.nodeIds.join(',');
    if(!routes.some(p=>p.nodeIds.join(',')===key))routes.push(r);
    for(const e of r.edges)penalties.set(`${e.from}:${e.to}`,(penalties.get(`${e.from}:${e.to}`)??1)*1.7);
  }
  journeys[name]=routes.sort((a,b)=>a.durationSeconds-b.durationSeconds).slice(0,3).map(({edges,...r})=>r);
}
const all=Object.values(journeys).flat().flatMap(r=>r.coordinates);
const bounds=[Math.min(...all.map(p=>p[0]))-.004,Math.min(...all.map(p=>p[1]))-.004,Math.max(...all.map(p=>p[0]))+.004,Math.max(...all.map(p=>p[1]))+.004];
const roads=raw.elements.filter(w=>w.geometry?.some(p=>p.lat>=bounds[0]&&p.lat<=bounds[2]&&p.lon>=bounds[1]&&p.lon<=bounds[3])).map(w=>({id:w.id,kind:w.tags.highway,name:w.tags['name:en']??w.tags.name??'',points:w.geometry.map(p=>[p.lat,p.lon])}));
const result={attribution:'© OpenStreetMap contributors',license:'https://opendatacommons.org/licenses/odbl/1-0/',sourceTimestamp:raw.osm3s?.timestamp_osm_base,sourceSha256:createHash('sha256').update(bytes).digest('hex'),bounds,pins,snapDistances:Object.fromEntries(Object.keys(pins).map(k=>[k,Math.round(dist(pins[k],points.get(nodes[k])))])),roads,journeys};
mkdirSync('src/data',{recursive:true});writeFileSync('src/data/tutorial-map.json',JSON.stringify(result));
console.log(JSON.stringify({roads:roads.length,snapDistances:result.snapDistances,journeys:Object.fromEntries(Object.entries(journeys).map(([k,v])=>[k,v.map(r=>({meters:r.distanceMeters,seconds:r.durationSeconds,vertices:r.coordinates.length}))]))}));
