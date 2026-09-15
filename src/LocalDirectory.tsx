import {useState} from 'react';
import {directoryHours,type Directory,type DirectoryPlace} from './domain/local-directory';
import {PIN_COLORS} from './maps/pins';
import './local-directory.css';

export function LocalDirectory({directory,rows,show,onShow}:{directory:Directory;rows:(DirectoryPlace&{routeDistanceMeters:number})[];show:boolean;onShow:(show:boolean)=>void}){
 const [query,setQuery]=useState('');
 const matched=rows.filter(p=>`${p.name} ${p.kind}`.toLowerCase().includes(query.toLowerCase()));
 return <section className="local-directory" aria-label="Local place directory">
  <label className="directory-toggle"><input type="checkbox" checked={show} onChange={e=>onShow(e.target.checked)}/> Show local directory pins</label>
  <p className="settings-helper">{rows.length} saved listings within 200 m of this route. Saved {directory.savedAt.slice(0,10)}. These pins do not affect live activity scores; opening times and entrances may have changed.</p>
  <details><summary>Browse local places ({rows.length})</summary>
   <label className="search-label" htmlFor="directory-search">Find a saved place</label><input id="directory-search" type="search" enterKeyHint="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, hospital, medical, fuel…"/>
   <div className="directory-rows">{matched.map(p=><article key={p.id}><strong><i style={{backgroundColor:PIN_COLORS[p.kind]}}/>{p.name}</strong><p>{p.hoursNote??(p.hours?`Recorded hours: ${directoryHours(p.hours)}`:'Opening hours unknown')}</p><p>{p.routeDistanceMeters} m from the road line; access may require a detour.</p>{p.sourceUpdatedAt&&<p>Map record last edited {p.sourceUpdatedAt.slice(0,10)}.</p>}<a href={p.sourceUrl} target="_blank" rel="noreferrer">Location source</a>{p.hoursSourceUrl&&<> · <a href={p.hoursSourceUrl} target="_blank" rel="noreferrer">Hours source</a></>}</article>)}</div>
   {!matched.length&&<p>No saved places match.</p>}<p className="settings-helper">{directory.attribution}</p>
  </details>
 </section>;
}
