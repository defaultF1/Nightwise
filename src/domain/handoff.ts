import type { LiveJourney } from './journey';
import type { Coordinate } from './types';
const coordinate = (p: Coordinate) => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`;
// Google Maps URLs cannot carry a route polyline, and on-route shaping points
// appear as confusing "stops" in navigation. Hand off the endpoints only;
// Maps plans its own current route, which can differ from the compared option.
export function mapsHandoff(journey: LiveJourney) {
  const url = new URL('https://www.google.com/maps/dir/');
  url.search = new URLSearchParams({ api: '1', origin: coordinate(journey.origin), destination: coordinate(journey.destination), travelmode: 'driving' }).toString();
  return url.toString();
}
