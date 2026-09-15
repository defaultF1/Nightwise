import data from '../data/cameras-north-bengaluru.json' with { type: 'json' };
import type { Coordinate } from './types';
import { distanceToRoute } from './route-proximity';
import type { PlacePin } from '../maps/pins';

// OpenStreetMap-mapped surveillance cameras (ODbL) within 20 km of the
// AEOS–Manyata corridor. A mapped location never confirms that a camera is
// installed today, working, recording or monitored.
export type MappedCamera = { id: string; latitude: number; longitude: number; zone?: string; cameraType?: string; operator?: string };
export const CAMERA_DATA_TIMESTAMP: string = data.osmDataTimestamp;
export const MAPPED_CAMERA_DISTANCE_METERS = 60;
const cameras = data.cameras as MappedCamera[];

export function camerasNearRoute(path: Coordinate[], bufferMeters = MAPPED_CAMERA_DISTANCE_METERS): MappedCamera[] {
  if (path.length < 2) return [];
  // Cheap bounding-box prefilter before the exact segment-distance check.
  const margin = bufferMeters / 111195 * 1.2;
  let south = Infinity, west = Infinity, north = -Infinity, east = -Infinity;
  for (const p of path) { south = Math.min(south, p.latitude); north = Math.max(north, p.latitude); west = Math.min(west, p.longitude); east = Math.max(east, p.longitude); }
  return cameras.filter(c => c.latitude >= south - margin && c.latitude <= north + margin && c.longitude >= west - margin && c.longitude <= east + margin
    && distanceToRoute(c, path) <= bufferMeters);
}

export function mappedCameraPins(list: MappedCamera[]): PlacePin[] {
  return list.map(c => ({ latitude: c.latitude, longitude: c.longitude, kind: 'camera' as const,
    name: c.operator ? `Mapped camera · ${c.operator}` : 'Mapped camera',
    status: 'OpenStreetMap-mapped location. Recording and monitoring are not confirmed.' }));
}
