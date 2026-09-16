import type {Coordinate,Route} from './types';
import type {CameraEvidence} from './activity-types';
import {distanceMeters,pathLength,validCoordinate} from './geometry';
import {distanceToRoute} from './route-proximity';
import {camerasNearRoute,CAMERA_DATA_TIMESTAMP,MAPPED_CAMERA_DISTANCE_METERS,type MappedCamera} from './camera-layer';

const CENTER={latitude:13.0553,longitude:77.6070};
const EXTRACT_RADIUS=20000;
const SECTION_METERS=500;

// Project onto the closest road segment. Repeated/looped roads do not turn one
// camera into multiple records or multiple supported sections.
function progress(point:Coordinate,path:Coordinate[]){
 const sx=111195*Math.cos(point.latitude*Math.PI/180),sy=111195;
 let best=Infinity,at=0,cumulative=0;
 for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i],length=distanceMeters(a,b);
  const ax=(a.longitude-point.longitude)*sx,ay=(a.latitude-point.latitude)*sy;
  const dx=(b.longitude-a.longitude)*sx,dy=(b.latitude-a.latitude)*sy;
  const t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1)));
  const d=Math.hypot(ax+t*dx,ay+t*dy);
  if(d<best){best=d;at=cumulative+t*length;}
  cumulative+=length;
 }
 return at;
}

export function cameraRouteEvidence(path:Coordinate[],distance:number,records:MappedCamera[]):CameraEvidence|undefined{
 if(path.length<2||!Number.isFinite(distance)||distance<=0||path.some(p=>!validCoordinate(p)||distanceMeters(p,CENTER)>EXTRACT_RADIUS-MAPPED_CAMERA_DISTANCE_METERS))return;
 const length=pathLength(path);if(length<=0)return;
 const eligible=[...new Map(records.filter(c=>validCoordinate(c)&&!/(private|indoor)/i.test(c.zone??'')&&distanceToRoute(c,path)<=MAPPED_CAMERA_DISTANCE_METERS).map(c=>[c.id,c])).values()];
 // Several records at effectively the same location count as one camera site.
 const sites:MappedCamera[]=[];
 for(const c of eligible.sort((a,b)=>a.id.localeCompare(b.id)))if(!sites.some(s=>distanceMeters(s,c)<10))sites.push(c);
 const count=sites.length,perKm=count/Math.max(.5,distance/1000);
 const density=perKm/(perKm+2);
 const sections=Math.ceil(length/SECTION_METERS);
 const sectionLength=length/sections;
 const occupied=new Set(sites.map(c=>Math.min(sections-1,Math.floor(progress(c,path)/sectionLength))));
 const spread=occupied.size/sections;
 return {count,density,spread,value:.6*density+.4*spread,dataTimestamp:CAMERA_DATA_TIMESTAMP};
}

export function cameraEvidenceForRoutes(routes:Route[]):Record<string,CameraEvidence>{
 return Object.fromEntries(routes.flatMap(r=>{
  if(r.source!=='geoapify'||r.geometryKind!=='provider')return [];
  const evidence=cameraRouteEvidence(r.path,r.distanceMeters,camerasNearRoute(r.path));
  return evidence?[[r.id,evidence]]:[];
 }));
}
