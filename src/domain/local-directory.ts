import type {Coordinate,Route} from './types';
import {distanceMeters} from './geometry';
import {distanceToRoute} from './route-proximity';
import type {PlacePin} from '../maps/pins';

export type DirectoryPlace=Coordinate&{id:string;name:string;kind:PlacePin['kind'];hours?:string;sourceUrl:string;sourceUpdatedAt?:string;sourceCheckedAt?:string;hoursSourceUrl?:string;hoursNote?:string};
export type Directory={savedAt:string;attribution:string;places:DirectoryPlace[]};
export function directoryHours(hours:string){
 return hours==='24/7'?'24 hours':hours.replace(/Mo-Su/g,'Daily').replace(/Mo-Sa/g,'Mon–Sat').replace(/Mo-Fr/g,'Mon–Fri').replace(/\bPH\b/g,'Public holidays').replace(/\bMo\b/g,'Mon').replace(/\bTu\b/g,'Tue').replace(/\bWe\b/g,'Wed').replace(/\bTh\b/g,'Thu').replace(/\bFr\b/g,'Fri').replace(/\bSa\b/g,'Sat').replace(/\bSu\b/g,'Sun').replace(/,/g,', ');
}
export function directoryAlongRoute(directory:Directory,route?:Route){
 if(!route||route.source!=='geoapify')return [];
 return directory.places.map(p=>({...p,routeDistanceMeters:Math.round(distanceToRoute(p,route.path))})).filter(p=>p.routeDistanceMeters<=200).sort((a,b)=>a.routeDistanceMeters-b.routeDistanceMeters||a.name.localeCompare(b.name));
}
export function directoryPins(rows:DirectoryPlace[],savedAt:string,live:PlacePin[]):PlacePin[]{
 const normal=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
 return rows.filter(p=>!live.some(l=>l.kind===p.kind&&normal(l.name)===normal(p.name)&&distanceMeters(l,p)<60)).map(p=>({latitude:p.latitude,longitude:p.longitude,name:p.name,kind:p.kind,sourceUrl:p.hoursSourceUrl??p.sourceUrl,status:`Local directory · ${p.hoursNote??(p.hours?`Recorded hours: ${directoryHours(p.hours)}`:'Opening hours unknown')} · Saved ${savedAt.slice(0,10)}.${p.sourceUpdatedAt?` Map record last edited ${p.sourceUpdatedAt.slice(0,10)}.`:''} Current opening is not confirmed.`}));
}
