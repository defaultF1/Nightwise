import type { Route } from './domain/types';
import { MapPin, Check, Maximize2, Minimize2 } from 'lucide-react';
import { useExpandedMap } from './maps/use-expanded-map';
import map from './data/tutorial-map.json' with { type: 'json' };

export type RouteMapProps = { routes: Route[]; selectedId?: string; onSelect: (id: string) => void; origin: string; destination?: string };
const [south,west,north,east]=map.bounds;
const latitudeScale=Math.cos((north+south)*Math.PI/360);
const scale=Math.min(504/((east-west)*latitudeScale),374/(north-south));
const xy=(lat:number,lon:number)=>[280+(lon-(east+west)/2)*latitudeScale*scale,220-(lat-(north+south)/2)*scale];
const line=(points:number[][])=>points.map(([lat,lon],i)=>`${i?'L':'M'}${xy(lat,lon).map(v=>v.toFixed(1)).join(',')}`).join(' ');
// Group streets into three SVG paths to keep scrolling responsive on older phones.
const streets=['main','path','local'].map(kind=>({kind,d:map.roads.filter(r=>(/^(motorway|trunk|primary|secondary|tertiary)/.test(r.kind)?'main':/footway|path|steps|cycleway/.test(r.kind)?'path':'local')===kind).map(r=>line(r.points)).join(' ')}));
const labels:{name:string;x:number;y:number}[]=[];
for(const road of map.roads){
  if(!road.name||!/^(primary|secondary|tertiary)$/.test(road.kind)||labels.some(l=>l.name===road.name))continue;
  const [lat,lon]=road.points[Math.floor(road.points.length/2)];const [x,y]=xy(lat,lon);
  const halfWidth=road.name.length*2.5;
  if(x<halfWidth+10||x>550-halfWidth||y<45||y>390||labels.some(l=>Math.hypot(x-l.x,y-l.y)<90||(Math.abs(y-l.y)<20&&Math.abs(x-l.x)<halfWidth+l.name.length*2.5+10)))continue;
  labels.push({name:road.name,x,y});if(labels.length===7)break;
}
export function RouteDiagram({routes,selectedId,onSelect,origin,destination='AEOS'}:RouteMapProps){
  const {expanded,setExpanded,container,toggle}=useExpandedMap();
  const selected=routes.find(r=>r.id===selectedId);
  const ordered=[...routes.filter(r=>r.id!==selectedId),...routes.filter(r=>r.id===selectedId)];
  const pins=origin==='AEOS'?[map.pins.aeos,map.pins.manyata]:[map.pins.manyata,map.pins.aeos];
  return <section ref={container} className={`route-diagram offline-map${expanded?' map-expanded':''}`} role={expanded?'dialog':undefined} aria-modal={expanded?true:undefined} aria-label="Bengaluru street map">
    <div className="diagram-heading"><span><MapPin size={14}/> North Bengaluru</span><button ref={toggle} className="map-size-button" type="button" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?<Minimize2 size={17}/>:<Maximize2 size={17}/>} {expanded?'Minimize map':'Full screen'}</button></div>
    {routes.length?<>
      <div className="diagram-options" aria-label="Map route options">{routes.map(r=><button key={r.id} aria-pressed={r.id===selectedId} onClick={()=>onSelect(r.id)}>{r.id===selectedId&&<Check size={13}/>} {r.label} · {Math.round(r.durationSeconds/60)} min</button>)}</div>
      <svg viewBox="0 0 560 440" role="img" aria-label={`Street routes from ${origin} to ${destination}`}>
        <rect width="560" height="440" fill="var(--map)"/>
        {streets.map(s=><path key={s.kind} d={s.d} fill="none" className={`offline-streets ${s.kind}`} strokeLinejoin="round" strokeLinecap="round"/>)}
        {labels.map(l=><text key={l.name} x={l.x} y={l.y} className="offline-street-label" textAnchor="middle">{l.name}</text>)}
        {ordered.map(r=><g key={r.id}>
          <path d={line(r.path.map(p=>[p.latitude,p.longitude]))} fill="none" stroke="var(--map)" strokeWidth="10" strokeLinejoin="round"/>
          <path d={line(r.path.map(p=>[p.latitude,p.longitude]))} className={`diagram-path ${r.id===selectedId?'chosen':''}`} fill="none" strokeWidth={r.id===selectedId?5:3} strokeLinecap="round" strokeLinejoin="round"/>
          <path d={line(r.path.map(p=>[p.latitude,p.longitude]))} role="button" tabIndex={0} aria-label={`Select ${r.label} on diagram`} aria-pressed={r.id===selectedId} onClick={()=>onSelect(r.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(r.id);}}} fill="none" stroke="transparent" strokeWidth="18"/>
        </g>)}
        {pins.map(([lat,lon],i)=>{const [x,y]=xy(lat,lon);return <g key={i}><circle cx={x} cy={y} r="10" fill={i?'#ef4444':'#3b82f6'} stroke="white" strokeWidth="2"/><text x={x} y={y+4} textAnchor="middle" fontSize="11" fontWeight="700" fill="white">{i?'B':'A'}</text></g>;})}
      </svg>
      <div className="diagram-endpoints"><span><b>A</b> {origin}</span><span><b>B</b> {destination}</span></div>
      <p className="diagram-selection" aria-live="polite">{selected?.label??'Choose a route'} is highlighted. Tap another option to compare.</p>
    </>:<div className="diagram-empty"><MapPin size={28}/><p>No routes to display</p></div>}
    <p className="diagram-caption"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></p>
  </section>;
}
