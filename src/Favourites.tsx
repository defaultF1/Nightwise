import { useEffect, useRef, useState } from 'react';
import { makeFavourite, readFavourites, writeFavourites } from './domain/favourites';
import type { JourneyPoint } from './domain/journey';
import { resolveFavourite } from './providers/search';
export function Favourites({point,onChoose,accessCode}:{point:JourneyPoint;onChoose:(p:JourneyPoint)=>void;accessCode:string}){
  const [items,setItems]=useState(readFavourites),[label,setLabel]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  const request=useRef<AbortController|null>(null);
  useEffect(()=>()=>request.current?.abort(),[]);
  async function choose(item:typeof items[number]){
    request.current?.abort();const c=new AbortController();request.current=c;setBusy(true);setMessage('');
    try{const p=item.point??await resolveFavourite(item.placeId!,item.label,c.signal,accessCode);if(!c.signal.aborted)onChoose(p);}
    catch(e){if(!c.signal.aborted)setMessage(e instanceof Error?e.message:'Saved place unavailable.');}
    finally{if(!c.signal.aborted)setBusy(false);}
  }
  return <section className="favourites" aria-label="Saved places"><h3>Saved places</h3>
    <div className="saved-list">{items.map(item=><div key={item.id}><button className="text-button" disabled={busy} onClick={()=>void choose(item)}>{item.label}</button><button className="text-button" aria-label={`Remove ${item.label}`} onClick={()=>{try{const next=items.filter(i=>i.id!==item.id);writeFavourites(next);setItems(next);}catch{setMessage('Device storage is unavailable.');}}}>Remove</button></div>)}</div>
    {!items.length&&<p>No saved places yet. Give the selected pin a name such as Home or Office.</p>}
    <form className="save-place" onSubmit={e=>{e.preventDefault();try{if(items.length>=20)throw new Error('You can save up to 20 places.');const next=[...items,makeFavourite(label,point)];writeFavourites(next);setItems(next);setLabel('');setMessage('Place saved on this device.');}catch(e){setMessage(e instanceof Error?e.message:'Device storage is unavailable.');}}}>
      <label>Favourite label<input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Home, Office…" maxLength={60}/></label><button className="secondary-button" disabled={!label.trim()} type="submit">Save selected pin</button>
    </form><p className="settings-helper">Selected: {point.name}. Google places need a connection when reopened. Your labels and saved places stay on this device.</p>{message&&<p role="status">{message}</p>}
  </section>;
}
