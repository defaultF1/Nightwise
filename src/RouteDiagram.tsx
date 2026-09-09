import type { Route } from './domain/types';
import { MapPin, Check } from 'lucide-react';

export type RouteMapProps = { routes: Route[]; selectedId?: string; onSelect: (id: string) => void; origin: string; destination?: string };

// This adapter intentionally renders a labelled schematic; it is not a basemap.
export function RouteDiagram({ routes, selectedId, onSelect, origin, destination = 'AEOS' }: RouteMapProps) {
  const points = routes.flatMap(r => r.path);
  const minX = Math.min(...points.map(p => p.longitude));
  const minY = Math.min(...points.map(p => p.latitude));
  const spanX = Math.max(...points.map(p => p.longitude)) - minX || 1;
  const spanY = Math.max(...points.map(p => p.latitude)) - minY || 1;
  const xy = (p: Route['path'][number]) => [65 + (p.longitude-minX)/spanX*430, 70 + (1-(p.latitude-minY)/spanY)*230];
  const pathD = (r: Route) => r.path.map((p,i) => `${i ? 'L' : 'M'} ${xy(p).join(' ')}`).join(' ');
  const selected = routes.find(r => r.id === selectedId);
  const ordered = [...routes.filter(r => r.id !== selectedId), ...routes.filter(r => r.id === selectedId)];
  const endpoints = routes[0]?.path;
  return <section className="route-diagram" aria-label="Illustrative route diagram">
    <div className="diagram-heading"><span><MapPin size={14}/> Bengaluru tutorial</span><span className="sample-badge">Route diagram</span></div>
    {routes.length ? <>
      <svg viewBox="0 0 560 370" aria-label={`Illustrative paths from ${origin} to ${destination}. Not real streets.`}>
        <defs><pattern id="diagram-dots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="currentColor" opacity=".13"/></pattern></defs>
        <rect width="560" height="370" fill="url(#diagram-dots)"/>
        {ordered.map(route => <g key={route.id}>
          <path d={pathD(route)} fill="none" stroke="var(--map)" strokeWidth="15" strokeLinejoin="round"/>
          <path d={pathD(route)} className={`diagram-path ${route.id===selectedId?'chosen':''}`} fill="none" strokeWidth={route.id===selectedId?6:4} strokeDasharray={route.id===selectedId?undefined:'9 7'} strokeLinecap="round" strokeLinejoin="round"/>
          <path d={pathD(route)} className="diagram-hit" role="button" tabIndex={0} aria-label={`Select ${route.label} on diagram`} aria-pressed={route.id===selectedId} onClick={()=>onSelect(route.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(route.id);}}} fill="none" stroke="transparent" strokeWidth="26"/>
        </g>)}
        {endpoints && [endpoints[0],endpoints[endpoints.length-1]].map((p,i)=><g key={i}><circle cx={xy(p)[0]} cy={xy(p)[1]} r="11" fill="var(--surface)" stroke="var(--accent)" strokeWidth="3"/><text x={xy(p)[0]} y={xy(p)[1]+4} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text)">{i?'B':'A'}</text></g>)}
      </svg>
      <div className="diagram-endpoints"><span><b>A</b> {origin}</span><span><b>B</b> {destination}</span></div>
      <div className="diagram-options" aria-label="Diagram route options">{routes.map(r=><button key={r.id} aria-pressed={r.id===selectedId} onClick={()=>onSelect(r.id)}>{r.id===selectedId&&<Check size={13}/>} {r.label} · {Math.round(r.durationSeconds/60)} min</button>)}</div>
      <p className="diagram-selection" aria-live="polite">Selected: {selected?.label ?? 'Choose a route'}</p>
    </> : <div className="diagram-empty"><MapPin size={28}/><p>No paths to display</p></div>}
    <p className="diagram-caption">Illustrative paths, not real streets. The Bengaluru map connects in the live build.</p>
  </section>;
}
