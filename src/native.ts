import { Capacitor, registerPlugin } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { inBengaluru, type JourneyPoint } from './domain/journey';
const MapsHandoff = registerPlugin<{ open(options: { url: string }): Promise<void> }>('MapsHandoff');
export async function currentLocation(): Promise<JourneyPoint> {
  if (Capacitor.isNativePlatform()) {
    const permissions = await Geolocation.requestPermissions({ permissions: ['location'] });
    if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') throw new Error('Location permission was declined. You can use a supplied pin instead.');
  }
  let point;
  try { point = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }); }
  catch { throw new Error('Location is unavailable or permission was declined. Check location services, or use a supplied pin.'); }
  const origin = { name: 'Current location', latitude: point.coords.latitude, longitude: point.coords.longitude };
  if (!inBengaluru(origin)) throw new Error('This location is outside the Bengaluru pilot. Use a supplied pin instead.');
  if (!Number.isFinite(point.coords.accuracy) || point.coords.accuracy > 300) throw new Error('The location estimate is too broad for this journey. Try again near a window or choose a pin.');
  return origin;
}
export async function openMaps(url: string) { if (Capacitor.isNativePlatform()) await MapsHandoff.open({ url }); else window.open(url, '_blank', 'noopener,noreferrer'); }
