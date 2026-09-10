import { Capacitor, registerPlugin } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { type JourneyPoint } from './domain/journey';
import { validateLocation, locationError } from './domain/location';
const DeviceSettings=registerPlugin<{openLocation():Promise<void>;openApp():Promise<void>}>('DeviceSettings');
export async function openLocationSettings(){if(Capacitor.isNativePlatform())await DeviceSettings.openLocation();}
export async function openAppSettings(){if(Capacitor.isNativePlatform())await DeviceSettings.openApp();}
const MapsHandoff = registerPlugin<{ open(options: { url: string }): Promise<void> }>('MapsHandoff');
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
  return validateLocation(point);
}
export async function openMaps(url: string) { if (Capacitor.isNativePlatform()) await MapsHandoff.open({ url }); else window.open(url, '_blank', 'noopener,noreferrer'); }
