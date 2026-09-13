import { useEffect, useRef, useState } from 'react';
import { regionForPoint, type JourneyPoint } from './domain/journey';
import { searchKnownPins, type PlaceSuggestion, type PlaceTravelEstimate, type SearchDirection } from './domain/search';
import { suggestPlaces, resolvePlace, previewPlaces } from './providers/search';
import { serviceStatus } from './providers/live';
const distanceText=(m:number)=>m<1000?`${Math.round(m/10)*10} m`:`${(m/1000).toFixed(1)} km`;
const timeText=(s:number)=>s<60?'Under 1 min':`${Math.ceil(s/60)} min`;
export function PlaceSearch({onChoose,accessCode,anchor,direction}:{onChoose:(point:JourneyPoint)=>void;accessCode:string;anchor:JourneyPoint;direction:SearchDirection}){
  const city=regionForPoint(anchor)?.city??'Bengaluru';
  const [query,setQuery]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[choosing,setChoosing]=useState(false),[suggestions,setSuggestions]=useState<PlaceSuggestion[]>([]);
  const [estimates,setEstimates]=useState<PlaceTravelEstimate[]>([]),[previewState,setPreviewState]=useState(''),[checkedAt,setCheckedAt]=useState('');
  const request=useRef<AbortController|null>(null),sequence=useRef(0),token=useRef(crypto.randomUUID()),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),previewTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  function cancel(){sequence.current++;request.current?.abort();clearTimeout(timer.current);clearTimeout(previewTimer.current);}
  useEffect(()=>()=>cancel(),[]);
  useEffect(()=>{if(query.trim().length>=3)timer.current=setTimeout(()=>void search(),700);return()=>clearTimeout(timer.current);},[query,accessCode,anchor.latitude,anchor.longitude,direction]);
  function editQuery(text:string){cancel();setBusy(false);setQuery(text);setSuggestions([]);setEstimates([]);setPreviewState('');setCheckedAt('');setMessage('');setError('');}
  async function search(){
    cancel();const id=sequence.current,c=new AbortController();request.current=c;setBusy(true);setError('');setMessage('');setSuggestions([]);setEstimates([]);setCheckedAt('');setPreviewState('');
    try{
      const status=await serviceStatus(c.signal);if(c.signal.aborted||id!==sequence.current)return;
      if(!status.searchEnabled){setMessage('Place search is paused. Supplied pins and coordinate entry still work.');return;}
      const coordinate={latitude:anchor.latitude,longitude:anchor.longitude};
      const found=await suggestPlaces(query.trim(),token.current,c.signal,accessCode,status.searchPreviewEnabled?coordinate:undefined);if(id!==sequence.current||c.signal.aborted)return;
      setSuggestions(found);if(!found.length){setMessage('No matching places found. Try a more specific name or use coordinates.');return;}
      requestAnimationFrame(()=>document.getElementById('place-results')?.scrollIntoView({block:'nearest'}));
      if(!status.searchPreviewEnabled){setPreviewState('Travel estimates need the updated live service. You can still choose a place.');return;}
      setPreviewState('Checking driving times…');
      previewTimer.current=setTimeout(()=>{void (async()=>{
        try{const result=await previewPlaces(found.map(p=>p.id),token.current,coordinate,direction,c.signal,accessCode);if(id!==sequence.current||c.signal.aborted)return;setEstimates(result.estimates);setCheckedAt(result.checkedAt);setPreviewState('');}
        catch{if(id===sequence.current&&!c.signal.aborted)setPreviewState('Driving estimates unavailable. You can still choose a place.');}
      })();},900);
    }catch(e){if(id===sequence.current&&!c.signal.aborted){setError(e instanceof Error?e.message:'Search unavailable. Use a supplied pin.');token.current=crypto.randomUUID();}}
    finally{if(id===sequence.current)setBusy(false);}
  }
  async function choose(s:PlaceSuggestion){
    cancel();const id=sequence.current,c=new AbortController();request.current=c;setChoosing(true);setError('');
    try{const point=await resolvePlace(s,token.current,c.signal,accessCode);if(id===sequence.current&&!c.signal.aborted)onChoose(point);}
    catch(e){if(id===sequence.current&&!c.signal.aborted){setSuggestions([]);token.current=crypto.randomUUID();setError(e instanceof Error?e.message:'Place unavailable. Search again.');}}
    finally{if(id===sequence.current)setChoosing(false);}
  }
  const pins=searchKnownPins(query),tripLabel=`${direction==='from-anchor'?'From':'To'} ${anchor.name}`;
  // Submitting blurs the input so the phone keyboard closes and the results
  // that arrive are actually visible instead of hidden behind it.
  return <><form className="place-search" onSubmit={e=>{e.preventDefault();(document.activeElement as HTMLElement|null)?.blur?.();if(query.trim().length>=3&&!choosing)void search();}}>
    <label className="search-label" htmlFor="place-query">Search places</label><input className="origin-search" id="place-query" value={query} onChange={e=>editQuery(e.target.value)} placeholder={city==='Kanpur'?'Try Sharda Nagar or a school name':'Try Bengaluru Palace or Manyata'} maxLength={100} autoComplete="off" enterKeyHint="search" disabled={choosing} aria-controls="place-results"/>
    <button className="secondary-button" type="submit" disabled={busy||choosing||query.trim().length<3}>{busy?'Searching…':`Search ${city}`}</button><p className="settings-helper">Suggestions appear after you pause typing. Driving estimates use your selected journey endpoints.</p></form>
    <div aria-live="polite">{busy&&<p className="search-notice" role="status">Finding matching places…</p>}{message&&<p className="search-notice" role="status">{message}</p>}{error&&<p className="search-notice" role="alert">{error}</p>}</div>
    {suggestions.length>0&&<section id="place-results" aria-label="Google place results"><p className="search-label">Google Maps</p><p className="search-trip-context">Driving · {tripLabel}</p>{suggestions.map(p=>{
      const estimate=estimates.find(e=>e.id===p.id);
      return <button className="origin-option search-result" key={p.id} disabled={choosing} onClick={()=>void choose(p)}><span><strong>{p.title}</strong><small>{p.address}</small>
        {estimate?.available?<span className="search-travel"><b>{distanceText(estimate.distanceMeters!)} · {timeText(estimate.durationSeconds!)}</b><small>Estimated drive</small></span>:<span className="search-travel"><small>{Number.isFinite(p.straightDistanceMeters)?`${distanceText(p.straightDistanceMeters!)} straight-line distance · `:''}{previewState==='Checking driving times…'?'Checking drive time…':'Drive time unavailable'}</small></span>}
      </span></button>;
    })}{previewState&&<p className="settings-helper" role="status">{previewState}</p>}{checkedAt&&<p className="settings-helper">Estimates checked {new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',hour:'numeric',minute:'2-digit'}).format(new Date(checkedAt))} IST. Traffic and the chosen entrance can change the journey.</p>}</section>}
    <section aria-label="Supplied locations"><h3 className="settings-label">Supplied locations</h3>{pins.map(point=><button className="origin-option" key={point.name} disabled={choosing} onClick={()=>{cancel();onChoose(point);}}><span><strong>{point.name}</strong><small>Bengaluru · supplied pin · available offline</small></span></button>)}{!pins.length&&<p className="settings-helper">No supplied pin matches this name.</p>}</section></>;
}
