import {apiBase} from './providers/api-base';
import {teamAccessHeaders} from './team-access';
import { usesGeoapify } from './providers/selection';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { type JourneyPoint } from './domain/journey';
import { validateLocation, locationError } from './domain/location';
const DeviceSettings=registerPlugin<{openLocation():Promise<void>;openApp():Promise<void>;address(options:{latitude:number;longitude:number}):Promise<{address?:string}>}>('DeviceSettings');
export async function openLocationSettings(){if(Capacitor.isNativePlatform())await DeviceSettings.openLocation();}
export async function openAppSettings(){if(Capacitor.isNativePlatform())await DeviceSettings.openApp();}
const MapsHandoff = registerPlugin<{ open(options: { url: string }): Promise<void>; chooser(options: { latitude: number; longitude: number; name: string }): Promise<void> }>('MapsHandoff');
const MapViewport = registerPlugin<{ background(options: { color: string }): Promise<void> }>('MapViewport');
export async function setNativeBackground(color: string) { if (Capacitor.isNativePlatform()) await MapViewport.background({ color }); }
export async function currentLocation(): Promise<JourneyPoint> {
  if (Capacitor.isNativePlatform()) {
    let permissions;
    try {permissions = await Geolocation.requestPermissions({ permissions: ['location'] });}catch(e){throw new Error(locationError(e));}
    if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') throw new Error('Location permission was declined. You can use a supplied pin instead.');
  }
  let point;
  try { point = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }); }
  catch(e) { throw new Error(locationError(e)); }
  const validated=validateLocation(point);
  if(usesGeoapify){
    try{
      const response=await fetch(apiBase()+'/api/location/address',{method:'POST',headers:{'Content-Type':'application/json',...teamAccessHeaders()},body:JSON.stringify({latitude:validated.latitude,longitude:validated.longitude}),signal:AbortSignal.timeout(15000)});
      if(response.ok){const result=await response.json();if(typeof result.address==='string'&&result.address.trim())return {...validated,address:`Approximate address: ${result.address.trim().slice(0,250)}`};}
    }catch{/* Retain the GPS coordinate when the approximate address is unavailable. */}
    return validated;
  }
  if(Capacitor.isNativePlatform()){
    let timeout:ReturnType<typeof setTimeout>|undefined;
    try {
      const result=await Promise.race([DeviceSettings.address({latitude:validated.latitude,longitude:validated.longitude}),new Promise<{address?:string}>(resolve=>{timeout=setTimeout(()=>resolve({}),6000);})]);
      if(result.address?.trim())return {...validated,address:`Approximate address: ${result.address.trim().slice(0,250)}`};
    }catch{/* Keep the GPS fix and accuracy when address lookup is unavailable. */}finally{clearTimeout(timeout);}
  }
  return validated;
}
export async function openMaps(url: string) { if (Capacitor.isNativePlatform()) await MapsHandoff.open({ url }); else window.open(url, '_blank', 'noopener,noreferrer'); }
// Android shows its own chooser of installed maps apps for a geo: destination.
export async function chooseNavigation(point: { latitude: number; longitude: number; name: string }, fallbackUrl: string) { if (Capacitor.isNativePlatform()) await MapsHandoff.chooser(point); else window.open(fallbackUrl, '_blank', 'noopener,noreferrer'); }
