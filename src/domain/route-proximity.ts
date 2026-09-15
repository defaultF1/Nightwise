import {distanceMeters,validCoordinate} from './geometry';
import type {Coordinate} from './types';

/** Local tangent-plane distance, suitable for our short Bengaluru route segments. */
export function distanceToRoute(point:Coordinate,path:Coordinate[]):number{
 if(!validCoordinate(point)||path.length<2)return Infinity;
 const sx=111195*Math.cos(point.latitude*Math.PI/180),sy=111195;
 let nearest=Infinity;
 for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i];if(!validCoordinate(a)||!validCoordinate(b))continue;
  const ax=(a.longitude-point.longitude)*sx,ay=(a.latitude-point.latitude)*sy;
  const dx=(b.longitude-a.longitude)*sx,dy=(b.latitude-a.latitude)*sy;
  const t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1)));
  nearest=Math.min(nearest,Math.hypot(ax+t*dx,ay+t*dy));
 }
 return nearest;
}

export function distinctRoadShare(candidate:Coordinate[],existing:Coordinate[]):number{
 let total=0,distinct=0;
 for(let i=1;i<candidate.length;i++){
  const a=candidate[i-1],b=candidate[i],length=distanceMeters(a,b);
  const pieces=Math.max(1,Math.ceil(length/50));
  for(let k=0;k<pieces;k++){
   const t=(k+.5)/pieces,p={latitude:a.latitude+(b.latitude-a.latitude)*t,longitude:a.longitude+(b.longitude-a.longitude)*t};
   total+=length/pieces;if(distanceToRoute(p,existing)>50)distinct+=length/pieces;
  }
 }
 return total?distinct/total:0;
}
