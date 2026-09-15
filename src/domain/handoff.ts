import type { LiveJourney } from './journey';
import type { Coordinate, Route } from './types';
import { samplePolyline, pathLength, validCoordinate, distanceMeters } from './geometry';
const coordinate = (p: Coordinate) => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`;
// Three ordered points guide the navigation app toward the selected roads.
// They guide routing, but do not lock a full polyline.
export function handoffWaypoints(journey:LiveJourney,route?:Route):Coordinate[]{
  if(!route||route.source==='sample'||route.geometryKind!=='provider'||route.path.length<2||route.path.some(p=>!validCoordinate(p)))return [];
  // Never transfer a stale route after the user changes the endpoints.
  if(distanceMeters(route.path[0],journey.origin)>250||distanceMeters(route.path.at(-1)!,journey.destination)>250)return [];
  const length=pathLength(route.path);
  if(length<100)return [];
  const samples=samplePolyline(route.path,length/4,6).slice(1,-1).slice(0,3);
  const seen=new Set([coordinate(journey.origin),coordinate(journey.destination)]);
  return samples.flatMap(p=>{const key=coordinate(p.coordinate);if(seen.has(key))return [];seen.add(key);return [p.coordinate];});
}
export function mapsHandoff(journey: LiveJourney,route?:Route,fastestRouteId?:string) {
  const via=route?.id===fastestRouteId?[]:handoffWaypoints(journey,route);
  // Mappls documents ordered origin/via/destination points for /direction.
  // Its /navigation link supports mode but only a destination; using that
  // would silently discard a remote origin and the selected alternative.
  const url=new URL('https://mappls.com/direction');
  url.searchParams.set('places',[journey.origin,...via,journey.destination].map(coordinate).join(';'));
  return url.toString();
}
