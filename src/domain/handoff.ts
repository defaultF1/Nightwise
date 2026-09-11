import type { LiveJourney } from './journey';
import type { Route, Coordinate } from './types';
import { samplePolyline, pathLength } from './geometry';
const coordinate = (p: Coordinate) => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`;
export function mapsHandoff(journey: LiveJourney, route?: Route) {
  const url = new URL('https://www.google.com/maps/dir/');
  url.search = new URLSearchParams({ api: '1', origin: coordinate(journey.origin), destination: coordinate(journey.destination), travelmode: 'driving' }).toString();
  // Google Maps URLs cannot carry the route polyline. Three ordered on-route
  // shaping points improve corridor preservation, but may appear as stops.
  if (route?.source === 'google' && route.geometryKind === 'provider') {
    const samples = samplePolyline(route.path, Math.max(100, pathLength(route.path) / 4), 6);
    const via = samples.slice(1, -1).slice(0, 3);
    if (via.length) url.searchParams.set('waypoints', via.map(p => coordinate(p.coordinate)).join('|'));
  }
  return url.toString();
}
