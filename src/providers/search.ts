import { Capacitor } from '@capacitor/core';
import { inBengaluru, type JourneyPoint } from '../domain/journey';
import type { PlaceSuggestion } from '../domain/search';
const base=Capacitor.isNativePlatform()?import.meta.env.VITE_ANDROID_API_BASE_URL||import.meta.env.VITE_API_BASE_URL||'':import.meta.env.VITE_API_BASE_URL||(['localhost','127.0.0.1'].includes(window.location.hostname)?'http://127.0.0.1:8787':'');
async function post(path:string,body:unknown,signal:AbortSignal,accessCode:string){
  const response=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(accessCode?{'X-Nightwise-Code':accessCode}:{})},body:JSON.stringify(body),signal:AbortSignal.any([signal,AbortSignal.timeout(15000)]),cache:'no-store'});
  const data=await response.json();
  if(!response.ok)throw new Error(typeof data.message==='string'?data.message.slice(0,250):'Search unavailable. Use a supplied pin.');
  return data;
}
export async function suggestPlaces(query:string,sessionToken:string,signal:AbortSignal,accessCode:string):Promise<PlaceSuggestion[]>{
  const data=await post('/api/places/suggest',{query,sessionToken},signal,accessCode);
  if(!Array.isArray(data.suggestions)||data.suggestions.length>5||data.suggestions.some((p:any)=>typeof p.id!=='string'||typeof p.title!=='string'||typeof p.address!=='string'))throw new Error('Search results could not be read.');
  return data.suggestions;
}
export async function resolvePlace(suggestion:PlaceSuggestion,sessionToken:string,signal:AbortSignal,accessCode:string):Promise<JourneyPoint>{
  const data=await post('/api/places/resolve',{placeId:suggestion.id,sessionToken},signal,accessCode);
  if(!inBengaluru(data.coordinate))throw new Error('Choose a Bengaluru destination.');
  return {...data.coordinate,name:suggestion.title,placeId:suggestion.id,address:typeof data.address==='string'?data.address:suggestion.address};
}
export async function resolveFavourite(placeId:string,name:string,signal:AbortSignal,accessCode:string):Promise<JourneyPoint>{
  const data=await post('/api/places/saved',{placeId},signal,accessCode);
  if(!inBengaluru(data.coordinate))throw new Error('Choose a Bengaluru destination.');
  return {...data.coordinate,name,placeId,address:typeof data.address==='string'?data.address:undefined};
}
