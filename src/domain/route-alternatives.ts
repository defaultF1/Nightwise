import type {Route,Coordinate} from './types';
import {distanceMeters,pathLength,slicePolyline} from './geometry';
/** Two bounded search probes either side of the route; only provider-returned
 * road geometry can become an option. Probes are never rendered as route lines. */
export function alternativeProbes(route:Route):Coordinate[]{
 const length=pathLength(route.path);
 if(length<600)return [];
 const mid=slicePolyline(route.path,length/2,length/2)[0],a=route.path[0],b=route.path.at(-1)!;
 const lonScale=111195*Math.cos(mid.latitude*Math.PI/180),offset=Math.min(400,length*.25);
 const northSouth=Math.abs(b.latitude-a.latitude)*111195>=Math.abs(b.longitude-a.longitude)*lonScale;
 return [1,-1].map(sign=>northSouth?{latitude:mid.latitude,longitude:mid.longitude+sign*offset/lonScale}:{latitude:mid.latitude+sign*offset/111195,longitude:mid.longitude});
}
/** Reject artificial out-and-back excursions added only to create a choice. */
export function substantialBacktracking(route:Route):boolean{
 const key=(p:Coordinate)=>`${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`,seen=new Set<string>();let repeated=0;
 for(let i=1;i<route.path.length;i++){
  const a=key(route.path[i-1]),b=key(route.path[i]);
  if(a===b)continue;
  if(seen.has(b+'|'+a))repeated+=distanceMeters(route.path[i-1],route.path[i]);
  seen.add(a+'|'+b);
 }
 return repeated>Math.min(200,route.distanceMeters*.1);
}
