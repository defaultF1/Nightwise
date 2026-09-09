import type { ActivityAnalysis } from './activity-types';
import type { Route, Coordinate } from './types';
import { slicePolyline } from './geometry';

export type GapMarker = Coordinate & { name:string; label:string };
// Label contiguous gaps, not every sample. Keep at most the three longest visible.
export function gapMarkers(route:Route,analysis:ActivityAnalysis):GapMarker[]{
  if(route.id!==analysis.routeId)return [];
  const gaps:{from:number;to:number}[]=[];
  for(const segment of analysis.segments){
    if(segment.state!=='low')continue;
    const previous=gaps.at(-1);
    if(previous&&Math.abs(previous.to-segment.fromMeters)<.01)previous.to=segment.toMeters;
    else gaps.push({from:segment.fromMeters,to:segment.toMeters});
  }
  return gaps.sort((a,b)=>(b.to-b.from)-(a.to-a.from)).slice(0,3).map(gap=>{
    const mid=(gap.from+gap.to)/2;
    const coordinate=slicePolyline(route.path,mid,mid)[0];
    const length=gap.to-gap.from;
    const label=`Low activity · ${length>=1000?`~${(length/1000).toFixed(1)} km`:`~${Math.round(length/50)*50} m`}`;
    return {...coordinate,label,name:`${label}. Estimated between samples; fewer than two confirmed-open listings nearby.`};
  }).filter((p):p is GapMarker=>p!==null);
}
