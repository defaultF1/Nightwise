import { useEffect, useRef, useState } from 'react';
import type { JourneyPoint } from './domain/journey';
import { searchKnownPins, type PlaceSuggestion } from './domain/search';
import { suggestPlaces, resolvePlace } from './providers/search';
import { serviceStatus } from './providers/live';
export function PlaceSearch({onChoose,accessCode}:{onChoose:(point:JourneyPoint)=>void;accessCode:string}){
  const [query,setQuery]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[suggestions,setSuggestions]=useState<PlaceSuggestion[]>([]);
  const request=useRef<AbortController|null>(null), sequence=useRef(0),token=useRef(crypto.randomUUID());
  useEffect(()=>()=>{sequence.current++;request.current?.abort();},[]);
  function editQuery(text:string){sequence.current++;request.current?.abort();setBusy(false);setQuery(text);setSuggestions([]);setMessage('');setError('');}
  async function search(){
    const id=++sequence.current;request.current?.abort();const c=new AbortController();request.current=c;setBusy(true);setError('');setMessage('');setSuggestions([]);
    try{
      const status=await serviceStatus(c.signal);if(c.signal.aborted||id!==sequence.current)return;
      if(!status.searchEnabled){setMessage('Bengaluru search is paused. Supplied pins and coordinate entry still work.');return;}
      const found=await suggestPlaces(query.trim(),token.current,c.signal,accessCode);if(id!==sequence.current||c.signal.aborted)return;
      setSuggestions(found);if(!found.length)setMessage('No matching places found. Try a more specific name or use coordinates.');
    }catch(e){if(id===sequence.current&&!c.signal.aborted){setError(e instanceof Error?e.message:'Search unavailable. Use a supplied pin.');token.current=crypto.randomUUID();}}
    finally{if(id===sequence.current)setBusy(false);}
  }
  async function choose(s:PlaceSuggestion){
    const id=++sequence.current;request.current?.abort();const c=new AbortController();request.current=c;setBusy(true);setError('');
    try{const point=await resolvePlace(s,token.current,c.signal,accessCode);if(id===sequence.current&&!c.signal.aborted)onChoose(point);}
    catch(e){if(id===sequence.current&&!c.signal.aborted){setSuggestions([]);token.current=crypto.randomUUID();setError(e instanceof Error?e.message:'Place unavailable. Search again.');}}
    finally{if(id===sequence.current)setBusy(false);}
  }
  const pins=searchKnownPins(query);
  return <><form className="place-search" onSubmit={e=>{e.preventDefault();if(query.trim().length>=3&&!busy)void search();}}>
    <label className="search-label" htmlFor="place-query">Search places</label><input className="origin-search" id="place-query" value={query} onChange={e=>editQuery(e.target.value)} placeholder="Try Bengaluru Palace or Manyata" maxLength={100} autoComplete="off"/>
    <button className="secondary-button" type="submit" disabled={busy||query.trim().length<3}>{busy?'Searching…':'Search Bengaluru'}</button><p className="settings-helper">Supplied pins filter instantly. Wider search runs only when you press Search Bengaluru.</p></form>
    <div aria-live="polite">{message&&<p className="search-notice" role="status">{message}</p>}{error&&<p className="search-notice" role="alert">{error}</p>}</div>
    {suggestions.length>0&&<section aria-label="Google place results"><p className="search-label">Google Maps</p>{suggestions.map(p=><button className="origin-option" key={p.id} disabled={busy} onClick={()=>void choose(p)}><span><strong>{p.title}</strong><small>{p.address}</small></span></button>)}</section>}
    <section aria-label="Supplied locations"><h3 className="settings-label">Supplied locations</h3>{pins.map(point=><button className="origin-option" key={point.name} onClick={()=>{sequence.current++;request.current?.abort();onChoose(point);}}><span><strong>{point.name}</strong><small>Bengaluru · supplied pin · available offline</small></span></button>)}{!pins.length&&<p className="settings-helper">No supplied pin matches this name.</p>}</section></>;
}
