import type { LiveJourney } from './journey';
import type { Coordinate, Route } from './types';
import { samplePolyline, pathLength, validCoordinate, distanceMeters } from './geometry';
const coordinate = (p: Coordinate) => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`;
export type NavigationApp='google'|'mappls';
// Three ordered points are supported by mobile browser fallback as well as
// the Android Maps app. They guide routing, but do not lock a full polyline.
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
export function mapsHandoff(journey: LiveJourney,route?:Route,fastestRouteId?:string,app:NavigationApp='google') {
  const via=navigationWaypoints(journey,route,fastestRouteId,app);
  if(app==='mappls'){
    // Matches Mappls' own route-share link: ordered places, mode and region.
    // https://www.mappls.com/js/?392.js (shareLink / deepMode, checked 2026-09-16).
    const url=new URL('https://mappls.com/direction');
    url.searchParams.set('places',[journey.origin,...via,journey.destination].map(coordinate).join(';'));
    url.searchParams.set('mode',journey.mode==='WALK'?'walking':journey.mode==='TWO_WHEELER'?'biking':'driving');
    url.searchParams.set('region','ind');
    return url.toString();
  }
  const url = new URL('https://www.google.com/maps/dir/');
  url.search = new URLSearchParams({ api: '1', origin: coordinate(journey.origin), destination: coordinate(journey.destination), travelmode: journey.mode==='WALK'?'walking':journey.mode==='TWO_WHEELER'?'two-wheeler':'driving' }).toString();
  if(via.length)url.searchParams.set('waypoints',via.map(coordinate).join('|'));
  return url.toString();
}
export function navigationWaypoints(journey:LiveJourney,route?:Route,fastestRouteId?:string,app:NavigationApp='google'):Coordinate[]{
  return app==='google'&&route?.id===fastestRouteId?[]:handoffWaypoints(journey,route);
}
