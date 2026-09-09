import type { Coordinate } from './types';

const EARTH_RADIUS = 6_371_008.8;
const rad = (degrees: number) => degrees * Math.PI / 180;
export function validCoordinate(p: Coordinate): boolean {
  return Number.isFinite(p.latitude) && Math.abs(p.latitude) <= 90 && Number.isFinite(p.longitude) && Math.abs(p.longitude) <= 180;
}
export function distanceMeters(a: Coordinate, b: Coordinate): number {
  if (!validCoordinate(a) || !validCoordinate(b)) throw new Error('Invalid route coordinate');
  const h = Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}
export function pathLength(path: Coordinate[]): number {
  if (path.length < 2 || path.some(p => !validCoordinate(p))) throw new Error('A route needs valid geometry');
  return path.slice(1).reduce((sum, point, i) => sum + distanceMeters(path[i], point), 0);
}

export type SamplePoint = { coordinate: Coordinate; distanceMeters: number };
export function interpolate(a: Coordinate,b: Coordinate,fraction:number): Coordinate {
  const f=Math.min(1,Math.max(0,fraction));
  if(f===0)return {...a};if(f===1)return {...b};
  const angle=distanceMeters(a,b)/EARTH_RADIUS;
  if(angle<1e-12)return {...a};
  if(Math.PI-angle<1e-7)throw new Error('Ambiguous antipodal segment');
  const wa=Math.sin((1-f)*angle)/Math.sin(angle),wb=Math.sin(f*angle)/Math.sin(angle);
  const x=wa*Math.cos(rad(a.latitude))*Math.cos(rad(a.longitude))+wb*Math.cos(rad(b.latitude))*Math.cos(rad(b.longitude));
  const y=wa*Math.cos(rad(a.latitude))*Math.sin(rad(a.longitude))+wb*Math.cos(rad(b.latitude))*Math.sin(rad(b.longitude));
  const z=wa*Math.sin(rad(a.latitude))+wb*Math.sin(rad(b.latitude));
  return {latitude:Math.atan2(z,Math.hypot(x,y))*180/Math.PI,longitude:Math.atan2(y,x)*180/Math.PI};
}
export function samplePolyline(path: Coordinate[],spacingMeters=200,maxSamples=120): SamplePoint[] {
  if(!Number.isFinite(spacingMeters)||spacingMeters<=0||!Number.isInteger(maxSamples)||maxSamples<2)throw new Error('Invalid sampling limits');
  const length=pathLength(path);
  if(length===0)return [{coordinate:{...path[0]},distanceMeters:0}];
  const count=Math.ceil(length/spacingMeters)+1;
  if(count>maxSamples)throw new Error('Route exceeds the analysis sample budget');
  const cumulative=[0];for(let i=1;i<path.length;i++)cumulative.push(cumulative[i-1]+distanceMeters(path[i-1],path[i]));
  const samples:SamplePoint[]=[];let segment=1;
  for(let i=0;i<count;i++){
    const distance=i===count-1?length:i*spacingMeters;
    while(segment<path.length-1&&cumulative[segment]<=distance)segment++;
    const segmentLength=cumulative[segment]-cumulative[segment-1];
    const coordinate=distance===length?{...path[path.length-1]}:interpolate(path[segment-1],path[segment],segmentLength===0?0:(distance-cumulative[segment-1])/segmentLength);
    samples.push({coordinate,distanceMeters:distance});
  }
  return samples;
}
