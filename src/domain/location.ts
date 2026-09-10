import { AEOS_PIN, PILOT_RADIUS_METERS, inBengaluru } from './journey';
import { distanceMeters } from './geometry';
export function validateLocation(position:{timestamp:number;coords:{latitude:number;longitude:number;accuracy:number}},now=Date.now()){
  const {coords,timestamp}=position;
  if(!Number.isFinite(timestamp)||now-timestamp>60000||timestamp>now+10000)throw new Error('This location reading is stale. Try current location again or choose a pin.');
  if(!inBengaluru(coords))throw new Error('You are outside the North Bengaluru pilot. Choose an origin within 10 km of AEOS.');
  if(!Number.isFinite(coords.accuracy)||coords.accuracy<0||coords.accuracy>150)throw new Error('Location is too approximate. Enable precise location or choose a pin on the map.');
  const distance=distanceMeters(AEOS_PIN,coords);
  if(distance-coords.accuracy>PILOT_RADIUS_METERS)throw new Error('You are outside the 10 km North Bengaluru pilot around AEOS. Choose an in-area pin.');
  if(distance+coords.accuracy>PILOT_RADIUS_METERS)throw new Error('Your location is close to the pilot boundary. Try for a more precise fix or choose an in-area pin.');
  return {name:'Current location',latitude:coords.latitude,longitude:coords.longitude,address:`GPS accuracy about ${Math.round(coords.accuracy)} m · confirm the starting entrance`};
}
export function locationError(error:unknown):string{
  const code=String((error as {code?:unknown})?.code??'');
  if(['OS-PLUG-GLOC-0003','1'].includes(code))return 'Location permission was denied. Allow location in app settings, or choose a pin.';
  if(code==='OS-PLUG-GLOC-0007')return 'Phone location services are off. Open location settings, turn them on, then try again.';
  if(['OS-PLUG-GLOC-0010','3'].includes(code))return 'GPS did not return a fix in time. Try outdoors or choose a pin.';
  if(['OS-PLUG-GLOC-0016','OS-PLUG-GLOC-0017'].includes(code))return 'Phone location settings are unavailable or switched off. Open location settings and enable Location, then try again.';
  if(['OS-PLUG-GLOC-0014','OS-PLUG-GLOC-0015'].includes(code))return 'Google location services are unavailable on this phone. Check Play services or choose a pin.';
  return 'A location fix is unavailable. Check location settings and precise permission, then try again or choose a pin.';
}
