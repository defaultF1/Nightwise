import { Capacitor } from '@capacitor/core';
import { inServiceMapArea, type JourneyPoint } from '../domain/journey';
import type { PlaceSuggestion, PlaceTravelEstimate, SearchDirection } from '../domain/search';
import type { Coordinate } from '../domain/types';
const ANDROID_FALLBACK_API_BASE = 'https://nightwise-f5fu.onrender.com';
const base = Capacitor.isNativePlatform()
  ? import.meta.env.VITE_ANDROID_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || ANDROID_FALLBACK_API_BASE
  : import.meta.env.VITE_API_BASE_URL || (['localhost', '127.0.0.1'].includes(window.location.hostname) ? 'http://127.0.0.1:8787' : '');
async function post(path:string,body:unknown,signal:AbortSignal){
  const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.any([signal,AbortSignal.timeout(15000)]),cache:'no-store'});
  const data=await response.json();
  if(!response.ok)throw new Error(typeof data.message==='string'?data.message.slice(0,250):'Search unavailable. Use a supplied pin.');
  return data;
}
export async function suggestPlaces(query:string,sessionToken:string,signal:AbortSignal,anchor?:Coordinate):Promise<PlaceSuggestion[]>{
  const data=await post('/api/places/suggest',{query,sessionToken,...(anchor?{anchor}: {})},signal);
  if(!Array.isArray(data.suggestions)||data.suggestions.length>5||data.suggestions.some((p:any)=>typeof p.id!=='string'||typeof p.title!=='string'||typeof p.address!=='string'))throw new Error('Search results could not be read.');
  return data.suggestions;
}
export async function previewPlaces(placeIds:string[],sessionToken:string,anchor:Coordinate,direction:SearchDirection,signal:AbortSignal):Promise<{checkedAt:string;estimates:PlaceTravelEstimate[]}>{
  const data=await post('/api/places/preview',{placeIds,sessionToken,anchor,direction},signal);
  if(!Number.isFinite(Date.parse(data.checkedAt))||!Array.isArray(data.estimates)||data.estimates.length!==placeIds.length||data.estimates.some((p:any,i:number)=>p.id!==placeIds[i]||typeof p.available!=='boolean'||(p.available&&(!Number.isFinite(p.distanceMeters)||p.distanceMeters<0||!Number.isFinite(p.durationSeconds)||p.durationSeconds<0))))throw new Error('Travel estimates could not be read.');
  return data;
}
export async function resolvePlace(suggestion:PlaceSuggestion,sessionToken:string,signal:AbortSignal):Promise<JourneyPoint>{
  const data=await post('/api/places/resolve',{placeId:suggestion.id,sessionToken},signal);
  if(!inServiceMapArea(data.coordinate))throw new Error('Choose a supported-city destination.');
  return {...data.coordinate,name:suggestion.title,placeId:suggestion.id,address:typeof data.address==='string'?data.address:suggestion.address};
}
export async function resolveFavourite(placeId:string,name:string,signal:AbortSignal):Promise<JourneyPoint>{
  const data=await post('/api/places/saved',{placeId},signal);
  if(!inServiceMapArea(data.coordinate))throw new Error('Choose a supported-city destination.');
  return {...data.coordinate,name,placeId,address:typeof data.address==='string'?data.address:undefined};
}
