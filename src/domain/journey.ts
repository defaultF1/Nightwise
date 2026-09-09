import type { Coordinate } from './types';
export const AEOS_PIN = { name: 'AEOS', latitude: 13.0628268, longitude: 77.5940888 };
export const MANYATA_PIN = { name: 'Manyata Tech Park', latitude: 13.047697, longitude: 77.619939 };
export type JourneyPoint = Coordinate & { name: string };
export type LiveJourney = { origin: JourneyPoint; destination: JourneyPoint; mode: 'DRIVE' };
export const DEFAULT_JOURNEY: LiveJourney = { origin: AEOS_PIN, destination: MANYATA_PIN, mode: 'DRIVE' };
// Request bounds include Bengaluru; the map itself remains freely pannable.
export function inBengaluru(p: Coordinate): boolean {
  return !!p && Number.isFinite(p.latitude) && Number.isFinite(p.longitude) && p.latitude >= 12.75 && p.latitude <= 13.25 && p.longitude >= 77.35 && p.longitude <= 77.85;
}
