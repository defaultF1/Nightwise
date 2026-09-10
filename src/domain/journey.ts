import type { Coordinate } from './types';
import { distanceMeters } from './geometry';
export const AEOS_PIN = { name: 'AEOS', latitude: 13.0628268, longitude: 77.5940888 };
export const MANYATA_PIN = { name: 'Manyata Tech Park', latitude: 13.047697, longitude: 77.619939 };
export const PILOT_RADIUS_METERS=10000;
// These are product coverage circles, not administrative city boundaries.
export const SERVICE_REGIONS = [
  {id:'north-bengaluru',city:'Bengaluru',center:AEOS_PIN,radiusMeters:PILOT_RADIUS_METERS},
  {id:'kanpur',city:'Kanpur',center:{latitude:26.48,longitude:80.30},radiusMeters:20000},
] as const;
export function regionForPoint(p:Coordinate){return p&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&Math.abs(p.latitude)<=90&&Math.abs(p.longitude)<=180?SERVICE_REGIONS.find(r=>distanceMeters(r.center,p)<=r.radiusMeters):undefined;}
export function inPilotArea(p:Coordinate):boolean{return !!regionForPoint(p);}
export function sameServiceRegion(a:Coordinate,b:Coordinate):boolean{const region=regionForPoint(a);return !!region&&region.id===regionForPoint(b)?.id;}
export function inServiceMapArea(p:Coordinate):boolean{return inBengaluru(p)||(!!p&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&p.latitude>=26.2&&p.latitude<=26.75&&p.longitude>=79.98&&p.longitude<=80.62);}
export type JourneyPoint = Coordinate & { name: string; address?: string; placeId?: string };
export type LiveJourney = { origin: JourneyPoint; destination: JourneyPoint; mode: 'DRIVE' };
export const DEFAULT_JOURNEY: LiveJourney = { origin: AEOS_PIN, destination: MANYATA_PIN, mode: 'DRIVE' };
// Request bounds include Bengaluru; the map itself remains freely pannable.
export function inBengaluru(p: Coordinate): boolean {
  return !!p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && p.latitude >= 12.75 && p.latitude <= 13.25 && p.longitude >= 77.35 && p.longitude <= 77.85;
}
